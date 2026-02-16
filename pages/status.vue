<script setup lang="ts">
import {
  Printer,
  Wifi,
  WifiOff,
  Loader2,
  Thermometer,
  Clock,
  Play,
  Pause,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-vue-next'

// No auth middleware — this page is publicly accessible for TV display

const printerStore = usePrinterStore()

const printers = computed(() => printerStore.printers)

// Live clock
const currentTime = ref(new Date())
let clockInterval: ReturnType<typeof setInterval>

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
    hasThumbnail: boolean
  }
} | null>>({})

const refreshing = ref(false)
const lastUpdated = ref<Date | null>(null)
const thumbnailVersion = ref(0)

const getImageSrc = (printer: { id: number; image: string }) => {
  const status = printerStatus.value[printer.id]
  if (status?.data?.printing && status.data.hasThumbnail) {
    return `/api/printer/${printer.id}/thumbnail?v=${thumbnailVersion.value}`
  }
  return printer.image
}

const sanitizeProgress = (value: number | undefined | null): number => {
  if (value === undefined || value === null || isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

const fetchPrinterStatus = async (printerId: number) => {
  printerStatus.value[printerId] = { loading: true, online: false }

  try {
    const testResponse = await $fetch<{
      success: boolean
      message: string
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
      data: { file?: { name?: string; display?: string; thumbnailBig?: string }; progress?: { completion?: number; printTimeLeft?: number }; state?: string }
      printerTelemetry: { temperature?: { tool0?: { actual?: number }; bed?: { actual?: number } }; state?: { flags?: { printing?: boolean; paused?: boolean } } }
    }>(`/api/printer/${printerId}`)

    const temp = dataResponse.printerTelemetry?.temperature
    const state = dataResponse.printerTelemetry?.state
    const job = dataResponse.data

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
        progress: job?.progress?.completion ?? 0,
        currentFile: job?.file?.display || job?.file?.name,
        timeRemaining: job?.progress?.printTimeLeft,
        hasThumbnail: !!job?.file?.thumbnailBig,
      },
    }

    const status = isPrinting
      ? isPaused ? 'Paused' : 'Printing'
      : 'Online'
    printerStore.updateStatus(printerId, status)
  } catch {
    printerStatus.value[printerId] = {
      loading: false,
      online: false,
      error: 'Connection failed',
    }
    printerStore.updateStatus(printerId, 'Offline')
  }
}

const refreshAllStatus = async () => {
  refreshing.value = true
  await Promise.all(printers.value.map(p => fetchPrinterStatus(p.id)))
  thumbnailVersion.value++
  lastUpdated.value = new Date()
  refreshing.value = false
}

