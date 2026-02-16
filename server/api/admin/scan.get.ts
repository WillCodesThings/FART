import { getScanStatus } from '~/server/utils/networkScanner'

export default defineEventHandler(() => {
  return getScanStatus()
})
