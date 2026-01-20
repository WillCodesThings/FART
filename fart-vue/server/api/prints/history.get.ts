import { getSession, getPrintLogsByUser, updatePrintLog } from '~/server/utils/dataStore'
import { getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'

async function fetchLiveProgress(printerId: number, fileName: string): Promise<{ progress: number; stillRunning: boolean } | null> {
  const printer = getPrinterById(printerId)
  if (!printer) return null

  const client = new PrinterClient(printer)

  try {
    const jobData = await client.getJobStatus()
    const isPrinting = jobData.state === 'Printing' || jobData.state === 'Paused'
    const currentFile = jobData.file?.name || null
    const progress = jobData.progress?.completion || 0

    // Check if this is the same file
    const fileMatches = currentFile !== null && (
      currentFile === fileName ||
      fileName.includes(currentFile) ||
      currentFile.includes(fileName.replace('.gcode', ''))
    )

    return {
      progress,
      stillRunning: isPrinting && fileMatches,
    }
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const session = getSession(sessionId)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid session' })
  }

  const prints = getPrintLogsByUser(session.userId)

  // Update progress for any active prints by checking live status
  const activePrints = prints.filter(p => p.status === 'printing')

  await Promise.all(activePrints.map(async (print) => {
    const liveStatus = await fetchLiveProgress(print.printerId, print.fileName)

    if (liveStatus) {
      // Update progress if different
      if (Math.abs(liveStatus.progress - print.progress) > 1) {
        updatePrintLog(print.id, { progress: liveStatus.progress })
        print.progress = liveStatus.progress
      }

      // Mark as completed if no longer running and was high progress
      if (!liveStatus.stillRunning && (print.progress >= 95 || liveStatus.progress >= 95)) {
        updatePrintLog(print.id, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        })
        print.status = 'completed'
        print.progress = 100
      }
    }
  }))

  return {
    prints: prints.slice(0, 20), // Limit to 20 most recent
    total: prints.length,
  }
})
