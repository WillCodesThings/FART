import { defineStore } from 'pinia'
import type { Printer, PrinterConfig, PrinterStatus } from '~/types/printer'

// Storage key for persisting printers
const STORAGE_KEY = 'fart-printers'

// Default printers (migrated from original Svelte app)
const DEFAULT_PRINTERS: Printer[] = [
  {
    id: 0,
    name: 'Mock Printer',
    image: 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
    description: 'Local mock printer for testing',
    apiKey: 'test-api-key',
    ipAddr: 'mock-printer:8888',
    model: 'Mock Prusa MK-4',
    status: 'Offline',
    specs: {},
  },
  {
    id: 1,
    name: 'Dave',
    image: 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
    description: "Dave doesn't work",
    apiKey: 'eVc9qg9Pd8L5Biy',
    ipAddr: '192.168.50.234',
    model: 'Prusa MK-4',
    status: 'Offline',
    specs: {},
  },
  {
    id: 2,
    name: 'Greg',
    image: 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
    description: 'Dave works pretty well',
    apiKey: 'iiEjCdV9rkC3oUh',
    ipAddr: '192.168.50.186',
    model: 'Prusa MK-4',
    status: 'Offline',
    specs: {},
  },
  {
    id: 4,
    name: 'Mark',
    image: 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
    description: 'One of us is telling the truth',
    apiKey: 'UZtsmAmQjU4EuwJ',
    ipAddr: '192.168.50.206',
    model: 'Prusa MK-4',
    status: 'Offline',
    specs: {},
  },
  {
    id: 3,
    name: 'Larry',
    image: 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
    description: 'One of us is lying',
    apiKey: '8xjWDu9cUSVEXf7',
    ipAddr: '192.168.50.106',
    model: 'Prusa MK-4',
    status: 'Offline',
    specs: {},
  },
]

export const usePrinterStore = defineStore('printers', {
  state: () => ({
    printers: [] as Printer[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getPrinterById: (state) => {
      return (id: number): Printer | undefined => {
        return state.printers.find(p => p.id === id)
      }
    },

    onlinePrinters: (state): Printer[] => {
      return state.printers.filter(p => p.status !== 'Offline')
    },

    offlinePrinters: (state): Printer[] => {
      return state.printers.filter(p => p.status === 'Offline')
    },
  },

  actions: {
    // Load printers from storage or use defaults
    loadPrinters() {
      if (import.meta.client) {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          try {
            this.printers = JSON.parse(stored)
          } catch {
            this.printers = [...DEFAULT_PRINTERS]
          }
        } else {
          this.printers = [...DEFAULT_PRINTERS]
        }
      } else {
        this.printers = [...DEFAULT_PRINTERS]
      }
    },

    // Save printers to storage
    savePrinters() {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.printers))
      }
    },

    // Add a new printer
    addPrinter(config: PrinterConfig) {
      const newPrinter: Printer = {
        id: config.id || Date.now(),
        name: config.name,
        image: config.image || 'https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp',
        description: config.description || '',
        apiKey: config.apiKey,
        ipAddr: config.ipAddr,
        model: config.model,
        status: 'Offline',
        specs: {},
      }

      this.printers.push(newPrinter)
      this.savePrinters()
      return newPrinter
    },

    // Update an existing printer
    updatePrinter(id: number, updates: Partial<PrinterConfig>) {
      const index = this.printers.findIndex(p => p.id === id)
      const existing = this.printers[index]
      if (index !== -1 && existing) {
        const updated: Printer = {
          ...existing,
          ...updates,
        }
        this.printers[index] = updated
        this.savePrinters()
        return updated
      }
      return null
    },

    // Remove a printer
    removePrinter(id: number) {
      const index = this.printers.findIndex(p => p.id === id)
      if (index !== -1) {
        this.printers.splice(index, 1)
        this.savePrinters()
        return true
      }
      return false
    },

    // Update printer status
    updateStatus(id: number, status: PrinterStatus) {
      const printer = this.printers.find(p => p.id === id)
      if (printer) {
        printer.status = status
      }
    },

    // Reset to default printers
    resetToDefaults() {
      this.printers = [...DEFAULT_PRINTERS]
      this.savePrinters()
    },
  },
})
