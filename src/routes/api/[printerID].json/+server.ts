import fetcher  from "$lib/fetcher";
import { json } from "@sveltejs/kit";

export const GET = async ({ params: { printerID }, url, setHeaders, fetch}) => {
    try {
        const res = await fetcher(printerID, setHeaders, url, fetch);

        return res.json();
    } catch (error) {
        console.log(error);
    }
};