import { z as executeAsync } from '../nitro/nitro.mjs';
import { h as defineNuxtRouteMiddleware, n as navigateTo } from './server.mjs';
import { u as useAuth } from './useAuth-DPqcDWhG.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'vue';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pinia';
import 'vue-router';

const auth = defineNuxtRouteMiddleware(async (to) => {
  let __temp, __restore;
  if (to.path === "/login") {
    return;
  }
  const { checkAuth, authenticated } = useAuth();
  [__temp, __restore] = executeAsync(() => checkAuth()), await __temp, __restore();
  if (!authenticated.value) {
    return navigateTo("/login");
  }
});

export { auth as default };
//# sourceMappingURL=auth-1uLXhIBD.mjs.map
