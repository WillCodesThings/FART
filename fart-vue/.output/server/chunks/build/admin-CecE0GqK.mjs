import { _ as __nuxt_component_0 } from './nuxt-link-C2E11foT.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderAttr, ssrRenderList, ssrRenderClass, ssrRenderStyle } from 'vue/server-renderer';
import { ArrowLeft, RefreshCw, Loader2, AlertCircle, Key, Eye, EyeOff, Pencil, Check, X, Users, Activity, Printer, FileText, Clock, User, Plus, Trash2, DollarSign, Settings, Wrench } from 'lucide-vue-next';
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
  __name: "admin",
  __ssrInlineRender: true,
  setup(__props) {
    useRouter();
    const { user } = useAuth();
    const stats = ref(null);
    const loading = ref(false);
    const error = ref("");
    const showNewUserForm = ref(false);
    const newUserName = ref("");
    const savingUser = ref(false);
    const showAdminCode = ref(false);
    const editingCode = ref(false);
    const newAdminCode = ref("");
    const savingCode = ref(false);
    const showPrinterForm = ref(false);
    const editingPrinter = ref(null);
    const printerForm = ref({
      name: "",
      ipAddr: "",
      apiKey: "",
      model: "Prusa MK-4"
    });
    const savingPrinter = ref(false);
    const formatRelativeTime = (dateStr) => {
      const date = new Date(dateStr);
      const now = /* @__PURE__ */ new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 6e4);
      const hours = Math.floor(diff / 36e5);
      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return date.toLocaleDateString();
    };
    const getStatusColor = (status) => {
      switch (status) {
        case "printing":
          return "text-green-400 bg-green-500/10";
        case "completed":
          return "text-blue-400 bg-blue-500/10";
        case "cancelled":
          return "text-yellow-400 bg-yellow-500/10";
        case "failed":
          return "text-red-400 bg-red-500/10";
        default:
          return "text-zinc-400 bg-zinc-500/10";
      }
    };
    const sanitizeProgress = (progress) => {
      if (progress === void 0 || progress === null || isNaN(progress)) return 0;
      return Math.min(100, Math.max(0, Math.round(progress)));
    };
    const formatDuration = (seconds) => {
      if (!seconds || seconds <= 0) return "--";
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor(seconds % 3600 / 60);
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    };
    const formatCurrency = (amount) => {
      return `$${amount.toFixed(2)}`;
    };
    const troubleshootingTips = [
      { issue: "Printer offline", solution: "Check network connection and power. Try restarting the printer." },
      { issue: "Print failed", solution: "Check bed adhesion, filament, and nozzle temperature settings." },
      { issue: "Connection timeout", solution: "Verify printer IP address and API key are correct." },
      { issue: "Upload failed", solution: "Ensure file is valid .gcode and printer has storage space." }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-full bg-zinc-950" }, _attrs))}><header class="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50"><div class="max-w-7xl mx-auto px-6 py-4"><div class="flex items-center gap-4"><button class="btn btn-ghost p-2">`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div class="flex-1"><h1 class="text-xl font-semibold text-white">Admin Dashboard</h1><p class="text-xs text-zinc-500">Manage users and monitor prints</p></div><button class="btn btn-secondary flex items-center gap-2"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["w-4 h-4", unref(loading) && "animate-spin"]
      }, null, _parent));
      _push(` Refresh </button></div></div></header><main class="max-w-7xl mx-auto px-6 py-8">`);
      if (unref(loading) && !unref(stats)) {
        _push(`<div class="flex items-center justify-center py-20">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-8 h-8 text-orange-500 animate-spin" }, null, _parent));
        _push(`</div>`);
      } else if (unref(error) && !unref(stats)) {
        _push(`<div class="text-center py-20">`);
        _push(ssrRenderComponent(unref(AlertCircle), { class: "w-12 h-12 text-red-400 mx-auto mb-4" }, null, _parent));
        _push(`<p class="text-red-400">${ssrInterpolate(unref(error))}</p><button class="btn btn-primary mt-4">Retry</button></div>`);
      } else if (unref(stats)) {
        _push(`<div class="space-y-6"><div class="card p-4 bg-orange-500/5 border-orange-500/20"><div class="flex items-center justify-between flex-wrap gap-4"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">`);
        _push(ssrRenderComponent(unref(Key), { class: "w-5 h-5 text-orange-400" }, null, _parent));
        _push(`</div><div><h3 class="text-sm font-medium text-white">Admin Login</h3><p class="text-xs text-zinc-500">Share these credentials with people who need admin access</p></div></div><div class="flex items-center gap-3"><div class="text-right"><p class="text-xs text-zinc-500">Name</p><p class="font-mono text-white">${ssrInterpolate(unref(stats).adminName)}</p></div><div class="text-right"><p class="text-xs text-zinc-500">Code</p>`);
        if (!unref(editingCode)) {
          _push(`<div class="flex items-center gap-1"><span class="font-mono text-white">${ssrInterpolate(unref(showAdminCode) ? unref(stats).adminCode : "****")}</span><button class="p-1 text-zinc-400 hover:text-white">`);
          if (!unref(showAdminCode)) {
            _push(ssrRenderComponent(unref(Eye), { class: "w-4 h-4" }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(EyeOff), { class: "w-4 h-4" }, null, _parent));
          }
          _push(`</button><button class="p-1 text-zinc-400 hover:text-orange-400" title="Change code">`);
          _push(ssrRenderComponent(unref(Pencil), { class: "w-4 h-4" }, null, _parent));
          _push(`</button></div>`);
        } else {
          _push(`<div class="flex items-center gap-1"><input${ssrRenderAttr("value", unref(newAdminCode))} type="text" inputmode="numeric" pattern="[0-9]*" placeholder="New code" class="w-24 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white font-mono text-sm focus:border-orange-500 focus:outline-none"><button class="p-1 text-zinc-400 hover:text-green-400"${ssrIncludeBooleanAttr(unref(savingCode)) ? " disabled" : ""} title="Save">`);
          if (unref(savingCode)) {
            _push(ssrRenderComponent(unref(Loader2), { class: "w-4 h-4 animate-spin" }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(Check), { class: "w-4 h-4" }, null, _parent));
          }
          _push(`</button><button class="p-1 text-zinc-400 hover:text-red-400" title="Cancel">`);
          _push(ssrRenderComponent(unref(X), { class: "w-4 h-4" }, null, _parent));
          _push(`</button></div>`);
        }
        _push(`</div></div></div></div><div class="grid grid-cols-2 md:grid-cols-5 gap-4"><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Users), { class: "w-4 h-4" }, null, _parent));
        _push(` Total Users </div><div class="text-2xl font-bold text-white">${ssrInterpolate(unref(stats).stats.totalUsers)}</div></div><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Activity), { class: "w-4 h-4 text-green-400" }, null, _parent));
        _push(` Active Users </div><div class="text-2xl font-bold text-white">${ssrInterpolate(unref(stats).stats.activeUsers)}</div></div><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Printer), { class: "w-4 h-4" }, null, _parent));
        _push(` Printers </div><div class="text-2xl font-bold text-white">${ssrInterpolate(unref(stats).stats.totalPrinters)}</div></div><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(FileText), { class: "w-4 h-4 text-orange-400" }, null, _parent));
        _push(` Active Prints </div><div class="text-2xl font-bold text-white">${ssrInterpolate(unref(stats).stats.activePrints)}</div></div><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Clock), { class: "w-4 h-4" }, null, _parent));
        _push(` Total Prints </div><div class="text-2xl font-bold text-white">${ssrInterpolate(unref(stats).stats.totalPrints)}</div></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2 card"><div class="p-4 border-b border-zinc-800 flex items-center justify-between"><h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Active Prints</h2><span class="text-xs text-zinc-600">Est. cost: $${ssrInterpolate(unref(stats).costConfig.filamentPerKg)}/kg filament</span></div>`);
        if (unref(stats).activePrints.length === 0) {
          _push(`<div class="p-8 text-center text-zinc-500"> No active prints </div>`);
        } else {
          _push(`<div class="divide-y divide-zinc-800"><!--[-->`);
          ssrRenderList(unref(stats).activePrints, (print) => {
            _push(`<div class="p-4"><div class="flex items-center justify-between mb-3"><div class="flex items-center gap-2">`);
            _push(ssrRenderComponent(unref(User), { class: "w-4 h-4 text-zinc-500" }, null, _parent));
            _push(`<span class="text-white font-medium">${ssrInterpolate(print.userName)}</span>`);
            if (print.stillRunning) {
              _push(`<span class="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-400"> Running </span>`);
            } else if (print.printerOnline) {
              _push(`<span class="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-400"> Stopped </span>`);
            } else {
              _push(`<span class="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-400"> Offline </span>`);
            }
            _push(`</div>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/printer/${print.printerId}`,
              class: "text-xs text-orange-400 hover:text-orange-300 hover:underline"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(print.printerName)} → `);
                } else {
                  return [
                    createTextVNode(toDisplayString(print.printerName) + " → ", 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</div><p class="text-sm text-zinc-400 mb-3 truncate">${ssrInterpolate(print.fileName)}</p><div class="flex items-center gap-3 mb-3"><div class="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden"><div class="${ssrRenderClass([print.stillRunning ? "bg-orange-500" : "bg-zinc-600", "h-full transition-all duration-500"])}" style="${ssrRenderStyle({ width: `${sanitizeProgress(print.liveProgress)}%` })}"></div></div><span class="text-sm text-white font-medium w-12 text-right">${ssrInterpolate(sanitizeProgress(print.liveProgress))}%</span></div><div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs"><div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-zinc-500 mb-0.5">Elapsed</p><p class="text-white font-medium">${ssrInterpolate(formatDuration(print.elapsedTime))}</p></div><div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-zinc-500 mb-0.5">Remaining</p><p class="text-white font-medium">${ssrInterpolate(print.stillRunning ? formatDuration(print.timeRemaining) : "--")}</p></div><div class="bg-zinc-800/50 rounded-lg p-2"><p class="text-zinc-500 mb-0.5">Filament</p><p class="text-white font-medium">${ssrInterpolate(formatCurrency(print.estimatedCost.filament))}</p></div><div class="bg-orange-500/10 rounded-lg p-2"><p class="text-orange-400/70 mb-0.5">Total Est.</p><p class="text-orange-400 font-medium">${ssrInterpolate(formatCurrency(print.estimatedCost.total))}</p></div></div><p class="text-xs text-zinc-600 mt-3">Started ${ssrInterpolate(formatRelativeTime(print.startedAt))}</p></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div><div class="card"><div class="p-4 border-b border-zinc-800"><h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Online Users</h2></div>`);
        if (unref(stats).activeSessions.length === 0) {
          _push(`<div class="p-8 text-center text-zinc-500"> No users online </div>`);
        } else {
          _push(`<div class="divide-y divide-zinc-800"><!--[-->`);
          ssrRenderList(unref(stats).activeSessions, (session) => {
            _push(`<div class="p-4 flex items-center justify-between"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-green-500"></div><span class="text-white">${ssrInterpolate(session.userName)}</span></div><span class="text-xs text-zinc-500">${ssrInterpolate(formatRelativeTime(session.lastActive))}</span></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div></div><div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="card"><div class="p-4 border-b border-zinc-800 flex items-center justify-between"><h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Users</h2><button class="btn btn-primary text-sm py-1 px-3 flex items-center gap-1">`);
        _push(ssrRenderComponent(unref(Plus), { class: "w-4 h-4" }, null, _parent));
        _push(` Add User </button></div>`);
        if (unref(showNewUserForm)) {
          _push(`<div class="p-4 border-b border-zinc-800 bg-zinc-800/30"><div class="space-y-3"><input${ssrRenderAttr("value", unref(newUserName))} type="text" placeholder="Enter name" class="input text-sm"><p class="text-xs text-zinc-500">A PIN will be auto-generated for this user</p><div class="flex gap-2"><button class="btn btn-primary text-sm flex-1"${ssrIncludeBooleanAttr(unref(savingUser)) ? " disabled" : ""}>${ssrInterpolate(unref(savingUser) ? "Creating..." : "Create")}</button><button class="btn btn-ghost text-sm"> Cancel </button></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(stats).users.length === 0) {
          _push(`<div class="p-8 text-center text-zinc-500"> No users registered yet </div>`);
        } else {
          _push(`<div class="divide-y divide-zinc-800 max-h-80 overflow-y-auto"><!--[-->`);
          ssrRenderList(unref(stats).users, (u) => {
            _push(`<div class="p-4 flex items-center justify-between"><div><span class="text-white font-medium">${ssrInterpolate(u.name)}</span><p class="text-xs text-zinc-500">PIN: ${ssrInterpolate(u.pin)} - Joined ${ssrInterpolate(formatRelativeTime(u.createdAt))}</p></div>`);
            if (u.pin !== unref(user)?.pin) {
              _push(`<button class="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">`);
              _push(ssrRenderComponent(unref(Trash2), { class: "w-4 h-4" }, null, _parent));
              _push(`</button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div><div class="card"><div class="p-4 border-b border-zinc-800"><h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Recent Prints</h2></div>`);
        if (unref(stats).recentPrints.length === 0) {
          _push(`<div class="p-8 text-center text-zinc-500"> No print history </div>`);
        } else {
          _push(`<div><div class="divide-y divide-zinc-800 max-h-64 overflow-y-auto"><!--[-->`);
          ssrRenderList(unref(stats).recentPrints, (print) => {
            _push(`<div class="p-4"><div class="flex items-center justify-between mb-1"><span class="text-white font-medium text-sm">${ssrInterpolate(print.userName)}</span><div class="flex items-center gap-2"><span class="text-xs text-zinc-500">${ssrInterpolate(formatCurrency(print.estimatedCost.total))}</span><span class="${ssrRenderClass(["text-xs px-2 py-0.5 rounded-full", getStatusColor(print.status)])}">${ssrInterpolate(print.status)}</span></div></div><p class="text-sm text-zinc-400 truncate">${ssrInterpolate(print.fileName)}</p><p class="text-xs text-zinc-600 mt-1">${ssrInterpolate(print.printerName)} - ${ssrInterpolate(formatRelativeTime(print.startedAt))}</p></div>`);
          });
          _push(`<!--]--></div><div class="p-4 border-t border-zinc-800 bg-zinc-800/30"><div class="flex items-center gap-2 mb-3">`);
          _push(ssrRenderComponent(unref(DollarSign), { class: "w-4 h-4 text-green-400" }, null, _parent));
          _push(`<span class="text-sm font-medium text-zinc-400">Total Costs (${ssrInterpolate(unref(stats).totalCosts.printCount)} completed prints)</span></div><div class="grid grid-cols-3 gap-3 text-center"><div><p class="text-xs text-zinc-500">Filament</p><p class="text-white font-medium">${ssrInterpolate(formatCurrency(unref(stats).totalCosts.filament))}</p></div><div><p class="text-xs text-zinc-500">Electricity</p><p class="text-white font-medium">${ssrInterpolate(formatCurrency(unref(stats).totalCosts.electricity))}</p></div><div class="bg-green-500/10 rounded-lg py-1"><p class="text-xs text-green-400/70">Total</p><p class="text-green-400 font-bold">${ssrInterpolate(formatCurrency(unref(stats).totalCosts.total))}</p></div></div></div></div>`);
        }
        _push(`</div></div><div class="card"><div class="p-4 border-b border-zinc-800 flex items-center justify-between"><div class="flex items-center gap-2">`);
        _push(ssrRenderComponent(unref(Settings), { class: "w-4 h-4 text-zinc-400" }, null, _parent));
        _push(`<h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Printer Management</h2></div><button class="btn btn-primary text-sm py-1 px-3 flex items-center gap-1">`);
        _push(ssrRenderComponent(unref(Plus), { class: "w-4 h-4" }, null, _parent));
        _push(` Add Printer </button></div>`);
        if (unref(showPrinterForm)) {
          _push(`<div class="p-4 border-b border-zinc-800 bg-zinc-800/30"><h3 class="text-white font-medium mb-3">${ssrInterpolate(unref(editingPrinter) !== null ? "Edit Printer" : "Add New Printer")}</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><div><label class="text-xs text-zinc-500 mb-1 block">Name</label><input${ssrRenderAttr("value", unref(printerForm).name)} type="text" placeholder="e.g. Dave" class="input text-sm"></div><div><label class="text-xs text-zinc-500 mb-1 block">Model</label><input${ssrRenderAttr("value", unref(printerForm).model)} type="text" placeholder="e.g. Prusa MK-4" class="input text-sm"></div><div><label class="text-xs text-zinc-500 mb-1 block">IP Address</label><input${ssrRenderAttr("value", unref(printerForm).ipAddr)} type="text" placeholder="e.g. 192.168.1.100" class="input text-sm"></div><div><label class="text-xs text-zinc-500 mb-1 block">API Key</label><input${ssrRenderAttr("value", unref(printerForm).apiKey)} type="text" placeholder="Printer API key" class="input text-sm font-mono"></div></div><div class="flex gap-2 mt-4"><button class="btn btn-primary text-sm flex-1"${ssrIncludeBooleanAttr(unref(savingPrinter)) ? " disabled" : ""}>${ssrInterpolate(unref(savingPrinter) ? "Saving..." : unref(editingPrinter) !== null ? "Update Printer" : "Add Printer")}</button><button class="btn btn-ghost text-sm"> Cancel </button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(stats).printers.length === 0) {
          _push(`<div class="p-8 text-center text-zinc-500"> No printers configured </div>`);
        } else {
          _push(`<div class="divide-y divide-zinc-800"><!--[-->`);
          ssrRenderList(unref(stats).printers, (printer) => {
            _push(`<div class="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"><div class="flex items-center gap-4"><div class="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">`);
            _push(ssrRenderComponent(unref(Printer), { class: "w-5 h-5 text-zinc-500" }, null, _parent));
            _push(`</div><div><div class="flex items-center gap-2"><span class="text-white font-medium">${ssrInterpolate(printer.name)}</span><span class="text-xs text-zinc-500">${ssrInterpolate(printer.model)}</span></div><p class="text-xs text-zinc-500 font-mono">${ssrInterpolate(printer.ipAddr)}</p></div></div><div class="flex items-center gap-2"><button class="p-2 text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors" title="Edit printer">`);
            _push(ssrRenderComponent(unref(Pencil), { class: "w-4 h-4" }, null, _parent));
            _push(`</button><button class="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete printer">`);
            _push(ssrRenderComponent(unref(Trash2), { class: "w-4 h-4" }, null, _parent));
            _push(`</button></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div><div class="card"><div class="p-4 border-b border-zinc-800 flex items-center gap-2">`);
        _push(ssrRenderComponent(unref(Wrench), { class: "w-4 h-4 text-zinc-400" }, null, _parent));
        _push(`<h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Troubleshooting Guide</h2></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4"><!--[-->`);
        ssrRenderList(troubleshootingTips, (tip) => {
          _push(`<div class="bg-zinc-800/30 rounded-lg p-4"><h3 class="text-white font-medium mb-1">${ssrInterpolate(tip.issue)}</h3><p class="text-sm text-zinc-400">${ssrInterpolate(tip.solution)}</p></div>`);
        });
        _push(`<!--]--></div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=admin-CecE0GqK.mjs.map
