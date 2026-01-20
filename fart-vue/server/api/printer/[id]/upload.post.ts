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
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded',
      })
    }

    const fileField = formData.find(field => field.name === 'file')

    if (!fileField || !fileField.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file found in upload',
      })
    }

    const fileName = fileField.filename || 'upload.gcode'

    // Create FormData for the printer API
    const printerFormData = new FormData()
    const blob = new Blob([fileField.data], { type: 'text/x.gcode' })
    printerFormData.append('file', blob, fileName)

    const client = new PrinterClient(printer)
    await client.addPrint(printerFormData, fileName)

    return {
      success: true,
      message: 'File uploaded and print started',
      filename: fileName,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Upload failed: ${message}`,
      data: { printerId: id, error: message },
    })
  }
})
