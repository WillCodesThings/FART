import { createServer, IncomingMessage, ServerResponse } from 'http'

const PORT = process.env.PORT || 8888
const API_KEY = process.env.API_KEY || 'test-api-key'

// Mock printer state
let printerState = {
  printing: false,
  paused: false,
  progress: 0,
  currentFile: null as string | null,
  nozzleTemp: 25,
  nozzleTarget: 0,
  bedTemp: 22,
  bedTarget: 0,
  printTimeRemaining: 0,
  files: [
    { name: 'benchy_30m.gcode', display: 'Benchy_30m.gcode', size: 1234567 },
    { name: 'calibration_cube_15m.gcode', display: 'Calibration_Cube_15m.gcode', size: 234567 },
    { name: 'phone_stand_2h15m.gcode', display: 'Phone_Stand_2h15m.gcode', size: 3456789 },
  ],
}

// Simulate temperature changes
setInterval(() => {
  if (printerState.printing && !printerState.paused) {
    // Increment progress
    printerState.progress = Math.min(100, printerState.progress + 0.5)
    printerState.printTimeRemaining = Math.max(0, printerState.printTimeRemaining - 3)

    // Simulate temperatures when printing
    printerState.nozzleTemp = 210 + Math.random() * 5 - 2.5
    printerState.nozzleTarget = 215
    printerState.bedTemp = 60 + Math.random() * 2 - 1
    printerState.bedTarget = 60

    // Complete print
    if (printerState.progress >= 100) {
      printerState.printing = false
      printerState.currentFile = null
      printerState.nozzleTarget = 0
      printerState.bedTarget = 0
    }
  } else {
    // Cool down when not printing
    printerState.nozzleTemp = Math.max(25, printerState.nozzleTemp - 2)
    printerState.bedTemp = Math.max(22, printerState.bedTemp - 0.5)
  }
}, 1000)

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
  })
}

function sendJson(res: ServerResponse, data: object, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'X-Api-Key, Content-Type',
  })
  res.end(JSON.stringify(data))
}

function checkAuth(req: IncomingMessage): boolean {
  const apiKey = req.headers['x-api-key']
  return apiKey === API_KEY
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  const path = url.pathname
  const method = req.method || 'GET'

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Api-Key, Content-Type, Print-After-Upload',
    })
    res.end()
    return
  }

  // Log requests
  console.log(`[${new Date().toISOString()}] ${method} ${path}`)

  // Check API key for protected routes
  if (!path.startsWith('/api/version') && !checkAuth(req)) {
    sendJson(res, { error: 'Unauthorized' }, 401)
    return
  }

  // Routes
  if (path === '/api/version' && method === 'GET') {
    // Version endpoint (used for ping/connection test)
    sendJson(res, {
      api: '0.1',
      server: '1.0.0',
      text: 'Mock Prusa Printer',
    })
  } else if (path === '/api/printer' && method === 'GET') {
    // Printer telemetry
    sendJson(res, {
      temperature: {
        tool0: {
          actual: printerState.nozzleTemp,
          target: printerState.nozzleTarget,
        },
        bed: {
          actual: printerState.bedTemp,
          target: printerState.bedTarget,
        },
      },
      state: {
        text: printerState.printing
          ? printerState.paused
            ? 'Paused'
            : 'Printing'
          : 'Operational',
        flags: {
          operational: true,
          printing: printerState.printing,
          paused: printerState.paused,
          error: false,
          ready: !printerState.printing,
        },
      },
    })
  } else if (path === '/api/job' && method === 'GET') {
    // Job status
    sendJson(res, {
      job: printerState.currentFile
        ? {
            file: {
              name: printerState.currentFile,
              display: printerState.currentFile,
            },
            estimatedPrintTime: 3600,
          }
        : null,
      progress: {
        completion: printerState.progress,
        printTimeLeft: printerState.printTimeRemaining,
      },
      state: printerState.printing
        ? printerState.paused
          ? 'Paused'
          : 'Printing'
        : 'Operational',
    })
  } else if (path === '/api/job' && method === 'POST') {
    // Job control (pause, resume, cancel)
    const body = await parseBody(req)
    const data = JSON.parse(body || '{}')
    const action = data.command || data.action

    if (action === 'pause') {
      printerState.paused = true
      console.log('Print paused')
    } else if (action === 'resume') {
      printerState.paused = false
      console.log('Print resumed')
    } else if (action === 'cancel') {
      printerState.printing = false
      printerState.paused = false
      printerState.progress = 0
      printerState.currentFile = null
      printerState.printTimeRemaining = 0
      console.log('Print cancelled')
    }

    res.writeHead(204)
    res.end()
  } else if (path === '/api/files' && method === 'GET') {
    // File list
    sendJson(res, {
      files: [
        {
          name: 'USB',
          type: 'folder',
          children: printerState.files.map((f) => ({
            name: f.name,
            display: f.display,
            size: f.size,
            type: 'machinecode',
            refs: {
              resource: `/api/files/local/${f.name}`,
              download: `/downloads/${f.name}`,
            },
          })),
        },
      ],
    })
  } else if (path.startsWith('/api/files/local/') && method === 'POST') {
    // Select and print file
    const fileName = path.replace('/api/files/local/', '')
    const body = await parseBody(req)
    const data = JSON.parse(body || '{}')

    if (data.command === 'select' && data.print) {
      printerState.printing = true
      printerState.paused = false
      printerState.progress = 0
      printerState.currentFile = fileName
      printerState.printTimeRemaining = 1800 // 30 minutes
      console.log(`Started printing: ${fileName}`)
    }

    res.writeHead(204)
    res.end()
  } else if (path.startsWith('/api/v1/files/usb/') && method === 'PUT') {
    // File upload
    const fileName = path.replace('/api/v1/files/usb/', '')
    const printAfter = req.headers['print-after-upload'] === 'true'

    // Simulate upload (we don't actually store the file)
    printerState.files.push({
      name: fileName,
      display: fileName,
      size: Math.floor(Math.random() * 1000000) + 100000,
    })

    console.log(`File uploaded: ${fileName}`)

    if (printAfter) {
      printerState.printing = true
      printerState.paused = false
      printerState.progress = 0
      printerState.currentFile = fileName
      printerState.printTimeRemaining = 1800
      console.log(`Started printing after upload: ${fileName}`)
    }

    sendJson(res, { done: true })
  } else {
    sendJson(res, { error: 'Not found' }, 404)
  }
})

server.listen(PORT, () => {
  console.log(`
==========================================
  Mock Prusa Printer Server
==========================================
  Running on: http://localhost:${PORT}
  API Key: ${API_KEY}
==========================================

Endpoints:
  GET  /api/version  - Connection test
  GET  /api/printer  - Printer telemetry
  GET  /api/job      - Current job status
  POST /api/job      - Control print (pause/resume/cancel)
  GET  /api/files    - List files
  POST /api/files/local/:name - Select and print
  PUT  /api/v1/files/usb/:name - Upload file

`)
})
