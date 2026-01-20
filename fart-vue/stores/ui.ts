import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    editMode: false,
    deleteMode: false,
    selectedPrinterId: null as number | null,
    sidebarOpen: false,
    toasts: [] as Toast[],
  }),

  actions: {
    toggleEditMode() {
      this.editMode = !this.editMode
      if (!this.editMode) {
        this.deleteMode = false
      }
    },

    toggleDeleteMode() {
      this.deleteMode = !this.deleteMode
    },

    setEditMode(value: boolean) {
      this.editMode = value
      if (!value) {
        this.deleteMode = false
      }
    },

    setDeleteMode(value: boolean) {
      this.deleteMode = value
    },

    selectPrinter(id: number | null) {
      this.selectedPrinterId = id
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },

    // Toast notifications
    addToast(toast: Omit<Toast, 'id'>) {
      const id = Date.now().toString()
      this.toasts.push({ ...toast, id })

      // Auto-remove after duration
      if (toast.duration !== 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, toast.duration || 5000)
      }

      return id
    },

    removeToast(id: string) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    },

    // Convenience methods for different toast types
    showSuccess(message: string, duration = 5000) {
      return this.addToast({ type: 'success', message, duration })
    },

    showError(message: string, duration = 8000) {
      return this.addToast({ type: 'error', message, duration })
    },

    showWarning(message: string, duration = 6000) {
      return this.addToast({ type: 'warning', message, duration })
    },

    showInfo(message: string, duration = 5000) {
      return this.addToast({ type: 'info', message, duration })
    },
  },
})

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
