export interface User {
  id: string  // UUID for regular users
  name: string
  createdAt: string
}

export interface Session {
  id: string
  userId: string  // UUID of the user (or 'admin' for admin sessions)
  userName: string
  isAdmin: boolean
  createdAt: string
  lastActive: string
}

export interface PrintLog {
  id: string
  userId: string  // UUID of the user
  userName: string
  printerId: number
  printerName: string
  fileName: string
  startedAt: string
  completedAt?: string
  status: 'printing' | 'completed' | 'cancelled' | 'failed'
  progress: number
  notified: boolean
}

export interface MaintenanceLog {
  id: string
  printerId: number
  type: 'nozzle_change' | 'belt_tension' | 'lubrication' | 'cleaning' | 'calibration' | 'other'
  description: string
  performedAt: string
  performedBy: string
  nextDueAt?: string
}

export interface CostConfig {
  filamentPerKg: number // $ per kg
  electricityPerHour: number // $ per hour
}

export interface StoredPrinter {
  id: number
  name: string
  ipAddr: string
  apiKey: string
  model: string
  description: string
  image: string
}

export interface AppData {
  users: User[]
  printLogs: PrintLog[]
  sessions: Session[]
  adminCode: string
  printers: StoredPrinter[]
  costConfig: CostConfig
  maintenanceLogs: MaintenanceLog[]
}
