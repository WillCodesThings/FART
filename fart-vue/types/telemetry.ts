export interface TemperatureReading {
  actual: number
  target: number
}

export interface TemperatureData {
  bed: TemperatureReading
  tool0: TemperatureReading
}

export interface TelemetryData {
  'z-height': number
  'print-speed': number
  material?: string
}

export interface PrinterTelemetry {
  temperature: TemperatureData
  telemetry: TelemetryData
}
