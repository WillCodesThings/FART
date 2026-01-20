import { getSession } from '~/server/utils/dataStore'
import { addPrinter, updatePrinter, deletePrinter, getPrinterById } from '~/server/utils/printerStore'
import type { Printer } from '~/types/printer'

interface PrinterAction {
  action: 'add' | 'edit' | 'delete'
  id?: number
  printer?: Partial<Printer>
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

  const body = await readBody<PrinterAction>(event)
  const { action, id, printer } = body

  if (action === 'add') {
    if (!printer?.name || !printer?.ipAddr || !printer?.apiKey) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name, IP address, and API key are required',
      })
    }

    const newPrinter = addPrinter({
      name: printer.name,
      ipAddr: printer.ipAddr,
      apiKey: printer.apiKey,
      model: printer.model || 'Unknown',
      description: printer.description || '',
      image: printer.image || 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
      status: 'Offline',
      specs: {},
    })

    return { success: true, message: 'Printer added', printer: newPrinter }
  }

  if (action === 'edit') {
    if (id === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'Printer ID is required' })
    }

    const existing = getPrinterById(id)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Printer not found' })
    }

    const updated = updatePrinter(id, {
      name: printer?.name,
      ipAddr: printer?.ipAddr,
      apiKey: printer?.apiKey,
      model: printer?.model,
      description: printer?.description,
    })

    return { success: true, message: 'Printer updated', printer: updated }
  }

  if (action === 'delete') {
    if (id === undefined) {
      throw createError({ statusCode: 400, statusMessage: 'Printer ID is required' })
    }

    const success = deletePrinter(id)
    if (!success) {
      throw createError({ statusCode: 404, statusMessage: 'Printer not found' })
    }

    return { success: true, message: 'Printer deleted' }
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid action' })
})
