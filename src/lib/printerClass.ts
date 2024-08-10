// Printer class constructor
class Printer {
  constructor(printerID) {
    this.printerID = printerID;
    this.printer = this.getPrinter(printerID);
    if (!this.printer) {
      throw new Error(`Printer with ID ${printerID} not found`);
    }
  }

  // Get printer details from printers.js
  getPrinter(printerID) {
    let printersS;
    const unsubscribe = printers.subscribe((value) => {
      printersS = value;
    });
    let printer = {};
    printersS.forEach((p) => {
      if (p.printerID === parseInt(printerID)) {
        printer = p;
      }
    });
    return printer;
  }

  // Fetch job status from the printer
  async getJobStatus(fetch) {
    const res = await fetch(`http://${this.printer.ipAddr}/api/job`, {
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  }

  // Fetch printer data
  async getPrinterData(fetch) {
    const res = await fetch(`http://${this.printer.ipAddr}/api/printer`, {
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    return await res.json();
  }

  // Fetch available files on the printer
  async getFiles(fetch) {
    let res = await fetch(`http://${this.printer.ipAddr}/api/files`, {
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    res = await res.json();
    return res.files[0].children.length === 0
      ? ["No files found"]
      : res.files[0].children;
  }

  // Upload and start a print job
  async addPrint(formData, fileName, fetch, lastIncrement = 0) {
    try {
      const res = await fetch(
        `http://${this.printer.ipAddr}/api/v1/files/usb//${
          lastIncrement === 0 ? "" : lastIncrement
        }${fileName}`,
        {
          method: "PUT",
          body: formData,
          headers: {
            "X-Api-Key": this.printer.apiKey,
            "Print-After-Upload": true,
            "Content-Type": "text/x.gcode",
          },
        }
      );

      if (!res.ok) {
        if (res.status === 409) {
          await this.addPrint(formData, fileName, fetch, lastIncrement + 1);
        } else {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
      }
    } catch (error) {
      console.error("Error processing the response:", error);
      throw error;
    }
  }

  // Control the printer (pause, resume, etc.)
  async controlPrint(Caction, fetch) {
    const endpoint = `http://${this.printer.ipAddr}/api/job`;
    const apiKeyHeader = { "X-Api-Key": this.printer.apiKey };
    const requestBody = { command: Caction, action: Caction };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiKeyHeader,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.status !== 204) {
        throw new Error(
          `Unexpected response: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error executing command:", error.message);
    }
  }

  // Select and start a print job
  async selectPrint(fileName, fetch) {
    const res = await fetch(
      `${this.printer.ipAddr}/api/files/local/${fileName}`,
      {
        method: "POST",
        body: JSON.stringify({ command: "select" }),
        headers: { "X-Api-Key": this.printer.apiKey },
      }
    );
    return res.status;
  }

  // Get image from the printer
  async getImg(fetch) {
    const res = await fetch(`http://${this.printer.ipAddr}/api/job`, {
      method: "GET",
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
    }
    const imgBlob = await fetch(`http://${this.printer.ipAddr}/`, {
      method: "GET",
      headers: {
        "X-Api-Key": this.printer.apiKey,
        Accept: "image/*",
        "If-None-Match": '"71171903"',
        "Cache-Control": "no-cache",
      },
    });
    return await this.processChunkedResponse(imgBlob);
  }

  // Process the response in chunks for image fetching
  async processChunkedResponse(response) {
    const reader = response.body.getReader();
    let chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return new Blob(chunks, { type: "image/png" });
  }
}
