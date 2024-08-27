import { json } from "@sveltejs/kit";
import { Printer } from "$lib/printerClass"; // Adjust the path as necessary

// Defines the get method for the server
export const GET = async ({ params: { printerID }, fetch }) => {
  try {
    // Instantiate the Printer class
    const printerInstance = new Printer(Number(printerID));

    // Fetch job status
    const data = await printerInstance.getJobStatus(fetch);

    console.log(data);

    // Fetch printer data
    const printerTelemetry = await printerInstance.getPrinterData(fetch);

    // Fetch available files
    const files = await printerInstance.getFiles(fetch);

    console.log(files);

    // Return the gathered data as a JSON response
    return json({
      data,
      files,
      prinerTelem: printerTelemetry,
    });
  } catch (error) {
    console.error(error);
    return json({ error: error.message });
  }
};

// Defines the post method for the server
export async function POST({ params: { printerID }, request, fetch }) {
  try {
    const formData = await request.formData();

    // Instantiate the Printer class
    const printerInstance = new Printer(Number(printerID));

    const a = await request.json();

    if (a.query.command.toLowerCase() === "img") {
      const image = await printerInstance.getImg(fetch);
      const response = new Response(image, {
        status: 200,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response;
    }

    const method = a.query.method;
    const commnad = a.query.command;

    if (commnad.toLowerCase() === "run") {
      const filename = a.query.filename;
      await printerInstance.selectPrint(filename, fetch);
      return json("got it");
    }

    await printerInstance.controlPrint(commnad.toLowerCase(), fetch);

    return json("got it");
  } catch (error) {
    console.error(error);
    return json({ error: error.message });
  }
}
