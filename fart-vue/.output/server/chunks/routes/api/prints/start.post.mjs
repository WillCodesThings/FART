import { d as defineEventHandler, g as getCookie, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { g as getSession, o as createPrintLog } from '../../../_/dataStore.mjs';
import { g as getPrinterById } from '../../../_/printerStore.mjs';
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

const start_post = defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "fart-session");
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }
  const session = getSession(sessionId);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Invalid session" });
  }
  const body = await readBody(event);
  const { printerId, fileName } = body;
  if (!printerId || !fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: "printerId and fileName are required"
    });
  }
  const printer = getPrinterById(printerId);
  if (!printer) {
    throw createError({ statusCode: 404, statusMessage: "Printer not found" });
  }
  const printLog = createPrintLog(
    session.pin,
    session.userName,
    printerId,
    printer.name,
    fileName
  );
  return {
    success: true,
    printLog
  };
});

export { start_post as default };
//# sourceMappingURL=start.post.mjs.map
