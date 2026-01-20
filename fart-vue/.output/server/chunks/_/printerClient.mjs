var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
const DEFAULT_TIMEOUT = 1e4;
async function fetchWithTimeout(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
async function fetchWithRetry(url, options = {}, { timeout = DEFAULT_TIMEOUT, retries = 2, retryDelay = 1e3 } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
class PrinterClient {
  constructor(printer) {
    __publicField(this, "printer");
    this.printer = printer;
  }
  get baseUrl() {
    return `http://${this.printer.ipAddr}`;
  }
  get headers() {
    return {
      "X-Api-Key": this.printer.apiKey,
      "Content-Type": "application/json"
    };
  }
  // Fetch job status from the printer
  async getJobStatus() {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/job`,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch job status: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  // Fetch printer telemetry data
  async getPrinterData() {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/printer`,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch printer data: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }
  // Fetch available files on the printer
  async getFiles() {
    var _a;
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/files`,
      { headers: this.headers },
      { timeout: DEFAULT_TIMEOUT }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      return [];
    }
    const files = ((_a = data.files[0]) == null ? void 0 : _a.children) || [];
    for (const file of files) {
      const printTime = this.extractPrintTimeFromFilename(file.display || file.name);
      if (file.refs) {
        file.refs.printTime = printTime;
      }
    }
    return files;
  }
  // Extract print time from filename (e.g., "model_4h53m.gcode" -> "4h53m")
  extractPrintTimeFromFilename(filename) {
    var _a;
    const parts = filename.split("_");
    if (parts.length > 1) {
      const timeParts = parts.filter((part) => part.includes("m"));
      const lastPart = timeParts[timeParts.length - 1];
      if (lastPart) {
        return (_a = lastPart.split(".")[0]) != null ? _a : "Unknown";
      }
    }
    return "Unknown";
  }
  // Upload and start a print job
  async addPrint(formData, fileName, increment = 0) {
    const adjustedName = increment === 0 ? fileName : `${increment}${fileName}`;
    const response = await fetchWithTimeout(
      `${this.baseUrl}/api/v1/files/usb/${adjustedName}`,
      {
        method: "PUT",
        body: formData,
        headers: {
          "X-Api-Key": this.printer.apiKey,
          "Print-After-Upload": "true",
          "Content-Type": "text/x.gcode"
        }
      },
      6e4
      // 60 second timeout for uploads
    );
    if (!response.ok) {
      if (response.status === 409 && increment < 10) {
        return this.addPrint(formData, fileName, increment + 1);
      }
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  }
  // Control the printer (pause, resume, cancel)
  async controlPrint(action) {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/job`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ command: action, action })
      },
      { timeout: DEFAULT_TIMEOUT }
    );
    if (response.status !== 204 && !response.ok) {
      throw new Error(`Control command failed: ${response.status} ${response.statusText}`);
    }
  }
  // Select and start a print job
  async selectPrint(fileName) {
    const response = await fetchWithRetry(
      `${this.baseUrl}/api/files/local/${fileName}`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ command: "select", print: true })
      },
      { timeout: DEFAULT_TIMEOUT }
    );
    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to select print: ${response.status} ${response.statusText}`);
    }
  }
  // Get live image from the printer
  async getImage() {
    const response = await fetchWithTimeout(
      `${this.baseUrl}/`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": this.printer.apiKey,
          "Accept": "image/*",
          "Cache-Control": "no-cache"
        }
      },
      15e3
      // 15 second timeout for images
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    return this.processChunkedResponse(response);
  }
  // Process chunked response for image fetching
  async processChunkedResponse(response) {
    var _a;
    const reader = (_a = response.body) == null ? void 0 : _a.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return new Blob(chunks, { type: "image/png" });
  }
  // Check if printer is reachable
  async ping() {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/api/version`,
        { headers: this.headers },
        5e3
        // 5 second timeout for ping
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}

export { PrinterClient as P };
//# sourceMappingURL=printerClient.mjs.map
