import { d as defineEventHandler, g as getCookie, a as deleteCookie } from '../../../nitro/nitro.mjs';
import { g as getSession, n as updateSessionActivity } from '../../../_/dataStore.mjs';
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

const me_get = defineEventHandler((event) => {
  const sessionId = getCookie(event, "fart-session");
  if (!sessionId) {
    return { authenticated: false };
  }
  const session = getSession(sessionId);
  if (!session) {
    deleteCookie(event, "fart-session", { path: "/" });
    return { authenticated: false };
  }
  updateSessionActivity(sessionId);
  return {
    authenticated: true,
    user: {
      name: session.userName,
      isAdmin: session.isAdmin,
      pin: session.pin
    },
    sessionId: session.id
  };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
