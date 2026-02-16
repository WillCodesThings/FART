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

// Printer capabilities based on firmware/model
export interface PrinterCapabilities {
  model: string
  firmware: string
  serial?: string
  nozzleDiameter?: number
  hasInputShaper: boolean
  requiresBgcode: boolean
  supportedExtensions: string[]
  apiVersion?: string
}

// Get proxy URL from environment (for Docker on Mac)
// When set, requests go through the proxy to reach local network printers
const PRINTER_PROXY_URL = process.env.PRINTER_PROXY_URL || ''

export class PrinterClient {
  private printer: Printer

  constructor(printer: Printer) {
    this.printer = printer
  }

  private get baseUrl(): string {
    // If proxy is configured, route through it
    // Proxy format: http://host.docker.internal:9999/proxy/{printer-ip}
    if (PRINTER_PROXY_URL) {
      const proxyBase = PRINTER_PROXY_URL.replace(/\/$/, '') // Remove trailing slash
      return `${proxyBase}/proxy/${this.printer.ipAddr}`
    }
    return `http://${this.printer.ipAddr}`
  }

  private get headers(): Record<string, string> {
    return {
      'X-Api-Key': this.printer.apiKey,
      'Content-Type': 'application/json',
    }
  }

  // Get printer version and capabilities
  async getVersion(): Promise<PrinterCapabilities> {
    const url = `${this.baseUrl}/api/version`
    console.log(`[DEBUG] getVersion: Fetching version from ${url}`)

    try {
      const response = await fetchWithRetry(
        url,
        { headers: this.headers },
        { timeout: DEFAULT_TIMEOUT }
      )

      if (!response.ok) {
        console.log(`[DEBUG] getVersion: Failed with status ${response.status}`)
        return this.getDefaultCapabilities()
      }

      const data = await response.json()
      console.log(`[DEBUG] getVersion: Raw response:`, JSON.stringify(data, null, 2))

      return this.parseCapabilities(data)
    } catch (error) {
      console.log(`[DEBUG] getVersion: Error fetching version:`, error)
      return this.getDefaultCapabilities()
    }
  }

  // Parse version response into capabilities
  private parseCapabilities(data: {
    api?: string
    server?: string
    text?: string
    firmware?: string
    sdk?: string
    capabilities?: { upload_by_put?: boolean }
    nozzle_diameter?: number
    serial?: string
    hostname?: string
  }): PrinterCapabilities {
    const firmware = data.firmware || data.text || data.server || 'Unknown'
    const model = this.detectModel(firmware, data.hostname)
    const hasInputShaper = this.detectInputShaper(firmware, data.hostname)

    // MK4 with Input Shaper requires .bgcode
    // MK3 and older use .gcode
    // XL uses .bgcode
    const requiresBgcode = hasInputShaper || model.toLowerCase().includes('xl')

    const supportedExtensions = requiresBgcode
      ? ['.bgcode', '.bgc']
      : ['.gcode', '.gco', '.g']

    console.log(`[DEBUG] parseCapabilities: Model=${model}, Firmware=${firmware}, InputShaper=${hasInputShaper}, RequiresBgcode=${requiresBgcode}`)

    return {
      model,
      firmware,
      serial: data.serial,
      nozzleDiameter: data.nozzle_diameter,
      hasInputShaper,
      requiresBgcode,
      supportedExtensions,
      apiVersion: data.api,
    }
  }

  // Detect printer model from firmware string
  private detectModel(firmware: string, hostname?: string): string {
    const fw = firmware.toLowerCase()
    const host = (hostname || '').toLowerCase()

    // Check firmware string for model indicators
    if (fw.includes('xl') || host.includes('xl')) return 'Prusa XL'
    if (fw.includes('mk4') || host.includes('mk4')) return 'Prusa MK4'
    if (fw.includes('mk3.9') || host.includes('mk3.9')) return 'Prusa MK3.9'
    if (fw.includes('mk3.5') || host.includes('mk3.5')) return 'Prusa MK3.5'
    if (fw.includes('mk3s') || host.includes('mk3s')) return 'Prusa MK3S+'
    if (fw.includes('mk3') || host.includes('mk3')) return 'Prusa MK3'
    if (fw.includes('mini') || host.includes('mini')) return 'Prusa Mini'

    // Use configured model as fallback
    return this.printer.model || 'Unknown'
  }

