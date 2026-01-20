import { d as defineEventHandler, g as getCookie, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { g as getSession, h as getUserByName, i as findOrCreateUser, j as deleteUser } from '../../../_/dataStore.mjs';
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

const users_post = defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "fart-session");
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }
  const session = getSession(sessionId);
  if (!session || !session.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Admin access required" });
  }
  const body = await readBody(event);
  const { action, pin, name } = body;
  if (action === "create") {
    if (!name || !name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Name is required"
      });
    }
    const existing = getUserByName(name.trim());
    if (existing) {
      throw createError({
        statusCode: 400,
        statusMessage: "User with this name already exists"
      });
    }
    const user = findOrCreateUser(name.trim());
    return { success: true, user };
  }
  if (action === "delete") {
    if (!pin) {
      throw createError({
        statusCode: 400,
        statusMessage: "PIN is required"
      });
    }
    const success = deleteUser(pin);
    if (!success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Cannot delete user"
      });
    }
    return { success: true };
  }
  throw createError({
    statusCode: 400,
    statusMessage: "Invalid action"
  });
});

export { users_post as default };
//# sourceMappingURL=users.post.mjs.map
