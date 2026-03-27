const express = require('express');
const { prisma } = require('../config/db');
const { notifyNewOrder, notifyOrderUpdate } = require('../services/whatsappService');

const router = express.Router();

const ALLOWED_STATUSES = [
  'Pending',
  'Confirmed',
  'Out for Delivery',
  'Delivered',
];

function toSerializableNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

function serializeOrder(order) {
  return {
    id: order.id,
    user_id: order.userId,
    phone: order.user.phone,
    weight_range: order.weightRange,
    quantity: order.quantity,
    delivery_date: order.deliveryDate,
    delivery_slot: order.deliverySlot,
    address: order.address,
    notes: order.notes,
    status: order.status,
    final_weight: toSerializableNumber(order.finalWeight),
    final_price: toSerializableNumber(order.finalPrice),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

function validateCreateOrderPayload(body) {
  const requiredFields = [
    'phone',
    'weight_range',
    'quantity',
    'delivery_date',
    'delivery_slot',
    'address',
  ];

  for (const field of requiredFields) {
    if (!body[field]) {
      return `${field} is required`;
    }
  }

  if (!Number.isInteger(body.quantity) || body.quantity <= 0) {
    return 'quantity must be a positive integer';
  }

  const parsedDate = new Date(body.delivery_date);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'delivery_date must be a valid date in YYYY-MM-DD format';
  }

  return null;
}

router.post('/order', async (req, res) => {
  const validationError = validateCreateOrderPayload(req.body);
  if (validationError) {
    return res.status(400).json({
      ok: false,
      message: validationError,
    });
  }

  const {
    phone,
    weight_range,
    quantity,
    delivery_date,
    delivery_slot,
    address,
    notes,
  } = req.body;

  try {
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const created = await prisma.order.create({
      data: {
        userId: user.id,
        weightRange: weight_range,
        quantity,
        deliveryDate: new Date(delivery_date),
        deliverySlot: delivery_slot,
        address,
        notes: notes || null,
      },
      include: {
        user: {
          select: { phone: true },
        },
      },
    });

    // Send WhatsApp notification to admin (fire and forget)
    notifyNewOrder(created, user.phone).catch((err) => {
      console.error('WhatsApp notification failed (non-critical):', err.message);
    });

    return res.status(201).json({
      ok: true,
      message: 'Order created successfully',
      data: serializeOrder(created),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
});

router.get('/order/:id', async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      ok: false,
      message: 'Invalid order id',
    });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { phone: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        ok: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      ok: true,
      data: serializeOrder(order),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
});

router.get('/admin/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: { phone: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      ok: true,
      count: orders.length,
      data: orders.map(serializeOrder),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});

router.patch('/order/:id', async (req, res) => {
  const orderId = Number(req.params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      ok: false,
      message: 'Invalid order id',
    });
  }

  const { status, final_weight, final_price } = req.body;
  const data = {};

  if (status !== undefined) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }
    data.status = status;
  }

  if (final_weight !== undefined) {
    const parsedFinalWeight = Number(final_weight);
    if (Number.isNaN(parsedFinalWeight) || parsedFinalWeight <= 0) {
      return res.status(400).json({
        ok: false,
        message: 'final_weight must be a positive number',
      });
    }
    data.finalWeight = parsedFinalWeight;
  }

  if (final_price !== undefined) {
    const parsedFinalPrice = Number(final_price);
    if (Number.isNaN(parsedFinalPrice) || parsedFinalPrice < 0) {
      return res.status(400).json({
        ok: false,
        message: 'final_price must be a non-negative number',
      });
    }
    data.finalPrice = parsedFinalPrice;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      ok: false,
      message: 'Provide at least one of: status, final_weight, final_price',
    });
  }

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return res.status(404).json({
        ok: false,
        message: 'Order not found',
      });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        user: {
          select: { phone: true },
        },
      },
    });

    // Send WhatsApp notification if status or price changed (fire and forget)
    if (Object.keys(data).length > 0) {
      const updates = {};
      if (data.status) updates.status = data.status;
      if (data.finalPrice) updates.finalPrice = data.finalPrice;
      if (data.finalWeight) updates.finalWeight = data.finalWeight;

      notifyOrderUpdate(orderId, updated.user.phone, updates).catch((err) => {
        console.error('WhatsApp notification failed (non-critical):', err.message);
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Order updated successfully',
      data: serializeOrder(updated),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Failed to update order',
      error: error.message,
    });
  }
});

module.exports = router;
