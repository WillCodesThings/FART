import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'
import { validateGcode } from '~/server/utils/gcodeValidator'

export default defineEventHandler(async (event) => {
  console.log(`[DEBUG] upload.post: Upload endpoint called`)

  const id = Number(getRouterParam(event, 'id'))
  console.log(`[DEBUG] upload.post: Printer ID: ${id}`)

  if (isNaN(id)) {
    console.log(`[DEBUG] upload.post: Invalid printer ID`)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid printer ID',
    })
  }

  const printer = getPrinterById(id)
  console.log(`[DEBUG] upload.post: Printer found:`, printer ? `${printer.name} (${printer.ipAddr})` : 'NOT FOUND')

  if (!printer) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Printer not found',
    })
  }

  const client = new PrinterClient(printer)

  try {
    console.log(`[DEBUG] upload.post: Reading multipart form data...`)
    const formData = await readMultipartFormData(event)
    console.log(`[DEBUG] upload.post: Form data fields: ${formData?.length || 0}`)

    if (!formData || formData.length === 0) {
      console.log(`[DEBUG] upload.post: No form data received`)
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded',
      })
    }

    const fileField = formData.find(field => field.name === 'file')
    console.log(`[DEBUG] upload.post: File field found: ${!!fileField}`)
    console.log(`[DEBUG] upload.post: File field name: ${fileField?.name}`)
    console.log(`[DEBUG] upload.post: File field filename: ${fileField?.filename}`)
    console.log(`[DEBUG] upload.post: File field data size: ${fileField?.data?.length || 0} bytes`)

    if (!fileField || !fileField.data) {
      console.log(`[DEBUG] upload.post: No file data in form`)
      throw createError({
        statusCode: 400,
        statusMessage: 'No file found in upload',
      })
    }

    const fileName = fileField.filename || 'upload.gcode'
    console.log(`[DEBUG] upload.post: Using filename: ${fileName}`)

    // Check if user wants to force upload despite errors
    const forceUpload = formData.find(field => field.name === 'force')?.data?.toString() === 'true'

    // STEP 1: Validate file extension against printer capabilities (gcode vs bgcode)
    console.log(`[DEBUG] upload.post: Validating file extension for printer...`)
    const extValidation = await client.validateFileExtension(fileName)

    if (!extValidation.valid && !forceUpload) {
      console.log(`[DEBUG] upload.post: File extension validation failed:`, extValidation.error)
      return {
        success: false,
        message: 'File type not supported',
        filename: fileName,
        validation: {
          errors: [extValidation.error || 'Invalid file type'],
          warnings: extValidation.warning ? [extValidation.warning] : [],
          printerCapabilities: {
            model: extValidation.capabilities.model,
            firmware: extValidation.capabilities.firmware,
            hasInputShaper: extValidation.capabilities.hasInputShaper,
            requiresBgcode: extValidation.capabilities.requiresBgcode,
            supportedExtensions: extValidation.capabilities.supportedExtensions,
          },
        },
        requiresConfirmation: true,
      }
    }

    // STEP 2: Validate gcode content (only for text gcode files, not binary)
    const isBinaryGcode = fileName.toLowerCase().endsWith('.bgcode') || fileName.toLowerCase().endsWith('.bgc')
    let validation = { errors: [] as string[], warnings: [] as string[], printerModel: undefined as string | undefined, nozzleDiameter: undefined as number | undefined, filamentType: undefined as string | undefined, printTime: undefined as string | undefined, filamentUsedG: undefined as number | undefined }

    if (!isBinaryGcode) {
      console.log(`[DEBUG] upload.post: Validating gcode content for printer model: ${printer.model}`)
      validation = validateGcode(fileField.data, printer.model)

      // Check for content validation errors (blocking)
      if (validation.errors.length > 0 && !forceUpload) {
        console.log(`[DEBUG] upload.post: Gcode content validation failed with errors:`, validation.errors)
        return {
          success: false,
          message: 'Gcode validation failed',
          filename: fileName,
          validation: {
            errors: validation.errors,
            warnings: validation.warnings,
            metadata: {
              printerModel: validation.printerModel,
              nozzleDiameter: validation.nozzleDiameter,
              filamentType: validation.filamentType,
              printTime: validation.printTime,
            },
            printerCapabilities: {
              model: extValidation.capabilities.model,
              firmware: extValidation.capabilities.firmware,
              hasInputShaper: extValidation.capabilities.hasInputShaper,
              requiresBgcode: extValidation.capabilities.requiresBgcode,
              supportedExtensions: extValidation.capabilities.supportedExtensions,
            },
          },
          requiresConfirmation: true,
        }
      }

      // Log warnings but don't block
      if (validation.warnings.length > 0) {
        console.log(`[DEBUG] upload.post: Gcode validation warnings:`, validation.warnings)
      }
    } else {
      console.log(`[DEBUG] upload.post: Skipping content validation for binary gcode file`)
    }

    // Pass raw file data to printer API (not FormData)
    console.log(`[DEBUG] upload.post: Sending raw file data, size: ${fileField.data.length} bytes`)

    console.log(`[DEBUG] upload.post: Calling client.addPrint()...`)
    await client.addPrint(fileField.data, fileName)

    console.log(`[DEBUG] upload.post: Upload successful!`)
    return {
      success: true,
      message: 'File uploaded and print started',
      filename: fileName,
      validation: {
        warnings: validation.warnings,
        metadata: {
          printerModel: validation.printerModel,
          nozzleDiameter: validation.nozzleDiameter,
          filamentType: validation.filamentType,
          printTime: validation.printTime,
          filamentUsedG: validation.filamentUsedG,
        },
        printerCapabilities: {
          model: extValidation.capabilities.model,
          firmware: extValidation.capabilities.firmware,
          hasInputShaper: extValidation.capabilities.hasInputShaper,
          requiresBgcode: extValidation.capabilities.requiresBgcode,
          supportedExtensions: extValidation.capabilities.supportedExtensions,
        },
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log(`[DEBUG] upload.post: Upload failed with error: ${message}`)
    console.log(`[DEBUG] upload.post: Full error:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: `Upload failed: ${message}`,
      data: { printerId: id, error: message },
    })
  }
})
