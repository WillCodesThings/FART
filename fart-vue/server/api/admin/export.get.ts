import { getSession, getPrintLogs, getCostConfig } from '~/server/utils/dataStore'

export default defineEventHandler((event) => {
  const sessionId = getCookie(event, 'fart-session')

  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const session = getSession(sessionId)
  if (!session || !session.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const printLogs = getPrintLogs(1000) // Get up to 1000 logs
  const costConfig = getCostConfig()

  // Calculate costs for each print
  const FILAMENT_GRAMS_PER_HOUR = 10

  const logsWithCosts = printLogs.map(log => {
    const startTime = new Date(log.startedAt).getTime()
    const endTime = log.completedAt ? new Date(log.completedAt).getTime() : Date.now()
    const elapsedHours = (endTime - startTime) / (1000 * 60 * 60)

    const filamentGrams = elapsedHours * FILAMENT_GRAMS_PER_HOUR
    const filamentCost = filamentGrams * (costConfig.filamentPerKg / 1000)
    const electricityCost = elapsedHours * costConfig.electricityPerHour
    const totalCost = filamentCost + electricityCost

    return {
      ...log,
      elapsedHours: Math.round(elapsedHours * 100) / 100,
      filamentGrams: Math.round(filamentGrams * 10) / 10,
      filamentCost: Math.round(filamentCost * 100) / 100,
      electricityCost: Math.round(electricityCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
    }
  })

  // Generate CSV
  const headers = [
    'ID',
    'User',
    'Printer',
    'File',
    'Started',
    'Completed',
    'Status',
    'Progress',
    'Duration (hrs)',
    'Filament (g)',
    'Filament Cost ($)',
    'Electricity Cost ($)',
    'Total Cost ($)',
  ]

  const rows = logsWithCosts.map(log => [
    log.id,
    log.userName,
    log.printerName,
    log.fileName,
    log.startedAt,
    log.completedAt || '',
    log.status,
    log.progress,
    log.elapsedHours,
    log.filamentGrams,
    log.filamentCost,
    log.electricityCost,
    log.totalCost,
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  // Calculate totals
  const totals = logsWithCosts.reduce(
    (acc, log) => ({
      filamentCost: acc.filamentCost + log.filamentCost,
      electricityCost: acc.electricityCost + log.electricityCost,
      totalCost: acc.totalCost + log.totalCost,
    }),
    { filamentCost: 0, electricityCost: 0, totalCost: 0 }
  )

  // Add totals row
  const csvWithTotals = csv + '\n' + [
    '',
    '',
    '',
    '',
    '',
    '',
    'TOTALS',
    '',
    '',
    '',
    Math.round(totals.filamentCost * 100) / 100,
    Math.round(totals.electricityCost * 100) / 100,
    Math.round(totals.totalCost * 100) / 100,
  ].map(cell => `"${cell}"`).join(',')

  setResponseHeader(event, 'Content-Type', 'text/csv')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="print-logs-${new Date().toISOString().split('T')[0]}.csv"`)

  return csvWithTotals
})
