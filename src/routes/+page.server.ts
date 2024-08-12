import { json } from "@sveltejs/kit";
import { printers } from "$lib";

/** @type {import('./$types').PageServerLoad} */
export async function load() {
  try {
    // Defines data in the +page.svelte file to pass to the page
    const minimalPrinters = printers.map(
      ({ name, image, desc, model, status, select, id }) => ({
        name,
        image,
        desc,
        model,
        status,
        select,
        id,
      })
    );

    return {
      printers: minimalPrinters,
    };
  } catch (error) {
    console.log(error);
  }
}

export async function post({ body }) {
  try {
    console.log(body);
    return {
      body,
    };
  } catch (error) {
    console.log(error);
  }
}
