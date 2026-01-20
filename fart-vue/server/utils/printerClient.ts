import type { PrintJob, PrintFile, PrintAction } from '~/types/job'
import type { PrinterTelemetry } from '~/types/telemetry'
import type { Printer } from '~/types/printer'

const DEFAULT_TIMEOUT = 10000 // 10 seconds

interface FetchOptions {
  timeout?: number
  retries?: number
  retryDelay?: number
}

// Fetch with timeout support
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// Fetch with retry support
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  { timeout = DEFAULT_TIMEOUT, retries = 2, retryDelay = 1000 }: FetchOptions = {}
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout)
      return response
    } catch (error) {
      lastError = error as Error
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
      }
    }
  }

  throw lastError
}

export class PrinterClient {
  private printer: Printer

  constructor(printer: Printer) {
    this.printer = printer
  }

  private get baseUrl(): string {
    return `http://${this.printer.ipAddr}`
  }

  private get headers(): Record<string, string> {
    return {
      'X-Api-Key': this.printer.apiKey,
      'Content-Type': 'application/json',
    }
  }

  // Fetch job status from the printer
  async getJobStatus(): Promise<PrintJob> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/job`,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Fetch printer telemetry data
  async getPrinterData(): Promise<PrinterTelemetry> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/printer`,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch printer data: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Fetch available files on the printer
  async getFiles(): Promise<PrintFile[]> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/files`,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.files || data.files.length === 0) {
      return []
    }

    const files: PrintFile[] = data.files[0]?.children || []

    // Extract print time from filename and add to refs
    for (const file of files) {
      const printTime = this.extractPrintTimeFromFilename(file.display || file.name)
      if (file.refs) {
        file.refs.printTime = printTime
      }
    }

    return files
  }

  // Extract print time from filename (e.g., "model_4h53m.gcode" -> "4h53m")
  private extractPrintTimeFromFilename(filename: string): string {
    const parts = filename.split('_')
    if (parts.length > 1) {
      const timeParts = parts.filter(part => part.includes('m'))
      const lastPart = timeParts[timeParts.length - 1]
      if (lastPart) {
        return lastPart.split('.')[0] ?? 'Unknown'
      }
    }
    return 'Unknown'
  }

  // Upload and start a print job
  async addPrint(
    formData: FormData,
    fileName: string,
    increment: number = 0
  ): Promise<void> {
    const adjustedName = increment === 0 ? fileName : `${increment}${fileName}`

    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/v1/files/usb/${adjustedName}`,
      {
        method: 'PUT',
        body: formData,
        headers: {
          'X-Api-Key': this.printer.apiKey,
          'Print-After-Upload': 'true',
          'Content-Type': 'text/x.gcode',
        },
      },
      60000 // 60 second timeout for uploads
    )

    if (!response.ok) {
      // Handle filename conflict by incrementing
      if (response.status === 409 && increment < 10) {
        return this.addPrint(formData, fileName, increment + 1)
      }
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }
  }

  // Control the printer (pause, resume, cancel)
  async controlPrint(action: PrintAction): Promise<void> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/job`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ command: action, action }),
      },
      { timeout: DEFAULT_TIMEOUT }
    )

    if (response.status !== 204 && !response.ok) {
      throw new Error(`Control command failed: ${response.status} ${response.statusText}`)
    }
  }

  // Select and start a print job
  async selectPrint(fileName: string): Promise<void> {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/files/local/${fileName}`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ command: 'select', print: true }),
      },
      { timeout: DEFAULT_TIMEOUT }
    )

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to select print: ${response.status} ${response.statusText}`)
    }
  }

  // Get live image from the printer
  async getImage(): Promise<Blob> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/`,
      {
        method: 'GET',
        headers: {
          'X-Api-Key': this.printer.apiKey,
          'Accept': 'image/*',
          'Cache-Control': 'no-cache',
        },
      },
      15000 // 15 second timeout for images
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    return this.processChunkedResponse(response)
  }

  // Process chunked response for image fetching
  private async processChunkedResponse(response: Response): Promise<Blob> {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const chunks: BlobPart[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) chunks.push(value as BlobPart)
    }

    return new Blob(chunks, { type: 'image/png' })
  }

  // Check if printer is reachable
  async ping(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/version`,
        { headers: this.headers },
        5000 // 5 second timeout for ping
      )
      return response.ok
    } catch {
      return false
    }
  }
}

// Factory function to create a PrinterClient
export function createPrinterClient(printer: Printer): PrinterClient {
  return new PrinterClient(printer)
}
