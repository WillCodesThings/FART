import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'
import { getActivePrintLogs, updatePrintLog } from '~/server/utils/dataStore'
import type { PrinterApiResponse } from '~/types/api'

export default defineEventHandler(async (event): Promise<PrinterApiResponse> => {
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
    // Fetch all data in parallel for better performance
    const [data, printerTelemetry, files] = await Promise.all([
      client.getJobStatus(),
      client.getPrinterData(),
      client.getFiles(),
    ])

    // Sync print log progress with actual printer data
    const activePrints = getActivePrintLogs()
    const currentPrint = activePrints.find(p => p.printerId === id)

    if (currentPrint && data) {
      const progress = data.progress || 0
      const isPrinting = data.state === 'Printing'
      const isFinished = data.state === 'Finished' || progress >= 100

      if (isFinished) {
        // Mark print as completed
        updatePrintLog(currentPrint.id, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        })
      } else if (isPrinting) {
        // Update progress
        updatePrintLog(currentPrint.id, { progress })
      }
    }

    return {
      data,
      files,
      printerTelemetry,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch printer data: ${message}`,
      data: { printerId: id, error: message },
    })
  }
})
