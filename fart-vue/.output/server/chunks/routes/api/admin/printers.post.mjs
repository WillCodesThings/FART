import { d as defineEventHandler, g as getCookie, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { g as getSession } from '../../../_/dataStore.mjs';
import { a as addPrinter, g as getPrinterById, u as updatePrinter, d as deletePrinter } from '../../../_/printerStore.mjs';
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

const printers_post = defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "fart-session");
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }
  const session = getSession(sessionId);
  if (!session || !session.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Admin access required" });
  }
  const body = await readBody(event);
  const { action, id, printer } = body;
  if (action === "add") {
    if (!(printer == null ? void 0 : printer.name) || !(printer == null ? void 0 : printer.ipAddr) || !(printer == null ? void 0 : printer.apiKey)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name, IP address, and API key are required"
      });
    }
    const newPrinter = addPrinter({
      name: printer.name,
      ipAddr: printer.ipAddr,
      apiKey: printer.apiKey,
      model: printer.model || "Unknown",
      description: printer.description || "",
      image: printer.image || "https://i.ebayimg.com/images/g/j6sAAOSwm1FhdZKe/s-l1200.webp",
      status: "Offline",
      specs: {}
    });
    return { success: true, message: "Printer added", printer: newPrinter };
  }
  if (action === "edit") {
    if (id === void 0) {
      throw createError({ statusCode: 400, statusMessage: "Printer ID is required" });
    }
    const existing = getPrinterById(id);
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: "Printer not found" });
    }
    const updated = updatePrinter(id, {
      name: printer == null ? void 0 : printer.name,
      ipAddr: printer == null ? void 0 : printer.ipAddr,
      apiKey: printer == null ? void 0 : printer.apiKey,
      model: printer == null ? void 0 : printer.model,
      description: printer == null ? void 0 : printer.description
    });
    return { success: true, message: "Printer updated", printer: updated };
  }
  if (action === "delete") {
    if (id === void 0) {
      throw createError({ statusCode: 400, statusMessage: "Printer ID is required" });
    }
    const success = deletePrinter(id);
    if (!success) {
      throw createError({ statusCode: 404, statusMessage: "Printer not found" });
    }
    return { success: true, message: "Printer deleted" };
  }
  throw createError({ statusCode: 400, statusMessage: "Invalid action" });
});

export { printers_post as default };
//# sourceMappingURL=printers.post.mjs.map
