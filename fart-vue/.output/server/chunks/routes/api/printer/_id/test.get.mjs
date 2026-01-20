import { d as defineEventHandler, b as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { g as getPrinterById } from '../../../../_/printerStore.mjs';
import { P as PrinterClient } from '../../../../_/printerClient.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const test_get = defineEventHandler(async (event) => {
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
  const startTime = Date.now();
  try {
    const isReachable = await client.ping();
    const responseTime = Date.now() - startTime;
    if (isReachable) {
      return {
        success: true,
        message: "Printer is online and responding",
        printerName: printer.name,
        ipAddr: printer.ipAddr,
        responseTime
      };
    } else {
      return {
        success: false,
        message: "Printer is not responding",
        printerName: printer.name,
        ipAddr: printer.ipAddr,
        responseTime
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      message: `Connection failed: ${errorMessage}`,
      printerName: printer.name,
      ipAddr: printer.ipAddr,
      responseTime
    };
  }
});

export { test_get as default };
//# sourceMappingURL=test.get.mjs.map
