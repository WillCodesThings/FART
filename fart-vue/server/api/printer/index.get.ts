import { getAllPrinters } from '~/server/utils/printerStore'

export default defineEventHandler(() => {
  return getAllPrinters()
})
