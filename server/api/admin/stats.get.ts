import { getSession, getUsers, getPrintLogs, getActivePrintLogs, getActiveSessions, getAdminCode, getAdminName, updatePrintLog, getCostConfig, getMaintenanceLogs } from '~/server/utils/dataStore'
import { getAllPrinters, getPrinterById } from '~/server/utils/printerStore'
import { PrinterClient } from '~/server/utils/printerClient'

// Rough estimate: ~10g of filament per hour for typical prints
const FILAMENT_GRAMS_PER_HOUR = 10

// Get cost configuration
function getCosts() {
  const config = getCostConfig()
  return {
    filamentPerGram: config.filamentPerKg / 1000,
    electricityPerHour: config.electricityPerHour,
    filamentPerKg: config.filamentPerKg,
  }
}

interface PrinterLiveStatus {
  online: boolean
  isPrinting: boolean
  currentFile: string | null
  progress: number
  timeRemaining: number
  state: string
}

interface ActivePrintWithStatus {
  id: string
  userName: string
  printerName: string
  printerId: number
  fileName: string
  startedAt: string
  progress: number
  // Live status
  printerOnline: boolean
  stillRunning: boolean
  liveProgress: number
  timeRemaining: number
  // Cost estimation
  estimatedCost: {
    filament: number
    electricity: number
    total: number
  }
  elapsedTime: number // in seconds
}

async function getPrinterLiveStatus(printerId: number): Promise<PrinterLiveStatus> {
  const printer = getPrinterById(printerId)
  if (!printer) {
    return { online: false, isPrinting: false, currentFile: null, progress: 0, timeRemaining: 0, state: 'Unknown' }
  }

  const client = new PrinterClient(printer)

  try {
    const [jobData, printerData] = await Promise.all([
      client.getJobStatus(),
      client.getPrinterData(),
    ])

    const isPrinting = jobData.state === 'Printing' || jobData.state === 'Paused'
    const currentFile = jobData.file?.name || null
    const progress = jobData.progress?.completion || 0
    const timeRemaining = jobData.progress?.printTimeLeft || 0

    return {
      online: true,
      isPrinting,
      currentFile,
      progress,
      timeRemaining,
      state: jobData.state,
    }
  } catch {
    return { online: false, isPrinting: false, currentFile: null, progress: 0, timeRemaining: 0, state: 'Offline' }
  }
}

