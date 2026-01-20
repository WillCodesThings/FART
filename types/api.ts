import type { PrintJob, PrintFile } from './job'
import type { PrinterTelemetry } from './telemetry'

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
}

export interface PrinterApiResponse {
  data: PrintJob
  files: PrintFile[]
  printerTelemetry: PrinterTelemetry
}

export interface PrinterCommand {
  command: 'img' | 'run' | 'pause' | 'resume' | 'cancel' | 'addPrint'
  filename?: string
  file?: File
}
