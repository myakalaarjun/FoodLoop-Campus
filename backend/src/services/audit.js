import AuditLog from '../models/AuditLog.js';

export function audit(actor, action, entityType, entityId, details = {}) {
  return AuditLog.create({ actor: actor?._id ?? actor ?? null, action, entityType, entityId: String(entityId), details });
}
