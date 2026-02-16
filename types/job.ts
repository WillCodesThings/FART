export type JobState =
  | 'Operational'
  | 'Printing'
  | 'Paused'
  | 'Cancelling'
  | 'Error'
  | 'Offline'
  | 'Finishing'
  | 'Finished'
  | 'IDLE'
  | 'PRINTING'
  | 'PAUSED'
  | 'FINISHED'
  | 'ATTENTION'

export interface JobProgress {
  completion: number      // 0-1 (percentage as decimal) from API, converted to 0-100 for display
  printTime: number       // seconds elapsed
  printTimeLeft: number   // seconds remaining
}

export interface FileRefs {
  resource?: string
  download?: string
  printTime?: string
}

export interface PrintFile {
  name: string
  display?: string
  path?: string
  size?: number
  date?: number
  refs?: FileRefs
  thumbnailBig?: string
}

// Raw PrusaLink API response structure
export interface PrusaLinkJobResponse {
  state: string
  job?: {
    estimatedPrintTime?: number
    file?: {
      name: string
      path?: string
      display?: string
      refs?: {
        resource?: string
        thumbnailBig?: string
      }
    }
  }
  progress?: {
    completion?: number    // 0-1 decimal
    printTime?: number     // seconds
    printTimeLeft?: number // seconds
  }
}

// Normalized PrintJob for our app
export interface PrintJob {
  file: PrintFile | null
  state: JobState | string
  progress: {
    completion: number     // 0-100 percentage
    printTime: number      // seconds
    printTimeLeft: number  // seconds
  }
  // Raw values from API for reference
  raw?: PrusaLinkJobResponse
}

export type PrintAction = 'pause' | 'resume' | 'cancel' | 'start'
