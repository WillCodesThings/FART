import { json } from "@sveltejs/kit";
import { printers } from "../.././printers";

export const GET = async ({ params: { printerID }, fetch }) => {
    try {
        let printersS;

        // Subscribe to the printers store
        const unsubscribe = printers.subscribe(value => {
            printersS = value;
        });

        let printer = {};

        try {
            printersS.forEach((p) => {
                if (p.printerID === parseInt(printerID)) {
                    printer = p;
                }
            });
        } catch (error) {
            console.log("cry about it");
        }

        console.log(printer);

        if (!printer) {
            throw new Error(`Printer with ID ${printerID} not found`);
        }

        const res = await fetch('http://192.168.50.235/api/job', {
            headers: {
                'X-Api-Key': printer.apiKey
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Unsubscribe from the store to avoid memory leaks
        unsubscribe();

        return json({ data, printer });
    } catch (error) {
        console.error(error);
        return json({ error: error.message });
    }
};


/** @type {import('./$types').RequestHandler} */
export async function POST({ params: { printerID }, request, fetch }) {
    try {
        const formData = await request.formData();
        console.log(formData)
        let fileName: String;
        let lengthOfFile: Number;
        // Now formDataObject contains all the fields from the form data

        for (const [name, file1] of formData.entries()) {
            // Process each file as needed
            fileName = name;
            break;
        }

        const file = formData.get(fileName);

        lengthOfFile = file.size;

        console.log(lengthOfFile);

        const res = await addPrint(getPrinter(printerID), formData, fileName, lengthOfFile, fetch);

        console.log("awehfiga");
        console.log(res);

        return json("got it");
    } catch (error) {
        const a = await request.json();
        const method = a.query.method;
        const Cprinter = a.query.printer;
        const commnad = a.query.command;
        console.log("");
        console.log("");
        console.log("");
        console.log(commnad);
        console.log("");
        console.log("");
        console.log("");

        controlPrint(Cprinter, commnad.toLowerCase(), "2324", fetch);

        return json("got it");
    }
}


function getPrinter(printerID) {

    let printersS;
    const unsubscribe = printers.subscribe(value => {
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


/*

    put:
      summary: upload file or create folder
      parameters:
        - in: header
          name: Content-Length
          description: Length of file to upload
          schema:
            type: integer
            example: 101342
        - in: header
          name: Content-Type
          description: Type of uploaded media
          schema:
            type: string
            default: application/octet-stream
        - in: header
          name: Print-After-Upload
          description: Whether to start printing the file after upload
          schema:
            type: boolean
            default: False
        - in: header
          name: Overwrite
          description: Whether to overwrite already existing files
          schema:
            type: string
            description: ?0=False, ?1=True, according RFC8941/3.3.6
            enum: ["?0", "?1"]
            default: "?0"

*/
async function addPrint(printer, formData: FormData, fileName: string, lengthOfFile: number, fetch) {
    try {
        const res = await fetch(printer.ipAddr + `/api/files/sdcard`, {
            method: 'POST',
            body: formData,
            headers: {'X-Api-Key': printer.apiKey, 'Print-After-Upload': true, 'Content-Type': 'multipart/form-data'},
        });

        // Check if the response status is ok before reading the JSON
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        // Read the response JSON
        const responseBody = await res.json();

        // Log or process the responseBody as needed
        console.log('Response Body:', responseBody);

        return responseBody;
    } catch (error) {
        // Handle any errors that occur during the fetch or JSON parsing
        console.error('Error processing the response:', error);
        throw error; // Rethrow the error for the calling code to handle if needed
    }
}


async function selectNstartPrint(fileName: string, printer, fetch) {

    const res = await fetch(printer.ipAddr + `/api/files/`, { method: 'POST', headers: { 'X-Api-Key': printer.apiKey } })
    let files = res.json();

}
async function controlPrint(printer, Caction, authorizationCode, fetch) {
    const endpoint = `${printer.ipAddr}/api/job`;
    const apiKeyHeader = { 'X-Api-Key': printer.apiKey };
    let requestBody = {};
    if (Caction === 'resume') {

        console.log("resume");
        requestBody = {
            command: 'pause',
            action: 'resume',
        };
    

    } else {
        requestBody = {
            command: 'pause',
            action: 'pause',
        };
    
    }



    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...apiKeyHeader,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.status === 204) {
            // Successful request, no content
            console.log('Command executed successfully.');
        } else if (response.status === 403) {
            console.error('Unauthorized request.');
        } else if (response.status === 409) {
            console.error('Conflict: File not found, wrong format, or printer is printing.');
        } else if (response.status === 501) {
            console.error('Not Implemented: Unsupported command.');
        } else {
            console.error(`Unexpected response: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error executing command:', error.message);
    }
}

