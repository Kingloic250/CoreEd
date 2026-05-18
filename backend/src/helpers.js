const prisma = require('./db');

function generateId(prefix) {
  return `${prefix}${Date.now()}`;
}

async function logAudit({ action, performedBy, performedById, targetType, targetId, details }) {
  await prisma.auditLog.create({
    data: {
      id: generateId('al'),
      action,
      performedBy,
      performedById,
      targetType,
      targetId,
      details,
    },
  });
}

module.exports = { generateId, logAudit };
