const cron = require('node-cron');
const prisma = require('./db');

function startScheduler() {
  // Hourly: auto-activate semesters
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

  // Daily midnight: registration window checks
  cron.schedule('0 0 * * *', async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const activeSemesters = await prisma.semester.findMany({
        where: { isActive: 1 },
      });

      for (const sem of activeSemesters) {
        if (sem.registrationOpenDate === todayStr) {
          console.log(`[Scheduler] Registration opens today for ${sem.name} ${sem.year}`);
        }
        if (sem.registrationCloseDate === todayStr) {
          console.log(`[Scheduler] Registration closes today for ${sem.name} ${sem.year}`);
        }
        if (sem.dropDeadline === todayStr) {
          console.log(`[Scheduler] Drop deadline is today for ${sem.name} ${sem.year}`);
        }
        if (sem.withdrawDeadline === todayStr) {
          console.log(`[Scheduler] Withdraw deadline is today for ${sem.name} ${sem.year}`);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Registration window check error:', err);
    }
  });

  console.log('[Scheduler] Started (hourly + daily checks)');
}

module.exports = { startScheduler };