const formatTime = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const formatClock = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const formatLastUpdated = (date: Date | null): string => {
  if (!date) return 'Never'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const getStatusBadge = (printerId: number) => {
  const status = printerStatus.value[printerId]
  if (!status || status.loading) return { text: 'Checking...', class: 'bg-zinc-700 text-zinc-300', dot: 'bg-zinc-400' }
  if (!status.online) return { text: 'Offline', class: 'bg-red-500/20 text-red-400', dot: 'bg-red-500' }
  if (status.data?.paused) return { text: 'Paused', class: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' }
  if (status.data?.printing) return { text: 'Printing', class: 'bg-green-500/20 text-green-400', dot: 'bg-green-500' }
  return { text: 'Ready', class: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-500' }
}

const onlineCount = computed(() =>
  Object.values(printerStatus.value).filter(s => s?.online).length
)
const printingCount = computed(() =>
  Object.values(printerStatus.value).filter(s => s?.data?.printing).length
)
const offlineCount = computed(() =>
  Object.values(printerStatus.value).filter(s => s && !s.online && !s.loading).length
)

// Grid columns based on printer count
const gridClass = computed(() => {
  const count = printers.value.length
  if (count <= 1) return 'grid-cols-1 max-w-2xl mx-auto'
  if (count <= 2) return 'grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto'
  if (count <= 4) return 'grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto'
  return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto'
})

let refreshInterval: ReturnType<typeof setInterval>

onMounted(async () => {
  await printerStore.loadPrinters()
  refreshAllStatus()

  // Auto-refresh every 15 seconds
  refreshInterval = setInterval(refreshAllStatus, 15000)

  // Live clock
  clockInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(refreshInterval)
  clearInterval(clockInterval)
})
</script>

<template>
  <div class="min-h-screen bg-zinc-950 flex flex-col">
    <!-- Top Bar -->
    <header class="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm flex-shrink-0">
      <div class="max-w-7xl mx-auto px-8 py-4">
        <div class="flex items-center justify-between">
          <!-- Branding -->
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Printer class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-white tracking-tight">FART</h1>
              <p class="text-xs text-zinc-500 tracking-wide uppercase">Printer Status</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-8 text-sm">
            <div class="flex items-center gap-2.5">
              <div class="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              <span class="text-zinc-300 font-medium">{{ onlineCount }} Online</span>
            </div>
            <div class="flex items-center gap-2.5">
              <Activity class="w-4 h-4 text-orange-400" />
              <span class="text-zinc-300 font-medium">{{ printingCount }} Printing</span>
            </div>
            <div class="flex items-center gap-2.5">
              <div class="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
              <span class="text-zinc-300 font-medium">{{ offlineCount }} Offline</span>
            </div>
          </div>

          <!-- Clock & Update -->
          <div class="flex items-center gap-6">
            <div class="text-right">
              <div class="text-2xl font-mono font-semibold text-white tabular-nums">
                {{ formatClock(currentTime) }}
              </div>
              <div class="flex items-center gap-1.5 justify-end text-xs text-zinc-500">
                <RefreshCw :class="['w-3 h-3', refreshing && 'animate-spin text-orange-400']" />
                <span>Updated {{ formatLastUpdated(lastUpdated) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Printer Grid -->
    <main class="flex-1 px-8 py-6 overflow-auto">
      <div :class="['grid gap-6', gridClass]">
        <div
          v-for="printer in printers"
          :key="printer.id"
          class="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300"
          :class="[
            printerStatus[printer.id]?.data?.printing && !printerStatus[printer.id]?.data?.paused
              ? 'border-green-500/30 shadow-lg shadow-green-500/5'
              : printerStatus[printer.id]?.data?.paused
                ? 'border-yellow-500/30'
                : ''
          ]"
        >
          <!-- Card Header -->
          <div class="px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-semibold text-white">{{ printer.name }}</h2>
              <span
                :class="[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                  getStatusBadge(printer.id).class
                ]"
              >
                <span
                  :class="[
                    'w-1.5 h-1.5 rounded-full',
                    getStatusBadge(printer.id).dot,
                    printerStatus[printer.id]?.data?.printing && !printerStatus[printer.id]?.data?.paused && 'animate-pulse'
                  ]"
                />
                {{ getStatusBadge(printer.id).text }}
              </span>
            </div>
            <span class="text-sm text-zinc-500">{{ printer.model }}</span>
          </div>

          <!-- Printer Image / Print Thumbnail / Idle Graphic -->
          <div class="relative aspect-video bg-zinc-800 overflow-hidden">
            <!-- Thumbnail when printing -->
            <img
              v-if="printerStatus[printer.id]?.data?.printing && printerStatus[printer.id]?.data?.hasThumbnail"
              :src="getImageSrc(printer)"
              :alt="printer.name"
              class="w-full h-full object-contain p-4 transition-all duration-500"
            />

            <!-- Idle/Ready animated graphic -->
            <div
              v-else-if="printerStatus[printer.id]?.online && !printerStatus[printer.id]?.data?.printing"
              class="w-full h-full flex items-center justify-center"
            >
              <div class="relative flex items-center justify-center">
                <!-- Pulsing rings -->
                <div class="absolute w-28 h-28 rounded-full border border-blue-500/20 animate-[ping_3s_ease-in-out_infinite]" />
                <div class="absolute w-20 h-20 rounded-full border border-blue-500/10 animate-[ping_3s_ease-in-out_1s_infinite]" />
                <div class="absolute w-16 h-16 rounded-full bg-blue-500/5" />
                <Printer class="w-8 h-8 text-blue-400/60" />
              </div>
              <span class="absolute bottom-4 text-xs text-zinc-600 uppercase tracking-widest">Ready</span>
            </div>

            <!-- Fallback static image -->
            <img
              v-else
              :src="printer.image"
              :alt="printer.name"
              class="w-full h-full object-cover"
            />

            <!-- Printing Overlay -->
            <div
              v-if="printerStatus[printer.id]?.data?.printing"
              class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end"
            >
              <div class="w-full p-5">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2 min-w-0 flex-1 mr-4">
                    <component
                      :is="printerStatus[printer.id]?.data?.paused ? Pause : Play"
                      class="w-4 h-4 flex-shrink-0"
                      :class="printerStatus[printer.id]?.data?.paused ? 'text-yellow-400' : 'text-green-400'"
                    />
                    <span class="text-sm text-zinc-300 truncate">
                      {{ printerStatus[printer.id]?.data?.currentFile || 'Printing...' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 text-sm text-zinc-400 flex-shrink-0">
                    <Clock class="w-3.5 h-3.5" />
                    {{ formatTime(printerStatus[printer.id]?.data?.timeRemaining) }}
                  </div>
                </div>
                <!-- Progress Bar -->
                <div class="relative">
                  <div class="h-2.5 bg-zinc-700/80 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      class="h-full rounded-full transition-all duration-1000 ease-out"
                      :class="printerStatus[printer.id]?.data?.paused ? 'bg-yellow-500' : 'bg-green-500'"
                      :style="{ width: `${sanitizeProgress(printerStatus[printer.id]?.data?.progress)}%` }"
                    />
                  </div>
                  <div class="absolute -top-6 right-0 text-lg font-bold tabular-nums"
                    :class="printerStatus[printer.id]?.data?.paused ? 'text-yellow-400' : 'text-green-400'"
                  >
                    {{ sanitizeProgress(printerStatus[printer.id]?.data?.progress) }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Offline Overlay -->
            <div
              v-if="printerStatus[printer.id] && !printerStatus[printer.id]?.online && !printerStatus[printer.id]?.loading"
              class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
            >
              <div class="text-center">
                <WifiOff class="w-10 h-10 text-red-400/80 mx-auto mb-2" />
                <span class="text-red-400 text-sm font-medium">Offline</span>
              </div>
            </div>

            <!-- Loading Overlay -->
            <div
              v-if="printerStatus[printer.id]?.loading"
              class="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              <Loader2 class="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
          </div>

          <!-- Temperature Bar -->
          <div
            v-if="printerStatus[printer.id]?.online && printerStatus[printer.id]?.data"
            class="px-5 py-4"
          >
            <div class="grid grid-cols-2 gap-4">
              <!-- Nozzle Temp -->
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Thermometer class="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div class="text-xs text-zinc-500 uppercase tracking-wide">Nozzle</div>
                  <div class="text-xl font-semibold text-white tabular-nums">
                    {{ Math.round(printerStatus[printer.id]?.data?.nozzleTemp || 0) }}<span class="text-sm text-zinc-400">°C</span>
                  </div>
                </div>
              </div>
              <!-- Bed Temp -->
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Thermometer class="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div class="text-xs text-zinc-500 uppercase tracking-wide">Bed</div>
                  <div class="text-xl font-semibold text-white tabular-nums">
                    {{ Math.round(printerStatus[printer.id]?.data?.bedTemp || 0) }}<span class="text-sm text-zinc-400">°C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Offline / Error Bar -->
          <div
            v-else-if="printerStatus[printer.id] && !printerStatus[printer.id]?.loading && !printerStatus[printer.id]?.online"
            class="px-5 py-4"
          >
            <div class="flex items-center gap-2 text-red-400/80 text-sm">
              <AlertCircle class="w-4 h-4 flex-shrink-0" />
              <span>{{ printerStatus[printer.id]?.error || 'Unable to connect' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="printers.length === 0"
        class="flex items-center justify-center h-full min-h-[50vh]"
      >
        <div class="text-center">
          <div class="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Printer class="w-10 h-10 text-zinc-600" />
          </div>
          <h3 class="text-xl font-medium text-white mb-2">No printers configured</h3>
          <p class="text-zinc-500">Printers will appear here once configured</p>
        </div>
      </div>
    </main>
  </div>
</template>
