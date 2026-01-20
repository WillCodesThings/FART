export type JobState =
  | 'Operational'
  | 'Printing'
  | 'Paused'
  | 'Cancelling'
  | 'Error'
  | 'Offline'
  | 'Finishing'

export interface JobProgress {
  completion: number      // 0-1 (percentage as decimal)
  printTime: number       // seconds elapsed
  printTimeLeft: number   // seconds remaining
}

export interface FileRefs {
  resource: string
  download: string
  printTime?: string
}

export interface PrintFile {
  name: string
  display: string
  path: string
  size: number
  date: number
  refs: FileRefs
  thumbnailBig?: string
}

export interface PrintJob {
  file: PrintFile | null
  state: JobState
  progress: JobProgress
}

export type PrintAction = 'pause' | 'resume' | 'cancel' | 'start'
