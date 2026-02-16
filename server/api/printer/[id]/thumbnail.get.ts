import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'

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

  const client = new PrinterClient(printer)

  try {
    const job = await client.getJobStatus()
    const thumbPath = job.file?.thumbnailBig

    if (!thumbPath) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No thumbnail available',
      })
    }

    const buffer = await client.getThumbnail(thumbPath)

    setResponseHeaders(event, {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=60',
    })

    return buffer
  } catch (error) {
    if ((error as any).statusCode) throw error
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch thumbnail: ${message}`,
    })
  }
})
