import fetcher from "$lib/fetcher";
import { json } from "@sveltejs/kit";
import { printers } from "../.././printers";

export const GET = async ({ params: { printerID }, setHeaders, fetch }) => {

    let printersS = [];

    printers.update((printers) => {
        printersS.push(printers);
    });

    let printer: any = {};

    printersS = printersS[0];
    printersS.forEach((p) => {
        if (p.printerID == printerID) {
            printer = p;
        }
    });

    try {
        const res = await fetcher(printerID, setHeaders, printer.ipAddr, fetch);

        return res.json();
    } catch (error) {
        console.log(error);
    }
};