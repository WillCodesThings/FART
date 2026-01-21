<script setup lang="ts">
import {
  ArrowLeft,
  Users,
  Printer,
  Activity,
  Clock,
  User,
  Trash2,
  Plus,
  Shield,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Wrench,
  Key,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  DollarSign,
  Settings,
  Wifi,
  WifiOff,
  Download,
  Calendar,
  HardDrive,
} from 'lucide-vue-next'

interface MaintenanceLog {
  id: string
  printerId: number
  type: 'nozzle_change' | 'belt_tension' | 'lubrication' | 'cleaning' | 'calibration' | 'other'
  description: string
  performedAt: string
  performedBy: string
  nextDueAt?: string
}

const router = useRouter()
const { user, isAdmin, checkAuth, authenticated } = useAuth()

// Check auth on mount
onMounted(async () => {
  await checkAuth()
  if (!authenticated.value) {
    router.push('/login')
    return
  }
  if (!isAdmin.value) {
    router.push('/')
    return
  }
  fetchStats()
})

interface AdminStats {
  stats: {
    totalUsers: number
    activeUsers: number
    totalPrints: number
    activePrints: number
    totalPrinters: number
  }
  adminName: string
  adminCode: string
  activePrints: Array<{
    id: string
    userName: string
    printerName: string
    printerId: number
    fileName: string
    startedAt: string
    progress: number
    // Live status
    printerOnline: boolean
    stillRunning: boolean
    liveProgress: number
    timeRemaining: number
    // Cost estimation
    estimatedCost: {
      filament: number
      electricity: number
      total: number
    }
    elapsedTime: number
  }>
  recentPrints: Array<{
    id: string
    userName: string
    printerName: string
    fileName: string
    startedAt: string
    completedAt?: string
    status: string
    estimatedCost: {
      filament: number
      electricity: number
      total: number
    }
    elapsedTime: number
  }>
  totalCosts: {
    filament: number
    electricity: number
    total: number
    printCount: number
  }
  activeSessions: Array<{
    userName: string
    lastActive: string
  }>
  users: Array<{
    id: string
    name: string
    createdAt: string
  }>
  printers: Array<{
    id: number
    name: string
    model: string
    ipAddr: string
    apiKey: string
    status: string
  }>
  costConfig: {
    filamentPerKg: number
    electricityPerHour: number
  }
}

const stats = ref<AdminStats | null>(null)
const loading = ref(false)
const error = ref('')

// New user form
const showNewUserForm = ref(false)
const newUserName = ref('')
const savingUser = ref(false)

// Admin code display and edit
const showAdminCode = ref(false)
const editingCode = ref(false)
const newAdminCode = ref('')
const savingCode = ref(false)

const changeAdminCode = async () => {
  if (!newAdminCode.value || !/^\d{4,}$/.test(newAdminCode.value)) {
    error.value = 'Code must be at least 4 digits (numbers only)'
    return
  }

  savingCode.value = true
  error.value = ''

  try {
    await $fetch('/api/admin/code', {
      method: 'POST',
      body: { code: newAdminCode.value },
    })
    editingCode.value = false
    newAdminCode.value = ''
    fetchStats() // Refresh to show new code
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update code'
  } finally {
    savingCode.value = false
  }
}

// Printer management
const showPrinterForm = ref(false)
const editingPrinter = ref<number | null>(null)
const printerForm = ref({
  name: '',
  ipAddr: '',
  apiKey: '',
  model: 'Prusa MK-4',
})
const savingPrinter = ref(false)

const resetPrinterForm = () => {
  printerForm.value = { name: '', ipAddr: '', apiKey: '', model: 'Prusa MK-4' }
  editingPrinter.value = null
  showPrinterForm.value = false
}

