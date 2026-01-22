import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { AppData, User, Session, PrintLog, StoredPrinter, CostConfig, MaintenanceLog } from '~/types/auth'

const DATA_DIR = process.env.DATA_DIR || './data'
const DATA_FILE = join(DATA_DIR, 'fart-data.json')

// Admin credentials
const ADMIN_NAME = 'stembassadors'
const DEFAULT_ADMIN_CODE = '1264'

// No default printers - printers are managed by admins and persisted to file

const DEFAULT_COST_CONFIG: CostConfig = {
  filamentPerKg: 25,
  electricityPerHour: 0.05,
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function getDefaultData(): AppData {
  return {
    users: [],
    printLogs: [],
    sessions: [],
    adminCode: DEFAULT_ADMIN_CODE,
    printers: [],
    costConfig: DEFAULT_COST_CONFIG,
    maintenanceLogs: [],
  }
}

export function loadData(): AppData {
  ensureDataDir()

  if (!existsSync(DATA_FILE)) {
    const defaultData = getDefaultData()
    saveData(defaultData)
    return defaultData
  }

  try {
    const content = readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(content) as AppData
  } catch {
    const defaultData = getDefaultData()
    saveData(defaultData)
    return defaultData
  }
}

export function saveData(data: AppData): void {
  ensureDataDir()
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// User functions
export function getUsers(): User[] {
  return loadData().users
}

export function getUserById(id: string): User | undefined {
  return loadData().users.find(u => u.id === id)
}

export function getUserByName(name: string): User | undefined {
  return loadData().users.find(u => u.name.toLowerCase() === name.toLowerCase())
}

// Generate a UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Find or create user by name
export function findOrCreateUser(name: string): User {
  const existing = getUserByName(name)
  if (existing) {
    return existing
  }

  const data = loadData()
  const user: User = {
    id: generateUUID(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }

  data.users.push(user)
  saveData(data)
  return user
}

// Admin verification
export function isAdminLogin(name: string, code: string): boolean {
  const data = loadData()
  const adminCode = data.adminCode || DEFAULT_ADMIN_CODE
  return name.toLowerCase() === ADMIN_NAME.toLowerCase() && code === adminCode
}

export function getAdminCode(): string {
  const data = loadData()
  return data.adminCode || DEFAULT_ADMIN_CODE
}

export function setAdminCode(newCode: string): boolean {
  if (!/^\d+$/.test(newCode)) {
    return false // Must be numeric
  }
  const data = loadData()
  data.adminCode = newCode
  saveData(data)
  return true
}

export function getAdminName(): string {
  return ADMIN_NAME
}

export function deleteUser(id: string): boolean {
  const data = loadData()
  const index = data.users.findIndex(u => u.id === id)

  if (index === -1) return false

  data.users.splice(index, 1)
  saveData(data)
  return true
}

// Session functions
export function createSession(userId: string, userName: string, isAdmin: boolean = false): Session {
  const data = loadData()

  // Remove existing session for this user
  data.sessions = data.sessions.filter(s => s.userId !== userId)

  const session: Session = {
    id: generateId(),
    userId,
    userName,
    isAdmin,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  }

  data.sessions.push(session)
  saveData(data)
  return session
}

export function getSession(sessionId: string): Session | undefined {
  return loadData().sessions.find(s => s.id === sessionId)
}

export function updateSessionActivity(sessionId: string): void {
  const data = loadData()
  const session = data.sessions.find(s => s.id === sessionId)
  if (session) {
    session.lastActive = new Date().toISOString()
    saveData(data)
  }
}

export function deleteSession(sessionId: string): void {
  const data = loadData()
  data.sessions = data.sessions.filter(s => s.id !== sessionId)
  saveData(data)
}

export function getActiveSessions(): Session[] {
  const data = loadData()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  return data.sessions.filter(s => s.lastActive > oneHourAgo)
}

// Print log functions
export function createPrintLog(
  userId: string,
  userName: string,
  printerId: number,
  printerName: string,
  fileName: string
): PrintLog {
  const data = loadData()

  const log: PrintLog = {
    id: generateId(),
    userId,
    userName,
    printerId,
    printerName,
    fileName,
    startedAt: new Date().toISOString(),
    status: 'printing',
    progress: 0,
    notified: false,
  }

  data.printLogs.push(log)
  saveData(data)
  return log
}

export function updatePrintLog(
  id: string,
  updates: Partial<Pick<PrintLog, 'status' | 'progress' | 'completedAt' | 'notified'>>
): PrintLog | null {
  const data = loadData()
  const log = data.printLogs.find(l => l.id === id)

  if (!log) return null

  Object.assign(log, updates)
  saveData(data)
  return log
}

export function getPrintLogs(limit: number = 50): PrintLog[] {
  const data = loadData()
  return data.printLogs
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
}

export function getActivePrintLogs(): PrintLog[] {
  return loadData().printLogs.filter(l => l.status === 'printing')
}

export function getPrintLogsByUser(userId: string): PrintLog[] {
  return loadData().printLogs
    .filter(l => l.userId === userId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
}

export function getUnnotifiedCompletedPrints(userId: string): PrintLog[] {
  return loadData().printLogs.filter(
    l => l.userId === userId && l.status === 'completed' && !l.notified
  )
}

export function markPrintNotified(id: string): void {
  updatePrintLog(id, { notified: true })
}

// Utility
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

// Printer functions
export function getPrinters(): StoredPrinter[] {
  const data = loadData()
  return data.printers || []
}

export function getPrinterById(id: number): StoredPrinter | undefined {
  return getPrinters().find(p => p.id === id)
}

export function addPrinter(printer: Omit<StoredPrinter, 'id'>): StoredPrinter {
  const data = loadData()
  if (!data.printers) data.printers = []

  const newPrinter: StoredPrinter = {
    ...printer,
    id: Date.now(),
  }
  data.printers.push(newPrinter)
  saveData(data)
  return newPrinter
}

export function updatePrinter(id: number, updates: Partial<StoredPrinter>): StoredPrinter | null {
  const data = loadData()
  if (!data.printers) data.printers = []

  const index = data.printers.findIndex(p => p.id === id)
  if (index === -1) return null

  const existing = data.printers[index]
  if (!existing) return null

  const updated: StoredPrinter = { ...existing, ...updates, id } // Preserve ID
  data.printers[index] = updated
  saveData(data)
  return updated
}

export function deletePrinter(id: number): boolean {
  const data = loadData()
  if (!data.printers) return false

  const index = data.printers.findIndex(p => p.id === id)
  if (index === -1) return false

  data.printers.splice(index, 1)
  saveData(data)
  return true
}

// Cost config functions
export function getCostConfig(): CostConfig {
  const data = loadData()
  return data.costConfig || DEFAULT_COST_CONFIG
}

export function updateCostConfig(updates: Partial<CostConfig>): CostConfig {
  const data = loadData()
  if (!data.costConfig) data.costConfig = { ...DEFAULT_COST_CONFIG }

  data.costConfig = { ...data.costConfig, ...updates }
  saveData(data)
  return data.costConfig
}

// Maintenance log functions
export function getMaintenanceLogs(printerId?: number): MaintenanceLog[] {
  const data = loadData()
  const logs = data.maintenanceLogs || []
  if (printerId !== undefined) {
    return logs.filter(l => l.printerId === printerId)
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
  }
  return logs.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime())
}

export function addMaintenanceLog(log: Omit<MaintenanceLog, 'id'>): MaintenanceLog {
  const data = loadData()
  if (!data.maintenanceLogs) data.maintenanceLogs = []

  const newLog: MaintenanceLog = {
    ...log,
    id: generateId(),
  }
  data.maintenanceLogs.push(newLog)
  saveData(data)
  return newLog
}

export function deleteMaintenanceLog(id: string): boolean {
  const data = loadData()
  if (!data.maintenanceLogs) return false

  const index = data.maintenanceLogs.findIndex(l => l.id === id)
  if (index === -1) return false

  data.maintenanceLogs.splice(index, 1)
  saveData(data)
  return true
}
