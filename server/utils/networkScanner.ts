import { networkInterfaces } from 'os'
import { getPrinters, updatePrinter } from './dataStore'

const PRINTER_PROXY_URL = process.env.PRINTER_PROXY_URL || ''
const SCAN_TIMEOUT = 1500 // 1.5s per IP
const SCAN_INTERVAL = 5 * 60 * 1000 // 5 minutes
const BATCH_SIZE = 30 // concurrent requests

interface ScanResult {
  printerId: number
  printerName: string
  oldIp: string
  newIp: string
  found: boolean
}

interface ScanStatus {
  running: boolean
  lastScan: string | null
  lastDuration: number | null
  results: ScanResult[]
  subnet: string | null
}

const state: ScanStatus = {
  running: false,
  lastScan: null,
  lastDuration: null,
  results: [],
  subnet: null,
}

let scanInterval: ReturnType<typeof setInterval> | null = null

function getLocalSubnet(): string | null {
  const interfaces = networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    const addrs = interfaces[name]
    if (!addrs) continue
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal && addr.netmask === '255.255.255.0') {
        // e.g. 192.168.1.105 -> 192.168.1
        const parts = addr.address.split('.')
        return `${parts[0]}.${parts[1]}.${parts[2]}`
      }
    }
  }
  return null
}

function buildUrl(ip: string): string {
  if (PRINTER_PROXY_URL) {
    const proxyBase = PRINTER_PROXY_URL.replace(/\/$/, '')
    return `${proxyBase}/proxy/${ip}/api/version`
  }
  return `http://${ip}/api/version`
}

async function tryIpWithKey(ip: string, apiKey: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT)

    const response = await fetch(buildUrl(ip), {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}

// Scan IPs in batches to avoid overwhelming the network
async function scanInBatches(ips: string[], apiKey: string): Promise<string | null> {
  for (let i = 0; i < ips.length; i += BATCH_SIZE) {
    const batch = ips.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (ip) => ({ ip, ok: await tryIpWithKey(ip, apiKey) }))
    )
    const found = results.find(r => r.ok)
    if (found) return found.ip
  }
  return null
}

export async function runScan(): Promise<ScanResult[]> {
  if (state.running) return state.results

  const subnet = getLocalSubnet()
  if (!subnet) {
    console.log('[NetworkScanner] Could not detect local subnet')
    return []
  }

  state.running = true
  state.subnet = subnet
  const startTime = Date.now()
  const results: ScanResult[] = []

  const printers = getPrinters()
  if (printers.length === 0) {
    state.running = false
    return []
  }

  // Build IP list (1-254), excluding known working IPs to check them first
  const knownIps = new Set(printers.map(p => p.ipAddr))
  const allIps: string[] = []
  for (let i = 1; i <= 254; i++) {
    allIps.push(`${subnet}.${i}`)
  }

  console.log(`[NetworkScanner] Scanning ${subnet}.0/24 for ${printers.length} printer(s)`)

  for (const printer of printers) {
    // Try current IP first (fast path)
    const currentWorks = await tryIpWithKey(printer.ipAddr, printer.apiKey)

    if (currentWorks) {
      results.push({
        printerId: printer.id,
        printerName: printer.name,
        oldIp: printer.ipAddr,
        newIp: printer.ipAddr,
        found: true,
      })
      console.log(`[NetworkScanner] ${printer.name}: still at ${printer.ipAddr}`)
      continue
    }

    // Current IP doesn't work — scan the subnet
    // Prioritize IPs not assigned to other printers
    const otherPrinterIps = new Set(printers.filter(p => p.id !== printer.id).map(p => p.ipAddr))
    const prioritizedIps = allIps.filter(ip => ip !== printer.ipAddr && !otherPrinterIps.has(ip))

    const foundIp = await scanInBatches(prioritizedIps, printer.apiKey)

    if (foundIp) {
      console.log(`[NetworkScanner] ${printer.name}: moved from ${printer.ipAddr} to ${foundIp}`)
      updatePrinter(printer.id, { ipAddr: foundIp })
      results.push({
        printerId: printer.id,
        printerName: printer.name,
        oldIp: printer.ipAddr,
        newIp: foundIp,
        found: true,
      })
    } else {
      console.log(`[NetworkScanner] ${printer.name}: not found on network`)
      results.push({
        printerId: printer.id,
        printerName: printer.name,
        oldIp: printer.ipAddr,
        newIp: printer.ipAddr,
        found: false,
      })
    }
  }

  state.running = false
  state.lastScan = new Date().toISOString()
  state.lastDuration = Date.now() - startTime
  state.results = results

  console.log(`[NetworkScanner] Scan complete in ${state.lastDuration}ms`)
  return results
}

// Scan for a single printer by API key — used on creation
export async function scanForPrinter(printerId: number, apiKey: string): Promise<string | null> {
  const subnet = getLocalSubnet()
  if (!subnet) return null

  const allIps: string[] = []
  for (let i = 1; i <= 254; i++) {
    allIps.push(`${subnet}.${i}`)
  }

  console.log(`[NetworkScanner] Scanning for new printer ${printerId} on ${subnet}.0/24`)
  const foundIp = await scanInBatches(allIps, apiKey)

  if (foundIp) {
    console.log(`[NetworkScanner] New printer ${printerId} found at ${foundIp}`)
    updatePrinter(printerId, { ipAddr: foundIp })
  } else {
    console.log(`[NetworkScanner] New printer ${printerId} not found on network`)
  }

  return foundIp
}

export function getScanStatus(): ScanStatus {
  return { ...state }
}

export function startPeriodicScan() {
  if (scanInterval) return

  // Run first scan after a short delay to let the server start
  setTimeout(() => {
    runScan()
  }, 10000)

  // Then scan every 5 minutes
  scanInterval = setInterval(() => {
    runScan()
  }, SCAN_INTERVAL)

  console.log(`[NetworkScanner] Periodic scanning enabled (every ${SCAN_INTERVAL / 1000}s)`)
}

export function stopPeriodicScan() {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
}