const startEditPrinter = (printer: { id: number; name: string; ipAddr: string; apiKey: string; model: string }) => {
  printerForm.value = {
    name: printer.name,
    ipAddr: printer.ipAddr,
    apiKey: printer.apiKey,
    model: printer.model,
  }
  editingPrinter.value = printer.id
  showPrinterForm.value = true
}

const savePrinter = async () => {
  if (!printerForm.value.name || !printerForm.value.ipAddr || !printerForm.value.apiKey) {
    error.value = 'Name, IP address, and API key are required'
    return
  }

  savingPrinter.value = true
  error.value = ''

  try {
    if (editingPrinter.value !== null) {
      await $fetch('/api/admin/printers', {
        method: 'POST',
        body: {
          action: 'edit',
          id: editingPrinter.value,
          printer: printerForm.value,
        },
      })
    } else {
      await $fetch('/api/admin/printers', {
        method: 'POST',
        body: {
          action: 'add',
          printer: printerForm.value,
        },
      })
    }
    resetPrinterForm()
    fetchStats()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to save printer'
  } finally {
    savingPrinter.value = false
  }
}

const deletePrinter = async (id: number, name: string) => {
  if (!confirm(`Delete printer "${name}"? This cannot be undone.`)) return

  try {
    await $fetch('/api/admin/printers', {
      method: 'POST',
      body: { action: 'delete', id },
    })
    fetchStats()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete printer'
  }
}

const fetchStats = async () => {
  loading.value = true
  error.value = ''
  try {
    stats.value = await $fetch<AdminStats>('/api/admin/stats')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load stats'
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  if (!newUserName.value.trim()) {
    error.value = 'Name is required'
    return
  }

  savingUser.value = true
  error.value = ''

  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: {
        action: 'create',
        name: newUserName.value.trim(),
      },
    })
    showNewUserForm.value = false
    newUserName.value = ''
    fetchStats()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create user'
  } finally {
    savingUser.value = false
  }
}

const deleteUser = async (id: string, name: string) => {
  if (!confirm(`Delete user "${name}"?`)) return

  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      body: { action: 'delete', id },
    })
    fetchStats()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete user'
  }
}

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'printing': return 'text-green-400 bg-green-500/10'
    case 'completed': return 'text-blue-400 bg-blue-500/10'
    case 'cancelled': return 'text-yellow-400 bg-yellow-500/10'
    case 'failed': return 'text-red-400 bg-red-500/10'
    default: return 'text-zinc-400 bg-zinc-500/10'
  }
}

const sanitizeProgress = (progress: number | undefined | null): number => {
  if (progress === undefined || progress === null || isNaN(progress)) return 0
  return Math.min(100, Math.max(0, Math.round(progress)))
}

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`
}

const goBack = () => router.push('/')

// Troubleshooting tips
const troubleshootingTips = [
  { issue: 'Printer offline', solution: 'Check network connection and power. Try restarting the printer.' },
  { issue: 'Print failed', solution: 'Check bed adhesion, filament, and nozzle temperature settings.' },
  { issue: 'Connection timeout', solution: 'Verify printer IP address and API key are correct.' },
  { issue: 'Upload failed', solution: 'Ensure file is valid .gcode/.bgcode and matches printer type (MK4 needs .bgcode).' },
]

// Cost configuration
const showCostConfig = ref(false)
const costForm = ref({
  filamentPerKg: 25,
  electricityPerHour: 0.05,
})
const savingCosts = ref(false)

const openCostConfig = () => {
  if (stats.value?.costConfig) {
    costForm.value = {
      filamentPerKg: stats.value.costConfig.filamentPerKg,
      electricityPerHour: stats.value.costConfig.electricityPerHour,
    }
  }
  showCostConfig.value = true
}

const saveCostConfig = async () => {
  savingCosts.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/costs', {
      method: 'POST',
      body: costForm.value,
    })
    showCostConfig.value = false
    fetchStats()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to update costs'
  } finally {
    savingCosts.value = false
  }
}

// Export CSV
const exportingCsv = ref(false)

const exportCsv = async () => {
  exportingCsv.value = true
  try {
    const response = await fetch('/api/admin/export', {
      credentials: 'include',
    })
    if (!response.ok) throw new Error('Export failed')

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `print-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to export'
  } finally {
    exportingCsv.value = false
  }
}

