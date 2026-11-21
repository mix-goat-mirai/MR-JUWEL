const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/* ★★★ এখানে শুধু আপনার নিজের (মানুষের) Facebook UID বসান — যে অ্যাকাউন্ট থেকে আপনি কমান্ড দেন ★★★
   এটা ফাঁকা থাকলে ফিচার বন্ধ থাকবে। এই কোড সব ইউজারের বটে যাবে, তাই এখানে শুধু আপনার UID রাখুন। */
const OWNER_UIDS = [
   "61596105511947",
   "100000000000002",
   "100000000000003",
];

/* ★ আইডি সাসপেন্ড হলে: নিচের যেকোনো নামের অ্যাকাউন্ট থেকে দেওয়া stop / on / status কমান্ডও মানা হবে।
   (setmaster / delmaster শুধু OWNER_UIDS পারবে — নাম নকল করা সহজ, তাই এ দুটো নামে খোলা নেই) */
const OWNER_NAMES = [
  "Juwel AhameD'z",
  "Juwel Ahmed",
  "Juwel Ahamed",
  "Juwel AhmeD'z",
  "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
];
/* মাস্টার বট stop/on দিলে নিজের ফ্রেম-নোটিশ দেবে কি না (false = শুধু ছোট সংকেত মেসেজ, নোটিশ দেয় ফলোয়াররা) */
const MASTER_NOTICE = false;

/* ঐচ্ছিক: মাস্টার বটের UID কোডে দিতে চাইলে। না দিলে "allbot setmaster <uid>" কমান্ড যথেষ্ট */
const MASTER_UIDS = [
  // "61500000000000",
];

/* ───────────── Credit check (power.js-এর মতোই) ───────────── */
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const sha = s => crypto.createHash("sha256").update(String(s == null ? "" : s).normalize("NFC")).digest("hex");
let _warned = false;
function creditOk() {
  try {
    if (sha(CREDIT) !== CREDIT_HASH) {
      if (!_warned) { _warned = true; console.log("[ALLBOT] CREDIT line in solo.js was modified"); }
      return false;
    }
    const power = require("./power");
    if (typeof power.creditOk === "function" && !power.creditOk()) {
      if (!_warned) { _warned = true; console.log("[ALLBOT] credit in power.js / bot.js was modified"); }
      return false;
    }
    return true;
  } catch (_) { return false; }
}

/* ───────────── State ───────────── */
const STATE_FILE = path.join(__dirname, "..", "Script", "commands", "cache", "solo.json");
const MARKER_RE = /⟦allbot:(stop|on):(\d+)⟧/;
const DEFAULT_MS = 24 * 3600 * 1000;   // সময় না দিলে ২৪ ঘণ্টা
const MAX_MS = 7 * 24 * 3600 * 1000;   // সর্বোচ্চ ৭ দিন
const MIN_MS = 10 * 1000;              // সর্বনিম্ন ১০ সেকেন্ড

let state = { threads: {}, masters: [] }; // threads: { threadID: { until, at } }
try {
  if (fs.existsSync(STATE_FILE)) {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    if (s && typeof s.threads === "object" && s.threads) state.threads = s.threads;
    if (s && Array.isArray(s.masters)) state.masters = s.masters.map(String);
  }
} catch (_) {}

function save() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) { console.log("[ALLBOT] save error:", e.message); }
}

function masters() {
  return [...MASTER_UIDS, ...state.masters].map(String).filter(Boolean);
}
function isOwner(id) {
  return OWNER_UIDS.map(String).filter(Boolean).includes(String(id));
}

