import type { Printer } from '~/types/printer'
import {
  getPrinters as getStoredPrinters,
  getPrinterById as getStoredPrinterById,
  addPrinter as addStoredPrinter,
  updatePrinter as updateStoredPrinter,
  deletePrinter as deleteStoredPrinter,
} from './dataStore'

// Convert stored printer to full Printer type
function toFullPrinter(stored: ReturnType<typeof getStoredPrinters>[0]): Printer {
  return {
    ...stored,
    status: 'Offline',
    specs: {},
  }
}

export function getAllPrinters(): Printer[] {
  return getStoredPrinters().map(toFullPrinter)
}

export function getPrinterById(id: number): Printer | undefined {
  const stored = getStoredPrinterById(id)
  return stored ? toFullPrinter(stored) : undefined
}

export function addPrinter(printer: Omit<Printer, 'id' | 'status' | 'specs'>): Printer {
  const stored = addStoredPrinter({
    name: printer.name,
    ipAddr: printer.ipAddr,
    apiKey: printer.apiKey,
    model: printer.model,
    description: printer.description || '',
    image: printer.image || 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
  })
  return toFullPrinter(stored)
}

export function updatePrinter(id: number, updates: Partial<Printer>): Printer | null {
  const stored = updateStoredPrinter(id, {
    name: updates.name,
    ipAddr: updates.ipAddr,
    apiKey: updates.apiKey,
    model: updates.model,
    description: updates.description,
    image: updates.image,
  })
  return stored ? toFullPrinter(stored) : null
}

export function deletePrinter(id: number): boolean {
  return deleteStoredPrinter(id)
}
