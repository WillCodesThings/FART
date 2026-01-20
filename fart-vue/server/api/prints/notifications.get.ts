import { getSession, getUnnotifiedCompletedPrints, markPrintNotified } from '~/server/utils/dataStore'

export default defineEventHandler((event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    return { notifications: [] }
  }

  const session = getSession(sessionId)
  if (!session) {
    return { notifications: [] }
  }

  const unnotifiedPrints = getUnnotifiedCompletedPrints(session.userId)

  // Mark them as notified
  for (const print of unnotifiedPrints) {
    markPrintNotified(print.id)
  }

  return {
    notifications: unnotifiedPrints.map(p => ({
      id: p.id,
      fileName: p.fileName,
      printerName: p.printerName,
      completedAt: p.completedAt,
    })),
  }
})
