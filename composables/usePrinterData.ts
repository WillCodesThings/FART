import { ref, onMounted, onUnmounted } from 'vue'
import type { PrinterApiResponse } from '~/types/api'

interface UsePrinterDataOptions {
  pollInterval?: number
  immediate?: boolean
}

export function usePrinterData(printerId: number, options: UsePrinterDataOptions = {}) {
  const { pollInterval = 5000, immediate = true } = options

  const data = ref<PrinterApiResponse | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const connected = ref(false)

  let intervalId: ReturnType<typeof setInterval> | null = null

  const fetchData = async () => {
    if (loading.value) return

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<PrinterApiResponse>(`/api/printer/${printerId}`)
      data.value = response
      connected.value = true
      error.value = null
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Failed to fetch printer data')
      connected.value = false
    } finally {
      loading.value = false
    }
  }

  const startPolling = () => {
    if (intervalId) return
    intervalId = setInterval(fetchData, pollInterval)
  }

  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  const refresh = async () => {
    await fetchData()
  }

  onMounted(() => {
    if (immediate) {
      fetchData()
    }
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  // Computed properties for easy access to nested data
  const jobData = computed(() => data.value?.data ?? null)
  const files = computed(() => data.value?.files ?? [])
  const telemetry = computed(() => data.value?.printerTelemetry ?? null)

  // Temperature shortcuts
  const nozzleTemp = computed(() => telemetry.value?.temperature?.tool0?.actual ?? 0)
  const nozzleTarget = computed(() => telemetry.value?.temperature?.tool0?.target ?? 0)
  const bedTemp = computed(() => telemetry.value?.temperature?.bed?.actual ?? 0)
  const bedTarget = computed(() => telemetry.value?.temperature?.bed?.target ?? 0)

  // Progress shortcuts
  const progress = computed(() => {
    const completion = jobData.value?.progress?.completion ?? 0
    return Math.round(completion * 100)
  })
  const printTimeElapsed = computed(() => jobData.value?.progress?.printTime ?? 0)
  const printTimeRemaining = computed(() => jobData.value?.progress?.printTimeLeft ?? 0)

  // State shortcuts
  const isPrinting = computed(() => jobData.value?.state === 'Printing')
  const isPaused = computed(() => jobData.value?.state === 'Paused')
  const isIdle = computed(() => jobData.value?.state === 'Operational')
  const currentFile = computed(() => jobData.value?.file?.display ?? null)

  return {
    data,
    loading,
    error,
    connected,
    refresh,
    startPolling,
    stopPolling,

    // Shortcuts
    jobData,
    files,
    telemetry,
    nozzleTemp,
    nozzleTarget,
    bedTemp,
    bedTarget,
    progress,
    printTimeElapsed,
    printTimeRemaining,
    isPrinting,
    isPaused,
    isIdle,
    currentFile,
  }
}
