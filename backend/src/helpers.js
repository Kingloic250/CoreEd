const { pool } = require('./db');

function generateId(prefix) {
  return `${prefix}${Date.now()}`;
}

async function logAudit({ action, performedBy, performedById, targetType, targetId, details }) {
  await pool.query(
    `INSERT INTO audit_logs (id, action, "performedBy", "performedById", "targetType", "targetId", details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [generateId('al'), action, performedBy, performedById, targetType, targetId, details]
  );
}

module.exports = { generateId, logAudit };
