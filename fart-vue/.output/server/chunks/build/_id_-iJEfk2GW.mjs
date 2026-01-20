import { defineComponent, computed, ref, mergeProps, unref, toValue, reactive, getCurrentInstance, onServerPrefetch, shallowRef, toRef, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrIncludeBooleanAttr, ssrRenderStyle, ssrRenderList } from 'vue/server-renderer';
import { ArrowLeft, RefreshCw, XCircle, Loader2, Thermometer, Gauge, Clock, Layers, Play, Pause, Square, CheckCircle, Upload, AlertCircle, FileText } from 'lucide-vue-next';
import { g as useRoute, a as useRouter, f as fetchDefaults, u as useNuxtApp, d as asyncDataDefaults, e as createError } from './server.mjs';
import { u as usePrinterStore } from './printers-i9NYAyQm.mjs';
import { u as useAuth } from './useAuth-DPqcDWhG.mjs';
import { D as hash } from '../nitro/nitro.mjs';
import { isPlainObject } from '@vue/shared';
import { debounce } from 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pinia';
import 'vue-router';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

function useAsyncData(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (_isAutoKeyNeeded(args[0], args[1])) {
    args.unshift(autoKey);
  }
  let [_key, _handler, options = {}] = args;
  const key = computed(() => toValue(_key));
  if (typeof key.value !== "string") {
    throw new TypeError("[nuxt] [useAsyncData] key must be a string.");
  }
  if (typeof _handler !== "function") {
    throw new TypeError("[nuxt] [useAsyncData] handler must be a function.");
  }
  const nuxtApp = useNuxtApp();
  options.server ??= true;
  options.default ??= getDefault;
  options.getCachedData ??= getDefaultCachedData;
  options.lazy ??= false;
  options.immediate ??= true;
  options.deep ??= asyncDataDefaults.deep;
  options.dedupe ??= "cancel";
  options._functionName || "useAsyncData";
  nuxtApp._asyncData[key.value];
  function createInitialFetch() {
    const initialFetchOptions = { cause: "initial", dedupe: options.dedupe };
    if (!nuxtApp._asyncData[key.value]?._init) {
      initialFetchOptions.cachedData = options.getCachedData(key.value, nuxtApp, { cause: "initial" });
      nuxtApp._asyncData[key.value] = createAsyncData(nuxtApp, key.value, _handler, options, initialFetchOptions.cachedData);
    }
    return () => nuxtApp._asyncData[key.value].execute(initialFetchOptions);
  }
  const initialFetch = createInitialFetch();
  const asyncData = nuxtApp._asyncData[key.value];
  asyncData._deps++;
  const fetchOnServer = options.server !== false && nuxtApp.payload.serverRendered;
  if (fetchOnServer && options.immediate) {
    const promise = initialFetch();
    if (getCurrentInstance()) {
      onServerPrefetch(() => promise);
    } else {
      nuxtApp.hook("app:created", async () => {
        await promise;
      });
    }
  }
  const asyncReturn = {
    data: writableComputedRef(() => nuxtApp._asyncData[key.value]?.data),
    pending: writableComputedRef(() => nuxtApp._asyncData[key.value]?.pending),
    status: writableComputedRef(() => nuxtApp._asyncData[key.value]?.status),
    error: writableComputedRef(() => nuxtApp._asyncData[key.value]?.error),
    refresh: (...args2) => {
      if (!nuxtApp._asyncData[key.value]?._init) {
        const initialFetch2 = createInitialFetch();
        return initialFetch2();
      }
      return nuxtApp._asyncData[key.value].execute(...args2);
    },
    execute: (...args2) => asyncReturn.refresh(...args2),
    clear: () => {
      const entry = nuxtApp._asyncData[key.value];
      if (entry?._abortController) {
        try {
          entry._abortController.abort(new DOMException("AsyncData aborted by user.", "AbortError"));
        } finally {
          entry._abortController = void 0;
        }
      }
      clearNuxtDataByKey(nuxtApp, key.value);
    }
  };
  const asyncDataPromise = Promise.resolve(nuxtApp._asyncDataPromises[key.value]).then(() => asyncReturn);
  Object.assign(asyncDataPromise, asyncReturn);
  return asyncDataPromise;
}
function writableComputedRef(getter) {
  return computed({
    get() {
      return getter()?.value;
    },
    set(value) {
      const ref2 = getter();
      if (ref2) {
        ref2.value = value;
      }
    }
  });
}
function _isAutoKeyNeeded(keyOrFetcher, fetcher) {
  if (typeof keyOrFetcher === "string") {
    return false;
  }
  if (typeof keyOrFetcher === "object" && keyOrFetcher !== null) {
    return false;
  }
  if (typeof keyOrFetcher === "function" && typeof fetcher === "function") {
    return false;
  }
  return true;
}
function clearNuxtDataByKey(nuxtApp, key) {
  if (key in nuxtApp.payload.data) {
    nuxtApp.payload.data[key] = void 0;
  }
  if (key in nuxtApp.payload._errors) {
    nuxtApp.payload._errors[key] = void 0;
  }
  if (nuxtApp._asyncData[key]) {
    nuxtApp._asyncData[key].data.value = unref(nuxtApp._asyncData[key]._default());
    nuxtApp._asyncData[key].error.value = void 0;
    nuxtApp._asyncData[key].status.value = "idle";
  }
  if (key in nuxtApp._asyncDataPromises) {
    nuxtApp._asyncDataPromises[key] = void 0;
  }
}
function pick(obj, keys) {
  const newObj = {};
  for (const key of keys) {
    newObj[key] = obj[key];
  }
  return newObj;
}
function createAsyncData(nuxtApp, key, _handler, options, initialCachedData) {
  nuxtApp.payload._errors[key] ??= void 0;
  const hasCustomGetCachedData = options.getCachedData !== getDefaultCachedData;
  const handler = _handler ;
  const _ref = options.deep ? ref : shallowRef;
  const hasCachedData = initialCachedData !== void 0;
  const unsubRefreshAsyncData = nuxtApp.hook("app:data:refresh", async (keys) => {
    if (!keys || keys.includes(key)) {
      await asyncData.execute({ cause: "refresh:hook" });
    }
  });
  const asyncData = {
    data: _ref(hasCachedData ? initialCachedData : options.default()),
    pending: computed(() => asyncData.status.value === "pending"),
    error: toRef(nuxtApp.payload._errors, key),
    status: shallowRef("idle"),
    execute: (...args) => {
      const [_opts, newValue = void 0] = args;
      const opts = _opts && newValue === void 0 && typeof _opts === "object" ? _opts : {};
      if (nuxtApp._asyncDataPromises[key]) {
        if ((opts.dedupe ?? options.dedupe) === "defer") {
          return nuxtApp._asyncDataPromises[key];
        }
      }
      {
        const cachedData = "cachedData" in opts ? opts.cachedData : options.getCachedData(key, nuxtApp, { cause: opts.cause ?? "refresh:manual" });
        if (cachedData !== void 0) {
          nuxtApp.payload.data[key] = asyncData.data.value = cachedData;
          asyncData.error.value = void 0;
          asyncData.status.value = "success";
          return Promise.resolve(cachedData);
        }
      }
      if (asyncData._abortController) {
        asyncData._abortController.abort(new DOMException("AsyncData request cancelled by deduplication", "AbortError"));
      }
      asyncData._abortController = new AbortController();
      asyncData.status.value = "pending";
      const cleanupController = new AbortController();
      const promise = new Promise(
        (resolve, reject) => {
          try {
            const timeout = opts.timeout ?? options.timeout;
            const mergedSignal = mergeAbortSignals([asyncData._abortController?.signal, opts?.signal], cleanupController.signal, timeout);
            if (mergedSignal.aborted) {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
              return;
            }
            mergedSignal.addEventListener("abort", () => {
              const reason = mergedSignal.reason;
              reject(reason instanceof Error ? reason : new DOMException(String(reason ?? "Aborted"), "AbortError"));
            }, { once: true, signal: cleanupController.signal });
            return Promise.resolve(handler(nuxtApp, { signal: mergedSignal })).then(resolve, reject);
          } catch (err) {
            reject(err);
          }
        }
      ).then(async (_result) => {
        let result = _result;
        if (options.transform) {
          result = await options.transform(_result);
        }
        if (options.pick) {
          result = pick(result, options.pick);
        }
        nuxtApp.payload.data[key] = result;
        asyncData.data.value = result;
        asyncData.error.value = void 0;
        asyncData.status.value = "success";
      }).catch((error) => {
        if (nuxtApp._asyncDataPromises[key] && nuxtApp._asyncDataPromises[key] !== promise) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (asyncData._abortController?.signal.aborted) {
          return nuxtApp._asyncDataPromises[key];
        }
        if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") {
          asyncData.status.value = "idle";
          return nuxtApp._asyncDataPromises[key];
        }
        asyncData.error.value = createError(error);
        asyncData.data.value = unref(options.default());
        asyncData.status.value = "error";
      }).finally(() => {
        cleanupController.abort();
        delete nuxtApp._asyncDataPromises[key];
      });
      nuxtApp._asyncDataPromises[key] = promise;
      return nuxtApp._asyncDataPromises[key];
    },
    _execute: debounce((...args) => asyncData.execute(...args), 0, { leading: true }),
    _default: options.default,
    _deps: 0,
    _init: true,
    _hash: void 0,
    _off: () => {
      unsubRefreshAsyncData();
      if (nuxtApp._asyncData[key]?._init) {
        nuxtApp._asyncData[key]._init = false;
      }
      if (!hasCustomGetCachedData) {
        nextTick(() => {
          if (!nuxtApp._asyncData[key]?._init) {
            clearNuxtDataByKey(nuxtApp, key);
            asyncData.execute = () => Promise.resolve();
          }
        });
      }
    }
  };
  return asyncData;
}
const getDefault = () => void 0;
const getDefaultCachedData = (key, nuxtApp, ctx) => {
  if (nuxtApp.isHydrating) {
    return nuxtApp.payload.data[key];
  }
  if (ctx.cause !== "refresh:manual" && ctx.cause !== "refresh:hook") {
    return nuxtApp.static.data[key];
  }
};
function mergeAbortSignals(signals, cleanupSignal, timeout) {
  const list = signals.filter((s) => !!s);
  if (typeof timeout === "number" && timeout >= 0) {
    const timeoutSignal = AbortSignal.timeout?.(timeout);
    if (timeoutSignal) {
      list.push(timeoutSignal);
    }
  }
  if (AbortSignal.any) {
    return AbortSignal.any(list);
  }
  const controller = new AbortController();
  for (const sig of list) {
    if (sig.aborted) {
      const reason = sig.reason ?? new DOMException("Aborted", "AbortError");
      try {
        controller.abort(reason);
      } catch {
        controller.abort();
      }
      return controller.signal;
    }
  }
  const onAbort = () => {
    const abortedSignal = list.find((s) => s.aborted);
    const reason = abortedSignal?.reason ?? new DOMException("Aborted", "AbortError");
    try {
      controller.abort(reason);
    } catch {
      controller.abort();
    }
  };
  for (const sig of list) {
    sig.addEventListener?.("abort", onAbort, { once: true, signal: cleanupSignal });
  }
  return controller.signal;
}
function useRequestEvent(nuxtApp) {
  nuxtApp ||= useNuxtApp();
  return nuxtApp.ssrContext?.event;
}
function useRequestFetch() {
  return useRequestEvent()?.$fetch || globalThis.$fetch;
}
function useFetch(request, arg1, arg2) {
  const [opts = {}, autoKey] = typeof arg1 === "string" ? [{}, arg1] : [arg1, arg2];
  const _request = computed(() => toValue(request));
  const key = computed(() => toValue(opts.key) || "$f" + hash([autoKey, typeof _request.value === "string" ? _request.value : "", ...generateOptionSegments(opts)]));
  if (!opts.baseURL && typeof _request.value === "string" && (_request.value[0] === "/" && _request.value[1] === "/")) {
    throw new Error('[nuxt] [useFetch] the request URL must not start with "//".');
  }
  const {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick: pick2,
    watch: watchSources,
    immediate,
    getCachedData,
    deep,
    dedupe,
    timeout,
    ...fetchOptions
  } = opts;
  const _fetchOptions = reactive({
    ...fetchDefaults,
    ...fetchOptions,
    cache: typeof opts.cache === "boolean" ? void 0 : opts.cache
  });
  const _asyncDataOptions = {
    server,
    lazy,
    default: defaultFn,
    transform,
    pick: pick2,
    immediate,
    getCachedData,
    deep,
    dedupe,
    timeout,
    watch: watchSources === false ? [] : [...watchSources || [], _fetchOptions]
  };
  const asyncData = useAsyncData(watchSources === false ? key.value : key, (_, { signal }) => {
    let _$fetch = opts.$fetch || globalThis.$fetch;
    if (!opts.$fetch) {
      const isLocalFetch = typeof _request.value === "string" && _request.value[0] === "/" && (!toValue(opts.baseURL) || toValue(opts.baseURL)[0] === "/");
      if (isLocalFetch) {
        _$fetch = useRequestFetch();
      }
    }
    return _$fetch(_request.value, { signal, ..._fetchOptions });
  }, _asyncDataOptions);
  return asyncData;
}
function generateOptionSegments(opts) {
  const segments = [
    toValue(opts.method)?.toUpperCase() || "GET",
    toValue(opts.baseURL)
  ];
  for (const _obj of [opts.query || opts.params]) {
    const obj = toValue(_obj);
    if (!obj) {
      continue;
    }
    const unwrapped = {};
    for (const [key, value] of Object.entries(obj)) {
      unwrapped[toValue(key)] = toValue(value);
    }
    segments.push(unwrapped);
  }
  if (opts.body) {
    const value = toValue(opts.body);
    if (!value) {
      segments.push(hash(value));
    } else if (value instanceof ArrayBuffer) {
      segments.push(hash(Object.fromEntries([...new Uint8Array(value).entries()].map(([k, v]) => [k, v.toString()]))));
    } else if (value instanceof FormData) {
      const obj = {};
      for (const entry of value.entries()) {
        const [key, val] = entry;
        obj[key] = val instanceof File ? val.name : val;
      }
      segments.push(hash(obj));
    } else if (isPlainObject(value)) {
      segments.push(hash(reactive(value)));
    } else {
      try {
        segments.push(hash(value));
      } catch {
        console.warn("[useFetch] Failed to hash body", value);
      }
    }
  }
  return segments;
}
const intervalError = "[nuxt] `setInterval` should not be used on the server. Consider wrapping it with an `onNuxtReady`, `onBeforeMount` or `onMounted` lifecycle hook, or ensure you only call it in the browser by checking `false`.";
const setInterval = () => {
  console.error(intervalError);
};
function usePrinterData(printerId, options = {}) {
  const { pollInterval = 5e3, immediate = true } = options;
  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const connected = ref(false);
  let intervalId = null;
  const fetchData = async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch(`/api/printer/${printerId}`);
      data.value = response;
      connected.value = true;
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to fetch printer data");
      connected.value = false;
    } finally {
      loading.value = false;
    }
  };
  const startPolling = () => {
    if (intervalId) return;
    intervalId = setInterval();
  };
  const stopPolling = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  const refresh = async () => {
    await fetchData();
  };
  const jobData = computed(() => data.value?.data ?? null);
  const files = computed(() => data.value?.files ?? []);
  const telemetry = computed(() => data.value?.printerTelemetry ?? null);
  const nozzleTemp = computed(() => telemetry.value?.temperature?.tool0?.actual ?? 0);
  const nozzleTarget = computed(() => telemetry.value?.temperature?.tool0?.target ?? 0);
  const bedTemp = computed(() => telemetry.value?.temperature?.bed?.actual ?? 0);
  const bedTarget = computed(() => telemetry.value?.temperature?.bed?.target ?? 0);
  const progress = computed(() => {
    const completion = jobData.value?.progress?.completion ?? 0;
    return Math.round(completion * 100);
  });
  const printTimeElapsed = computed(() => jobData.value?.progress?.printTime ?? 0);
  const printTimeRemaining = computed(() => jobData.value?.progress?.printTimeLeft ?? 0);
  const isPrinting = computed(() => jobData.value?.state === "Printing");
  const isPaused = computed(() => jobData.value?.state === "Paused");
  const isIdle = computed(() => jobData.value?.state === "Operational");
  const currentFile = computed(() => jobData.value?.file?.display ?? null);
  return {
    data,
    loading,
    error,
    connected,
    refresh,
    startPolling,
    stopPolling,
    // Shortcuts
    jobData,
    files,
    telemetry,
    nozzleTemp,
    nozzleTarget,
    bedTemp,
    bedTarget,
    progress,
    printTimeElapsed,
    printTimeRemaining,
    isPrinting,
    isPaused,
    isIdle,
    currentFile
  };
}
function usePrinter(printerId) {
  const { data, pending, error, refresh } = useFetch(
    `/api/printer/${printerId}`,
    {
      key: `printer-${printerId}`
    },
    "$0ufrU8gfTA"
  );
  const loading = pending;
  const controlPrint = async (action) => {
    try {
      await $fetch(`/api/printer/${printerId}`, {
        method: "POST",
        body: { command: action }
      });
      await refresh();
      return true;
    } catch (err) {
      console.error(`Failed to ${action} print:`, err);
      return false;
    }
  };
  const startPrint = async (filename) => {
    try {
      await $fetch(`/api/printer/${printerId}`, {
        method: "POST",
        body: { command: "run", filename }
      });
      await refresh();
      return true;
    } catch (err) {
      console.error("Failed to start print:", err);
      return false;
    }
  };
  const getImage = async () => {
    try {
      const response = await $fetch(`/api/printer/${printerId}`, {
        method: "POST",
        body: { command: "img" },
        responseType: "blob"
      });
      return response;
    } catch (err) {
      console.error("Failed to get image:", err);
      return null;
    }
  };
  const pausePrint = () => controlPrint("pause");
  const resumePrint = () => controlPrint("resume");
  const cancelPrint = () => controlPrint("cancel");
  return {
    data,
    loading,
    error,
    refresh,
    controlPrint,
    startPrint,
    getImage,
    pausePrint,
    resumePrint,
    cancelPrint
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    const printerStore = usePrinterStore();
    const { isAdmin } = useAuth();
    const printerId = computed(() => Number(route.params.id));
    const canControl = computed(() => {
      if (!isPrinting.value && !isPaused.value) return true;
      return isAdmin.value;
    });
    const printer = computed(() => printerStore.getPrinterById(printerId.value));
    const sanitizeProgress = (value) => {
      if (value === void 0 || value === null || isNaN(value)) return 0;
      return Math.min(100, Math.max(0, Math.round(value)));
    };
    const {
      data: apiData,
      loading,
      error,
      nozzleTemp,
      bedTemp,
      progress,
      files,
      isPrinting,
      isPaused,
      currentFile,
      printTimeRemaining
    } = usePrinterData(printerId.value);
    const refreshing = ref(false);
    ref(null);
    const uploading = ref(false);
    const uploadProgress = ref(0);
    const uploadError = ref(null);
    const dragOver = ref(false);
    usePrinter(printerId.value);
    const formatTime = (seconds) => {
      if (!seconds || seconds <= 0) return "--:--";
      const h = Math.floor(seconds / 3600);
      const m = Math.floor(seconds % 3600 / 60);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    const formatFileSize = (bytes) => {
      if (!bytes) return "Unknown";
      const mb = bytes / (1024 * 1024);
      return `${mb.toFixed(1)} MB`;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-full bg-zinc-950" }, _attrs))}><header class="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50"><div class="max-w-7xl mx-auto px-6 py-4"><div class="flex items-center gap-4"><button class="btn btn-ghost p-2">`);
      _push(ssrRenderComponent(unref(ArrowLeft), { class: "w-5 h-5" }, null, _parent));
      _push(`</button><div class="flex-1"><h1 class="text-xl font-semibold text-white">${ssrInterpolate(unref(printer)?.name || "Printer")}</h1><p class="text-xs text-zinc-500">${ssrInterpolate(unref(printer)?.model)} • ${ssrInterpolate(unref(printer)?.ipAddr)}</p></div>`);
      if (unref(isPrinting) || unref(isPaused)) {
        _push(`<div class="${ssrRenderClass([
          "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
          unref(isPaused) ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
        ])}"><span class="relative flex h-2 w-2"><span class="${ssrRenderClass([
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          unref(isPaused) ? "bg-yellow-400" : "bg-green-400"
        ])}"></span><span class="${ssrRenderClass([
          "relative inline-flex rounded-full h-2 w-2",
          unref(isPaused) ? "bg-yellow-400" : "bg-green-400"
        ])}"></span></span> ${ssrInterpolate(unref(isPaused) ? "Paused" : "Printing")}</div>`);
      } else if (unref(apiData)) {
        _push(`<div class="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400"> Ready </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="btn btn-secondary flex items-center gap-2"${ssrIncludeBooleanAttr(unref(refreshing)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(unref(RefreshCw), {
        class: ["w-4 h-4", unref(refreshing) && "animate-spin"]
      }, null, _parent));
      _push(` Refresh </button></div></div></header><main class="max-w-7xl mx-auto px-6 py-8">`);
      if (unref(error) && !unref(apiData)) {
        _push(`<div class="text-center py-20"><div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">`);
        _push(ssrRenderComponent(unref(XCircle), { class: "w-8 h-8 text-red-400" }, null, _parent));
        _push(`</div><h3 class="text-lg font-medium text-white mb-2">Connection Failed</h3><p class="text-zinc-500 mb-4">Unable to connect to printer at ${ssrInterpolate(unref(printer)?.ipAddr)}</p><div class="flex gap-3 justify-center"><button class="btn btn-secondary">Go Back</button><button class="btn btn-primary">Retry</button></div></div>`);
      } else if (unref(loading) && !unref(apiData)) {
        _push(`<div class="flex items-center justify-center py-20"><div class="text-center">`);
        _push(ssrRenderComponent(unref(Loader2), { class: "w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" }, null, _parent));
        _push(`<p class="text-zinc-500">Connecting to printer...</p></div></div>`);
      } else {
        _push(`<div class="space-y-6"><div class="grid grid-cols-2 md:grid-cols-4 gap-4"><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Thermometer), { class: "w-4 h-4 text-orange-400" }, null, _parent));
        _push(` Nozzle </div><div class="text-2xl font-bold text-white">${ssrInterpolate(Math.round(unref(nozzleTemp)))}°C</div></div><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Thermometer), { class: "w-4 h-4 text-blue-400" }, null, _parent));
        _push(` Bed </div><div class="text-2xl font-bold text-white">${ssrInterpolate(Math.round(unref(bedTemp)))}°C</div></div><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Gauge), { class: "w-4 h-4 text-green-400" }, null, _parent));
        _push(` Progress </div><div class="text-2xl font-bold text-white">${ssrInterpolate(sanitizeProgress(unref(progress)))}%</div></div><div class="card p-4"><div class="flex items-center gap-2 text-xs text-zinc-500 mb-2">`);
        _push(ssrRenderComponent(unref(Clock), { class: "w-4 h-4 text-purple-400" }, null, _parent));
        _push(` Time Left </div><div class="text-2xl font-bold text-white">${ssrInterpolate(formatTime(unref(printTimeRemaining)))}</div></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-1 space-y-6"><div class="card"><div class="p-4 border-b border-zinc-800"><h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Current Print</h2></div><div class="p-4">`);
        if (unref(isPrinting) || unref(isPaused)) {
          _push(`<div class="space-y-4"><div class="flex items-start gap-3"><div class="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">`);
          _push(ssrRenderComponent(unref(Layers), { class: "w-5 h-5 text-orange-400" }, null, _parent));
          _push(`</div><div class="flex-1 min-w-0"><div class="text-white font-medium truncate">${ssrInterpolate(unref(currentFile) || "Unknown file")}</div><div class="text-xs text-zinc-500 mt-0.5">${ssrInterpolate(unref(isPaused) ? "Paused" : "Printing")} • ${ssrInterpolate(formatTime(unref(printTimeRemaining)))} remaining </div></div></div><div><div class="flex justify-between text-sm mb-2"><span class="text-zinc-400">Progress</span><span class="text-white font-medium">${ssrInterpolate(sanitizeProgress(unref(progress)))}%</span></div><div class="h-3 bg-zinc-800 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500" style="${ssrRenderStyle({ width: `${sanitizeProgress(unref(progress))}%` })}"></div></div></div>`);
          if (unref(isAdmin)) {
            _push(`<div class="flex gap-2 pt-2">`);
            if (unref(isPaused)) {
              _push(`<button class="btn btn-primary flex-1 flex items-center justify-center gap-2">`);
              _push(ssrRenderComponent(unref(Play), { class: "w-4 h-4" }, null, _parent));
              _push(` Resume </button>`);
            } else {
              _push(`<button class="btn btn-secondary flex-1 flex items-center justify-center gap-2">`);
              _push(ssrRenderComponent(unref(Pause), { class: "w-4 h-4" }, null, _parent));
              _push(` Pause </button>`);
            }
            _push(`<button class="btn btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4">`);
            _push(ssrRenderComponent(unref(Square), { class: "w-4 h-4" }, null, _parent));
            _push(`</button></div>`);
          } else {
            _push(`<div class="pt-2 text-center"><p class="text-xs text-zinc-500">Only admins can control active prints</p></div>`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="text-center py-8"><div class="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">`);
          _push(ssrRenderComponent(unref(CheckCircle), { class: "w-7 h-7 text-zinc-600" }, null, _parent));
          _push(`</div><p class="text-zinc-500 mb-1">No active print</p><p class="text-xs text-zinc-600">Select a file below to start printing</p></div>`);
        }
        _push(`</div></div><div class="card"><div class="p-4 border-b border-zinc-800"><h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide">Upload File</h2></div><div class="p-4">`);
        if ((unref(isPrinting) || unref(isPaused)) && !unref(isAdmin)) {
          _push(`<div class="text-center py-6">`);
          _push(ssrRenderComponent(unref(Upload), { class: "w-8 h-8 text-zinc-600 mx-auto mb-2" }, null, _parent));
          _push(`<p class="text-zinc-500 text-sm">Upload disabled while printing</p><p class="text-xs text-zinc-600 mt-1">Only admins can upload during active prints</p></div>`);
        } else if (unref(uploading)) {
          _push(`<div class="space-y-4"><div class="flex items-center gap-3">`);
          _push(ssrRenderComponent(unref(Loader2), { class: "w-5 h-5 text-orange-400 animate-spin" }, null, _parent));
          _push(`<div class="flex-1"><div class="flex justify-between text-sm mb-1"><span class="text-zinc-400">Uploading...</span><span class="text-white font-medium">${ssrInterpolate(unref(uploadProgress))}%</span></div><div class="h-2 bg-zinc-800 rounded-full overflow-hidden"><div class="h-full bg-orange-500 transition-all duration-300" style="${ssrRenderStyle({ width: `${unref(uploadProgress)}%` })}"></div></div></div></div></div>`);
        } else {
          _push(`<div><label class="${ssrRenderClass([
            "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all",
            unref(dragOver) ? "border-orange-500 bg-orange-500/10" : "border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/30"
          ])}">`);
          _push(ssrRenderComponent(unref(Upload), {
            class: ["w-8 h-8 mb-2", unref(dragOver) ? "text-orange-400" : "text-zinc-500"]
          }, null, _parent));
          _push(`<span class="text-white font-medium text-sm">Drop .gcode file here</span><span class="text-xs text-zinc-500 mt-1">or click to browse</span><input type="file" accept=".gcode" class="hidden"></label>`);
          if (unref(uploadError)) {
            _push(`<div class="mt-3 flex items-center gap-2 text-sm text-red-400">`);
            _push(ssrRenderComponent(unref(AlertCircle), { class: "w-4 h-4" }, null, _parent));
            _push(` ${ssrInterpolate(unref(uploadError))}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        }
        _push(`</div></div></div><div class="lg:col-span-2"><div class="card"><div class="p-4 border-b border-zinc-800 flex items-center justify-between"><h2 class="text-sm font-medium text-zinc-400 uppercase tracking-wide"> Files on Printer </h2><span class="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full">${ssrInterpolate(unref(files).length)} files </span></div>`);
        if (unref(loading) && unref(files).length === 0) {
          _push(`<div class="flex items-center justify-center py-16">`);
          _push(ssrRenderComponent(unref(Loader2), { class: "w-6 h-6 text-zinc-500 animate-spin" }, null, _parent));
          _push(`</div>`);
        } else if (unref(files).length === 0) {
          _push(`<div class="text-center py-16">`);
          _push(ssrRenderComponent(unref(FileText), { class: "w-12 h-12 text-zinc-700 mx-auto mb-3" }, null, _parent));
          _push(`<p class="text-zinc-500 mb-1">No files on printer</p><p class="text-xs text-zinc-600">Upload a .gcode file to get started</p></div>`);
        } else {
          _push(`<div class="divide-y divide-zinc-800 max-h-[600px] overflow-y-auto"><!--[-->`);
          ssrRenderList(unref(files), (file) => {
            _push(`<div class="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors group"><div class="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">`);
            _push(ssrRenderComponent(unref(FileText), { class: "w-6 h-6 text-zinc-500" }, null, _parent));
            _push(`</div><div class="flex-1 min-w-0"><p class="text-white font-medium truncate">${ssrInterpolate(file.display || file.name)}</p><div class="flex items-center gap-3 text-xs text-zinc-500 mt-1"><span class="flex items-center gap-1">`);
            _push(ssrRenderComponent(unref(Clock), { class: "w-3 h-3" }, null, _parent));
            _push(` ${ssrInterpolate(file.refs?.printTime || "Unknown time")}</span>`);
            if (file.size) {
              _push(`<span>${ssrInterpolate(formatFileSize(file.size))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div><div class="flex items-center gap-2">`);
            if (unref(canControl)) {
              _push(`<button class="btn btn-primary flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"${ssrIncludeBooleanAttr(unref(isPrinting) || unref(isPaused)) ? " disabled" : ""}>`);
              _push(ssrRenderComponent(unref(Play), { class: "w-4 h-4" }, null, _parent));
              _push(` Print </button>`);
            } else {
              _push(`<span class="text-xs text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"> Printing in progress </span>`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div></div></div></div>`);
      }
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/printer/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_id_-iJEfk2GW.mjs.map
