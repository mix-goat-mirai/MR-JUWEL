// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// includes/power.js — Bot ON/OFF (Standby) engine
//
//  • bot off → bot goes on standby: no replies, commands, events or auto messages
//  • bot off 30m / 2h / 1d → auto ON after that time
//  • bot on  → bot is back, uptime restarts from zero, notice is sent
//  • bot status → status card
//  • plain "bot" (no command) is ignored here — the baby command replies
//  • only ADMINBOT (config.json) can use these commands
//  • non-admins using on/off/status get NO reply (silent)
//  • OFF state is saved to a file, so it survives restarts/crashes
// ══════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const sha = s => crypto.createHash("sha256").update(String(s == null ? "" : s).normalize("NFC")).digest("hex");

/* ───────────── Credit check ───────────── */
let _warned = false;
function botCmdCredits() {
  try {
    const cmd = global.client && global.client.commands && global.client.commands.get("bot");
    if (cmd && cmd.config && sha(cmd.config.credits) === CREDIT_HASH) return cmd.config.credits;
  } catch (_) {}
  try {
    const own = require(path.join(__dirname, "..", "Script", "commands", "bot.js"));
    if (own && own.config) return own.config.credits;
  } catch (_) {}
  return null;
}
function creditOk() {
  try {
    if (sha(CREDIT) !== CREDIT_HASH) {
      if (!_warned) { _warned = true; console.log("[POWER] CREDIT line in power.js was modified (hash mismatch)"); }
      return false;
    }
    const c = botCmdCredits();
    if (c == null || sha(c) !== CREDIT_HASH) {
      if (!_warned) { _warned = true; console.log("[POWER] credits line in bot.js was modified or bot.js not found"); }
      return false;
    }
    return true;
  } catch (_) { return false; }
}

/* ───────────── State ───────────── */
const STATE_FILE = path.join(__dirname, "..", "Script", "commands", "cache", "power.json");
const ON_WORDS = ["bot on", "boton", "বট অন", "বটঅন"];
const OFF_WORDS = ["bot off", "botoff", "বট অফ", "বটঅফ"];
const STATUS_WORDS = ["bot status", "botstatus", "বট স্ট্যাটাস"];

let startedAt = Date.now();
if (!process.__powerUptimePatched) {
  process.uptime = () => (Date.now() - startedAt) / 1000;
  process.__powerUptimePatched = true;
}

let state = { enabled: true, offAt: null, offBy: null };
try {
  if (fs.existsSync(STATE_FILE)) {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (s && typeof s === "object") state = Object.assign(state, s);
  }
} catch (_) {}

function save() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) { console.log("[POWER] save error:", e.message); }
}

/* ───────────── Stats & total uptime (saved to file) ───────────── */
const STATS_FILE = path.join(__dirname, "..", "Script", "commands", "cache", "power_stats.json");
let stats = { date: "", messages: 0, commands: 0, total: 0, days: {} };
try {
  if (fs.existsSync(STATS_FILE)) {
    const s2 = JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
    if (s2 && typeof s2 === "object") stats = Object.assign(stats, s2);
  }
} catch (_) {}
if (!stats.days || typeof stats.days !== "object") stats.days = {};

let statsDirty = false;
let lastTick = Date.now();
let apiRef = null;

