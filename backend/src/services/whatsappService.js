const twilio = require('twilio');

// Initialize Twilio client only with valid credentials
let client = null;

function initializeTwilio() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Only initialize if credentials are provided and look valid
  if (accountSid && authToken && accountSid.startsWith('AC')) {
    try {
      client = twilio(accountSid, authToken);
    } catch (error) {
      console.warn('Failed to initialize Twilio:', error.message);
    }
  }
}

// Initialize on module load
initializeTwilio();

const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., whatsapp:+1234567890
const ADMIN_PHONE = process.env.ADMIN_PHONE; // e.g., whatsapp:+918328682280

/**
 * Send a WhatsApp message to admin
 * @param {string} message - Message body
 */
async function sendAdminNotification(message) {
  try {
    // Skip if Twilio not initialized or not configured
    if (!client || !TWILIO_WHATSAPP_NUMBER || !ADMIN_PHONE) {
      console.warn('Twilio WhatsApp not configured. Skipping notification.');
      return;
    }

    const result = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: ADMIN_PHONE,
      body: message,
    });

    console.log(`WhatsApp notification sent. SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error.message);
    // Don't throw - order should still be created even if WhatsApp fails
  }
}

/**
 * Format order details for WhatsApp message
 */
function formatOrderMessage(order, userPhone) {
  return `🐔 *NEW BOOKING RECEIVED*

📱 Phone: ${userPhone}
📦 Quantity: ${order.quantity} birds
⚖️ Weight Range: ${order.weightRange}
📍 Delivery Date: ${order.deliveryDate}
🕐 Slot: ${order.deliverySlot}
📌 Address: ${order.address}
${order.notes ? `📝 Notes: ${order.notes}` : ''}

Order ID: #${order.id}`;
}

/**
 * Format order update message
 */
function formatUpdateMessage(orderId, phone, updates) {
  let message = `📋 *ORDER UPDATE*\n\nOrder ID: #${orderId}\nCustomer: ${phone}\n\n`;

  if (updates.status) {
    message += `✅ Status: ${updates.status}\n`;
  }
  if (updates.finalPrice) {
    message += `💰 Final Price: ₹${updates.finalPrice}\n`;
  }
  if (updates.finalWeight) {
    message += `⚖️ Final Weight: ${updates.finalWeight} kg\n`;
  }

  return message;
}

/**
 * Notify admin of new booking
 */
async function notifyNewOrder(order, userPhone) {
  const message = formatOrderMessage(order, userPhone);
  return sendAdminNotification(message);
}

/**
 * Notify admin of order status/payment update
 */
async function notifyOrderUpdate(orderId, userPhone, updates) {
  const message = formatUpdateMessage(orderId, userPhone, updates);
  return sendAdminNotification(message);
}

/**
 * Send daily summary to admin
 */
async function sendDailySummary(stats) {
  const message = `📊 *DAILY SUMMARY*\n\n📈 New Orders: ${stats.newOrders}\n✅ Delivered: ${stats.delivered}\n⏳ Pending: ${stats.pending}\n💰 Total Revenue: ₹${stats.totalRevenue}\n\nDate: ${new Date().toLocaleDateString('en-IN')}`;
  return sendAdminNotification(message);
}

module.exports = {
  sendAdminNotification,
  notifyNewOrder,
  notifyOrderUpdate,
  sendDailySummary,
};
