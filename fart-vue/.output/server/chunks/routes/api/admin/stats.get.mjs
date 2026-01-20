import { d as defineEventHandler, g as getCookie, c as createError } from '../../../nitro/nitro.mjs';
import { g as getSession, a as getUsers, b as getPrintLogs, c as getActivePrintLogs, d as getActiveSessions, u as updatePrintLog, e as getAdminCode, f as getAdminName } from '../../../_/dataStore.mjs';
import { b as getAllPrinters, g as getPrinterById } from '../../../_/printerStore.mjs';
import { P as PrinterClient } from '../../../_/printerClient.mjs';
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

const FILAMENT_COST_PER_KG = 25;
const FILAMENT_COST_PER_GRAM = FILAMENT_COST_PER_KG / 1e3;
const ELECTRICITY_COST_PER_HOUR = 0.05;
const FILAMENT_GRAMS_PER_HOUR = 10;
async function getPrinterLiveStatus(printerId) {
  var _a, _b, _c;
  const printer = getPrinterById(printerId);
  if (!printer) {
    return { online: false, isPrinting: false, currentFile: null, progress: 0, timeRemaining: 0, state: "Unknown" };
  }
  const client = new PrinterClient(printer);
  try {
    const [jobData, printerData] = await Promise.all([
      client.getJobStatus(),
      client.getPrinterData()
    ]);
    const isPrinting = jobData.state === "Printing" || jobData.state === "Paused";
    const currentFile = ((_a = jobData.file) == null ? void 0 : _a.name) || null;
    const progress = ((_b = jobData.progress) == null ? void 0 : _b.completion) || 0;
    const timeRemaining = ((_c = jobData.progress) == null ? void 0 : _c.printTimeLeft) || 0;
    return {
      online: true,
      isPrinting,
      currentFile,
      progress,
      timeRemaining,
      state: jobData.state
    };
  } catch {
    return { online: false, isPrinting: false, currentFile: null, progress: 0, timeRemaining: 0, state: "Offline" };
  }
}
function estimateCosts(elapsedSeconds, totalEstimatedSeconds) {
  const totalHours = (totalEstimatedSeconds > 0 ? totalEstimatedSeconds : elapsedSeconds) / 3600;
  const filamentGrams = totalHours * FILAMENT_GRAMS_PER_HOUR;
  const filamentCost = filamentGrams * FILAMENT_COST_PER_GRAM;
  const electricityCost = totalHours * ELECTRICITY_COST_PER_HOUR;
  return {
    filament: Math.round(filamentCost * 100) / 100,
    electricity: Math.round(electricityCost * 100) / 100,
    total: Math.round((filamentCost + electricityCost) * 100) / 100
  };
}
const stats_get = defineEventHandler(async (event) => {
  const sessionId = getCookie(event, "fart-session");
  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }
  const session = getSession(sessionId);
  if (!session || !session.isAdmin) {
    throw createError({ statusCode: 403, statusMessage: "Admin access required" });
  }
  const users = getUsers();
  const printLogs = getPrintLogs(100);
  const activePrints = getActivePrintLogs();
  const activeSessions = getActiveSessions();
  const printers = getAllPrinters();
  const printsByPrinter = /* @__PURE__ */ new Map();
  for (const print of activePrints) {
    const existing = printsByPrinter.get(print.printerId);
    if (!existing || new Date(print.startedAt) > new Date(existing.startedAt)) {
      printsByPrinter.set(print.printerId, print);
    }
  }
  const dedupedActivePrints = Array.from(printsByPrinter.values());
  const activePrintsWithStatus = await Promise.all(
    dedupedActivePrints.map(async (print) => {
      const liveStatus = await getPrinterLiveStatus(print.printerId);
      const startTime = new Date(print.startedAt).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1e3);
      const stillRunning = liveStatus.online && liveStatus.isPrinting && liveStatus.currentFile !== null && (liveStatus.currentFile === print.fileName || print.fileName.includes(liveStatus.currentFile) || liveStatus.currentFile.includes(print.fileName.replace(".gcode", "")));
      const currentProgress = stillRunning ? liveStatus.progress : print.progress;
      const totalEstimatedSeconds = stillRunning ? elapsedSeconds + liveStatus.timeRemaining : elapsedSeconds;
      const estimatedCost = estimateCosts(elapsedSeconds, totalEstimatedSeconds);
      if (stillRunning && Math.abs(currentProgress - print.progress) > 1) {
        updatePrintLog(print.id, { progress: currentProgress });
      }
      if (!stillRunning && liveStatus.online && print.status === "printing") {
        if (print.progress >= 95 || currentProgress >= 95) {
          updatePrintLog(print.id, {
            status: "completed",
            progress: 100,
            completedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      return {
        id: print.id,
        userName: print.userName,
        printerName: print.printerName,
        printerId: print.printerId,
        fileName: print.fileName,
        startedAt: print.startedAt,
        progress: print.progress,
        // Live status
        printerOnline: liveStatus.online,
        stillRunning,
        liveProgress: currentProgress,
        timeRemaining: liveStatus.timeRemaining,
        // Cost estimation
        estimatedCost,
        elapsedTime: elapsedSeconds
      };
    })
  );
  const recentPrintsWithCosts = printLogs.slice(0, 20).map((log) => {
    const startTime = new Date(log.startedAt).getTime();
    const endTime = log.completedAt ? new Date(log.completedAt).getTime() : Date.now();
    const elapsedSeconds = Math.floor((endTime - startTime) / 1e3);
    const cost = estimateCosts(elapsedSeconds, elapsedSeconds);
    return {
      ...log,
      estimatedCost: cost,
      elapsedTime: elapsedSeconds
    };
  });
  const completedPrints = recentPrintsWithCosts.filter((p) => p.status === "completed");
  const totalCosts = {
    filament: completedPrints.reduce((sum, p) => sum + p.estimatedCost.filament, 0),
    electricity: completedPrints.reduce((sum, p) => sum + p.estimatedCost.electricity, 0),
    total: completedPrints.reduce((sum, p) => sum + p.estimatedCost.total, 0),
    printCount: completedPrints.length
  };
  return {
    stats: {
      totalUsers: users.length,
      activeUsers: activeSessions.length,
      totalPrints: printLogs.length,
      activePrints: activePrintsWithStatus.filter((p) => p.stillRunning).length,
      totalPrinters: printers.length
    },
    adminName: getAdminName(),
    adminCode: getAdminCode(),
    activePrints: activePrintsWithStatus,
    recentPrints: recentPrintsWithCosts,
    totalCosts,
    activeSessions: activeSessions.map((s) => ({
      userName: s.userName,
      lastActive: s.lastActive
    })),
    users: users.map((u) => ({
      pin: u.pin,
      name: u.name,
      createdAt: u.createdAt
    })),
    // Full printer info for management
    printers: printers.map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model,
      ipAddr: p.ipAddr,
      apiKey: p.apiKey,
      status: p.status
    })),
    // Cost configuration for display
    costConfig: {
      filamentPerKg: FILAMENT_COST_PER_KG,
      electricityPerHour: ELECTRICITY_COST_PER_HOUR
    }
  };
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
