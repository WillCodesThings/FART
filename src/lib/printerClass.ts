/**
 *
 *
 * @class Printer
 */
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

    /**
     * Creates an instance of Printer.
     * @param {number} printerID
     * @param {string} ipAddr
     * @param {string} apiKey
     * @param {string} printerName
     * @param {string} image
     * @param {*} fetch the fetch API
     * @memberof Printer
     */
    constructor(printerID: number, ipAddr: string, apiKey: string, printerName: string, image: string, fetch: any) {
        this.printerID = printerID;
        this.name = printerName;
        this.apiKey = apiKey;
        this.ipAddr = ipAddr;
        this.image = image;
        this.cardHovered = false;
        this.fetch = fetch;
        this.printerInfo = this.getPrinterStatus();
        this.selectedFile = "";
        this.printThumbnail = "";
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

    public async getPrintThumbnail(): Promise<string> {
        return this.printThumbnail;
    }


    public toggleCardHovered(): void {
        this.cardHovered = !this.cardHovered;
    }

    // 4. Actual Methods


    /**
     *
     *
     * @return {*} 
     * @memberof Printer
     */
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

        this.printerInfo = data;

        return data;
    }



    /**
     *
     *
     * @param {FormData} file
     * @return {string} 
     * @memberof Printer
     */
    public async addFile(file: FormData) {

        let fileName: string = "";

        for (const [name, file1] of file.entries()) {
            fileName = name;
            break;
        }

        try {
            console.log(`http://${this.ipAddr}/api/files/usb//${fileName}`);
            const res = await fetch(`http://${this.ipAddr}/api/v1/files/usb//${fileName}`, {
                method: 'PUT',
                body: file,
                headers: { 'X-Api-Key': this.apiKey, 'Print-After-Upload': 'true', 'Content-Type': 'text/x.gcode' },
            });

            // Check if the response status is ok
            console.log(res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            if (res.status === 409) {
                console.error('Conflict: File already exists.');
            } else if (res.status === 413) {
                console.error('Payload Too Large: File is too large.');
            } else if (res.status === 507) {
                console.error('Internal Server Error: No storage');
            } else if (res.status === 201) {
                console.log('File uploaded successfully.');
            }

            return res.status === 201 ? fileName : "There was an error uploading the file: " + res.status;

        } catch (error) {
            // if I get any of these errors I am horrible at coding
            console.error('Error processing the response:', error);
            throw error;
            return "There was an error uploading the file";
        }
    }


    /**
     *
     *
     * @param {string} fileName
     * @return {string} 
     * @memberof Printer
     */
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

        const data = await res.status === 201 || res.status === 204;

        this.selectedFile = data ? fileName : "There was an error selecting the file";

        return this.selectedFile;
    }


    /**
     *
     *
     * @param {string} fileName
     * @return {string} 
     * @memberof Printer
     */
    public async deleteFile(fileName: string) {
        const res = await this.fetch(`http://${this.ipAddr}/api/v1/files/usb//${fileName}`, {
            method: 'DELETE',
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json',
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.status === 200 || res.status === 204;

        return data ? "File deleted successfully" : "There was an error deleting the file";
    }


    /**
     *
     *
     * @return {*} 
     * @memberof Printer
     */
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

    /**
     *
     *
     * @return {*}  {Promise<string>}
     * @memberof Printer
     */
    public async returnImageOfPrint(): Promise<string> {
        if (this.selectedFile === undefined || this.printerInfo.state.flags.link_state !== "IDLE") {
            return this.image;
        }

        const res = await this.fetch(`http://${this.ipAddr}/api/files/local/${this.selectedFile}.`, {
            headers: {
                'X-Api-Key': this.apiKey
            }
        });

        res.json().then((data: any) => {
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