import { runScan, getScanStatus } from '~/server/utils/networkScanner'

export default defineEventHandler(async () => {
  const status = getScanStatus()
  if (status.running) {
    return { message: 'Scan already in progress', ...status }
  }

  const results = await runScan()
  return {
    message: 'Scan complete',
    ...getScanStatus(),
    results,
  }
})
