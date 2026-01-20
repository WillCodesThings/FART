import { d as defineEventHandler, g as getCookie } from '../../../nitro/nitro.mjs';
import { g as getSession, p as getUnnotifiedCompletedPrints, q as markPrintNotified } from '../../../_/dataStore.mjs';
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

const notifications_get = defineEventHandler((event) => {
  const sessionId = getCookie(event, "fart-session");
  if (!sessionId) {
    return { notifications: [] };
  }
  const session = getSession(sessionId);
  if (!session) {
    return { notifications: [] };
  }
  const unnotifiedPrints = getUnnotifiedCompletedPrints(session.pin);
  for (const print of unnotifiedPrints) {
    markPrintNotified(print.id);
  }
  return {
    notifications: unnotifiedPrints.map((p) => ({
      id: p.id,
      fileName: p.fileName,
      printerName: p.printerName,
      completedAt: p.completedAt
    }))
  };
});

export { notifications_get as default };
//# sourceMappingURL=notifications.get.mjs.map
