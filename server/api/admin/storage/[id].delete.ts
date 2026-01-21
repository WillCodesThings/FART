import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'
import { getSession } from '~/server/utils/dataStore'

export default defineEventHandler(async (event) => {
  // Check admin auth
  const sessionId = getCookie(event, 'fart-session')
  const session = sessionId ? getSession(sessionId) : null

  if (!session?.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required',
    })
  }

  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ filename: string; filenames?: string[] }>(event)

  console.log(`[DEBUG] storage.delete: Delete request for printer ${id}`)
  console.log(`[DEBUG] storage.delete: Body:`, JSON.stringify(body, null, 2))

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

  // Support both single file and multiple files
  const filenames = body.filenames || (body.filename ? [body.filename] : [])

  if (filenames.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename(s) required',
    })
  }

  const client = new PrinterClient(printer)
  const results: { filename: string; success: boolean; error?: string }[] = []

  for (const filename of filenames) {
    try {
      console.log(`[DEBUG] storage.delete: Deleting file "${filename}" from printer ${printer.name}`)
      await client.deleteFile(filename)
      results.push({ filename, success: true })
      console.log(`[DEBUG] storage.delete: Successfully deleted "${filename}"`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.log(`[DEBUG] storage.delete: Failed to delete "${filename}": ${message}`)
      results.push({ filename, success: false, error: message })
    }
  }

  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return {
    success: failCount === 0,
    message: failCount === 0
      ? `Successfully deleted ${successCount} file(s)`
      : `Deleted ${successCount} file(s), ${failCount} failed`,
    results,
  }
})
