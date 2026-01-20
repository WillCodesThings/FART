import { d as defineEventHandler, b as getRouterParam, c as createError, r as readBody, g as getCookie, e as setResponseHeader } from '../../../nitro/nitro.mjs';
import { g as getPrinterById } from '../../../_/printerStore.mjs';
import { P as PrinterClient } from '../../../_/printerClient.mjs';
import { g as getSession, o as createPrintLog, c as getActivePrintLogs, u as updatePrintLog } from '../../../_/dataStore.mjs';
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

const index_post = defineEventHandler(async (event) => {
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
  const body = await readBody(event);
  const client = new PrinterClient(printer);
  const sessionId = getCookie(event, "fart-session");
  const session = sessionId ? getSession(sessionId) : null;
  try {
    const command = body.command.toLowerCase();
    if (command === "img") {
      const image = await client.getImage();
      setResponseHeader(event, "Content-Type", "image/png");
      return image;
    }
    if (command === "run") {
      if (!body.filename) {
        throw createError({
          statusCode: 400,
          statusMessage: "Filename required for run command"
        });
      }
      await client.selectPrint(body.filename);
      if (session) {
        createPrintLog(
          session.pin,
          session.userName,
          id,
          printer.name,
          body.filename
        );
      }
      return { success: true, message: "Print started" };
    }
    if (["pause", "resume", "cancel"].includes(command)) {
      await client.controlPrint(command);
      if (command === "cancel" && session) {
        const activePrints = getActivePrintLogs();
        const currentPrint = activePrints.find((p) => p.printerId === id && p.userPin === session.pin);
        if (currentPrint) {
          updatePrintLog(currentPrint.id, {
            status: "cancelled",
            completedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      return { success: true, message: `Print ${command} executed` };
    }
    throw createError({
      statusCode: 400,
      statusMessage: `Unknown command: ${command}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Command failed: ${message}`,
      data: { printerId: id, command: body.command, error: message }
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
