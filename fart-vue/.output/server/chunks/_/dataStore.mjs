import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || "./data";
const DATA_FILE = join(DATA_DIR, "fart-data.json");
const ADMIN_NAME = "stembassadors";
const DEFAULT_ADMIN_CODE = "1264";
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}
function getDefaultData() {
  return {
    users: [],
    printLogs: [],
    sessions: [],
    adminCode: DEFAULT_ADMIN_CODE
  };
}
function loadData() {
  ensureDataDir();
  if (!existsSync(DATA_FILE)) {
    const defaultData = getDefaultData();
    saveData(defaultData);
    return defaultData;
  }
  try {
    const content = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    const defaultData = getDefaultData();
    saveData(defaultData);
    return defaultData;
  }
}
function saveData(data) {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function getUsers() {
  return loadData().users;
}
function getUserByName(name) {
  return loadData().users.find((u) => u.name.toLowerCase() === name.toLowerCase());
}
function generateUniquePin() {
  const data = loadData();
  const existingPins = new Set(data.users.map((u) => u.pin));
  let pin;
  do {
    pin = Math.floor(1e3 + Math.random() * 9e3).toString();
  } while (existingPins.has(pin));
  return pin;
}
function findOrCreateUser(name) {
  const existing = getUserByName(name);
  if (existing) {
    return existing;
  }
  const data = loadData();
  const user = {
    pin: generateUniquePin(),
    name: name.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  data.users.push(user);
  saveData(data);
  return user;
}
function isAdminLogin(name, code) {
  const data = loadData();
  const adminCode = data.adminCode || DEFAULT_ADMIN_CODE;
  return name.toLowerCase() === ADMIN_NAME.toLowerCase() && code === adminCode;
}
function getAdminCode() {
  const data = loadData();
  return data.adminCode || DEFAULT_ADMIN_CODE;
}
function setAdminCode(newCode) {
  if (!/^\d+$/.test(newCode)) {
    return false;
  }
  const data = loadData();
  data.adminCode = newCode;
  saveData(data);
  return true;
}
function getAdminName() {
  return ADMIN_NAME;
}
function deleteUser(pin) {
  const data = loadData();
  const index = data.users.findIndex((u) => u.pin === pin);
  if (index === -1) return false;
  data.users.splice(index, 1);
  saveData(data);
  return true;
}
function createSession(pin, userName, isAdmin = false) {
  const data = loadData();
  data.sessions = data.sessions.filter((s) => s.pin !== pin);
  const session = {
    id: generateId(),
    pin,
    userName,
    isAdmin,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  };
  data.sessions.push(session);
  saveData(data);
  return session;
}
function getSession(sessionId) {
  return loadData().sessions.find((s) => s.id === sessionId);
}
function updateSessionActivity(sessionId) {
  const data = loadData();
  const session = data.sessions.find((s) => s.id === sessionId);
  if (session) {
    session.lastActive = (/* @__PURE__ */ new Date()).toISOString();
    saveData(data);
  }
}
function deleteSession(sessionId) {
  const data = loadData();
  data.sessions = data.sessions.filter((s) => s.id !== sessionId);
  saveData(data);
}
function getActiveSessions() {
  const data = loadData();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3).toISOString();
  return data.sessions.filter((s) => s.lastActive > oneHourAgo);
}
function createPrintLog(userPin, userName, printerId, printerName, fileName) {
  const data = loadData();
  const log = {
    id: generateId(),
    userPin,
    userName,
    printerId,
    printerName,
    fileName,
    startedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "printing",
    progress: 0,
    notified: false
  };
  data.printLogs.push(log);
  saveData(data);
  return log;
}
function updatePrintLog(id, updates) {
  const data = loadData();
  const log = data.printLogs.find((l) => l.id === id);
  if (!log) return null;
  Object.assign(log, updates);
  saveData(data);
  return log;
}
function getPrintLogs(limit = 50) {
  const data = loadData();
  return data.printLogs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, limit);
}
function getActivePrintLogs() {
  return loadData().printLogs.filter((l) => l.status === "printing");
}
function getUnnotifiedCompletedPrints(userPin) {
  return loadData().printLogs.filter(
    (l) => l.userPin === userPin && l.status === "completed" && !l.notified
  );
}
function markPrintNotified(id) {
  updatePrintLog(id, { notified: true });
}
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export { getUsers as a, getPrintLogs as b, getActivePrintLogs as c, getActiveSessions as d, getAdminCode as e, getAdminName as f, getSession as g, getUserByName as h, findOrCreateUser as i, deleteUser as j, isAdminLogin as k, createSession as l, deleteSession as m, updateSessionActivity as n, createPrintLog as o, getUnnotifiedCompletedPrints as p, markPrintNotified as q, setAdminCode as s, updatePrintLog as u };
//# sourceMappingURL=dataStore.mjs.map
