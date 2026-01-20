import { getSession, getMaintenanceLogs, addMaintenanceLog, deleteMaintenanceLog } from '~/server/utils/dataStore'
import type { MaintenanceLog } from '~/types/auth'

interface MaintenanceAction {
  action: 'list' | 'add' | 'delete'
  printerId?: number
  id?: string
  log?: Omit<MaintenanceLog, 'id'>
}

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const session = getSession(sessionId)
  if (!session || !session.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const body = await readBody<MaintenanceAction>(event)
  const { action, printerId, id, log } = body

  if (action === 'list') {
    const logs = getMaintenanceLogs(printerId)
    return { success: true, logs }
  }

  if (action === 'add') {
    if (!log || !log.printerId || !log.type || !log.description || !log.performedAt || !log.performedBy) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Printer ID, type, description, performed date, and performed by are required',
      })
    }

    const newLog = addMaintenanceLog(log)
    return { success: true, log: newLog }
  }

  if (action === 'delete') {
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Log ID is required' })
    }

    const success = deleteMaintenanceLog(id)
    if (!success) {
      throw createError({ statusCode: 404, statusMessage: 'Maintenance log not found' })
    }

    return { success: true }
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
})