/* ───────────── নাম দিয়ে চেনা ───────────── */
const normName = n => String(n || "").normalize("NFC").replace(/[\u2018\u2019\u02BC`]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
const OWNER_NAMES_N = OWNER_NAMES.map(normName).filter(Boolean);
const nameCache = new Map(); // uid → { name, at }
const NAME_TTL = 5 * 60 * 1000;

function getSenderName(api, uid) {
  return new Promise(resolve => {
    try {
      const c = nameCache.get(uid);
      if (c && Date.now() - c.at < NAME_TTL) return resolve(c.name);
      let done = false;
      const fin = n => { if (done) return; done = true; if (n) nameCache.set(uid, { name: n, at: Date.now() }); resolve(n || ""); };
      setTimeout(() => fin(""), 6000);
      api.getUserInfo(uid, (err, res) => {
        const n = !err && res && res[uid] && res[uid].name;
        fin(n || (global.data && global.data.userName && global.data.userName.get(String(uid))) || "");
      });
    } catch (_) { resolve(""); }
  });
}
async function isOwnerByName(api, uid) {
  if (!OWNER_NAMES_N.length) return false;
  return OWNER_NAMES_N.includes(normName(await getSenderName(api, String(uid))));
}
function isMasterUid(id) { return masters().includes(String(id)); }
function isMasterBot(api) {
  try { return isMasterUid(api.getCurrentUserID()); } catch (_) { return false; }
}

function isSolo(threadID) {
  const e = state.threads[String(threadID)];
  if (!e) return false;
  if (Date.now() >= e.until) return false; // মেয়াদ শেষ; মুছে নোটিশ দেয় নিচের sweeper
  return true;
}

/* ───────────── ফলোয়ার বটের OFF / ON নোটিশ ───────────── */
let apiRef = null;
let rawSend = null; // গার্ডের আগের আসল sendMessage — চুপ অবস্থাতেও নোটিশ পাঠাতে পারে

function notify(text, threadID) {
  try {
    if (!apiRef || !creditOk()) return;
    const fn = rawSend || apiRef.sendMessage.bind(apiRef);
    fn(text, threadID, () => {});
  } catch (e) { console.log("[ALLBOT] notice error:", e.message); }
}

function offNotice(tid, until) {
  let rem = until - Date.now();
  if (rem >= 60000) rem = Math.round(rem / 60000) * 60000; // "1 hr 59 min" না দেখিয়ে "2 hr"
  notify(frame("🔴 BOT OFF ⛔", [
    "💤 This bot is now silent here",
    "⏳ Off for: " + fmt(rem),
    "🕒 Back at: " + stamp(until),
    "🔓 Owner can resume anytime"
  ]), tid);
}
function onNotice(tid, auto) {
  notify(frame("🟢 BOT ON ✅", [
    auto ? "⏰ Timer ended, auto resumed" : "👑 Resumed by owner",
    "📡 Status: Online ✅",
    "⚡ Bot is active again!"
  ]), tid);
}

// সময় শেষ হলে নিজে থেকে চালু + নোটিশ (মাস্টার বট নোটিশ দেয় না)
setInterval(() => {
  try {
    const now = Date.now();
    for (const tid of Object.keys(state.threads)) {
      const e = state.threads[tid];
      if (!e || now < e.until) continue;
      delete state.threads[tid];
      save();
      const fresh = now - e.until < 10 * 60 * 1000; // অনেক পুরোনো হলে (বট বন্ধ ছিল) চুপচাপ মুছে ফেলে
      if (fresh && apiRef && !isMasterBot(apiRef)) onNotice(tid, true);
      console.log("[ALLBOT] " + tid + " → সময় শেষ, আবার চালু");
    }
  } catch (_) {}
}, 5000).unref();

/* ───────────── Helpers ───────────── */
// "30m", "2h", "1h30m", "45s", "1d" → ms (না দিলে ডিফল্ট)
function parseDuration(str) {
  if (!str) return DEFAULT_MS;
  const units = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  const re = /(\d+)\s*(days?|d|hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/gi;
  let total = 0, m;
  while ((m = re.exec(String(str))) !== null) total += parseInt(m[1], 10) * units[m[2][0].toLowerCase()];
  if (!total) return DEFAULT_MS;
  return Math.min(Math.max(total, MIN_MS), MAX_MS);
}

function fmt(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400), h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  const p = [];
  if (d) p.push(d + " day" + (d > 1 ? "s" : ""));
  if (h) p.push(h + " hr");
  if (m) p.push(m + " min");
  if (!p.length) p.push(sec + " sec");
  return p.join(" ");
}

function stamp(ts) {
  try { return new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { return new Date(ts).toISOString(); }
}

function norm(body) {
  let t = String(body || "").trim().replace(/\s+/g, " ").toLowerCase();
  const prefix = String((global.config && global.config.PREFIX) || ".").toLowerCase();
  if (prefix && t.startsWith(prefix)) t = t.slice(prefix.length).trim();
  return t;
}

function parseCmd(t) {
  let m = t.match(/^allbot ?(stop|on|status|setmaster|delmaster)(?: (.+))?$/);
  if (m) return { type: m[1], arg: m[2] };
  m = t.match(/^অলবট ?(স্টপ|অন|স্ট্যাটাস)(?: (.+))?$/);
  if (m) return { type: m[1] === "স্টপ" ? "stop" : m[1] === "অন" ? "on" : "status", arg: m[2] };
  return null;
}

/* ───────────── ফন্ট ও ফ্রেম: 𝙰𝙱𝙲𝙳 𝚊𝚋𝚌𝚍 𝟶𝟷𝟸𝟹 ───────────── */
function mono(str) {
  return String(str).replace(/[A-Za-z0-9]/g, c => {
    const k = c.charCodeAt(0);
    if (k >= 65 && k <= 90) return String.fromCodePoint(0x1D670 + k - 65);
    if (k >= 97 && k <= 122) return String.fromCodePoint(0x1D68A + k - 97);
    return String.fromCodePoint(0x1D7F6 + k - 48);
  });
}
function frame(title, rows, marker) {
  const botName = (global.config && global.config.BOTNAME) || "Bot";
  return [
    "╭━━━━━━━━━━━━━━━━━━━━━━╮",
    "┃  " + mono(title),
    "┣━━━━━━━━━━━━━━━━━━━━━━┫",
    "┃ 🤖 " + mono("Bot") + ": " + botName,
    ...rows.map(r => "┃ " + mono(r)),
    "┣━━━━━━━━━━━━━━━━━━━━━━┫",
    "┃ 👑 " + mono("Credit") + ": " + CREDIT,
    "╰━━━━━━━━━━━━━━━━━━━━━━╯"
  ].join("\n") + (marker ? "\n" + marker : "");
}

function send(api, text, threadID, replyTo) {
  try { api.sendMessage(text, threadID, () => {}, replyTo); } catch (e) { console.log("[ALLBOT] send error:", e.message); }
}

/* ───────────── মাস্টার সেট/ডিলিট (শুধু OWNER) ─────────────
   গ্রুপের সব বট চুপচাপ UID সেভ করে; শুধু যে বটের নিজের UID সেটাই, সে-ই রিপ্লাই দেয় */
function masterSetup(api, event, cmd) {
  const uid = String(cmd.arg || "").replace(/\D/g, "");
  let me = "";
  try { me = String(api.getCurrentUserID()); } catch (_) {}
  const mine = !!uid && uid === me;
  if (!uid) {
    send(api, frame("⚠️ ALLBOT ERROR", ["Usage: allbot setmaster <uid>"]), event.threadID, event.messageID);
    return;
  }
  if (cmd.type === "setmaster") {
    if (!state.masters.includes(uid)) state.masters.push(uid);
    save();
    if (mine) send(api, frame("✅ MASTER SET", ["🆔 UID: " + uid, "👑 This bot is now MASTER"]), event.threadID, event.messageID);
  } else {
    state.masters = state.masters.filter(x => x !== uid);
    save();
    if (mine) send(api, frame("🗑️ MASTER REMOVED", ["🆔 UID: " + uid]), event.threadID, event.messageID);
  }
}

/* ───────────── ফলোয়ার বট: OWNER-এর "allbot on" নিজেই শুনে চালু হয় (মাস্টার বট বন্ধ থাকলেও) ───────────── */
function releaseThread(tid) {
  if (state.threads[tid]) {
    const was = Date.now() < state.threads[tid].until;
    delete state.threads[tid];
    save();
    console.log("[ALLBOT] " + tid + " → OWNER-এর allbot on, আবার চালু");
    if (was && !(apiRef && isMasterBot(apiRef))) onNotice(tid, false);
  }
}

/* ───────────── মাস্টার বটের কমান্ড ───────────── */
function masterCommand(api, event, cmd) {
  const tid = String(event.threadID);
  if (cmd.type === "stop") {
    const ms = parseDuration(cmd.arg);
    const until = Date.now() + ms;
    state.threads[tid] = { until, at: Date.now() };
    save();
    const marker = "⟦allbot:stop:" + until + "⟧";
    send(api, MASTER_NOTICE ? frame("🔒 ALLBOT STOP ⛔", [
      "🔇 Other bots: silent here",
      "⏳ Duration: " + fmt(ms),
      "🕒 Ends at: " + stamp(until),
      "🔓 Resume early: allbot on"
    ], marker) : marker, event.threadID);
  } else if (cmd.type === "on") {
    delete state.threads[tid];
    save();
    const marker = "⟦allbot:on:" + (Date.now() + 60000) + "⟧";
    send(api, MASTER_NOTICE ? frame("🔓 ALLBOT ON ✅", [
      "📢 All bots are active again"
    ], marker) : marker, event.threadID);
  } else {
    send(api, isSolo(tid)
      ? frame("🔒 ALLBOT STATUS", [
          "📡 Mode: STOP (solo)",
          "⏳ Time left: " + fmt(state.threads[tid].until - Date.now()),
          "🕒 Ends at: " + stamp(state.threads[tid].until)
        ])
      : frame("🔓 ALLBOT STATUS", ["📡 Mode: ON (all bots active)"]),
      event.threadID, event.messageID);
  }
}

/* ───────────── listen.js-এর শুরুতে কল হয়। true = ইভেন্ট এখানেই শেষ ───────────── */
function gate(api, event) {
  try {
    if (!creditOk()) return false;
    const tid = String(event.threadID || "");
    const isMsg = event && (event.type === "message" || event.type === "message_reply");

    // ── "allbot ..." কমান্ড: শুধু OWNER (UID বা নাম) পারবে, বাকি সবার জন্য চুপচাপ বাদ ──
    const cmd0 = isMsg ? parseCmd(norm(event.body)) : null;
    if (cmd0) {
      const hasUid = OWNER_UIDS.map(String).filter(Boolean).length > 0;
      if (!hasUid && !OWNER_NAMES_N.length) return false;               // OWNER দেওয়া নেই → ফিচার বন্ধ
      if (isOwner(event.senderID)) {                                    // UID মিললে সব কমান্ড
        if (cmd0.type === "setmaster" || cmd0.type === "delmaster") masterSetup(api, event, cmd0);
        else if (isMasterBot(api)) masterCommand(api, event, cmd0);
        else if (cmd0.type === "on") releaseThread(tid);                // ফলোয়ার বট নিজেই চালু হয়
        return true;
      }
      // UID মেলেনি: শুধু মাস্টার বট নাম যাচাই করবে, তাও শুধু stop/on/status-এর জন্য
      if (cmd0.type !== "setmaster" && cmd0.type !== "delmaster") {
        if (isMasterBot(api)) {
          isOwnerByName(api, event.senderID).then(ok => { if (ok) masterCommand(api, event, cmd0); }).catch(() => {});
        } else if (cmd0.type === "on" && isSolo(tid)) {                 // ফলোয়ার: চুপ থাকলেই নাম যাচাই করে
          isOwnerByName(api, event.senderID).then(ok => { if (ok) releaseThread(tid); }).catch(() => {});
        }
      }
      return true;                                                      // বাকি সবার জন্য চুপচাপ বাদ
    }

    // ── মাস্টার বট ──
    if (isMasterBot(api)) return false; // মাস্টার কখনো নিজে চুপ হয় না

    // ── অন্য বট ──
    if (isMsg && typeof event.body === "string" && isMasterUid(event.senderID)) {
      const m = event.body.match(MARKER_RE);
      if (m) {
        if (m[1] === "stop") {
          const until = Math.min(parseInt(m[2], 10), Date.now() + MAX_MS);
          if (until > Date.now()) {
            offNotice(tid, until); // আগে নোটিশ, তারপর চুপ (নোটিশ আসল sendMessage দিয়ে যায়)
            state.threads[tid] = { until, at: Date.now() };
            save();
            console.log("[ALLBOT] " + tid + " → চুপ, " + stamp(until) + " পর্যন্ত");
          }
        } else {
          releaseThread(tid);
        }
        return true;
      }
    }

    if (tid && isSolo(tid)) return true; // চুপ থাকা গ্রুপের সব ইভেন্ট বাদ
    return false;
  } catch (e) {
    console.log("[ALLBOT] gate error:", e && e.message);
    return false;
  }
}

/* বট থেকে যাওয়া মেসেজও (টাইমার/অটো-মেসেজ) আটকাবে */
const GUARDED = { sendMessage: 1, sendMessageMqtt: 1, sendTypingIndicator: 0, shareContact: 2 };
function guardApi(api) {
  if (!api || api.__soloGuarded) return api;
  apiRef = api;
  if (typeof api.sendMessage === "function") rawSend = api.sendMessage.bind(api);
  for (const name of Object.keys(GUARDED)) {
    const original = api[name];
    if (typeof original !== "function") continue;
    const idx = GUARDED[name];
    api[name] = function (...args) {
      const tid = args[idx];
      if (creditOk() && (typeof tid === "string" || typeof tid === "number") && !isMasterBot(api) && isSolo(tid)) {
        const cb = args.find(a => typeof a === "function");
        if (cb) { try { cb(null, { allbotStopped: true }); } catch (_) {} }
        return Promise.resolve({ allbotStopped: true });
      }
      return original.apply(this, args);
    };
  }
  Object.defineProperty(api, "__soloGuarded", { value: true, enumerable: false });
  return api;
}

module.exports = { gate, guardApi, isSolo, isMasterBot, isOwner, isOwnerByName, creditOk, parseCmd, parseDuration, mono, OWNER_UIDS, MASTER_UIDS };
