import { defineStore } from 'pinia'
import type { Printer, PrinterConfig, PrinterStatus } from '~/types/printer'

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
    // Load printers from backend API
    async loadPrinters() {
      if (!import.meta.client) {
        this.printers = []
        return
      }

      this.loading = true
      this.error = null

      try {
        const printers = await $fetch<Printer[]>('/api/printer')
        this.printers = printers.map(p => ({
          ...p,
          status: 'Offline' as PrinterStatus,
          specs: {},
        }))
      } catch (err) {
        console.error('Failed to load printers:', err)
        this.error = 'Failed to load printers'
        this.printers = []
      } finally {
        this.loading = false
      }
    },

    // Add a new printer (local state only - admin API handles persistence)
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
      return newPrinter
    },

    // Update an existing printer (local state only)
    updatePrinter(id: number, updates: Partial<PrinterConfig>) {
      const index = this.printers.findIndex(p => p.id === id)
      const existing = this.printers[index]
      if (index !== -1 && existing) {
        const updated: Printer = {
          ...existing,
          ...updates,
        }
        this.printers[index] = updated
        return updated
      }
      return null
    },

    // Remove a printer (local state only)
    removePrinter(id: number) {
      const index = this.printers.findIndex(p => p.id === id)
      if (index !== -1) {
        this.printers.splice(index, 1)
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

    // Clear all printers
    clearPrinters() {
      this.printers = []
    },
  },
})
