import { json } from "@sveltejs/kit";
import { printers } from "../.././printers";


// Defines the get method for the server
export const GET = async ({ params: { printerID }, fetch }) => {
    try {
        let printer = getPrinter(printerID);

        // debug code dont need
        // console.log(printer);

        // checks to make sure im not stupid
        if (!printer) {
            throw new Error(`Printer with ID ${printerID} not found`);
        }

        // actual printer ip, can't ddos me tho haha
        const res = await fetch('http://192.168.50.235/api/job', {
            headers: {
                'X-Api-Key': printer.apiKey
            }
        });

        // check if the printer is not dead
        if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }

        // converting from nerd to human
        // remember this not explaining again
        const data = await res.json();

        // dont forget to be able to actually use it
        return json({ data, printer });
    } catch (error) {
        console.error(error);
        return json({ error: error.message });
    }
};


// Defines the post method for the server
// yes there are more than one method for https
// crazy

/** @type {import('./$types').RequestHandler} */
export async function POST({ params: { printerID }, request, fetch }) {
    try {
        const formData = await request.formData();

        // making sure I get file
        // still debug tho
        // console.log(formData)

        let fileName: String;
        let lengthOfFile: Number;

        // can get everything else with filename so
        // I neglect the rest
        for (const [name, file1] of formData.entries()) {
            fileName = name;
            break;
        }

        // proof of my other comment
        const file = formData.get(fileName);

        // no idea what to do with this
        lengthOfFile = file.size;

        // debug
        // console.log(lengthOfFile);

        // not debug
        const res = await addPrint(getPrinter(printerID), formData, fileName, lengthOfFile, fetch);

        // debug
        // console.log("awehfiga");
        // console.log(res);

        return json("got it"); // amazing response
    } catch (error) {
        const a = await request.json();
        const method = a.query.method;
        const Cprinter = a.query.printer;
        const commnad = a.query.command;

        // debug but dumb
        // console.log("");
        // console.log("");
        // console.log("");
        // console.log(commnad);
        // console.log("");
        // console.log("");
        // console.log("");

        controlPrint(Cprinter, commnad.toLowerCase(), "2324", fetch); // very secure authorization code ik

        return json("got it"); // amazing response
    }
}

// gets printer based on printerID
// uses the store in printers.ts
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
    API for prusa mk4

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

// gives me nightmares
// time spent debugging: 2 hours
// time spent writing: 1 hour

// uses the fetch api to send the file to the printer
async function addPrint(printer, formData: FormData, fileName: string, lengthOfFile: number, fetch) {
    try {
        const res = await fetch(printer.ipAddr + `/api/files/sdcard`, {
            method: 'POST',
            body: formData,
            headers: { 'X-Api-Key': printer.apiKey, 'Print-After-Upload': true, 'Content-Type': 'multipart/form-data' },
        });

        // Check if the response status is ok
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const responseBody = await res.json();

        // Log or process the responseBody as needed
        console.log('Response Body:', responseBody);

        return responseBody;
    } catch (error) {
        // if I get any of these errors I am horrible at coding
        console.error('Error processing the response:', error);
        throw error;
    }
}

// no idea what this does
// dont really need it but I think i can use it
async function selectNstartPrint(fileName: string, printer, fetch) {

    const res = await fetch(printer.ipAddr + `/api/files/`, { method: 'POST', headers: { 'X-Api-Key': printer.apiKey } })
    let files = res.json();

}

// this allows me to pause and resume the printer

/*
    API for prusa mk4

        post:
      summary: Issue a job command.
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                command:
                  type: string
                  enum: ["start", "restart", "pause", "cancel"]
                  default: start
                action:
                  type: string
                  enum: [pause, resume]
                  default: resume
      responses:
        204:
          description: No Content
                       No Error
        403:
          $ref: "#/components/responses/Unauthorized"
        409:
          $ref: "#/components/responses/Conflict"
          description: If not is project, file not found or printer is printing.
        501:
          $ref: "#/components/responses/NotImplemented"
          description: Unsupported command.
*/

// no errors so far
async function controlPrint(printer, Caction, authorizationCode, fetch) {
    const endpoint = `${printer.ipAddr}/api/job`;
    const apiKeyHeader = { 'X-Api-Key': printer.apiKey };
    let requestBody = {};

    // horrid if statement but it works
    // so no changes
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



    // crazy I need a try block
    // should just work probably
    try {
        // Send the request
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...apiKeyHeader,
            },
            body: JSON.stringify(requestBody),
        });

        // responses
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
        // Network or other request error
        // its the printers fault
        // i swear
        console.error('Error executing command:', error.message);
    }
}

