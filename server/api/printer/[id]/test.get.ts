import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'

interface TestConnectionResponse {
  success: boolean
  message: string
  printerName?: string
  ipAddr?: string
  responseTime?: number
}

export default defineEventHandler(async (event): Promise<TestConnectionResponse> => {
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
  const startTime = Date.now()

  try {
    const isReachable = await client.ping()
    const responseTime = Date.now() - startTime

    if (isReachable) {
      return {
        success: true,
        message: 'Printer is online and responding',
        printerName: printer.name,
        ipAddr: printer.ipAddr,
        responseTime,
      }
    } else {
      return {
        success: false,
        message: 'Printer is not responding',
        printerName: printer.name,
        ipAddr: printer.ipAddr,
        responseTime,
      }
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      message: `Connection failed: ${errorMessage}`,
      printerName: printer.name,
      ipAddr: printer.ipAddr,
      responseTime,
    }
  }
})
