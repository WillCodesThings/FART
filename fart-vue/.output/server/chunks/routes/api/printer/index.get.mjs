import { d as defineEventHandler, b as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { g as getPrinterById } from '../../../_/printerStore.mjs';
import { P as PrinterClient } from '../../../_/printerClient.mjs';
import { c as getActivePrintLogs, u as updatePrintLog } from '../../../_/dataStore.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'fs';
import 'path';

const index_get = defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, "id"));
  if (isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid printer ID"
    });
  }
  const printer = getPrinterById(id);
  if (!printer) {
    throw createError({
      statusCode: 404,
      statusMessage: "Printer not found"
    });
  }
  const client = new PrinterClient(printer);
  try {
    const [data, printerTelemetry, files] = await Promise.all([
      client.getJobStatus(),
      client.getPrinterData(),
      client.getFiles()
    ]);
    const activePrints = getActivePrintLogs();
    const currentPrint = activePrints.find((p) => p.printerId === id);
    if (currentPrint && data) {
      const progress = data.progress || 0;
      const isPrinting = data.state === "Printing";
      const isFinished = data.state === "Finished" || progress >= 100;
      if (isFinished) {
        updatePrintLog(currentPrint.id, {
          status: "completed",
          progress: 100,
          completedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else if (isPrinting) {
        updatePrintLog(currentPrint.id, { progress });
      }
    }
    return {
      data,
      files,
      printerTelemetry
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch printer data: ${message}`,
      data: { printerId: id, error: message }
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