// Maintenance tracking
const maintenanceLogs = ref<MaintenanceLog[]>([])
const showMaintenanceForm = ref(false)
const selectedPrinterForMaintenance = ref<number | null>(null)
const maintenanceForm = ref({
  type: 'cleaning' as MaintenanceLog['type'],
  description: '',
  performedAt: new Date().toISOString().split('T')[0],
  performedBy: '',
  nextDueAt: '',
})
const savingMaintenance = ref(false)

const maintenanceTypes = [
  { value: 'nozzle_change', label: 'Nozzle Change' },
  { value: 'belt_tension', label: 'Belt Tension' },
  { value: 'lubrication', label: 'Lubrication' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'calibration', label: 'Calibration' },
  { value: 'other', label: 'Other' },
]

const fetchMaintenanceLogs = async (printerId?: number) => {
  try {
    const response = await $fetch<{ logs: MaintenanceLog[] }>('/api/admin/maintenance', {
      method: 'POST',
      body: { action: 'list', printerId },
    })
    maintenanceLogs.value = response.logs
  } catch {
    // Ignore errors
  }
}

const openMaintenanceForm = (printerId: number) => {
  selectedPrinterForMaintenance.value = printerId
  maintenanceForm.value = {
    type: 'cleaning',
    description: '',
    performedAt: new Date().toISOString().split('T')[0],
    performedBy: user.value?.name || '',
    nextDueAt: '',
  }
  showMaintenanceForm.value = true
  fetchMaintenanceLogs(printerId)
}