function todayKey(ts) {
  try { return new Date(ts == null ? Date.now() : ts).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" }); }
  catch (_) { return new Date(ts == null ? Date.now() : ts).toISOString().slice(0, 10); }
}
function ensureDay() {
  const k = todayKey();
  if (stats.date !== k) { stats.date = k; stats.messages = 0; stats.commands = 0; statsDirty = true; }
}
function saveStats() {
  try {
    fs.mkdirSync(path.dirname(STATS_FILE), { recursive: true });
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    statsDirty = false;
  } catch (e) { console.log("[POWER] stats save error:", e.message); }
}
// adds online time (only while the bot is ON)
function tick() {
  const now = Date.now();
  const dt = now - lastTick;
  lastTick = now;
  ensureDay();
  if (state.enabled !== false && dt > 0 && dt < 600000) {
    stats.days[stats.date] = (stats.days[stats.date] || 0) + dt;
    stats.total = (stats.total || 0) + dt;
    statsDirty = true;
  }
  const keys = Object.keys(stats.days).sort();
  while (keys.length > 60) delete stats.days[keys.shift()];
}
function weekOnline() {
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += stats.days[todayKey(Date.now() - i * 86400000)] || 0;
  return sum;
}
function countMsg(event) {
  ensureDay();
  stats.messages++;
  statsDirty = true;
  try {
    const t = String(event.body || "").trim();
    const prefix = String((global.config && global.config.PREFIX) || ".");
    if (prefix && t.startsWith(prefix)) {
      const name = t.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
      if (name && global.client && global.client.commands && global.client.commands.has(name)) stats.commands++;
    }
  } catch (_) {}
}
setInterval(() => { tick(); if (statsDirty) saveStats(); }, 30000).unref();
process.on("exit", () => { try { tick(); saveStats(); } catch (_) {} });

function isOn() { return !creditOk() || state.enabled !== false; }

function isAdmin(id) {
  const list = ((global.config && global.config.ADMINBOT) || []).map(String);
  return list.includes(String(id));
}

/* ───────────── Fonts & formatting ───────────── */
// A-Z a-z 0-9  →  𝗔𝗕𝗖 𝗮𝗯𝗰 𝟬𝟭𝟮
function bold(str) {
  return String(str).replace(/[A-Za-z0-9]/g, c => {
    const k = c.charCodeAt(0);
    if (k >= 65 && k <= 90) return String.fromCodePoint(0x1D5D4 + k - 65);
    if (k >= 97 && k <= 122) return String.fromCodePoint(0x1D5EE + k - 97);
    return String.fromCodePoint(0x1D7EC + k - 48);
  });
}

// "30m", "2h", "1h30m", "45s", "1d"  →  milliseconds (0 = no timer)
function parseDuration(str) {
  if (!str) return 0;
  const units = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  const re = /(\d+)\s*(days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/gi;
  let total = 0, m;
  while ((m = re.exec(String(str))) !== null) total += parseInt(m[1], 10) * units[m[2][0].toLowerCase()];
  if (!total) return 0;
  return Math.min(Math.max(total, 5000), 30 * 86400000);
}

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = [];
  if (d) p.push(d + " day" + (d > 1 ? "s" : ""));
  if (d || h) p.push(h + " hr");
  if (d || h || m) p.push(m + " min");
  p.push(sec + " sec");
  return p.join(" ");
}

function stamp(ts) {
  try { return new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { return new Date(ts).toISOString(); }
}

function frame(title, rows) {
  const botName = (global.config && global.config.BOTNAME) || "Bot";
  return [
    "╭━━━━━━━━━━━━━━━━━━━━━━╮",
    "┃  " + bold(title),
    "┣━━━━━━━━━━━━━━━━━━━━━━┫",
    "┃ 🤖 " + bold("Bot") + ": " + botName,
    ...rows.map(r => "┃ " + bold(r)),
    "┣━━━━━━━━━━━━━━━━━━━━━━┫",
    "┃ 👑 " + bold("Credit") + ": " + CREDIT,
    "╰━━━━━━━━━━━━━━━━━━━━━━╯"
  ].join("\n");
}

function notice(text) {
  return frame("⚠️ NOTICE", [text]);
}

// Extra feature info shown on ON / STATUS notices
function infoRows() {
  const rows = [];
  try {
    const g = global;
    rows.push("🔣 Prefix: " + ((g.config && g.config.PREFIX) || "."));
    if (g.client && g.client.commands) rows.push("📦 Commands: " + g.client.commands.size);
    if (g.data && g.data.allThreadID) rows.push("👥 Groups: " + g.data.allThreadID.length);
    if (g.data && g.data.allUserID) rows.push("👤 Users: " + g.data.allUserID.length);
    rows.push("🛡️ Admins: " + (((g.config && g.config.ADMINBOT) || []).length));
    rows.push("💾 Memory: " + Math.round(process.memoryUsage().rss / 1048576) + " MB");
    rows.push("🧩 Node: " + process.version);
    tick();
    rows.push("📨 Messages today: " + stats.messages);
    rows.push("⌨️ Commands today: " + stats.commands);
    rows.push("🟢 Online today: " + fmt(stats.days[stats.date] || 0));
    rows.push("📅 Online this week: " + fmt(weekOnline()));
    rows.push("🏆 Online all-time: " + fmt(stats.total || 0));
  } catch (_) {}
  return rows;
}

/* ───────────── Silence the bot's own outgoing calls while OFF ───────────── */
const GUARDED = [
  "sendMessage", "sendMessageMqtt", "sendTypingIndicator", "shareContact", "setMessageReaction",
  "unsendMessage", "setTitle", "changeNickname", "markAsRead", "markAsReadAll", "markAsSeen",
  "markAsDelivered", "changeGroupImage", "addUserToGroup", "removeUserFromGroup",
  "changeAdminStatus", "changeThreadColor", "changeThreadEmoji", "createPoll",
  "handleMessageRequest", "forwardAttachment", "changeBio", "setPostReaction", "follow"
];
const originals = {};
let bypass = 0; // lets the OFF notice finish sending

function guardApi(api) {
  if (!api) return api;
  apiRef = api;
  for (const name of GUARDED) {
    const original = api[name];
    if (typeof original !== "function" || original.__powerWrapped) continue;
    originals[name] = original.bind(api);
    const wrapped = function (...args) {
      if (!isOn() && !bypass) {
        const cb = args.find(a => typeof a === "function");
        if (cb) { try { cb(null, { powerOff: true }); } catch (_) {} }
        return Promise.resolve({ powerOff: true });
      }
      return original.apply(this, args);
    };
    wrapped.__powerWrapped = true;
    api[name] = wrapped;
  }
  return api;
}

function rawSend(api, text, threadID, replyTo, done) {
  try {
    const fn = originals.sendMessage || api.sendMessage.bind(api);
    const cb = () => { try { if (done) done(); } catch (_) {} };
    const send = () => fn(text, threadID, cb, replyTo);
    try {
      const silent = require("./silent");
      return silent.runAsAdmin(send);
    } catch (_) { return send(); }
  } catch (e) { console.log("[POWER] send error:", e.message); if (done) done(); }
}

/* ───────────── ON / OFF / STATUS ───────────── */
function turnOff(api, event, ms) {
  if (!creditOk()) return;
  tick();
  const now = Date.now();
  const until = ms && ms > 0 ? now + ms : null;
  bypass++;
  let released = false;
  const release = () => { if (!released) { released = true; bypass = Math.max(0, bypass - 1); } };
  setTimeout(release, 15000);
  const rows = [
    "⏱️ Was online for: " + fmt(now - startedAt),
    "🕒 Online since: " + stamp(startedAt),
    "🕒 Turned off at: " + stamp(now)
  ];
  if (until) {
    rows.push("⏰ Auto ON in: " + fmt(ms));
    rows.push("🕒 Back at: " + stamp(until));
    rows.push("💤 Admin can also send \"bot on\" anytime.");
  } else {
    rows.push("💤 Now listening only for the");
    rows.push("    admin's \"bot on\" command.");
  }
  rawSend(api, frame("🔴 BOT OFF ⛔", rows), event.threadID, event.messageID, release);
  state.enabled = false;
  state.offAt = now;
  state.offBy = String(event.senderID);
  state.offUntil = until;
  state.offThread = String(event.threadID || "");
  save();
  saveStats();
  console.log("[POWER] Bot OFF, by " + event.senderID + (until ? " (auto ON at " + stamp(until) + ")" : ""));
}

function turnOn(api, event, auto) {
  if (!creditOk()) return;
  const now = Date.now();
  state.enabled = true; state.offAt = null; state.offBy = null; state.offUntil = null; state.offThread = null;
  lastTick = now;
  save();
  startedAt = now;
  try { if (global.client) global.client.timeStart = now; } catch (_) {}
  // NOTE: the old OFF duration is intentionally NOT shown — uptime starts fresh
  rawSend(api, frame("🟢 BOT ON ✅", [
    ...(auto ? ["⏰ Timer ended, auto resumed"] : []),
    "🆕 New uptime started",
    "⏱️ Uptime: 0 sec",
    "🕒 Online since: " + stamp(now),
    "📡 Status: Online ✅",
    ...infoRows(),
    "⚡ Bot is now fully active!"
  ]), event.threadID, event.messageID);
  console.log("[POWER] Bot ON, by " + event.senderID);
}

function status(api, event) {
  rawSend(api, frame(isOn() ? "🟢 BOT STATUS" : "🔴 BOT STATUS", [
    "📡 Status: " + (isOn() ? "Online ✅" : "Offline ⛔"),
    "⏱️ Uptime: " + fmt(Date.now() - startedAt),
    "🕒 Time now: " + stamp(Date.now()),
    ...infoRows()
  ]), event.threadID, event.messageID);
}

// Timer watcher: when "bot off 30m" expires, the bot turns itself ON again
setInterval(() => {
  try {
    if (state.enabled === false && state.offUntil && Date.now() >= state.offUntil && apiRef && creditOk()) {
      const admins = (global.config && global.config.ADMINBOT) || [];
      const threadID = state.offThread || String(admins[0] || "");
      if (!threadID) { state.enabled = true; state.offUntil = null; save(); return; }
      turnOn(apiRef, { threadID, messageID: undefined, senderID: "auto-timer" }, true);
    }
  } catch (e) { console.log("[POWER] timer error:", e && e.message); }
}, 5000).unref();

// Only real commands match: bot on / bot off [time] / bot status.
// Plain "bot" returns null → ignored here, baby command replies.
function parseCmd(t) {
  const m = String(t).match(/^(bot ?off|বট ?অফ)(?: (.+))?$/);
  if (m) return { type: "off", ms: parseDuration(m[2]) };
  if (ON_WORDS.includes(t)) return { type: "on" };
  if (STATUS_WORDS.includes(t)) return { type: "status" };
  return null;
}

function norm(body) {
  let t = String(body || "").trim().replace(/\s+/g, " ").toLowerCase();
  const prefix = String((global.config && global.config.PREFIX) || ".").toLowerCase();
  if (prefix && t.startsWith(prefix)) t = t.slice(prefix.length).trim();
  return t;
}

/** Called at the start of listen.js. true = event is fully handled here. */
function gate(api, event) {
  try {
    if (!creditOk()) return false;
    guardApi((global.client && global.client.api) || api);
    const isMsg = event && (event.type === "message" || event.type === "message_reply");
    if (isMsg) {
      const t = norm(event.body);
      const cmd = parseCmd(t);
      const isCmd = !!cmd;

      // Not a bot admin → completely silent. No reply, and the event is
      // swallowed here so no other command/handler answers it either.
      if (isCmd && !isAdmin(event.senderID)) {
        return true;
      }

      if (isCmd && isAdmin(event.senderID)) {
        if (cmd.type === "status") { status(api, event); return true; }
        if (cmd.type === "off") { if (isOn()) turnOff(api, event, cmd.ms); return true; }
        if (!isOn()) turnOn(api, event); else status(api, event);
        return true;
      }
    }
    if (isMsg && isOn()) countMsg(event);
    return !isOn();
  } catch (e) {
    console.log("[POWER] gate error:", e && e.message);
    return false;
  }
}

module.exports = { parseDuration, bold, notice, frame, CREDIT, gate, guardApi, isOn, isAdmin, turnOn, turnOff, status, creditOk, norm, ON_WORDS, OFF_WORDS };
