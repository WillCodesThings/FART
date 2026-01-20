import type { PrinterApiResponse } from '~/types/api'
import type { PrintAction } from '~/types/job'

export function usePrinter(printerId: number) {
  const { data, pending, error, refresh } = useFetch<PrinterApiResponse>(
    `/api/printer/${printerId}`,
    {
      key: `printer-${printerId}`,
    }
  )

  const loading = pending

  // Control print actions
  const controlPrint = async (action: PrintAction): Promise<boolean> => {
    try {
      await $fetch(`/api/printer/${printerId}`, {
        method: 'POST',
        body: { command: action },
      })
      // Refresh data after action
      await refresh()
      return true
    } catch (err) {
      console.error(`Failed to ${action} print:`, err)
      return false
    }
  }

  // Start a specific print file
  const startPrint = async (filename: string): Promise<boolean> => {
    try {
      await $fetch(`/api/printer/${printerId}`, {
        method: 'POST',
        body: { command: 'run', filename },
      })
      await refresh()
      return true
    } catch (err) {
      console.error('Failed to start print:', err)
      return false
    }
  }

  // Get live image from printer
  const getImage = async (): Promise<Blob | null> => {
    try {
      const response = await $fetch<Blob>(`/api/printer/${printerId}`, {
        method: 'POST',
        body: { command: 'img' },
        responseType: 'blob',
      })
      return response
    } catch (err) {
      console.error('Failed to get image:', err)
      return null
    }
  }

  // Convenience methods for common actions
  const pausePrint = () => controlPrint('pause')
  const resumePrint = () => controlPrint('resume')
  const cancelPrint = () => controlPrint('cancel')

  return {
    data,
    loading,
    error,
    refresh,
    controlPrint,
    startPrint,
    getImage,
    pausePrint,
    resumePrint,
    cancelPrint,
  }
}
