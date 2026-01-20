import { d as defineEventHandler, r as readBody, c as createError, s as setCookie } from '../../../nitro/nitro.mjs';
import { k as isAdminLogin, l as createSession, f as getAdminName, i as findOrCreateUser } from '../../../_/dataStore.mjs';
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

const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { name, adminCode } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Name is required"
    });
  }
  const trimmedName = name.trim();
  const isAdmin = adminCode && isAdminLogin(trimmedName, adminCode);
  if (isAdmin) {
    const session2 = createSession("admin", getAdminName(), true);
    setCookie(event, "fart-session", session2.id, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      // 7 days
      path: "/"
    });
    return {
      success: true,
      user: {
        name: getAdminName(),
        isAdmin: true
      },
      sessionId: session2.id
    };
  }
  const user = findOrCreateUser(trimmedName);
  const session = createSession(user.pin, user.name, false);
  setCookie(event, "fart-session", session.id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    // 7 days
    path: "/"
  });
  return {
    success: true,
    user: {
      name: user.name,
      isAdmin: false
    },
    sessionId: session.id
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
