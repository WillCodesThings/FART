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
export async function POST({ request }) {
    const a = await request.json();
    const method = a.query.method;
    const printerID = a.printerID;
    const url = a.url;
    const body = a.query.body;
    return json("got it");
}

function getPrinter(printerID) {
    let printer = {};
    printers.forEach((p) => {
        if (p.printerID === parseInt(printerID)) {
            printer = p;
        }
    });
    return printer;
}

function addPrint(printer, file: File) {
    const apiKey = printer.apiKey;
    const formData = new FormData();
    formData.append('file', file);
    const res = fetch(printer.ipAddr + `/api/files/${file.name}`, { method: 'POST', body: formData, headers: { 'X-Api-Key': apiKey } });
}

async function selectNstartPrint(fileName: string, printer) {

    const res = await fetch(printer.ipAddr + `/api/files/`, { method: 'POST', headers: { 'X-Api-Key': printer.apiKey } })
    let files = res.json();

}