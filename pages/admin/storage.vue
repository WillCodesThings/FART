<script setup lang="ts">
import { Trash2, RefreshCw, HardDrive, File, AlertTriangle } from 'lucide-vue-next'

definePageMeta({
  middleware: 'auth',
})

interface PrinterFile {
  name: string
  displayName: string
  size: number
  modified: string | null
  type: string
  readOnly: boolean
}

interface PrinterStorage {
  printer: {
    id: number
    name: string
    model: string
  }
  storage: {
    free: number
    total: number
    used: number
    available: boolean
  }
  files: PrinterFile[]
  totalFiles: number
  totalFilesSize: number
}

interface Printer {
  id: number
  name: string
  model: string
  status: string
}

const printers = ref<Printer[]>([])
const selectedPrinterId = ref<number | null>(null)
const storageData = ref<PrinterStorage | null>(null)
const loading = ref(false)
const deleting = ref<Set<string>>(new Set())
const selectedFiles = ref<Set<string>>(new Set())
const error = ref<string | null>(null)

// Fetch printers list
async function fetchPrinters() {
  try {
    const response = await $fetch<{ printers: Printer[] }>('/api/printer')
    printers.value = response.printers
    if (printers.value.length > 0 && !selectedPrinterId.value) {
      selectedPrinterId.value = printers.value[0].id
    }
  } catch (err) {
    console.error('Failed to fetch printers:', err)
  }
}

// Fetch storage for selected printer
async function fetchStorage() {
  if (!selectedPrinterId.value) return

  loading.value = true
  error.value = null
  selectedFiles.value.clear()

  try {
    storageData.value = await $fetch<PrinterStorage>(`/api/admin/storage/${selectedPrinterId.value}`)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch storage'
    error.value = errorMessage
    storageData.value = null
  } finally {
    loading.value = false
  }
}

// Delete a single file
async function deleteFile(filename: string) {
  if (!selectedPrinterId.value) return
  if (!confirm(`Are you sure you want to delete "${filename}"?`)) return

  deleting.value.add(filename)

  try {
    await $fetch(`/api/admin/storage/${selectedPrinterId.value}`, {
      method: 'DELETE',
      body: { filename },
    })
    await fetchStorage()
  } catch (err) {
    console.error('Failed to delete file:', err)
    alert('Failed to delete file')
  } finally {
    deleting.value.delete(filename)
  }
}

// Delete selected files
async function deleteSelected() {
  if (!selectedPrinterId.value) return
  if (selectedFiles.value.size === 0) return

  const filenames = Array.from(selectedFiles.value)
  if (!confirm(`Are you sure you want to delete ${filenames.length} file(s)?`)) return

  for (const f of filenames) {
    deleting.value.add(f)
  }

  try {
    await $fetch(`/api/admin/storage/${selectedPrinterId.value}`, {
      method: 'DELETE',
      body: { filenames },
    })
    selectedFiles.value.clear()
    await fetchStorage()
  } catch (err) {
    console.error('Failed to delete files:', err)
    alert('Failed to delete some files')
  } finally {
    deleting.value.clear()
  }
}

// Toggle file selection
function toggleFileSelection(filename: string) {
  if (selectedFiles.value.has(filename)) {
    selectedFiles.value.delete(filename)
  } else {
    selectedFiles.value.add(filename)
  }
}

// Select/deselect all files
function toggleSelectAll() {
  if (!storageData.value) return

  if (selectedFiles.value.size === storageData.value.files.length) {
    selectedFiles.value.clear()
  } else {
    selectedFiles.value = new Set(storageData.value.files.map(f => f.name))
  }
}

// Format file size
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleString()
}

// Watch for printer selection changes
watch(selectedPrinterId, () => {
  fetchStorage()
})

// Initial fetch
onMounted(() => {
  fetchPrinters()
})
</script>

