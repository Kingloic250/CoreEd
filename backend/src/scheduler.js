const cron = require('node-cron');
const prisma = require('./db');

function startScheduler() {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const todayStr = now.toISOString().split('T')[0];
      const futureStr = fiveDaysFromNow.toISOString().split('T')[0];

      const semesters = await prisma.semester.findMany({
        where: { isActive: 0 },
      });

      for (const sem of semesters) {
        if (sem.startDate && sem.startDate >= todayStr && sem.startDate <= futureStr) {
          await prisma.semester.updateMany({ where: { isActive: 1 }, data: { isActive: 0 } });
          await prisma.semester.update({ where: { id: sem.id }, data: { isActive: 1 } });
          console.log(`[Scheduler] Auto-activated semester: ${sem.name} ${sem.year}`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error auto-activating semester:', err);
    }
  });

  console.log('[Scheduler] Started (checks every hour)');
}

module.exports = { startScheduler };