  // Detect if firmware has Input Shaper (and thus requires bgcode)
  private detectInputShaper(firmware: string, hostname?: string): boolean {
    const fw = firmware.toLowerCase()
    const host = (hostname || '').toLowerCase()

    // Input Shaper firmware versions typically have specific identifiers
    // MK4 firmware 5.x+ has Input Shaper
    // Look for "is" suffix or version patterns

    // Check for explicit Input Shaper indicators
    if (fw.includes('input shaper') || fw.includes('inputshaper')) return true
    if (fw.includes('-is') || host.includes('-is')) return true // e.g., "5.1.0-is"

    // MK4 firmware version 5.0.0+ has Input Shaper
    const versionMatch = fw.match(/(\d+)\.(\d+)\.(\d+)/)
    if (versionMatch && (fw.includes('mk4') || host.includes('mk4'))) {
      const major = parseInt(versionMatch[1])
      if (major >= 5) return true
    }

    // XL always uses bgcode
    if (fw.includes('xl') || host.includes('xl')) return true

    // MK4 printers (detected by hostname) - assume Input Shaper by default
    // Modern MK4 firmware all has Input Shaper enabled
    if (host.includes('mk4') || host.includes('prusa-mk4')) {
      console.log(`[DEBUG] detectInputShaper: MK4 detected from hostname "${host}", assuming Input Shaper`)
      return true
    }

    // MK3.9 and MK3.5 can also have Input Shaper firmware
    if (host.includes('mk3.9') || host.includes('mk3.5')) {
      console.log(`[DEBUG] detectInputShaper: MK3.9/MK3.5 detected, may have Input Shaper`)
      // These can go either way, so check the server version
      // PrusaLink 2.x+ typically indicates Input Shaper firmware
      if (fw.includes('prusalink') || fw.includes('2.')) {
        return true
      }
    }

    return false
  }

  // Get default capabilities when detection fails
  private getDefaultCapabilities(): PrinterCapabilities {
    const model = this.printer.model || 'Unknown'
    const isMK4 = model.toLowerCase().includes('mk4')
    const isXL = model.toLowerCase().includes('xl')

    // Assume newer printers (MK4, XL) need bgcode
    const requiresBgcode = isMK4 || isXL

    return {
      model,
      firmware: 'Unknown',
      hasInputShaper: requiresBgcode,
      requiresBgcode,
      supportedExtensions: requiresBgcode
        ? ['.bgcode', '.bgc']
        : ['.gcode', '.gco', '.g'],
    }
  }

