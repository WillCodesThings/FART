<script setup lang="ts">
import {
  Printer,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle,
  XCircle,
  Thermometer,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Activity,
  FileText,
  LogOut,
  Shield,
  Bell,
  User,
  History,
  AlertCircle,
} from 'lucide-vue-next'

interface PrintHistory {
  id: string
  printerName: string
  fileName: string
  startedAt: string
  completedAt?: string
  status: 'printing' | 'completed' | 'failed' | 'cancelled'
  progress: number
}

definePageMeta({
  middleware: 'auth',
})

const printerStore = usePrinterStore()
const router = useRouter()
const { user, isAdmin, logout, checkAuth, authenticated } = useAuth()

// Check auth on mount
onMounted(async () => {
  await checkAuth()
  if (!authenticated.value) {
    router.push('/login')
    return
  }
  await printerStore.loadPrinters()
  refreshAllStatus()
  requestNotificationPermission()
  startNotificationPolling()
  fetchPrintHistory()
})

const printers = computed(() => printerStore.printers)

const sanitizeProgress = (value: number | undefined | null): number => {
  if (value === undefined || value === null || isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Track status per printer
const printerStatus = ref<Record<number, {
  loading: boolean
  online: boolean
  error?: string
  data?: {
    nozzleTemp: number
    bedTemp: number
    printing: boolean
    paused: boolean
    progress: number
    currentFile?: string
    timeRemaining?: number
  }
} | null>>({})

const refreshing = ref(false)

// Notifications
const notificationPermission = ref<NotificationPermission>('default')

const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    notificationPermission.value = Notification.permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission
    }
  }
}

const showNotification = (title: string, body: string) => {
  if (notificationPermission.value === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  }
}

let notificationInterval: ReturnType<typeof setInterval>

// Print history
const printHistory = ref<PrintHistory[]>([])
const historyLoading = ref(false)

const fetchPrintHistory = async () => {
  historyLoading.value = true
  try {
    const response = await $fetch<{ prints: PrintHistory[]; total: number }>('/api/prints/history')
    printHistory.value = response.prints
  } catch {
    // Ignore errors
  } finally {
    historyLoading.value = false
  }
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  }
  return date.toLocaleDateString()
}

const getHistoryStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return { text: 'Completed', class: 'bg-green-500/20 text-green-400' }
    case 'printing':
      return { text: 'Printing', class: 'bg-blue-500/20 text-blue-400' }
    case 'failed':
      return { text: 'Failed', class: 'bg-red-500/20 text-red-400' }
    case 'cancelled':
      return { text: 'Cancelled', class: 'bg-zinc-500/20 text-zinc-400' }
    default:
      return { text: status, class: 'bg-zinc-500/20 text-zinc-400' }
  }
}

const startNotificationPolling = () => {
  const checkNotifications = async () => {
    try {
      const response = await $fetch<{
        notifications: Array<{
          id: string
          fileName: string
          printerName: string
          completedAt?: string
        }>
      }>('/api/prints/notifications')

      for (const notification of response.notifications) {
        showNotification(
          'Print Complete!',
          `${notification.fileName} has finished printing on ${notification.printerName}`
        )
      }
    } catch {
      // Ignore errors
    }
  }

  // Check every 10 seconds
  notificationInterval = setInterval(checkNotifications, 10000)
  checkNotifications() // Check immediately
}

onUnmounted(() => {
  clearInterval(notificationInterval)
  clearInterval(refreshInterval)
})

const goToPrinter = (id: number) => {
  router.push(`/printer/${id}`)
}

