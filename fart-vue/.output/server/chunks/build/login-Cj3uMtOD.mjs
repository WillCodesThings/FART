import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate } from 'vue/server-renderer';
import { Printer, User, Shield, AlertCircle, Loader2 } from 'lucide-vue-next';
import { a as useRouter } from './server.mjs';
import { u as useAuth } from './useAuth-DPqcDWhG.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pinia';
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    useAuth();
    const name = ref("");
    const adminCode = ref("");
    const showAdminCode = ref(false);
    const loading = ref(false);
    const error = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-zinc-950 flex items-center justify-center px-4" }, _attrs))}><div class="w-full max-w-sm"><div class="text-center mb-8"><div class="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">`);
      _push(ssrRenderComponent(unref(Printer), { class: "w-8 h-8 text-white" }, null, _parent));
      _push(`</div><h1 class="text-2xl font-bold text-white">FART</h1><p class="text-zinc-500 text-sm mt-1">Filament Automation &amp; Remote Tracking</p></div><div class="card p-6"><div class="text-center mb-6"><div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">`);
      _push(ssrRenderComponent(unref(User), { class: "w-6 h-6 text-zinc-400" }, null, _parent));
      _push(`</div><h2 class="text-lg font-semibold text-white">Welcome</h2><p class="text-sm text-zinc-500 mt-1">Enter your name to continue</p></div><form class="space-y-5"><div class="space-y-2"><label class="block text-sm font-medium text-zinc-400">Your Name</label><input${ssrRenderAttr("value", unref(name))} type="text" placeholder="Enter your name" class="input"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} autofocus></div><div class="flex items-center justify-center"><button type="button" class="text-xs text-zinc-500 hover:text-zinc-400 flex items-center gap-1">`);
      _push(ssrRenderComponent(unref(Shield), { class: "w-3 h-3" }, null, _parent));
      _push(` ${ssrInterpolate(unref(showAdminCode) ? "Hide admin login" : "Admin login")}</button></div>`);
      if (unref(showAdminCode)) {
        _push(`<div class="space-y-2"><label class="block text-sm font-medium text-zinc-400">Admin Code</label><div class="relative">`);
        _push(ssrRenderComponent(unref(Shield), { class: "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" }, null, _parent));
        _push(`<input${ssrRenderAttr("value", unref(adminCode))} type="password" placeholder="Enter admin code" class="input pl-10"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(error)) {
        _push(`<div class="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">`);
        _push(ssrRenderComponent(unref(AlertCircle), { class: "w-4 h-4 flex-shrink-0" }, null, _parent));
        _push(` ${ssrInterpolate(unref(error))}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit" class="btn btn-primary w-full flex items-center justify-center gap-2 py-3"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      if (unref(loading)) {
        _push(ssrRenderComponent(unref(Loader2), { class: "w-5 h-5 animate-spin" }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(` ${ssrInterpolate(unref(loading) ? "Please wait..." : "Continue")}</button></form><p class="text-center text-xs text-zinc-600 mt-6"> Your session will be remembered on this device </p></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-Cj3uMtOD.mjs.map
