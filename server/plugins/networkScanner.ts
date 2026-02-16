import { startPeriodicScan } from '~/server/utils/networkScanner'

export default defineNitroPlugin(() => {
  startPeriodicScan()
})
