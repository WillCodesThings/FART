<script setup lang="ts">
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  Square,
  Clock,
  FileText,
  Loader2,
  CheckCircle,
  XCircle,
  Thermometer,
  RefreshCw,
  Trash2,
  AlertCircle,
  Layers,
  Gauge,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const printerStore = usePrinterStore()
const { isAdmin } = useAuth()

const printerId = computed(() => Number(route.params.id))

// Check if user can control the printer (admin only when printing)
const canControl = computed(() => {
  // If not printing, anyone can start a print
  if (!isPrinting.value && !isPaused.value) return true
  // If printing, only admins can control
  return isAdmin.value
})

onMounted(async () => {
  if (printerStore.printers.length === 0) {
    await printerStore.loadPrinters()
  }
})

const printer = computed(() => printerStore.getPrinterById(printerId.value))

const sanitizeProgress = (value: number | undefined | null): number => {
  if (value === undefined || value === null || isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Printer data
const {
  data: apiData,
  loading,
  error,
  nozzleTemp,
  bedTemp,
  progress,
  files,
  isPrinting,
  isPaused,
  currentFile,
  printTimeRemaining,
  refresh,
} = usePrinterData(printerId.value)

// Auto-refresh
let refreshInterval: ReturnType<typeof setInterval>
onMounted(() => {
  refreshInterval = setInterval(refresh, 5000)
})
onUnmounted(() => {
  clearInterval(refreshInterval)
})

const refreshing = ref(false)
const handleRefresh = async () => {
  refreshing.value = true
  await refresh()
  refreshing.value = false
}

// File upload
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref<string | null>(null)
const dragOver = ref(false)

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await uploadFile(file)
  input.value = ''
}

const handleDrop = async (event: DragEvent) => {
  dragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) await uploadFile(file)
}

const uploadFile = async (file: File) => {
  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.gcode') && !fileName.endsWith('.bgcode') && !fileName.endsWith('.gco') && !fileName.endsWith('.bgc')) {
    uploadError.value = 'Please select a .gcode or .bgcode file'
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadError.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        uploadProgress.value = Math.round((e.loaded / e.total) * 100)
      }
    })

    xhr.addEventListener('load', () => {
      uploading.value = false
      if (xhr.status >= 200 && xhr.status < 300) {
        uploadProgress.value = 100
        refresh()
      } else {
        uploadError.value = 'Upload failed'
      }
    })

    xhr.addEventListener('error', () => {
      uploading.value = false
      uploadError.value = 'Upload failed'
    })

    xhr.open('POST', `/api/printer/${printerId.value}/upload`)
    xhr.send(formData)
  } catch {
    uploading.value = false
    uploadError.value = 'Upload failed'
  }
}

// Print controls
const { controlPrint, startPrint } = usePrinter(printerId.value)

const handlePrint = async (fileName: string) => {
  await startPrint(fileName)
  refresh()
}

const handlePause = async () => {
  await controlPrint('pause')
  refresh()
}

const handleResume = async () => {
  await controlPrint('resume')
  refresh()
}

const handleCancel = async () => {
  if (confirm('Are you sure you want to cancel the print?')) {
    await controlPrint('cancel')
    refresh()
  }
}

const formatTime = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

const goBack = () => router.push('/')
</script>

