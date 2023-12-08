import { get } from "svelte/store";


class Printer {

    // 1. Instance Variables
    private cardHovered: boolean;
    private printerID: number;
    private name: string;
    private image: string;
    private apiKey: string;
    private ipAddr: string;
    private fetch;
    private selectedFile: string;
    private printerInfo: any;
    private printThumbnail: string;

    // 2. Constructor
    constructor(printerID: number, ipAddr: string, apiKey: string, printerName: string, image: string, fetch) {
        this.printerID = printerID;
        this.name = printerName;
        this.apiKey = apiKey;
        this.ipAddr = ipAddr;
        this.image = image;
        this.cardHovered = false;
        this.fetch = fetch;
        this.printerInfo = this.getPrinterStatus();
        this.selectedFile = "";
        this.printThumbnail = this.image;
    }

    // 3. Getter/Setter Methods
    public getPrinterID(): number {
        return this.printerID;
    }

    public getName(): string {
        return this.name;
    }

    public getImage(): string {
        return this.image;
    }

    public getApiKey(): string {
        return this.apiKey;
    }

    public getIpAddr(): string {
        return this.ipAddr;
    }

    public getCardHovered(): boolean {
        return this.cardHovered;
    }

    public toggleCardHovered(): void {
        this.cardHovered = !this.cardHovered;
    }

    // 4. Actual Methods
    public async getPrinterStatus() {
        const res = await this.fetch(`http://${this.ipAddr}/api/printer`, {
            headers: {
                'X-Api-Key': this.apiKey
            }
        });

        // check if the printer is not dead
        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        // converting from nerd to human
        const data = await res.json();

        return data;
    }

    public async addFile(file: FormData) {

        const res = await this.fetch(`http://${this.ipAddr}/api/files/local`, {
            method: 'POST',
            body: JSON.stringify({ file: file, path: "/usb", select: true }),
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        return data;
    }

    public async printFile(fileName: string) {
        const res = await this.fetch(`http://${this.ipAddr}/api/files/local/${fileName}`, {
            method: 'POST',
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                command: 'select',
                print: true
            })
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        return data;
    }

    public async deleteFile(fileName: string) {
        const res = await this.fetch(`http://${this.ipAddr}/api/files/local/${fileName}`, {
            method: 'DELETE',
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json',
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        return data;
    }

    public async getFiles() {
        const res = await this.fetch(`http://${this.ipAddr}/api/files/local`, {
            headers: {
                'X-Api-Key': this.apiKey
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        return data;
    }

    public async returnImageOfPrint(): Promise<string> {
        if (this.selectedFile === undefined || this.printerInfo.state.flags.link_state !== "IDLE") {
            return this.image;
        }

        const res = await this.fetch(`http://${this.ipAddr}/api/files/local/${this.selectedFile}`, {
            headers: {
                'X-Api-Key': this.apiKey
            }
        });

        res.json().then((data) => {
            this.printThumbnail = data.refs.thumbnailBig;
        });

        return this.printThumbnail;
    }

    public equals(otherPrinter: Printer): boolean {
        return (this.printerID === otherPrinter.getPrinterID()) && (this.apiKey === otherPrinter.getApiKey());
    }

    public toString(): string {
        return `Printer: ${this.name} with ID ${this.printerID} at ${this.ipAddr}`;
    }
}