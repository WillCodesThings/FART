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
                if (p.printerID === parseInt(printerID)){
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
