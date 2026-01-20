export type WidgetType =
  | 'FilamentLevel'
  | 'HumidityLevel'
  | 'PrintProgress'
  | 'TemperatureLevel'
  | 'ChatAi'
  | 'Upload'
  | 'PrinterHead'
  | 'TimeRemaining'
  | 'FileDisplay'
  | 'PrinterInfo'

export interface WidgetConfig {
  id: string
  component: WidgetType
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}

export const DEFAULT_WIDGET_LAYOUT: WidgetConfig[] = [
  { id: 'a', x: 14, y: 0, w: 1, h: 12, component: 'FilamentLevel' },
  { id: 'b', x: 5, y: 6, w: 3, h: 3, component: 'HumidityLevel' },
  { id: 'c', x: 5, y: 0, w: 3, h: 3, component: 'PrintProgress' },
  { id: 'd', x: 5, y: 3, w: 3, h: 3, component: 'TemperatureLevel' },
  { id: 'e', x: 8, y: 7, w: 6, h: 5, component: 'ChatAi' },
  { id: 'f', x: 8, y: 0, w: 6, h: 3, component: 'Upload' },
  { id: 'g', x: 0, y: 7, w: 5, h: 5, component: 'PrinterHead' },
  { id: 'h', x: 5, y: 9, w: 3, h: 3, component: 'TimeRemaining' },
  { id: 'i', x: 8, y: 3, w: 6, h: 4, component: 'FileDisplay' },
  { id: 'j', x: 0, y: 0, w: 5, h: 7, component: 'PrinterInfo' },
]

export const AVAILABLE_WIDGETS: { id: string; component: WidgetType; label: string }[] = [
  { id: 'a', component: 'FilamentLevel', label: 'Filament Level' },
  { id: 'b', component: 'HumidityLevel', label: 'Humidity' },
  { id: 'c', component: 'PrintProgress', label: 'Print Progress' },
  { id: 'd', component: 'TemperatureLevel', label: 'Temperature' },
  { id: 'e', component: 'ChatAi', label: 'AI Chat' },
  { id: 'f', component: 'Upload', label: 'Upload' },
  { id: 'g', component: 'PrinterHead', label: 'Print Head' },
  { id: 'h', component: 'TimeRemaining', label: 'Time Remaining' },
  { id: 'i', component: 'FileDisplay', label: 'File Display' },
  { id: 'j', component: 'PrinterInfo', label: 'Printer Info' },
]
