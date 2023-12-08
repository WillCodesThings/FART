import { json } from "@sveltejs/kit";
/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {

  try {

    // Defines data in the +page.svelte file to pass to the page
    // Don't really need this file anymore so its just vanity
    // or a POC, whichever you prefer
  } catch (error) {
    console.log(error);
  }
}