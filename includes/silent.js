// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ══════════════════════════════════════════════

const fs = require("fs");
const path = require("path");
const { AsyncLocalStorage } = require("async_hooks");

const STATE_FILE = path.join(__dirname, "..", "Script", "commands", "cache", "silent.json");

const als = new AsyncLocalStorage();

// state.threads = { "<threadID>": { by, at } }  → লিস্টে থাকা গ্রুপগুলো silent
let state = { threads: {} };
try {
  if (fs.existsSync(STATE_FILE)) {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (saved && typeof saved.threads === "object" && saved.threads) state.threads = saved.threads;
  }
} catch (_) {}

function save() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.log("[SILENT] state save error:", e.message);
  }
}

// credit চেক বন্ধ: অন্য ফাইল কল করলেও যেন এরর না হয়, তাই সবসময় true
function creditOk() {
  return true;
}

// config.json-এ থাকা যেকোনো UID (ADMINBOT + DEVELOPER)
function isAdmin(id) {
  const cfg = global.config || {};
  const list = [...(cfg.ADMINBOT || []), ...(cfg.DEVELOPER || [])].map(String);
  if (list.includes(String(id))) return true;
  try { return !!(global.isDeveloper && global.isDeveloper(String(id))); } catch (_) { return false; }
}

function isEnabled(threadID) {
  return !!state.threads[String(threadID)];
}

function isActive(threadID) {
  return isEnabled(threadID);
}

function set(threadID, on, by) {
  const tid = String(threadID);
  if (on === true) state.threads[tid] = { by: by ? String(by) : null, at: new Date().toISOString() };
  else delete state.threads[tid];
  save();
}

function listThreads() {
  return Object.keys(state.threads);
}

function runAsAdmin(fn) {
  return als.run({ adminBypass: true }, fn);
}
function inAdminContext() {
  const s = als.getStore();
  return !!(s && s.adminBypass);
}

// কোন মেথডের কোন আর্গুমেন্ট threadID
const GUARDED = { sendMessage: 1, sendMessageMqtt: 1, sendTypingIndicator: 0, shareContact: 2 };

function guardApi(api) {
  if (!api || api.__silentGuarded) return api;
  for (const name of Object.keys(GUARDED)) {
    const original = api[name];
    if (typeof original !== "function") continue;
    const idx = GUARDED[name];
    api[name] = function (...args) {
      const tid = args[idx];
      if ((typeof tid === "string" || typeof tid === "number") && isActive(tid) && !inAdminContext()) {
        return Promise.resolve({ silenced: true });
      }
      return original.apply(this, args);
    };
  }
  Object.defineProperty(api, "__silentGuarded", { value: true, enumerable: false });
  return api;
}

module.exports = {
  isActive,
  isEnabled,
  isAdmin,
  creditOk,
  set,
  listThreads,
  runAsAdmin,
  inAdminContext,
  guardApi
};
