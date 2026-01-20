import { d as defineEventHandler, g as getCookie, a as deleteCookie } from '../../../nitro/nitro.mjs';
import { m as deleteSession } from '../../../_/dataStore.mjs';
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

const logout_post = defineEventHandler((event) => {
  const sessionId = getCookie(event, "fart-session");
  if (sessionId) {
    deleteSession(sessionId);
  }
  deleteCookie(event, "fart-session", {
    path: "/"
  });
  return { success: true };
});

export { logout_post as default };
//# sourceMappingURL=logout.post.mjs.map
