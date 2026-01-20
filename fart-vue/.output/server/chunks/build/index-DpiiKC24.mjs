import { defineComponent, computed, ref, mergeProps, unref, createVNode, resolveDynamicComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrRenderStyle, ssrRenderVNode } from 'vue/server-renderer';
import { Printer, Bell, User, Shield, RefreshCw, LogOut, Activity, Wifi, WifiOff, Thermometer, Pause, Play, Clock, XCircle, Loader2, FileText } from 'lucide-vue-next';
import { u as usePrinterStore } from './printers-i9NYAyQm.mjs';
import { a as useRouter } from './server.mjs';
import { u as useAuth } from './useAuth-DPqcDWhG.mjs';
import 'pinia';
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
import 'vue-router';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const printerStore = usePrinterStore();
    useRouter();
    const { user, isAdmin } = useAuth();
    const printers = computed(() => printerStore.printers);
    const sanitizeProgress = (value) => {
      if (value === void 0 || value === null || isNaN(value)) return 0;
      return Math.min(100, Math.max(0, Math.round(value)));
    };
    const printerStatus = ref({});
    const refreshing = ref(false);
    const notificationPermission = ref("default");
    const formatTime = (seconds) => {
      if (!seconds || seconds <= 0) return "--:--";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor(seconds % 3600 / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    const getStatusBadge = (printerId) => {
      const status = printerStatus.value[printerId];
      if (!status || status.loading) return { text: "Checking...", class: "bg-zinc-700 text-zinc-300" };
      if (!status.online) return { text: "Offline", class: "bg-red-500/20 text-red-400" };
      if (status.data?.paused) return { text: "Paused", class: "bg-yellow-500/20 text-yellow-400" };
      if (status.data?.printing) return { text: "Printing", class: "bg-green-500/20 text-green-400" };
      return { text: "Ready", class: "bg-blue-500/20 text-blue-400" };
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-full bg-zinc-950" }, _attrs))}><header class="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50"><div class="max-w-7xl mx-auto px-6 py-4"><div class="flex items-center gap-4"><div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">`);
      _push(ssrRenderComponent(unref(Printer), { class: "w-5 h-5 text-white" }, null, _parent));
      _push(`</div><div class="flex-1"><h1 class="text-xl font-semibold text-white">FART</h1><p class="text-xs text-zinc-500">Filament Automation &amp; Remote Tracking</p></div><div class="flex items-center gap-3">`);
      if (unref(notificationPermission) !== "granted") {
        _push(`<div class="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">`);
        _push(ssrRenderComponent(unref(Bell), { class: "w-4 h-4" }, null, _parent));
        _push(`<span>Enable Notifications</span></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg">`);
      _push(ssrRenderComponent(unref(User), { class: "w-4 h-4 text-zinc-400" }, null, _parent));
      _push(`<span class="text-sm text-white">${ssrInterpolate(unref(user)?.name)}</span>`);
      if (unref(isAdmin)) {
        _push(`<span class="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded"> Admin </span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(isAdmin)) {
        _push(`<button class="btn btn-ghost p-2" title="Admin Dashboard">`);
        _push(ssrRenderComponent(unref(Shield), { class: "w-5 h-5" }, null, _parent));
        _push(`</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="btn btn-secondary flex items-center gap-2"${ssrIncludeBooleanAttr(unref(refreshing)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["w-4 h-4", unref(refreshing) && "animate-spin"]
      }, null, _parent));
      _push(`<span class="hidden sm:inline">Refresh</span></button><button class="btn btn-ghost p-2 text-zinc-400 hover:text-red-400" title="Logout">`);
      _push(ssrRenderComponent(unref(LogOut), { class: "w-5 h-5" }, null, _parent));
      _push(`</button></div></div></div></header><div class="border-b border-zinc-800 bg-zinc-900/30"><div class="max-w-7xl mx-auto px-6 py-3"><div class="flex items-center gap-6 text-sm"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-zinc-400">${ssrInterpolate(Object.values(unref(printerStatus)).filter((s) => s?.online).length)} Online </span></div><div class="flex items-center gap-2">`);
      _push(ssrRenderComponent(unref(Activity), { class: "w-4 h-4 text-orange-400" }, null, _parent));
      _push(`<span class="text-zinc-400">${ssrInterpolate(Object.values(unref(printerStatus)).filter((s) => s?.data?.printing).length)} Printing </span></div><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-red-500"></div><span class="text-zinc-400">${ssrInterpolate(Object.values(unref(printerStatus)).filter((s) => s && !s.online && !s.loading).length)} Offline </span></div></div></div></div><main class="max-w-7xl mx-auto px-6 py-8"><div class="mb-6"><h2 class="text-2xl font-semibold text-white mb-1">Printers</h2><p class="text-zinc-500 text-sm">Monitor and control your 3D printers</p></div><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"><!--[-->`);
      ssrRenderList(unref(printers), (printer) => {
        _push(`<div class="card overflow-hidden hover:border-zinc-700 transition-all duration-200 group"><div class="p-4 border-b border-zinc-800 flex items-center justify-between"><div class="flex items-center gap-3"><button class="font-semibold text-white text-lg hover:text-orange-400 transition-colors">${ssrInterpolate(printer.name)}</button><span class="${ssrRenderClass([
          "px-2 py-0.5 rounded-full text-xs font-medium",
          getStatusBadge(printer.id).class
        ])}">${ssrInterpolate(getStatusBadge(printer.id).text)}</span></div><button class="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"${ssrIncludeBooleanAttr(unref(printerStatus)[printer.id]?.loading) ? " disabled" : ""}>`);
        _push(ssrRenderComponent(unref(RefreshCw), {
          class: ["w-4 h-4", unref(printerStatus)[printer.id]?.loading && "animate-spin"]
        }, null, _parent));
        _push(`</button></div><button class="w-full aspect-video bg-zinc-800 overflow-hidden cursor-pointer relative"><img${ssrRenderAttr("src", printer.image)}${ssrRenderAttr("alt", printer.name)} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">`);
        if (unref(printerStatus)[printer.id]?.data?.printing) {
          _push(`<div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4"><div class="w-full"><div class="flex items-center justify-between text-sm mb-2"><span class="text-white font-medium truncate max-w-[70%]">${ssrInterpolate(unref(printerStatus)[printer.id]?.data?.currentFile || "Printing...")}</span><span class="text-orange-400 font-bold">${ssrInterpolate(sanitizeProgress(unref(printerStatus)[printer.id]?.data?.progress))}% </span></div><div class="h-1.5 bg-zinc-700 rounded-full overflow-hidden"><div class="h-full bg-orange-500 transition-all duration-500" style="${ssrRenderStyle({ width: `${sanitizeProgress(unref(printerStatus)[printer.id]?.data?.progress)}%` })}"></div></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button><div class="p-4 space-y-4"><div class="flex items-center justify-between text-sm"><span class="text-zinc-500">${ssrInterpolate(printer.model)}</span>`);
        if (unref(printerStatus)[printer.id]?.online) {
          _push(`<div class="flex items-center gap-1.5 text-green-500">`);
          _push(ssrRenderComponent(unref(Wifi), { class: "w-3.5 h-3.5" }, null, _parent));
          _push(`<span class="text-xs">Connected</span></div>`);
        } else {
          _push(`<div class="flex items-center gap-1.5 text-zinc-600">`);
          _push(ssrRenderComponent(unref(WifiOff), { class: "w-3.5 h-3.5" }, null, _parent));
          _push(`<span class="text-xs">Disconnected</span></div>`);
        }
        _push(`</div>`);
        if (unref(printerStatus)[printer.id]?.online && unref(printerStatus)[printer.id]?.data) {
          _push(`<div class="space-y-3"><div class="grid grid-cols-2 gap-3"><div class="bg-zinc-800/50 rounded-lg p-3"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-1">`);
          _push(ssrRenderComponent(unref(Thermometer), { class: "w-3.5 h-3.5 text-orange-400" }, null, _parent));
          _push(` Nozzle </div><div class="text-lg font-semibold text-white">${ssrInterpolate(Math.round(unref(printerStatus)[printer.id]?.data?.nozzleTemp || 0))}°C </div></div><div class="bg-zinc-800/50 rounded-lg p-3"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-1">`);
          _push(ssrRenderComponent(unref(Thermometer), { class: "w-3.5 h-3.5 text-blue-400" }, null, _parent));
          _push(` Bed </div><div class="text-lg font-semibold text-white">${ssrInterpolate(Math.round(unref(printerStatus)[printer.id]?.data?.bedTemp || 0))}°C </div></div></div>`);
          if (unref(printerStatus)[printer.id]?.data?.printing) {
            _push(`<div class="bg-zinc-800/50 rounded-lg p-3"><div class="flex items-center justify-between"><div class="flex items-center gap-2">`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(printerStatus)[printer.id]?.data?.paused ? unref(Pause) : unref(Play)), { class: "w-4 h-4 text-green-400" }, null), _parent);
            _push(`<span class="text-sm text-zinc-300">${ssrInterpolate(unref(printerStatus)[printer.id]?.data?.paused ? "Paused" : "In Progress")}</span></div><div class="flex items-center gap-1.5 text-sm text-zinc-400">`);
            _push(ssrRenderComponent(unref(Clock), { class: "w-3.5 h-3.5" }, null, _parent));
            _push(` ${ssrInterpolate(formatTime(unref(printerStatus)[printer.id]?.data?.timeRemaining))}</div></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else if (unref(printerStatus)[printer.id] && !unref(printerStatus)[printer.id]?.loading && !unref(printerStatus)[printer.id]?.online) {
          _push(`<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3"><div class="flex items-center gap-2 text-red-400 text-sm">`);
          _push(ssrRenderComponent(unref(XCircle), { class: "w-4 h-4 flex-shrink-0" }, null, _parent));
          _push(`<span class="truncate">${ssrInterpolate(unref(printerStatus)[printer.id]?.error || "Connection failed")}</span></div></div>`);
        } else if (unref(printerStatus)[printer.id]?.loading) {
          _push(`<div class="flex items-center justify-center py-4">`);
          _push(ssrRenderComponent(unref(Loader2), { class: "w-5 h-5 text-zinc-500 animate-spin" }, null, _parent));
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex gap-2 pt-2"><button class="btn btn-primary flex-1 flex items-center justify-center gap-2">`);
        _push(ssrRenderComponent(unref(FileText), { class: "w-4 h-4" }, null, _parent));
        _push(` Open Dashboard </button></div></div></div>`);
      });
      _push(`<!--]--></div>`);
      if (unref(printers).length === 0) {
        _push(`<div class="text-center py-20"><div class="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">`);
        _push(ssrRenderComponent(unref(Printer), { class: "w-8 h-8 text-zinc-600" }, null, _parent));
        _push(`</div><h3 class="text-lg font-medium text-white mb-2">No printers configured</h3><p class="text-zinc-500">Printers will appear here once configured</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-DpiiKC24.mjs.map
