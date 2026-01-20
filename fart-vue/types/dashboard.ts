// Dashboard-specific types for formatted printer data
export interface PrinterDashboardData {
  // Printer info
  name: string
  image: string
  ipAddr: string
  model: string
  status: string

  // Current job
  currentFile: string
  progress: number
  totalTime: number
  timeElapsed: number

  // Temperatures
  bedTemperature: number
  previousBedTemperature: number
  bedTemperatureHistory: number[]
  nozzleTemperature: number
  previousNozzleTemperature: number
  nozzleTemperatureHistory: number[]

  // Print head position
  headPosition: {
    x: number
    y: number
    z: number
  }

  // Print speed
  printSpeed: number
  previousPrintSpeed: number
  printSpeedHistory: number[]

  // Files
  files: DashboardFile[]

  // Additional
  filamentCost: string
  humidity?: number
  filamentLevel?: number
}

export interface DashboardFile {
  name: string
  image: string
  printTime: string
}
