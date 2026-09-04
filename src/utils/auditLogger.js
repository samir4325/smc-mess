import { ls_get, ls_set } from './storageHelpers'

export function logAudit(userId, userName, action, entity, recordId, oldValue = null, newValue = null) {
  const logs = ls_get('auditLogs') || []
  const entry = {
    id: `AUDIT-${Date.now()}`,
    userId,
    userName,
    action,
    entity,
    recordId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
    timestamp: new Date().toISOString(),
  }
  logs.unshift(entry)
  ls_set('auditLogs', logs.slice(0, 5000)) // keep last 5000
  return entry
}