  // Validate file extension against printer capabilities
  async validateFileExtension(filename: string): Promise<{
    valid: boolean
    error?: string
    warning?: string
    capabilities: PrinterCapabilities
  }> {
    const capabilities = await this.getVersion()
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))

    console.log(`[DEBUG] validateFileExtension: File="${filename}", Ext="${ext}", Supported=${capabilities.supportedExtensions.join(',')}`)

    // Check if extension is supported
    const isSupported = capabilities.supportedExtensions.some(
      supported => ext === supported || ext === supported.replace('.', '')
    )

    if (!isSupported) {
      const isGcode = ext === '.gcode' || ext === '.gco' || ext === '.g'
      const isBgcode = ext === '.bgcode' || ext === '.bgc'

      if (capabilities.requiresBgcode && isGcode) {
        return {
          valid: false,
          error: `This printer (${capabilities.model}) requires binary G-code (.bgcode) files. You uploaded a .gcode file. Please re-slice your model with PrusaSlicer using the correct printer profile (with Input Shaper enabled).`,
          capabilities,
        }
      }

      if (!capabilities.requiresBgcode && isBgcode) {
        return {
          valid: false,
          error: `This printer (${capabilities.model}) does not support binary G-code (.bgcode) files. Please use regular .gcode files.`,
          capabilities,
        }
      }

      return {
        valid: false,
        error: `Unsupported file type "${ext}". This printer accepts: ${capabilities.supportedExtensions.join(', ')}`,
        capabilities,
      }
    }

    return { valid: true, capabilities }
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

    const raw = await response.json()
    console.log(`[DEBUG] getJobStatus: Raw response:`, JSON.stringify(raw, null, 2))

    // Normalize PrusaLink response to our PrintJob format
    // PrusaLink: { state, job: { file: {...} }, progress: { completion: 0-1 } }
    // Our format: { state, file: {...}, progress: { completion: 0-100 } }
    const normalized: PrintJob = {
      state: raw.state || 'Operational',
      file: raw.job?.file ? {
        name: raw.job.file.name,
        display: raw.job.file.display || raw.job.file.name,
        path: raw.job.file.path,
        thumbnailBig: raw.job.file.refs?.thumbnailBig || undefined,
      } : null,
      progress: {
        // Convert 0-1 decimal to 0-100 percentage
        completion: Math.round((raw.progress?.completion || 0) * 100),
        printTime: raw.progress?.printTime || 0,
        printTimeLeft: raw.progress?.printTimeLeft || 0,
      },
      raw: raw,
    }

    console.log(`[DEBUG] getJobStatus: Normalized - State: ${normalized.state}, File: ${normalized.file?.name || 'none'}, Progress: ${normalized.progress.completion}%`)

    return normalized
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

  // Fetch available files on the printer (PrusaLink API)
  async getFiles(): Promise<PrintFile[]> {
    const url = `${this.baseUrl}/api/v1/files/usb`
    console.log(`[DEBUG] getFiles: Fetching files from ${url}`)

    const response = await fetchWithRetry(
      url,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    )

    console.log(`[DEBUG] getFiles: Response status ${response.status} ${response.statusText}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[DEBUG] getFiles: Raw response:`, JSON.stringify(data, null, 2))

    // PrusaLink returns { children: [...] } directly
    const rawFiles = data.children || data.files?.[0]?.children || []
    console.log(`[DEBUG] getFiles: Found ${rawFiles.length} files`)

    // Map PrusaLink format to our PrintFile format
    const files: PrintFile[] = rawFiles.map((file: { name: string; display_name?: string; display?: string; refs?: { printTime?: string } }) => ({
      name: file.name,
      display: file.display_name || file.display || file.name,
      refs: {
        printTime: this.extractPrintTimeFromFilename(file.display_name || file.display || file.name)
      }
    }))

    console.log(`[DEBUG] getFiles: Mapped files:`, JSON.stringify(files, null, 2))
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
    fileData: Buffer | Blob | FormData,
    fileName: string,
    increment: number = 0
  ): Promise<void> {
    const adjustedName = increment === 0 ? fileName : `${increment}${fileName}`
    const url = `${this.baseUrl}/api/v1/files/usb/${adjustedName}`

    // Determine content type based on file extension
    const isBgcode = fileName.toLowerCase().endsWith('.bgcode') || fileName.toLowerCase().endsWith('.bgc')
    const contentType = isBgcode ? 'application/octet-stream' : 'text/x.gcode'

    console.log(`[DEBUG] addPrint: Uploading file "${adjustedName}" to ${url}`)
    console.log(`[DEBUG] addPrint: Printer: ${this.printer.name} (${this.printer.ipAddr})`)
    console.log(`[DEBUG] addPrint: API Key: ${this.printer.apiKey.substring(0, 4)}...`)
    console.log(`[DEBUG] addPrint: Content-Type: ${contentType}`)
    console.log(`[DEBUG] addPrint: Increment: ${increment}`)

    // Extract raw file data if FormData was passed
    let body: Buffer | Blob | ArrayBuffer
    if (fileData instanceof FormData) {
      const file = fileData.get('file') as Blob
      body = file
      console.log(`[DEBUG] addPrint: Extracted file from FormData, size: ${file.size} bytes`)
    } else {
      body = fileData
      console.log(`[DEBUG] addPrint: Using raw file data`)
    }

    const response = await fetchWithTimeout(
      url,
      {
        method: 'PUT',
        body: body,
        headers: {
          'X-Api-Key': this.printer.apiKey,
          'Print-After-Upload': 'true',
          'Content-Type': contentType,
        },
      },
      120000 // 120 second timeout for uploads (bgcode files can be large)
    )

    console.log(`[DEBUG] addPrint: Response status ${response.status} ${response.statusText}`)

    if (!response.ok) {
      // Handle filename conflict by incrementing
      if (response.status === 409 && increment < 10) {
        console.log(`[DEBUG] addPrint: File conflict (409), retrying with increment ${increment + 1}`)
        return this.addPrint(fileData, fileName, increment + 1)
      }
      const responseText = await response.text().catch(() => 'Unable to read response')
      console.log(`[DEBUG] addPrint: Upload failed. Response body: ${responseText}`)
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    console.log(`[DEBUG] addPrint: Upload successful!`)
  }

  // Control the printer (pause, resume, cancel)
  async controlPrint(action: PrintAction): Promise<void> {
    // PrusaLink API uses "pause" command with action field for pause/resume
    // - Pause: { "command": "pause", "action": "pause" }
    // - Resume: { "command": "pause", "action": "resume" }
    // - Cancel: { "command": "cancel" }
    let body: { command: string; action?: string }
    if (action === 'pause' || action === 'resume') {
      body = { command: 'pause', action: action }
    } else {
      body = { command: action }
    }

    console.log(`[DEBUG] controlPrint: Sending ${action} command:`, JSON.stringify(body))

    const response = await fetchWithRetry(
      `${this.baseUrl}/api/job`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      },
      { timeout: DEFAULT_TIMEOUT }
    )

    console.log(`[DEBUG] controlPrint: Response status ${response.status} ${response.statusText}`)

    if (response.status !== 204 && !response.ok) {
      throw new Error(`Control command failed: ${response.status} ${response.statusText}`)
    }
  }

  // Select and start a print job (PrusaLink API)
  async selectPrint(fileName: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/files/usb/${fileName}`
    const body = JSON.stringify({ command: 'start' })

    console.log(`[DEBUG] selectPrint: Starting print of "${fileName}"`)
    console.log(`[DEBUG] selectPrint: URL: ${url}`)
    console.log(`[DEBUG] selectPrint: Printer: ${this.printer.name} (${this.printer.ipAddr})`)
    console.log(`[DEBUG] selectPrint: API Key: ${this.printer.apiKey.substring(0, 4)}...`)
    console.log(`[DEBUG] selectPrint: Request body: ${body}`)
    console.log(`[DEBUG] selectPrint: Headers:`, JSON.stringify(this.headers, null, 2))

    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: this.headers,
        body: body,
      },
      { timeout: DEFAULT_TIMEOUT }
    )

    console.log(`[DEBUG] selectPrint: Response status ${response.status} ${response.statusText}`)

    if (!response.ok && response.status !== 204) {
      const responseText = await response.text().catch(() => 'Unable to read response')
      console.log(`[DEBUG] selectPrint: Failed. Response body: ${responseText}`)
      throw new Error(`Failed to select print: ${response.status} ${response.statusText}`)
    }

    console.log(`[DEBUG] selectPrint: Print started successfully!`)
  }

  // Get thumbnail image for the current print job
  async getThumbnail(thumbPath: string): Promise<Buffer> {
    const response = await fetchWithTimeout(
      `${this.baseUrl}${thumbPath}`,
      {
        method: 'GET',
        headers: {
          'X-Api-Key': this.printer.apiKey,
          'Accept': 'image/*',
        },
      },
      10000
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch thumbnail: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
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

  // Get detailed file list with sizes (PrusaLink API)
  async getFilesDetailed(): Promise<PrintFileDetailed[]> {
    const url = `${this.baseUrl}/api/v1/files/usb`
    console.log(`[DEBUG] getFilesDetailed: Fetching files from ${url}`)

    const response = await fetchWithRetry(
      url,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const rawFiles = data.children || data.files?.[0]?.children || []

    // Map PrusaLink format to detailed format
    const files: PrintFileDetailed[] = rawFiles.map((file: {
      name: string
      display_name?: string
      size?: number
      m_timestamp?: number
      type?: string
      ro?: boolean
    }) => ({
      name: file.name,
      displayName: file.display_name || file.name,
      size: file.size || 0,
      modified: file.m_timestamp ? new Date(file.m_timestamp * 1000).toISOString() : null,
      type: file.type || 'PRINT_FILE',
      readOnly: file.ro || false,
    }))

    console.log(`[DEBUG] getFilesDetailed: Found ${files.length} files`)
    return files
  }

  // Delete a file from the printer (PrusaLink API)
  async deleteFile(fileName: string): Promise<void> {
    const url = `${this.baseUrl}/api/v1/files/usb/${fileName}`
    console.log(`[DEBUG] deleteFile: Deleting file "${fileName}" from ${url}`)
    console.log(`[DEBUG] deleteFile: Printer: ${this.printer.name} (${this.printer.ipAddr})`)

    const response = await fetchWithRetry(
      url,
      {
        method: 'DELETE',
        headers: {
          'X-Api-Key': this.printer.apiKey,
        },
      },
      { timeout: DEFAULT_TIMEOUT }
    )

    console.log(`[DEBUG] deleteFile: Response status ${response.status} ${response.statusText}`)

    if (!response.ok && response.status !== 204) {
      const responseText = await response.text().catch(() => 'Unable to read response')
      console.log(`[DEBUG] deleteFile: Failed. Response body: ${responseText}`)
      throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`)
    }

    console.log(`[DEBUG] deleteFile: File deleted successfully!`)
  }

  // Get storage info (PrusaLink API)
  async getStorageInfo(): Promise<StorageInfo> {
    const url = `${this.baseUrl}/api/v1/storage`
    console.log(`[DEBUG] getStorageInfo: Fetching storage info from ${url}`)

    const response = await fetchWithRetry(
      url,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    )

    if (!response.ok) {
      // If storage endpoint doesn't exist, return default values
      console.log(`[DEBUG] getStorageInfo: Endpoint not available, returning defaults`)
      return {
        free: 0,
        total: 0,
        available: true,
      }
    }

    const data = await response.json()
    console.log(`[DEBUG] getStorageInfo: Raw response:`, JSON.stringify(data, null, 2))

    // Find USB storage
    const usbStorage = data.storage_list?.find((s: { path: string }) => s.path === '/usb/') || data

    return {
      free: usbStorage.free_space || usbStorage.free || 0,
      total: usbStorage.total_space || usbStorage.total || 0,
      available: usbStorage.available !== false,
    }
  }
}

// Detailed file info interface
export interface PrintFileDetailed {
  name: string
  displayName: string
  size: number
  modified: string | null
  type: string
  readOnly: boolean
}

// Storage info interface
export interface StorageInfo {
  free: number
  total: number
  available: boolean
}

// Factory function to create a PrinterClient
export function createPrinterClient(printer: Printer): PrinterClient {
  return new PrinterClient(printer)
}
