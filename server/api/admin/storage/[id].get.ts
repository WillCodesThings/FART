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
  console.log(`[DEBUG] storage.get: Fetching storage for printer ${id}`)

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

    // Fetch files and storage info in parallel
    const [files, storageInfo] = await Promise.all([
      client.getFilesDetailed(),
      client.getStorageInfo(),
    ])

    // Calculate total size of files
    const totalFilesSize = files.reduce((sum, file) => sum + file.size, 0)

    console.log(`[DEBUG] storage.get: Found ${files.length} files, total size: ${totalFilesSize} bytes`)

    return {
      printer: {
        id: printer.id,
        name: printer.name,
        model: printer.model,
      },
      storage: {
        free: storageInfo.free,
        total: storageInfo.total,
        used: storageInfo.total - storageInfo.free,
        available: storageInfo.available,
      },
      files: files.sort((a, b) => {
        // Sort by modified date descending (newest first)
        if (a.modified && b.modified) {
          return new Date(b.modified).getTime() - new Date(a.modified).getTime()
        }
        return a.name.localeCompare(b.name)
      }),
      totalFiles: files.length,
      totalFilesSize,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log(`[DEBUG] storage.get: Failed with error: ${message}`)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch storage info: ${message}`,
    })
  }
})
