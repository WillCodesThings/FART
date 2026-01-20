import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'
import { getSession, createPrintLog, updatePrintLog, getActivePrintLogs } from '~/server/utils/dataStore'
import type { PrintAction } from '~/types/job'

interface CommandBody {
  command: 'img' | 'run' | 'pause' | 'resume' | 'cancel'
  filename?: string
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid printer ID',
    })
  }

  const printer = getPrinterById(id)

  if (!printer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Printer not found',
    })
  }

  const body = await readBody<CommandBody>(event)
  const client = new PrinterClient(printer)

  // Get current user from session for print logging
  const sessionId = getCookie(event, 'fart-session')
  const session = sessionId ? getSession(sessionId) : null

  try {
    const command = body.command.toLowerCase()

    // Handle image request
    if (command === 'img') {
      const image = await client.getImage()
      setResponseHeader(event, 'Content-Type', 'image/png')
      return image
    }

    // Handle run/select print command
    if (command === 'run') {
      if (!body.filename) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Filename required for run command',
        })
      }
      await client.selectPrint(body.filename)

      // Log the print start if user is authenticated
      if (session) {
        createPrintLog(
          session.userId,
          session.userName,
          id,
          printer.name,
          body.filename
        )
      }

      return { success: true, message: 'Print started' }
    }

    // Handle print control commands (pause, resume, cancel)
    if (['pause', 'resume', 'cancel'].includes(command)) {
      await client.controlPrint(command as PrintAction)

      // Update print log status if cancelling
      if (command === 'cancel' && session) {
        const activePrints = getActivePrintLogs()
        const currentPrint = activePrints.find(p => p.printerId === id && p.userId === session.userId)
        if (currentPrint) {
          updatePrintLog(currentPrint.id, {
            status: 'cancelled',
            completedAt: new Date().toISOString(),
          })
        }
      }

      return { success: true, message: `Print ${command} executed` }
    }

    throw createError({
      statusCode: 400,
      statusMessage: `Unknown command: ${command}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Command failed: ${message}`,
      data: { printerId: id, command: body.command, error: message },
    })
  }
})
