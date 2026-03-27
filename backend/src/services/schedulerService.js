const schedule = require('node-schedule');
const { prisma } = require('../config/db');
const { sendDailySummary } = require('./whatsappService');

let scheduledJob = null;

/**
 * Start daily summary job (runs at 8 PM every day)
 */
function startDailySummaryJob() {
  if (scheduledJob) {
    console.warn('Daily summary job already running.');
    return;
  }

  // Run every day at 8 PM (20:00)
  scheduledJob = schedule.scheduleJob('0 20 * * *', async () => {
    try {
      console.log('Running daily summary job...');

      // Get today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const stats = {
        newOrders: todayOrders.length,
        delivered: todayOrders.filter((o) => o.status === 'Delivered').length,
        pending: todayOrders.filter((o) => o.status === 'Pending').length,
        totalRevenue: todayOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0),
      };

      await sendDailySummary(stats);
      console.log('Daily summary sent successfully.');
    } catch (error) {
      console.error('Error in daily summary job:', error.message);
    }
  });

  console.log('Daily summary job started. Runs at 8 PM every day.');
}

/**
 * Stop the scheduled job
 */
function stopDailySummaryJob() {
  if (scheduledJob) {
    scheduledJob.cancel();
    scheduledJob = null;
    console.log('Daily summary job stopped.');
  }
}

module.exports = {
  startDailySummaryJob,
  stopDailySummaryJob,
};
