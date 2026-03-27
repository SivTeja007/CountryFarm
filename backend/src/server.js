require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { prisma, checkDatabaseConnection } = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const { startDailySummaryJob, stopDailySummaryJob } = require('./services/schedulerService');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  return res.status(200).json({
    ok: true,
    message: 'CountryFarm booking API is running',
  });
});

app.use('/api', orderRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await checkDatabaseConnection();
    return res.status(200).json({
      ok: true,
      message: 'Backend is running and connected to PostgreSQL',
    });
  } catch (error) {
    const normalizedMessage =
      (error && error.message) ||
      (error && error.code) ||
      (error && JSON.stringify(error)) ||
      String(error || 'Unknown database error');

    return res.status(500).json({
      ok: false,
      message: 'Backend is running but PostgreSQL connection failed',
      error: normalizedMessage,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  // Start daily summary scheduler if environment is configured
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_NUMBER
  ) {
    startDailySummaryJob();
  } else {
    console.warn(
      'WhatsApp integration not configured. Notifications disabled.'
    );
  }
});

async function shutdown() {
  stopDailySummaryJob();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
