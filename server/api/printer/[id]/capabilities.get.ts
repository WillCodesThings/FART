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

  try {
    const client = new PrinterClient(printer)
    const capabilities = await client.getVersion()

    return {
      printer: {
        id: printer.id,
        name: printer.name,
        configuredModel: printer.model,
      },
      capabilities: {
        detectedModel: capabilities.model,
        firmware: capabilities.firmware,
        serial: capabilities.serial,
        nozzleDiameter: capabilities.nozzleDiameter,
        hasInputShaper: capabilities.hasInputShaper,
        requiresBgcode: capabilities.requiresBgcode,
        supportedExtensions: capabilities.supportedExtensions,
        apiVersion: capabilities.apiVersion,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to get printer capabilities: ${message}`,
    })
  }
})
