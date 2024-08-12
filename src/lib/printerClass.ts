import { printers } from "./printers"; // Adjust the path as necessary

export class Printer {
  private printer: any; // Using 'any' type for a JSON object

  constructor(private printerID: number) {
    this.printer = this.getPrinter(printerID);
    if (!this.printer) {
      throw new Error(`Printer with ID ${printerID} not found`);
    }
  }

  // Get printer details from the printer data
  private getPrinter(printerID: number): any {
    return printers.find((p) => p.id === printerID);
  }

  // Fetch job status from the printer
  async getJobStatus(fetch: typeof globalThis.fetch): Promise<any> {
    const response = await fetch(`http://${this.printer.ipAddr}/api/job`, {
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  // Fetch printer data
  async getPrinterData(fetch: typeof globalThis.fetch): Promise<any> {
    const response = await fetch(`http://${this.printer.ipAddr}/api/printer`, {
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    return response.json();
  }

  // Fetch available files on the printer
  async getFiles(fetch: typeof globalThis.fetch): Promise<any> {
    const response = await fetch(`http://${this.printer.ipAddr}/api/files`, {
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    const data = await response.json();
    return data.files[0].children.length === 0
      ? ["No files found"]
      : data.files[0].children;
  }

  // Upload and start a print job
  async addPrint(
    formData: FormData,
    fileName: string,
    fetch: typeof globalThis.fetch,
    lastIncrement: number = 0
  ): Promise<void> {
    try {
      const response = await fetch(
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

      if (!response.ok) {
        if (response.status === 409) {
          await this.addPrint(formData, fileName, fetch, lastIncrement + 1);
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("Error processing the response:", error);
      throw error;
    }
  }

  // Control the printer (pause, resume, etc.)
  async controlPrint(
    action: string,
    fetch: typeof globalThis.fetch
  ): Promise<void> {
    const endpoint = `http://${this.printer.ipAddr}/api/job`;
    const requestBody = { command: action, action };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": this.printer.apiKey,
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
  async selectPrint(
    fileName: string,
    fetch: typeof globalThis.fetch
  ): Promise<number> {
    const response = await fetch(
      `http://${this.printer.ipAddr}/api/files/local/${fileName}`,
      {
        method: "POST",
        body: JSON.stringify({ command: "select" }),
        headers: { "X-Api-Key": this.printer.apiKey },
      }
    );
    return response.status;
  }

  // Get image from the printer
  async getImg(fetch: typeof globalThis.fetch): Promise<Blob> {
    const jobResponse = await fetch(`http://${this.printer.ipAddr}/api/job`, {
      method: "GET",
      headers: { "X-Api-Key": this.printer.apiKey },
    });
    if (!jobResponse.ok) {
      throw new Error(
        `Failed to fetch image: ${jobResponse.status} ${jobResponse.statusText}`
      );
    }

    const imgResponse = await fetch(`http://${this.printer.ipAddr}/`, {
      method: "GET",
      headers: {
        "X-Api-Key": this.printer.apiKey,
        Accept: "image/*",
        "If-None-Match": '"71171903"',
        "Cache-Control": "no-cache",
      },
    });
    return this.processChunkedResponse(imgResponse);
  }

  // Process the response in chunks for image fetching
  private async processChunkedResponse(response: Response): Promise<Blob> {
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader?.read()!;
      if (done) break;
      chunks.push(value);
    }
    return new Blob(chunks, { type: "image/png" });
  }
}
