export type PrinterStatus = 'Offline' | 'Idle' | 'Printing' | 'Paused' | 'Error'

export interface PrinterSpecs {
  buildVolume?: { x: number; y: number; z: number }
  maxTemp?: { nozzle: number; bed: number }
}

export interface Printer {
  id: number
  name: string
  image: string
  description: string
  apiKey: string
  ipAddr: string
  model: string
  status: PrinterStatus
  specs?: PrinterSpecs
}

export interface PrinterConfig {
  id: number
  name: string
  ipAddr: string
  apiKey: string
  model: string
  description?: string
  image?: string
}
