import { ref, watch } from 'vue'
import type { WidgetConfig, WidgetType } from '~/types/widget'
import { DEFAULT_WIDGET_LAYOUT } from '~/types/widget'

const STORAGE_KEY = 'grid-layout'

export function useWidgetLayout() {
  const layout = ref<WidgetConfig[]>([])
  const editMode = ref(false)
  const deleteMode = ref(false)

  // Load layout from localStorage or use defaults
  const loadLayout = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          layout.value = JSON.parse(stored)
        } catch {
          layout.value = [...DEFAULT_WIDGET_LAYOUT]
        }
      } else {
        layout.value = [...DEFAULT_WIDGET_LAYOUT]
      }
    } else {
      layout.value = [...DEFAULT_WIDGET_LAYOUT]
    }
  }

  // Save layout to localStorage
  const saveLayout = () => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout.value))
    }
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    editMode.value = !editMode.value
    if (!editMode.value) {
      deleteMode.value = false
      saveLayout()
    }
  }

  // Toggle delete mode
  const toggleDeleteMode = () => {
    deleteMode.value = !deleteMode.value
  }

  // Add a widget to the layout
  const addWidget = (component: WidgetType) => {
    const newWidget: WidgetConfig = {
      id: `${component}-${Date.now()}`,
      component,
      x: 0,
      y: 0,
      w: 3,
      h: 3,
    }
    layout.value.push(newWidget)
    saveLayout()
  }

  // Remove a widget from the layout
  const removeWidget = (id: string) => {
    const index = layout.value.findIndex(item => item.id === id)
    if (index !== -1) {
      layout.value.splice(index, 1)
      saveLayout()
    }
    deleteMode.value = false
  }

  // Update layout when items are moved/resized
  const onLayoutUpdate = (newLayout: WidgetConfig[]) => {
    layout.value = newLayout
    saveLayout()
  }

  // Update a single item's position
  const updateItemPosition = (id: string, x: number, y: number, w: number, h: number) => {
    const item = layout.value.find(item => item.id === id)
    if (item) {
      item.x = x
      item.y = y
      item.w = w
      item.h = h
      saveLayout()
    }
  }

  // Reset layout to defaults
  const resetLayout = () => {
    layout.value = [...DEFAULT_WIDGET_LAYOUT]
    saveLayout()
  }

  // Initialize layout on mount
  onMounted(() => {
    loadLayout()
  })

  return {
    layout,
    editMode,
    deleteMode,
    toggleEditMode,
    toggleDeleteMode,
    addWidget,
    removeWidget,
    onLayoutUpdate,
    updateItemPosition,
    resetLayout,
    saveLayout,
    loadLayout,
  }
}
