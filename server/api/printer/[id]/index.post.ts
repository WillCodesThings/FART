import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'
import { getSession, createPrintLog, updatePrintLog, getActivePrintLogs } from '~/server/utils/dataStore'
import type { PrintAction } from '~/types/job'

interface CommandBody {
  command: 'img' | 'run' | 'pause' | 'resume' | 'cancel'
  filename?: string
}

export default defineEventHandler(async (event) => {
  console.log(`[DEBUG] index.post: Printer command endpoint called`)

  const id = Number(getRouterParam(event, 'id'))
  console.log(`[DEBUG] index.post: Printer ID: ${id}`)

  if (isNaN(id)) {
    console.log(`[DEBUG] index.post: Invalid printer ID`)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid printer ID',
    })
  }

  const printer = getPrinterById(id)
  console.log(`[DEBUG] index.post: Printer found:`, printer ? `${printer.name} (${printer.ipAddr})` : 'NOT FOUND')

  if (!printer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Printer not found',
    })
  }

  const body = await readBody<CommandBody>(event)
  console.log(`[DEBUG] index.post: Command body:`, JSON.stringify(body, null, 2))

  const client = new PrinterClient(printer)

  // Get current user from session for print logging
  const sessionId = getCookie(event, 'fart-session')
  const session = sessionId ? getSession(sessionId) : null
  console.log(`[DEBUG] index.post: Session ID: ${sessionId || 'none'}`)
  console.log(`[DEBUG] index.post: Session user: ${session?.userName || 'none'}`)

  try {
    const command = body.command.toLowerCase()
    console.log(`[DEBUG] index.post: Processing command: ${command}`)

    // Handle image request
    if (command === 'img') {
      console.log(`[DEBUG] index.post: Handling image request`)
      const image = await client.getImage()
      setResponseHeader(event, 'Content-Type', 'image/png')
      return image
    }

    // Handle run/select print command
    if (command === 'run') {
      console.log(`[DEBUG] index.post: Handling RUN command`)
      console.log(`[DEBUG] index.post: Filename: ${body.filename}`)

      if (!body.filename) {
        console.log(`[DEBUG] index.post: No filename provided`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Filename required for run command',
        })
      }

      console.log(`[DEBUG] index.post: Calling selectPrint("${body.filename}")...`)
      await client.selectPrint(body.filename)
      console.log(`[DEBUG] index.post: selectPrint completed successfully`)

      // Log the print start if user is authenticated
      if (session) {
        console.log(`[DEBUG] index.post: Creating print log for user ${session.userName}`)
        createPrintLog(
          session.userId,
          session.userName,
          id,
          printer.name,
          body.filename
        )
      }

      console.log(`[DEBUG] index.post: RUN command completed successfully`)
      return { success: true, message: 'Print started' }
    }

    // Handle print control commands (pause, resume, cancel)
    if (['pause', 'resume', 'cancel'].includes(command)) {
      console.log(`[DEBUG] index.post: Handling control command: ${command}`)
      await client.controlPrint(command as PrintAction)

      // Update print log status if cancelling
      if (command === 'cancel' && session) {
        const activePrints = getActivePrintLogs()
        const currentPrint = activePrints.find(p => p.printerId === id && p.userId === session.userId)
        if (currentPrint) {
          console.log(`[DEBUG] index.post: Updating print log to cancelled`)
          updatePrintLog(currentPrint.id, {
            status: 'cancelled',
            completedAt: new Date().toISOString(),
          })
        }
      }

      console.log(`[DEBUG] index.post: Control command completed successfully`)
      return { success: true, message: `Print ${command} executed` }
    }

    console.log(`[DEBUG] index.post: Unknown command: ${command}`)
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown command: ${command}`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log(`[DEBUG] index.post: Command failed with error: ${message}`)
    console.log(`[DEBUG] index.post: Full error:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: `Command failed: ${message}`,
      data: { printerId: id, command: body.command, error: message },
    })
  }
})
