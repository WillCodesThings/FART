import { json } from "@sveltejs/kit";
import { printers } from "$lib";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  try {
    // Defines data in the +page.svelte file to pass to the page
    // Don't really need this file anymore so its just vanity
    // or a POC, whichever you prefer

    // let res = await fetch(`/api/${printerID}`, {
    //   method: "GET",
    //   headers: {
    //     "Content-Type": "application/json"
    //   }

    // });

    // console.log(printers)

    // res = res.json();

    return {
      printers,
    };
  } catch (error) {
    console.log(error);
  }
}

export async function post({ body }) {
    try {
        console.log(body);
        return {
        body
        }
    } catch (error) {
        console.log(error);
    }
}