<template>
  <div class="min-h-full bg-zinc-950">
    <!-- Header -->
    <header class="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center gap-4">
          <button
            class="btn btn-ghost p-2"
            @click="goBack"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div class="flex-1">
            <h1 class="text-xl font-semibold text-white">{{ printer?.name || 'Printer' }}</h1>
            <p class="text-xs text-zinc-500">{{ printer?.model }} • {{ printer?.ipAddr }}</p>
          </div>

          <!-- Status Badge -->
          <div
            v-if="isPrinting || isPaused"
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2',
              isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
            ]"
          >
            <span class="relative flex h-2 w-2">
              <span :class="[
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                isPaused ? 'bg-yellow-400' : 'bg-green-400'
              ]" />
              <span :class="[
                'relative inline-flex rounded-full h-2 w-2',
                isPaused ? 'bg-yellow-400' : 'bg-green-400'
              ]" />
            </span>
            {{ isPaused ? 'Paused' : 'Printing' }}
          </div>
          <div v-else-if="apiData" class="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400">
            Ready
          </div>

          <button
            class="btn btn-secondary flex items-center gap-2"
            :disabled="refreshing"
            @click="handleRefresh"
          >
            <RefreshCw :class="['w-4 h-4', refreshing && 'animate-spin']" />
            Refresh
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-8">
      <!-- Error State -->
      <div v-if="error && !apiData" class="text-center py-20">
        <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle class="w-8 h-8 text-red-400" />
        </div>
        <h3 class="text-lg font-medium text-white mb-2">Connection Failed</h3>
        <p class="text-zinc-500 mb-4">Unable to connect to printer at {{ printer?.ipAddr }}</p>
        <div class="flex gap-3 justify-center">
          <button class="btn btn-secondary" @click="goBack">Go Back</button>
          <button class="btn btn-primary" @click="handleRefresh">Retry</button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading && !apiData" class="flex items-center justify-center py-20">
        <div class="text-center">
          <Loader2 class="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p class="text-zinc-500">Connecting to printer...</p>
        </div>
      </div>

      <div v-else class="space-y-6">
        <!-- Top Row: Status Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Nozzle Temp -->
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Thermometer class="w-4 h-4 text-orange-400" />
              Nozzle
            </div>
            <div class="text-2xl font-bold text-white">{{ Math.round(nozzleTemp) }}°C</div>
          </div>

          <!-- Bed Temp -->
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Thermometer class="w-4 h-4 text-blue-400" />
              Bed
            </div>
            <div class="text-2xl font-bold text-white">{{ Math.round(bedTemp) }}°C</div>
          </div>

          <!-- Progress -->
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Gauge class="w-4 h-4 text-green-400" />
              Progress
            </div>
            <div class="text-2xl font-bold text-white">{{ sanitizeProgress(progress) }}%</div>
          </div>

          <!-- Time Remaining -->
          <div class="card p-4">
            <div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <Clock class="w-4 h-4 text-purple-400" />
              Time Left
            </div>
            <div class="text-2xl font-bold text-white">{{ formatTime(printTimeRemaining) }}</div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Current Print + Controls -->
          <div class="lg:col-span-1 space-y-6">
            <!-- Current Print Card -->
            <div class="card">
              <div class="p-4 border-b border-zinc-800">
                <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Current Print</h2>
              </div>

              <div class="p-4">
                <div v-if="isPrinting || isPaused" class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Layers class="w-5 h-5 text-orange-400" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-white font-medium truncate">{{ currentFile || 'Unknown file' }}</div>
                      <div class="text-xs text-zinc-500 mt-0.5">
                        {{ isPaused ? 'Paused' : 'Printing' }} • {{ formatTime(printTimeRemaining) }} remaining
                      </div>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div>
                    <div class="flex justify-between text-sm mb-2">
                      <span class="text-zinc-400">Progress</span>
                      <span class="text-white font-medium">{{ sanitizeProgress(progress) }}%</span>
                    </div>
                    <div class="h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                        :style="{ width: `${sanitizeProgress(progress)}%` }"
                      />
                    </div>
                  </div>

                  <!-- Controls (Admin only) -->
                  <div v-if="isAdmin" class="flex gap-2 pt-2">
                    <button
                      v-if="isPaused"
                      class="btn btn-primary flex-1 flex items-center justify-center gap-2"
                      @click="handleResume"
                    >
                      <Play class="w-4 h-4" />
                      Resume
                    </button>
                    <button
                      v-else
                      class="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                      @click="handlePause"
                    >
                      <Pause class="w-4 h-4" />
                      Pause
                    </button>
                    <button
                      class="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4"
                      @click="handleCancel"
                    >
                      <Square class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Non-admin notice -->
                  <div v-else class="pt-2 text-center">
                    <p class="text-xs text-zinc-500">Only admins can control active prints</p>
                  </div>
                </div>

                <div v-else class="text-center py-8">
                  <div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle class="w-7 h-7 text-zinc-600" />
                  </div>
                  <p class="text-zinc-500 mb-1">No active print</p>
                  <p class="text-xs text-zinc-600">Select a file below to start printing</p>
                </div>
              </div>
            </div>

            <!-- Upload Card -->
            <div class="card">
              <div class="p-4 border-b border-zinc-800">
                <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Upload File</h2>
              </div>

              <div class="p-4">
                <!-- Show notice if printing and not admin -->
                <div v-if="(isPrinting || isPaused) && !isAdmin" class="text-center py-6">
                  <Upload class="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p class="text-zinc-500 text-sm">Upload disabled while printing</p>
                  <p class="text-xs text-zinc-600 mt-1">Only admins can upload during active prints</p>
                </div>

                <div v-else-if="uploading" class="space-y-4">
                  <div class="flex items-center gap-3">
                    <Loader2 class="w-5 h-5 text-orange-400 animate-spin" />
                    <div class="flex-1">
                      <div class="flex justify-between text-sm mb-1">
                        <span class="text-zinc-400">Uploading...</span>
                        <span class="text-white font-medium">{{ uploadProgress }}%</span>
                      </div>
                      <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-orange-500 transition-all duration-300"
                          :style="{ width: `${uploadProgress}%` }"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else>
                  <label
                    :class="[
                      'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all',
                      dragOver
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30'
                    ]"
                    @dragover.prevent="dragOver = true"
                    @dragleave="dragOver = false"
                    @drop.prevent="handleDrop"
                  >
                    <Upload :class="['w-8 h-8 mb-2', dragOver ? 'text-orange-400' : 'text-zinc-500']" />
                    <span class="text-white font-medium text-sm">Drop .gcode or .bgcode file here</span>
                    <span class="text-xs text-zinc-500 mt-1">or click to browse</span>
                    <input
                      ref="fileInput"
                      type="file"
                      accept=".gcode,.bgcode,.gco,.bgc"
                      class="hidden"
                      @change="handleFileSelect"
                    />
                  </label>
                  <div v-if="uploadError" class="mt-3 flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle class="w-4 h-4" />
                    {{ uploadError }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Files -->
          <div class="lg:col-span-2">
            <div class="card">
              <div class="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                  Files on Printer
                </h2>
                <span class="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full">
                  {{ files.length }} files
                </span>
              </div>

              <div v-if="loading && files.length === 0" class="flex items-center justify-center py-16">
                <Loader2 class="w-6 h-6 text-zinc-500 animate-spin" />
              </div>

              <div v-else-if="files.length === 0" class="text-center py-16">
                <FileText class="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p class="text-zinc-500 mb-1">No files on printer</p>
                <p class="text-xs text-zinc-600">Upload a .gcode or .bgcode file to get started</p>
              </div>

              <div v-else class="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto">
                <div
                  v-for="file in files"
                  :key="file.name"
                  class="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors group"
                >
                  <div class="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText class="w-6 h-6 text-zinc-500" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-white font-medium truncate">{{ file.display || file.name }}</p>
                    <div class="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span class="flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        {{ file.refs?.printTime || 'Unknown time' }}
                      </span>
                      <span v-if="file.size">{{ formatFileSize(file.size) }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      v-if="canControl"
                      class="btn btn-primary flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      :disabled="isPrinting || isPaused"
                      @click="handlePrint(file.name)"
                    >
                      <Play class="w-4 h-4" />
                      Print
                    </button>
                    <span
                      v-else
                      class="text-xs text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Printing in progress
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
