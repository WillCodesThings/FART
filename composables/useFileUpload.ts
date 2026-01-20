import { ref } from 'vue'

export function useFileUpload(printerId: number) {
  const progress = ref(0)
  const uploading = ref(false)
  const error = ref<Error | null>(null)
  const fileName = ref<string | null>(null)

  const upload = async (file: File): Promise<boolean> => {
    uploading.value = true
    progress.value = 0
    error.value = null
    fileName.value = file.name

    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          progress.value = Math.round((e.loaded / e.total) * 100)
        }
      })

      xhr.addEventListener('load', () => {
        uploading.value = false
        if (xhr.status >= 200 && xhr.status < 300) {
          progress.value = 100
          resolve(true)
        } else {
          error.value = new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`)
          resolve(false)
        }
      })

      xhr.addEventListener('error', () => {
        uploading.value = false
        error.value = new Error('Upload failed: Network error')
        resolve(false)
      })

      xhr.addEventListener('abort', () => {
        uploading.value = false
        error.value = new Error('Upload cancelled')
        resolve(false)
      })

      // Create FormData and send
      const formData = new FormData()
      formData.append('file', file)

      xhr.open('POST', `/api/printer/${printerId}/upload`)
      xhr.send(formData)
    })
  }

  const reset = () => {
    progress.value = 0
    uploading.value = false
    error.value = null
    fileName.value = null
  }

  return {
    upload,
    reset,
    progress,
    uploading,
    error,
    fileName,
  }
}