const saveMaintenanceLog = async () => {
  if (!selectedPrinterForMaintenance.value || !maintenanceForm.value.description) {
    error.value = 'Description is required'
    return
  }

  savingMaintenance.value = true
  error.value = ''

  try {
    await $fetch('/api/admin/maintenance', {
      method: 'POST',
      body: {
        action: 'add',
        log: {
          printerId: selectedPrinterForMaintenance.value,
          ...maintenanceForm.value,
        },
      },
    })
    maintenanceForm.value = {
      type: 'cleaning',
      description: '',
      performedAt: new Date().toISOString().split('T')[0],
      performedBy: user.value?.name || '',
      nextDueAt: '',
    }
    fetchMaintenanceLogs(selectedPrinterForMaintenance.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to add maintenance log'
  } finally {
    savingMaintenance.value = false
  }
}

const deleteMaintenanceLog = async (id: string) => {
  if (!confirm('Delete this maintenance log?')) return
  try {
    await $fetch('/api/admin/maintenance', {
      method: 'POST',
      body: { action: 'delete', id },
    })
    if (selectedPrinterForMaintenance.value) {
      fetchMaintenanceLogs(selectedPrinterForMaintenance.value)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to delete log'
  }
}

const getPrinterName = (printerId: number): string => {
  const printer = stats.value?.printers.find(p => p.id === printerId)
  return printer?.name || `Printer ${printerId}`
}

const formatMaintenanceType = (type: string): string => {
  return maintenanceTypes.find(t => t.value === type)?.label || type
}
</script>

<template>
  <div class="min-h-full bg-zinc-950">
    <!-- Header -->
    <header class="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center gap-4">
          <button class="btn btn-ghost p-2" @click="goBack">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div class="flex-1">
            <h1 class="text-xl font-semibold text-white">Admin Dashboard</h1>
            <p class="text-xs text-zinc-500">Manage users and monitor prints</p>
          </div>
          <NuxtLink
            to="/admin/storage"
            class="btn btn-secondary flex items-center gap-2"
            title="Manage printer storage"
          >
            <HardDrive class="w-4 h-4" />
            <span class="hidden sm:inline">Storage</span>
          </NuxtLink>
          <button
            class="btn btn-secondary flex items-center gap-2"
            :disabled="exportingCsv"
            @click="exportCsv"
            title="Export print logs to CSV"
          >
            <Download :class="['w-4 h-4', exportingCsv && 'animate-pulse']" />
            <span class="hidden sm:inline">Export</span>
          </button>
          <button
            class="btn btn-secondary flex items-center gap-2"
            @click="openCostConfig"
            title="Configure costs"
          >
            <DollarSign class="w-4 h-4" />
            <span class="hidden sm:inline">Costs</span>
          </button>
          <button
            class="btn btn-secondary flex items-center gap-2"
            :disabled="loading"
            @click="fetchStats"
          >
            <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
            Refresh
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- Loading -->
      <div v-if="loading && !stats" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
      </div>

      <!-- Error -->
      <div v-else-if="error && !stats" class="text-center py-20">
        <AlertCircle class="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p class="text-red-400">{{ error }}</p>
        <button class="btn btn-primary mt-4" @click="fetchStats">Retry</button>
      </div>

      <div v-else-if="stats" class="space-y-6">
        <!-- Admin Credentials Info -->
        <div class="card p-4 bg-orange-500/5 border-orange-500/20">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Key class="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 class="text-sm font-medium text-white">Admin Login</h3>
                <p class="text-xs text-zinc-500">Share these credentials with people who need admin access</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <p class="text-xs text-zinc-500">Name</p>
                <p class="font-mono text-white">{{ stats.adminName }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-zinc-500">Code</p>
                <div v-if="!editingCode" class="flex items-center gap-1">
                  <span class="font-mono text-white">{{ showAdminCode ? stats.adminCode : '****' }}</span>
                  <button
                    class="p-1 text-zinc-400 hover:text-white"
                    @click="showAdminCode = !showAdminCode"
                  >
                    <Eye v-if="!showAdminCode" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1 text-zinc-400 hover:text-orange-400"
                    @click="editingCode = true; newAdminCode = stats.adminCode"
                    title="Change code"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                </div>
                <div v-else class="flex items-center gap-1">
                  <input
                    v-model="newAdminCode"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    placeholder="New code"
                    class="w-24 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white font-mono text-sm focus:border-orange-500 focus:outline-none"
                    @keyup.enter="changeAdminCode"
                    @keyup.escape="editingCode = false"
                  />
                  <button
                    class="p-1 text-zinc-400 hover:text-green-400"
                    :disabled="savingCode"
                    @click="changeAdminCode"
                    title="Save"
                  >
                    <Loader2 v-if="savingCode" class="w-4 h-4 animate-spin" />
                    <Check v-else class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1 text-zinc-400 hover:text-red-400"
                    @click="editingCode = false"
                    title="Cancel"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Users class="w-4 h-4" />
              Total Users
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.stats.totalUsers }}</div>
          </div>
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Activity class="w-4 h-4 text-green-400" />
              Active Users
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.stats.activeUsers }}</div>
          </div>
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Printer class="w-4 h-4" />
              Printers
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.stats.totalPrinters }}</div>
          </div>
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <FileText class="w-4 h-4 text-orange-400" />
              Active Prints
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.stats.activePrints }}</div>
          </div>
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Clock class="w-4 h-4" />
              Total Prints
            </div>
            <div class="text-2xl font-bold text-white">{{ stats.stats.totalPrints }}</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Active Prints -->
          <div class="lg:col-span-2 card">
            <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Active Prints</h2>
              <span class="text-xs text-zinc-600">Est. cost: ${{ stats.costConfig.filamentPerKg }}/kg filament</span>
            </div>
            <div v-if="stats.activePrints.length === 0" class="p-8 text-center text-zinc-500">
              No active prints
            </div>
            <div v-else class="divide-y divide-zinc-800">
              <div
                v-for="print in stats.activePrints"
                :key="print.id"
                class="p-4"
              >
                <!-- Header: User, Status Badge, Printer -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <User class="w-4 h-4 text-zinc-500" />
                    <span class="text-white font-medium">{{ print.userName }}</span>
                    <!-- Status Badge -->
                    <span
                      v-if="print.stillRunning"
                      class="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400"
                    >
                      Running
                    </span>
                    <span
                      v-else-if="print.printerOnline"
                      class="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-400"
                    >
                      Stopped
                    </span>
                    <span
                      v-else
                      class="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-400"
                    >
                      Offline
                    </span>
                  </div>
                  <NuxtLink
                    :to="`/printer/${print.printerId}`"
                    class="text-xs text-orange-400 hover:text-orange-300 hover:underline"
                  >
                    {{ print.printerName }} →
                  </NuxtLink>
                </div>

                <!-- File name -->
                <p class="text-sm text-zinc-400 mb-3 truncate">{{ print.fileName }}</p>

                <!-- Progress Bar -->
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-500"
                      :class="print.stillRunning ? 'bg-orange-500' : 'bg-zinc-600'"
                      :style="{ width: `${sanitizeProgress(print.liveProgress)}%` }"
                    />
                  </div>
                  <span class="text-sm text-white font-medium w-12 text-right">{{ sanitizeProgress(print.liveProgress) }}%</span>
                </div>

                <!-- Time & Cost Info -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div class="bg-zinc-800/50 rounded-lg p-2">
                    <p class="text-zinc-500 mb-0.5">Elapsed</p>
                    <p class="text-white font-medium">{{ formatDuration(print.elapsedTime) }}</p>
                  </div>
                  <div class="bg-zinc-800/50 rounded-lg p-2">
                    <p class="text-zinc-500 mb-0.5">Remaining</p>
                    <p class="text-white font-medium">{{ print.stillRunning ? formatDuration(print.timeRemaining) : '--' }}</p>
                  </div>
                  <div class="bg-zinc-800/50 rounded-lg p-2">
                    <p class="text-zinc-500 mb-0.5">Filament</p>
                    <p class="text-white font-medium">{{ formatCurrency(print.estimatedCost.filament) }}</p>
                  </div>
                  <div class="bg-orange-500/10 rounded-lg p-2">
                    <p class="text-orange-400/70 mb-0.5">Total Est.</p>
                    <p class="text-orange-400 font-medium">{{ formatCurrency(print.estimatedCost.total) }}</p>
                  </div>
                </div>

                <!-- Started time -->
                <p class="text-xs text-zinc-600 mt-3">Started {{ formatRelativeTime(print.startedAt) }}</p>
              </div>
            </div>
          </div>

          <!-- Active Sessions -->
          <div class="card">
            <div class="p-4 border-b border-zinc-800">
              <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Online Users</h2>
            </div>
            <div v-if="stats.activeSessions.length === 0" class="p-8 text-center text-zinc-500">
              No users online
            </div>
            <div v-else class="divide-y divide-zinc-800">
              <div
                v-for="session in stats.activeSessions"
                :key="session.userName"
                class="p-4 flex items-center justify-between"
              >
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500" />
                  <span class="text-white">{{ session.userName }}</span>
                </div>
                <span class="text-xs text-zinc-500">{{ formatRelativeTime(session.lastActive) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Users & Recent Prints -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Users -->
          <div class="card">
            <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Users</h2>
              <button
                class="btn btn-primary text-sm py-1 px-3 flex items-center gap-1"
                @click="showNewUserForm = true"
              >
                <Plus class="w-4 h-4" />
                Add User
              </button>
            </div>

            <!-- New User Form -->
            <div v-if="showNewUserForm" class="p-4 border-b border-zinc-800 bg-zinc-800/30">
              <div class="space-y-3">
                <input
                  v-model="newUserName"
                  type="text"
                  placeholder="Enter name"
                  class="input text-sm"
                />
                <p class="text-xs text-zinc-500">A PIN will be auto-generated for this user</p>
                <div class="flex gap-2">
                  <button
                    class="btn btn-primary text-sm flex-1"
                    :disabled="savingUser"
                    @click="createUser"
                  >
                    {{ savingUser ? 'Creating...' : 'Create' }}
                  </button>
                  <button
                    class="btn btn-ghost text-sm"
                    @click="showNewUserForm = false"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <div v-if="stats.users.length === 0" class="p-8 text-center text-zinc-500">
              No users registered yet
            </div>
            <div v-else class="divide-y divide-zinc-800 max-h-80 overflow-y-auto">
              <div
                v-for="u in stats.users"
                :key="u.id"
                class="p-4 flex items-center justify-between"
              >
                <div>
                  <span class="text-white font-medium">{{ u.name }}</span>
                  <p class="text-xs text-zinc-500">Joined {{ formatRelativeTime(u.createdAt) }}</p>
                </div>
                <button
                  v-if="u.name !== user?.name"
                  class="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  @click="deleteUser(u.id, u.name)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Recent Prints -->
          <div class="card">
            <div class="p-4 border-b border-zinc-800">
              <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Recent Prints</h2>
            </div>
            <div v-if="stats.recentPrints.length === 0" class="p-8 text-center text-zinc-500">
              No print history
            </div>
            <div v-else>
              <div class="divide-y divide-zinc-800 max-h-64 overflow-y-auto">
                <div
                  v-for="print in stats.recentPrints"
                  :key="print.id"
                  class="p-4"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-white font-medium text-sm">{{ print.userName }}</span>
                    <div class="flex items-center gap-2">
                      <span class="text-xs text-zinc-500">{{ formatCurrency(print.estimatedCost.total) }}</span>
                      <span :class="['text-xs px-2 py-0.5 rounded-full', getStatusColor(print.status)]">
                        {{ print.status }}
                      </span>
                    </div>
                  </div>
                  <p class="text-sm text-zinc-400 truncate">{{ print.fileName }}</p>
                  <p class="text-xs text-zinc-600 mt-1">
                    {{ print.printerName }} - {{ formatRelativeTime(print.startedAt) }}
                  </p>
                </div>
              </div>
              <!-- Total Costs Summary -->
              <div class="p-4 border-t border-zinc-800 bg-zinc-800/30">
                <div class="flex items-center gap-2 mb-3">
                  <DollarSign class="w-4 h-4 text-green-400" />
                  <span class="text-sm font-medium text-zinc-400">Total Costs ({{ stats.totalCosts.printCount }} completed prints)</span>
                </div>
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p class="text-xs text-zinc-500">Filament</p>
                    <p class="text-white font-medium">{{ formatCurrency(stats.totalCosts.filament) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-zinc-500">Electricity</p>
                    <p class="text-white font-medium">{{ formatCurrency(stats.totalCosts.electricity) }}</p>
                  </div>
                  <div class="bg-green-500/10 rounded-lg py-1">
                    <p class="text-xs text-green-400/70">Total</p>
                    <p class="text-green-400 font-bold">{{ formatCurrency(stats.totalCosts.total) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Printer Management -->
        <div class="card">
          <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Settings class="w-4 h-4 text-zinc-400" />
              <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Printer Management</h2>
            </div>
            <button
              class="btn btn-primary text-sm py-1 px-3 flex items-center gap-1"
              @click="showPrinterForm = true; editingPrinter = null; printerForm = { name: '', ipAddr: '', apiKey: '', model: 'Prusa MK-4' }"
            >
              <Plus class="w-4 h-4" />
              Add Printer
            </button>
          </div>

          <!-- Add/Edit Printer Form -->
          <div v-if="showPrinterForm" class="p-4 border-b border-zinc-800 bg-zinc-800/30">
            <h3 class="text-white font-medium mb-3">{{ editingPrinter !== null ? 'Edit Printer' : 'Add New Printer' }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">Name</label>
                <input
                  v-model="printerForm.name"
                  type="text"
                  placeholder="e.g. Dave"
                  class="input text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">Model</label>
                <input
                  v-model="printerForm.model"
                  type="text"
                  placeholder="e.g. Prusa MK-4"
                  class="input text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">IP Address</label>
                <input
                  v-model="printerForm.ipAddr"
                  type="text"
                  placeholder="e.g. 192.168.1.100"
                  class="input text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">API Key</label>
                <input
                  v-model="printerForm.apiKey"
                  type="text"
                  placeholder="Printer API key"
                  class="input text-sm font-mono"
                />
              </div>
            </div>
            <div class="flex gap-2 mt-4">
              <button
                class="btn btn-primary text-sm flex-1"
                :disabled="savingPrinter"
                @click="savePrinter"
              >
                {{ savingPrinter ? 'Saving...' : (editingPrinter !== null ? 'Update Printer' : 'Add Printer') }}
              </button>
              <button
                class="btn btn-ghost text-sm"
                @click="resetPrinterForm"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Printer List -->
          <div v-if="stats.printers.length === 0" class="p-8 text-center text-zinc-500">
            No printers configured
          </div>
          <div v-else class="divide-y divide-zinc-800">
            <div
              v-for="printer in stats.printers"
              :key="printer.id"
              class="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
            >
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <Printer class="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-white font-medium">{{ printer.name }}</span>
                    <span class="text-xs text-zinc-500">{{ printer.model }}</span>
                  </div>
                  <p class="text-xs text-zinc-500 font-mono">{{ printer.ipAddr }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  @click="openMaintenanceForm(printer.id)"
                  title="Maintenance logs"
                >
                  <Wrench class="w-4 h-4" />
                </button>
                <button
                  class="p-2 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                  @click="startEditPrinter(printer)"
                  title="Edit printer"
                >
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  class="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  @click="deletePrinter(printer.id, printer.name)"
                  title="Delete printer"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Troubleshooting -->
        <div class="card">
          <div class="p-4 border-b border-zinc-800 flex items-center gap-2">
            <Wrench class="w-4 h-4 text-zinc-400" />
            <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Troubleshooting Guide</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div
              v-for="tip in troubleshootingTips"
              :key="tip.issue"
              class="bg-zinc-800/30 rounded-lg p-4"
            >
              <h3 class="text-white font-medium mb-1">{{ tip.issue }}</h3>
              <p class="text-sm text-zinc-400">{{ tip.solution }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Cost Configuration Modal -->
    <div
      v-if="showCostConfig"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="showCostConfig = false"
    >
      <div class="card w-full max-w-md">
        <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <DollarSign class="w-5 h-5 text-green-400" />
            <h2 class="text-lg font-semibold text-white">Cost Configuration</h2>
          </div>
          <button class="p-1 text-zinc-400 hover:text-white" @click="showCostConfig = false">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="text-sm text-zinc-400 mb-1 block">Filament Cost ($/kg)</label>
            <input
              v-model.number="costForm.filamentPerKg"
              type="number"
              step="0.01"
              min="0"
              class="input"
              placeholder="e.g. 25.00"
            />
            <p class="text-xs text-zinc-600 mt-1">Average cost per kilogram of filament</p>
          </div>
          <div>
            <label class="text-sm text-zinc-400 mb-1 block">Electricity Cost ($/hour)</label>
            <input
              v-model.number="costForm.electricityPerHour"
              type="number"
              step="0.001"
              min="0"
              class="input"
              placeholder="e.g. 0.05"
            />
            <p class="text-xs text-zinc-600 mt-1">Estimated printer electricity cost per hour</p>
          </div>
          <div class="bg-zinc-800/50 rounded-lg p-3">
            <p class="text-xs text-zinc-500 mb-1">Estimated usage rate</p>
            <p class="text-sm text-zinc-300">~10g filament/hour (average print)</p>
          </div>
        </div>
        <div class="p-4 border-t border-zinc-800 flex gap-2">
          <button
            class="btn btn-primary flex-1"
            :disabled="savingCosts"
            @click="saveCostConfig"
          >
            {{ savingCosts ? 'Saving...' : 'Save Configuration' }}
          </button>
          <button class="btn btn-ghost" @click="showCostConfig = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Maintenance Modal -->
    <div
      v-if="showMaintenanceForm"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="showMaintenanceForm = false"
    >
      <div class="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Wrench class="w-5 h-5 text-blue-400" />
            <h2 class="text-lg font-semibold text-white">
              Maintenance - {{ getPrinterName(selectedPrinterForMaintenance!) }}
            </h2>
          </div>
          <button class="p-1 text-zinc-400 hover:text-white" @click="showMaintenanceForm = false">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto">
          <!-- Add Maintenance Form -->
          <div class="p-4 border-b border-zinc-800 bg-zinc-800/30">
            <h3 class="text-sm font-medium text-zinc-400 mb-3">Log New Maintenance</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">Type</label>
                <select v-model="maintenanceForm.type" class="input text-sm">
                  <option v-for="t in maintenanceTypes" :key="t.value" :value="t.value">
                    {{ t.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">Performed By</label>
                <input
                  v-model="maintenanceForm.performedBy"
                  type="text"
                  class="input text-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">Date Performed</label>
                <input
                  v-model="maintenanceForm.performedAt"
                  type="date"
                  class="input text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-zinc-500 mb-1 block">Next Due (optional)</label>
                <input
                  v-model="maintenanceForm.nextDueAt"
                  type="date"
                  class="input text-sm"
                />
              </div>
              <div class="md:col-span-2">
                <label class="text-xs text-zinc-500 mb-1 block">Description</label>
                <textarea
                  v-model="maintenanceForm.description"
                  class="input text-sm"
                  rows="2"
                  placeholder="Describe what was done..."
                />
              </div>
            </div>
            <button
              class="btn btn-primary text-sm mt-3"
              :disabled="savingMaintenance"
              @click="saveMaintenanceLog"
            >
              {{ savingMaintenance ? 'Adding...' : 'Add Log' }}
            </button>
          </div>

          <!-- Maintenance History -->
          <div class="p-4">
            <h3 class="text-sm font-medium text-zinc-400 mb-3">Maintenance History</h3>
            <div v-if="maintenanceLogs.length === 0" class="text-center py-8 text-zinc-500">
              No maintenance logs yet
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="log in maintenanceLogs"
                :key="log.id"
                class="bg-zinc-800/30 rounded-lg p-3"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400">
                      {{ formatMaintenanceType(log.type) }}
                    </span>
                    <span class="text-xs text-zinc-500">by {{ log.performedBy }}</span>
                  </div>
                  <button
                    class="p-1 text-zinc-500 hover:text-red-400"
                    @click="deleteMaintenanceLog(log.id)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-sm text-white mb-2">{{ log.description }}</p>
                <div class="flex items-center gap-4 text-xs text-zinc-500">
                  <span class="flex items-center gap-1">
                    <Calendar class="w-3.5 h-3.5" />
                    {{ new Date(log.performedAt).toLocaleDateString() }}
                  </span>
                  <span v-if="log.nextDueAt" class="flex items-center gap-1 text-orange-400">
                    <Clock class="w-3.5 h-3.5" />
                    Due: {{ new Date(log.nextDueAt).toLocaleDateString() }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-zinc-800">
          <button class="btn btn-ghost w-full" @click="showMaintenanceForm = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