function estimateCosts(elapsedSeconds: number, totalEstimatedSeconds: number): { filament: number; electricity: number; total: number } {
  const costs = getCosts()

  // Use total estimated time if available, otherwise use elapsed time
  const totalHours = (totalEstimatedSeconds > 0 ? totalEstimatedSeconds : elapsedSeconds) / 3600

  // Estimate filament usage
  const filamentGrams = totalHours * FILAMENT_GRAMS_PER_HOUR
  const filamentCost = filamentGrams * costs.filamentPerGram

  // Electricity cost
  const electricityCost = totalHours * costs.electricityPerHour

  return {
    filament: Math.round(filamentCost * 100) / 100,
    electricity: Math.round(electricityCost * 100) / 100,
    total: Math.round((filamentCost + electricityCost) * 100) / 100,
  }
}

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const session = getSession(sessionId)
  if (!session || !session.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const users = getUsers()
  const printLogs = getPrintLogs(100)
  const activePrints = getActivePrintLogs()
  const activeSessions = getActiveSessions()
  const printers = getAllPrinters()

  // Group active prints by printer and keep only the most recent per printer
  const printsByPrinter = new Map<number, typeof activePrints[0]>()
  for (const print of activePrints) {
    const existing = printsByPrinter.get(print.printerId)
    if (!existing || new Date(print.startedAt) > new Date(existing.startedAt)) {
      printsByPrinter.set(print.printerId, print)
    }
  }
  const dedupedActivePrints = Array.from(printsByPrinter.values())

  // Fetch live status for each active print's printer
  const activePrintsWithStatus: ActivePrintWithStatus[] = await Promise.all(
    dedupedActivePrints.map(async (print) => {
      const liveStatus = await getPrinterLiveStatus(print.printerId)

      // Calculate elapsed time
      const startTime = new Date(print.startedAt).getTime()
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)

      // Determine if this print is still running
      // It's "still running" if the printer is printing and the file matches (or close enough)
      const stillRunning = liveStatus.online &&
        liveStatus.isPrinting &&
        liveStatus.currentFile !== null &&
        (liveStatus.currentFile === print.fileName ||
          print.fileName.includes(liveStatus.currentFile) ||
          liveStatus.currentFile.includes(print.fileName.replace('.gcode', '')))

      // Use live progress if still running, otherwise use stored progress
      const currentProgress = stillRunning ? liveStatus.progress : print.progress

      // Calculate estimated total time (elapsed + remaining)
      const totalEstimatedSeconds = stillRunning
        ? elapsedSeconds + liveStatus.timeRemaining
        : elapsedSeconds // If not running, we only have elapsed time

      // Estimate costs
      const estimatedCost = estimateCosts(elapsedSeconds, totalEstimatedSeconds)

      // Update the print log with live progress if still running
      if (stillRunning && Math.abs(currentProgress - print.progress) > 1) {
        updatePrintLog(print.id, { progress: currentProgress })
      }

      // If printer is not printing this file anymore, mark as completed or failed
      if (!stillRunning && liveStatus.online && print.status === 'printing') {
        // If progress was high, likely completed; otherwise might have failed
        if (print.progress >= 95 || currentProgress >= 95) {
          updatePrintLog(print.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
          })
        }
        // Don't auto-mark as failed - could be paused or other reasons
      }

      return {
        id: print.id,
        userName: print.userName,
        printerName: print.printerName,
        printerId: print.printerId,
        fileName: print.fileName,
        startedAt: print.startedAt,
        progress: print.progress,
        // Live status
        printerOnline: liveStatus.online,
        stillRunning,
        liveProgress: currentProgress,
        timeRemaining: liveStatus.timeRemaining,
        // Cost estimation
        estimatedCost,
        elapsedTime: elapsedSeconds,
      }
    })
  )

  // Calculate costs for recent completed prints
  const recentPrintsWithCosts = printLogs.slice(0, 20).map(log => {
    const startTime = new Date(log.startedAt).getTime()
    const endTime = log.completedAt ? new Date(log.completedAt).getTime() : Date.now()
    const elapsedSeconds = Math.floor((endTime - startTime) / 1000)
    const cost = estimateCosts(elapsedSeconds, elapsedSeconds)
    return {
      ...log,
      estimatedCost: cost,
      elapsedTime: elapsedSeconds,
    }
  })

  // Calculate total costs for completed prints
  const completedPrints = recentPrintsWithCosts.filter(p => p.status === 'completed')
  const totalCosts = {
    filament: completedPrints.reduce((sum, p) => sum + p.estimatedCost.filament, 0),
    electricity: completedPrints.reduce((sum, p) => sum + p.estimatedCost.electricity, 0),
    total: completedPrints.reduce((sum, p) => sum + p.estimatedCost.total, 0),
    printCount: completedPrints.length,
  }

  return {
    stats: {
      totalUsers: users.length,
      activeUsers: activeSessions.length,
      totalPrints: printLogs.length,
      activePrints: activePrintsWithStatus.filter(p => p.stillRunning).length,
      totalPrinters: printers.length,
    },
    adminName: getAdminName(),
    adminCode: getAdminCode(),
    activePrints: activePrintsWithStatus,
    recentPrints: recentPrintsWithCosts,
    totalCosts,
    activeSessions: activeSessions.map(s => ({
      userName: s.userName,
      lastActive: s.lastActive,
    })),
    users: users.map(u => ({
      id: u.id,
      name: u.name,
      createdAt: u.createdAt,
    })),
    // Full printer info for management
    printers: printers.map(p => ({
      id: p.id,
      name: p.name,
      model: p.model,
      ipAddr: p.ipAddr,
      apiKey: p.apiKey,
      status: p.status,
    })),
    // Cost configuration for display
    costConfig: getCostConfig(),
  }
})
