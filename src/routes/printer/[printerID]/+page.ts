/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params: { printerID } }) {

  try {
    const res = await fetch(`/api/${printerID}`);
    return {
      res, printerID
    };
  } catch (error) {
    console.log(error);
  }
}