<template>
  <div class="min-h-screen bg-darkGray p-6">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <NuxtLink to="/admin" class="text-gray-400 hover:text-white">
            &larr; Back to Admin
          </NuxtLink>
          <h1 class="text-2xl font-bold text-white flex items-center gap-2">
            <HardDrive class="w-6 h-6" />
            Printer Storage Management
          </h1>
        </div>
      </div>

      <!-- Printer Selector -->
      <div class="bg-gray-800 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-4">
          <label class="text-gray-300">Select Printer:</label>
          <select
            v-model="selectedPrinterId"
            class="bg-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-lightOrange"
          >
            <option v-for="printer in printers" :key="printer.id" :value="printer.id">
              {{ printer.name }} ({{ printer.model }})
            </option>
          </select>
          <button
            @click="fetchStorage"
            :disabled="loading"
            class="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw :class="['w-4 h-4', { 'animate-spin': loading }]" />
            Refresh
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-2 text-red-400">
          <AlertTriangle class="w-5 h-5" />
          <span>{{ error }}</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="text-center py-12">
        <RefreshCw class="w-8 h-8 animate-spin text-lightOrange mx-auto mb-4" />
        <p class="text-gray-400">Loading storage information...</p>
      </div>

      <!-- Storage Info -->
      <div v-else-if="storageData" class="space-y-6">
        <!-- Storage Stats -->
        <div class="bg-gray-800 rounded-lg p-4">
          <h2 class="text-lg font-semibold text-white mb-4">Storage Overview</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-700 rounded p-3">
              <p class="text-gray-400 text-sm">Total Files</p>
              <p class="text-2xl font-bold text-white">{{ storageData.totalFiles }}</p>
            </div>
            <div class="bg-gray-700 rounded p-3">
              <p class="text-gray-400 text-sm">Files Size</p>
              <p class="text-2xl font-bold text-white">{{ formatSize(storageData.totalFilesSize) }}</p>
            </div>
            <div class="bg-gray-700 rounded p-3">
              <p class="text-gray-400 text-sm">Free Space</p>
              <p class="text-2xl font-bold text-green-400">{{ formatSize(storageData.storage.free) }}</p>
            </div>
            <div class="bg-gray-700 rounded p-3">
              <p class="text-gray-400 text-sm">Total Space</p>
              <p class="text-2xl font-bold text-white">{{ formatSize(storageData.storage.total) }}</p>
            </div>
          </div>

          <!-- Storage Bar -->
          <div v-if="storageData.storage.total > 0" class="mt-4">
            <div class="flex justify-between text-sm text-gray-400 mb-1">
              <span>Used: {{ formatSize(storageData.storage.used) }}</span>
              <span>{{ Math.round((storageData.storage.used / storageData.storage.total) * 100) }}%</span>
            </div>
            <div class="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-lightOrange transition-all duration-300"
                :style="{ width: `${(storageData.storage.used / storageData.storage.total) * 100}%` }"
              />
            </div>
          </div>
        </div>

        <!-- File Actions -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                :checked="selectedFiles.size === storageData.files.length && storageData.files.length > 0"
                :indeterminate="selectedFiles.size > 0 && selectedFiles.size < storageData.files.length"
                @change="toggleSelectAll"
                class="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              Select All
            </label>
            <span v-if="selectedFiles.size > 0" class="text-gray-400">
              {{ selectedFiles.size }} selected
            </span>
          </div>
          <button
            v-if="selectedFiles.size > 0"
            @click="deleteSelected"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            <Trash2 class="w-4 h-4" />
            Delete Selected ({{ selectedFiles.size }})
          </button>
        </div>

        <!-- Files List -->
        <div class="bg-gray-800 rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-700">
              <tr>
                <th class="w-10 px-4 py-3"></th>
                <th class="px-4 py-3 text-left text-gray-300 font-medium">File Name</th>
                <th class="px-4 py-3 text-left text-gray-300 font-medium">Size</th>
                <th class="px-4 py-3 text-left text-gray-300 font-medium">Modified</th>
                <th class="px-4 py-3 text-right text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              <tr
                v-for="file in storageData.files"
                :key="file.name"
                :class="[
                  'hover:bg-gray-700/50 transition-colors',
                  { 'bg-gray-700/30': selectedFiles.has(file.name) }
                ]"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="selectedFiles.has(file.name)"
                    @change="toggleFileSelection(file.name)"
                    class="w-4 h-4 rounded bg-gray-700 border-gray-600"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <File class="w-4 h-4 text-gray-400" />
                    <span class="text-white">{{ file.displayName }}</span>
                    <span v-if="file.readOnly" class="text-xs bg-yellow-600 text-yellow-100 px-1 rounded">Read Only</span>
                  </div>
                  <p v-if="file.name !== file.displayName" class="text-xs text-gray-500 mt-1">{{ file.name }}</p>
                </td>
                <td class="px-4 py-3 text-gray-300">{{ formatSize(file.size) }}</td>
                <td class="px-4 py-3 text-gray-300">{{ formatDate(file.modified) }}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    @click="deleteFile(file.name)"
                    :disabled="deleting.has(file.name) || file.readOnly"
                    class="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :title="file.readOnly ? 'Cannot delete read-only file' : 'Delete file'"
                  >
                    <Trash2 v-if="!deleting.has(file.name)" class="w-4 h-4" />
                    <RefreshCw v-else class="w-4 h-4 animate-spin" />
                  </button>
                </td>
              </tr>
              <tr v-if="storageData.files.length === 0">
                <td colspan="5" class="px-4 py-8 text-center text-gray-400">
                  No files found on this printer
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- No Printer Selected -->
      <div v-else class="text-center py-12 text-gray-400">
        <HardDrive class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Select a printer to view storage</p>
      </div>
    </div>
  </div>
</template>