const fetchPrinterStatus = async (printerId: number) => {
  printerStatus.value[printerId] = { loading: true, online: false }

  try {
    const testResponse = await $fetch<{
      success: boolean
      message: string
      responseTime?: number
    }>(`/api/printer/${printerId}/test`)

    if (!testResponse.success) {
      printerStatus.value[printerId] = {
        loading: false,
        online: false,
        error: testResponse.message,
      }
      printerStore.updateStatus(printerId, 'Offline')
      return
    }

    const dataResponse = await $fetch<{
      data: { file?: { name?: string; display?: string }; progress?: { completion?: number; printTimeLeft?: number }; state?: string }
      printerTelemetry: { temperature?: { tool0?: { actual?: number }; bed?: { actual?: number } }; state?: { flags?: { printing?: boolean; paused?: boolean } } }
    }>(`/api/printer/${printerId}`)

    const temp = dataResponse.printerTelemetry?.temperature
    const state = dataResponse.printerTelemetry?.state
    const job = dataResponse.data

    // Determine printing/paused state from telemetry flags or job state
    const jobState = job?.state?.toUpperCase() || ''
    const isPrinting = state?.flags?.printing ?? (jobState === 'PRINTING' || job?.state === 'Printing')
    const isPaused = state?.flags?.paused ?? (jobState === 'PAUSED' || job?.state === 'Paused')

    printerStatus.value[printerId] = {
      loading: false,
      online: true,
      data: {
        nozzleTemp: temp?.tool0?.actual ?? 0,
        bedTemp: temp?.bed?.actual ?? 0,
        printing: isPrinting,
        paused: isPaused,
        progress: job?.progress?.completion ?? 0,  // Already 0-100 from normalized API
        currentFile: job?.file?.display || job?.file?.name,  // Fixed: was job?.job?.file?.name
        timeRemaining: job?.progress?.printTimeLeft,
      },
    }

    const status = isPrinting
      ? isPaused ? 'Paused' : 'Printing'
      : 'Online'
    printerStore.updateStatus(printerId, status)
  } catch (error) {
    printerStatus.value[printerId] = {
      loading: false,
      online: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    }
    printerStore.updateStatus(printerId, 'Offline')
  }
}

const refreshAllStatus = async () => {
  refreshing.value = true
  await Promise.all(printers.value.map(p => fetchPrinterStatus(p.id)))
  refreshing.value = false
}

const formatTime = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const getStatusBadge = (printerId: number) => {
  const status = printerStatus.value[printerId]
  if (!status || status.loading) return { text: 'Checking...', class: 'bg-zinc-700 text-zinc-300' }
  if (!status.online) return { text: 'Offline', class: 'bg-red-500/20 text-red-400' }
  if (status.data?.paused) return { text: 'Paused', class: 'bg-yellow-500/20 text-yellow-400' }
  if (status.data?.printing) return { text: 'Printing', class: 'bg-green-500/20 text-green-400' }
  return { text: 'Ready', class: 'bg-blue-500/20 text-blue-400' }
}

// Auto-refresh every 30 seconds
let refreshInterval: ReturnType<typeof setInterval>
onMounted(() => {
  refreshInterval = setInterval(refreshAllStatus, 30000)
})

const handleLogout = async () => {
  await logout()
  router.push('/login')
}

const goToAdmin = () => {
  router.push('/admin')
}
</script>

