import { getSession, createPrintLog } from '~/server/utils/dataStore'
import { getPrinterById } from '~/server/utils/printerStore'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const session = getSession(sessionId)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid session' })
  }

  const body = await readBody(event)
  const { printerId, fileName } = body

  if (!printerId || !fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'printerId and fileName are required',
    })
  }

  const printer = getPrinterById(printerId)
  if (!printer) {
    throw createError({ statusCode: 404, statusMessage: 'Printer not found' })
  }

  const printLog = createPrintLog(
    session.userId,
    session.userName,
    printerId,
    printer.name,
    fileName
  )

  return {
    success: true,
    printLog,
  }
})