<template>
  <div class="min-h-full bg-zinc-950">
    <!-- Header -->
    <header class="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Printer class="w-5 h-5 text-white" />
          </div>
          <div class="flex-1">
            <h1 class="text-xl font-semibold text-white">FART</h1>
            <p class="text-xs text-zinc-500">Filament Automation & Remote Tracking</p>
          </div>

          <!-- User Info -->
          <div class="flex items-center gap-3">
            <!-- Notification Status -->
            <div
              v-if="notificationPermission !== 'granted'"
              class="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300"
              @click="requestNotificationPermission"
            >
              <Bell class="w-4 h-4" />
              <span>Enable Notifications</span>
            </div>

            <!-- User Badge -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg">
              <User class="w-4 h-4 text-zinc-400" />
              <span class="text-sm text-white">{{ user?.name }}</span>
              <span
                v-if="isAdmin"
                class="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded"
              >
                Admin
              </span>
            </div>

            <!-- Admin Button -->
            <button
              v-if="isAdmin"
              class="btn btn-ghost p-2"
              title="Admin Dashboard"
              @click="goToAdmin"
            >
              <Shield class="w-5 h-5" />
            </button>

            <!-- Refresh Button -->
            <button
              class="btn btn-secondary flex items-center gap-2"
              :disabled="refreshing"
              @click="refreshAllStatus"
            >
              <RefreshCw :class="['w-4 h-4', refreshing && 'animate-spin']" />
              <span class="hidden sm:inline">Refresh</span>
            </button>

            <!-- Logout -->
            <button
              class="btn btn-ghost p-2 text-zinc-400 hover:text-red-400"
              title="Logout"
              @click="handleLogout"
            >
              <LogOut class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Stats Bar -->
    <div class="border-b border-zinc-800 bg-zinc-900/30">
      <div class="max-w-7xl mx-auto px-6 py-3">
        <div class="flex items-center gap-6 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-green-500" />
            <span class="text-zinc-400">
              {{ Object.values(printerStatus).filter(s => s?.online).length }} Online
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Activity class="w-4 h-4 text-orange-400" />
            <span class="text-zinc-400">
              {{ Object.values(printerStatus).filter(s => s?.data?.printing).length }} Printing
            </span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-red-500" />
            <span class="text-zinc-400">
              {{ Object.values(printerStatus).filter(s => s && !s.online && !s.loading).length }} Offline
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      <div class="mb-6">
        <h2 class="text-2xl font-semibold text-white mb-1">Printers</h2>
        <p class="text-zinc-500 text-sm">Monitor and control your 3D printers</p>
      </div>

      <!-- Printer Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div
          v-for="printer in printers"
          :key="printer.id"
          class="card overflow-hidden hover:border-zinc-700 transition-all duration-200 group"
        >
          <!-- Header with status -->
          <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                class="font-semibold text-white text-lg hover:text-orange-400 transition-colors"
                @click="goToPrinter(printer.id)"
              >
                {{ printer.name }}
              </button>
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  getStatusBadge(printer.id).class
                ]"
              >
                {{ getStatusBadge(printer.id).text }}
              </span>
            </div>
            <button
              class="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
              :disabled="printerStatus[printer.id]?.loading"
              @click="fetchPrinterStatus(printer.id)"
            >
              <RefreshCw :class="['w-4 h-4', printerStatus[printer.id]?.loading && 'animate-spin']" />
            </button>
          </div>

          <!-- Printer Image -->
          <button
            class="w-full aspect-video bg-zinc-800 overflow-hidden cursor-pointer relative"
            @click="goToPrinter(printer.id)"
          >
            <img
              :src="printer.image"
              :alt="printer.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <!-- Overlay when printing -->
            <div
              v-if="printerStatus[printer.id]?.data?.printing"
              class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4"
            >
              <div class="w-full">
                <div class="flex items-center justify-between text-sm mb-2">
                  <span class="text-white font-medium truncate max-w-[70%]">
                    {{ printerStatus[printer.id]?.data?.currentFile || 'Printing...' }}
                  </span>
                  <span class="text-orange-400 font-bold">
                    {{ sanitizeProgress(printerStatus[printer.id]?.data?.progress) }}%
                  </span>
                </div>
                <div class="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-orange-500 transition-all duration-500"
                    :style="{ width: `${sanitizeProgress(printerStatus[printer.id]?.data?.progress)}%` }"
                  />
                </div>
              </div>
            </div>
          </button>

          <!-- Info Section -->
          <div class="p-4 space-y-4">
            <!-- Printer details -->
            <div class="flex items-center justify-between text-sm">
              <span class="text-zinc-500">{{ printer.model }}</span>
              <div
                v-if="printerStatus[printer.id]?.online"
                class="flex items-center gap-1.5 text-green-500"
              >
                <Wifi class="w-3.5 h-3.5" />
                <span class="text-xs">Connected</span>
              </div>
              <div v-else class="flex items-center gap-1.5 text-zinc-600">
                <WifiOff class="w-3.5 h-3.5" />
                <span class="text-xs">Disconnected</span>
              </div>
            </div>

            <!-- Temperature & Status when online -->
            <div v-if="printerStatus[printer.id]?.online && printerStatus[printer.id]?.data" class="space-y-3">
              <!-- Temperatures -->
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-800/50 rounded-lg p-3">
                  <div class="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                    <Thermometer class="w-3.5 h-3.5 text-orange-400" />
                    Nozzle
                  </div>
                  <div class="text-lg font-semibold text-white">
                    {{ Math.round(printerStatus[printer.id]?.data?.nozzleTemp || 0) }}°C
                  </div>
                </div>
                <div class="bg-zinc-800/50 rounded-lg p-3">
                  <div class="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                    <Thermometer class="w-3.5 h-3.5 text-blue-400" />
                    Bed
                  </div>
                  <div class="text-lg font-semibold text-white">
                    {{ Math.round(printerStatus[printer.id]?.data?.bedTemp || 0) }}°C
                  </div>
                </div>
              </div>

              <!-- Print info if printing -->
              <div
                v-if="printerStatus[printer.id]?.data?.printing"
                class="bg-zinc-800/50 rounded-lg p-3"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <component
                      :is="printerStatus[printer.id]?.data?.paused ? Pause : Play"
                      class="w-4 h-4 text-green-400"
                    />
                    <span class="text-sm text-zinc-300">
                      {{ printerStatus[printer.id]?.data?.paused ? 'Paused' : 'In Progress' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 text-sm text-zinc-400">
                    <Clock class="w-3.5 h-3.5" />
                    {{ formatTime(printerStatus[printer.id]?.data?.timeRemaining) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Error state -->
            <div
              v-else-if="printerStatus[printer.id] && !printerStatus[printer.id]?.loading && !printerStatus[printer.id]?.online"
              class="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
            >
              <div class="flex items-center gap-2 text-red-400 text-sm">
                <XCircle class="w-4 h-4 flex-shrink-0" />
                <span class="truncate">{{ printerStatus[printer.id]?.error || 'Connection failed' }}</span>
              </div>
            </div>

            <!-- Loading state -->
            <div
              v-else-if="printerStatus[printer.id]?.loading"
              class="flex items-center justify-center py-4"
            >
              <Loader2 class="w-5 h-5 text-zinc-500 animate-spin" />
            </div>

            <!-- Actions -->
            <div class="flex gap-2 pt-2">
              <button
                class="btn btn-primary flex-1 flex items-center justify-center gap-2"
                @click="goToPrinter(printer.id)"
              >
                <FileText class="w-4 h-4" />
                Open Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="printers.length === 0"
        class="text-center py-20"
      >
        <div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Printer class="w-8 h-8 text-zinc-600" />
        </div>
        <h3 class="text-lg font-medium text-white mb-2">No printers configured</h3>
        <p class="text-zinc-500">Printers will appear here once configured</p>
      </div>

      <!-- Print History Section -->
      <div class="mt-12">
        <div class="flex items-center gap-3 mb-6">
          <History class="w-5 h-5 text-orange-400" />
          <h2 class="text-xl font-semibold text-white">Your Print History</h2>
        </div>

        <!-- Loading state -->
        <div v-if="historyLoading" class="flex items-center justify-center py-8">
          <Loader2 class="w-6 h-6 text-zinc-500 animate-spin" />
        </div>

        <!-- Empty state -->
        <div v-else-if="printHistory.length === 0" class="card p-6 text-center">
          <History class="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p class="text-zinc-400">No prints yet</p>
          <p class="text-zinc-600 text-sm mt-1">Your print history will appear here</p>
        </div>

        <!-- Print history list -->
        <div v-else class="space-y-3">
          <div
            v-for="print in printHistory"
            :key="print.id"
            class="card p-4 flex items-center gap-4"
          >
            <!-- Status icon -->
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                print.status === 'completed' ? 'bg-green-500/20' :
                print.status === 'printing' ? 'bg-blue-500/20' :
                print.status === 'failed' ? 'bg-red-500/20' : 'bg-zinc-700'
              ]"
            >
              <CheckCircle v-if="print.status === 'completed'" class="w-5 h-5 text-green-400" />
              <Play v-else-if="print.status === 'printing'" class="w-5 h-5 text-blue-400" />
              <AlertCircle v-else-if="print.status === 'failed'" class="w-5 h-5 text-red-400" />
              <XCircle v-else class="w-5 h-5 text-zinc-400" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-white font-medium truncate">{{ print.fileName }}</span>
                <span
                  :class="[
                    'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                    getHistoryStatusBadge(print.status).class
                  ]"
                >
                  {{ getHistoryStatusBadge(print.status).text }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                <span class="flex items-center gap-1">
                  <Printer class="w-3.5 h-3.5" />
                  {{ print.printerName }}
                </span>
                <span>{{ formatDate(print.startedAt) }}</span>
              </div>
            </div>

            <!-- Progress for active prints -->
            <div v-if="print.status === 'printing'" class="text-right">
              <span class="text-orange-400 font-bold">{{ sanitizeProgress(print.progress) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
