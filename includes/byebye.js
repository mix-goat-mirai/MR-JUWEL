// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// includes/byebye.js — বট বন্ধ হওয়ার ঠিক আগে সব গ্রুপে নোটিশ
//
//  কখন কাজ করে: বট বন্ধ/রিস্টার্ট হওয়ার সংকেত (SIGTERM, Ctrl+C, process.exit(), হোস্টিং রিস্টার্ট) পেলে
//  কখন কাজ করে না: ফেসবুক আইডি হঠাৎ লক হলে — তখন ফেসবুক নিজেই মেসেজ পাঠানো আটকে দেয়,
//                  বট আগে থেকে জানতে পারে না। (সেই অবস্থায় টেলিগ্রাম/ডিসকর্ড অ্যালার্ট কাজ করে)
//
//  সেটিংস (config.json, ঐচ্ছিক):  "SHUTDOWN_NOTICE": { "enabled": true, "maxGroups": 100, "waitMs": 4000, "cooldownMin": 10 }
//  ক্রেডিট বদলালে এই ফিচার কাজ করবে না।
// ══════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
// আসল ক্রেডিট base64-এ (খুঁজে-বদলে ধরা না পড়ার জন্য)। ফাইলের হেডারে এটা না থাকলেও কোড বন্ধ।
const ORIGINAL_CREDIT = Buffer.from("5LmbIE3wnYag4Y2d1p9SIOC9kOC9suC8j+C9i+C+gCBKVfCdhqDhjZ3Wn1fwnYag4Y2d1p9FTOqcm+C9kOC9suC8j+C9i+C+gOC/kA==", "base64").toString("utf8");
const sha = s => crypto.createHash("sha256").update(String(s == null ? "" : s).normalize("NFC")).digest("hex");
let _warned = false;
function creditOk() {
  try {
    if (sha(CREDIT) !== CREDIT_HASH) {
      if (!_warned) { _warned = true; console.log("[BYEBYE] CREDIT line in byebye.js was modified"); }
      return false;
    }
    // ফাইলের মাথায় আসল ক্রেডিট লাইন থাকতে হবে
    const head = fs.readFileSync(__filename, "utf8").slice(0, 600);
    if (head.indexOf(ORIGINAL_CREDIT) === -1) {
      if (!_warned) { _warned = true; console.log("[BYEBYE] header credit in byebye.js was removed or modified"); }
      return false;
    }
    const power = require("./power");
    if (typeof power.creditOk === "function" && !power.creditOk()) {
      if (!_warned) { _warned = true; console.log("[BYEBYE] credit in power.js / bot.js was modified"); }
      return false;
    }
    return true;
  } catch (_) { return false; }
}

const STATE_FILE = path.join(__dirname, "..", "Script", "commands", "cache", "byebye.json");
const START = Date.now();
let apiRef = null;
let sentOnce = null; // একই প্রসেসে একবারই

function settings() {
  const c = (global.config && global.config.SHUTDOWN_NOTICE) || {};
  return {
    enabled: c.enabled !== false,
    maxGroups: Math.max(1, Number(c.maxGroups) || 100),
    waitMs: Math.min(Math.max(Number(c.waitMs) || 4000, 1000), 8000),
    cooldownMs: Math.max(0, (c.cooldownMin === undefined ? 10 : Number(c.cooldownMin)) * 60000)
  };
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
const BAR = "┣━━━━━━━━━━━━━━━━━━━━━━┫";
// sections = [ [row, row, ...], [row, ...] ]  — প্রতিটা সেকশনের মাঝে আড়াআড়ি রেখা
function frame(title, sections) {
  const out = ["╭━━━━━━━━━━━━━━━━━━━━━━╮", "┃  " + mono(title)];
  for (const rows of sections) {
    out.push(BAR);
    for (const r of rows) out.push("┃ " + mono(r));
  }
  out.push(BAR, "┃ 👑 " + mono("Credit") + ": " + CREDIT, "╰━━━━━━━━━━━━━━━━━━━━━━╯");
  return out.join("\n");
}
function stamp(ts) {
  try { return new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true }); }
  catch (_) { return new Date(ts).toISOString(); }
}
const pad2 = n => String(n).padStart(2, "0");
// দিন → ঘণ্টা → মিনিট → সেকেন্ড (এই ক্রমে)
function uptimeParts(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}

// juwelalert.js-এর বাংলা কারণ → ছোট ইংরেজি কারণ
function reasonText(reason) {
  const r = String(reason || "");
  if (/SIGTERM|stop সিগন্যাল/i.test(r)) return "Server stop / restart signal";
  if (/SIGINT|Ctrl/i.test(r)) return "Manual stop";
  if (/SIGHUP|টার্মিনাল/i.test(r)) return "Terminal closed";
  if (/process\.exit/i.test(r)) return "Stop / restart command";
  if (/লগইন|লক|থেমে গেছে/i.test(r)) return "Login problem / session ended";
  return "Bot shutdown";
}

/* ───────────── কোন কোন গ্রুপে পাঠাবো ───────────── */
function groupList(max) {
  const d = global.data || {};
  const all = (d.allThreadID || []).map(String);
  const users = new Set((d.allUserID || []).map(String));
  // অনুমোদন-সিস্টেমে অন্তত একটা গ্রুপ অনুমোদিত থাকলে তবেই "অনুমোদিত নয়" গ্রুপ বাদ দেওয়া হয়
  let approve = null;
  try {
    const a = require("./approve");
    if (a && typeof a.list === "function" && a.list().length > 0 && typeof a.isApproved === "function") approve = a;
  } catch (_) {}
  const out = [];
  for (const tid of all) {
    if (out.length >= max) break;
    if (users.has(tid)) continue; // ইনবক্স
    const info = d.threadInfo && d.threadInfo.get ? d.threadInfo.get(tid) : null;
    if (info && info.isGroup === false) continue;
    try { if (approve && !approve.isApproved(tid)) continue; } catch (_) {}
    out.push(tid);
  }
  return out;
}

function canSendNow(cooldownMs) {
  try {
    if (!cooldownMs) return true;
    if (fs.existsSync(STATE_FILE)) {
      const s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      if (s && s.last && Date.now() - s.last < cooldownMs) return false;
    }
  } catch (_) {}
  return true;
}
function markSent() {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ last: Date.now() }));
  } catch (_) {}
}

/* ───────────── মূল কাজ: সব গ্রুপে নোটিশ ───────────── */
function groupNotice(reason) {
  if (sentOnce) return sentOnce;
  sentOnce = (async () => {
    try {
      const cfg = settings();
      if (!cfg.enabled || !apiRef || !creditOk()) return;
      if (!canSendNow(cfg.cooldownMs)) { console.log("[BYEBYE] কুলডাউন চলছে — গ্রুপ নোটিশ বাদ (বারবার রিস্টার্ট লুপে স্প্যাম ঠেকাতে)"); return; }
      const groups = groupList(cfg.maxGroups);
      if (!groups.length) return;
      markSent();

      const botName = (global.config && global.config.BOTNAME) || "Bot";
      const up = uptimeParts(Date.now() - START);
      const text = frame("🔴 BOT SHUTTING DOWN ⛔", [
        [
          "🤖 Bot: " + botName,
          "📡 Status: OFFLINE SOON 🔴",
          "⚠️ Going offline in 1-2 sec",
          "📛 Reason: " + reasonText(reason)
        ],
        [
          "⏱ Was online for",
          " ┌ 📆 DAYS ➤ " + pad2(up.d),
          " ├ 🕐 HOURS ➤ " + pad2(up.h),
          " ├ ⏰ MINUTES ➤ " + pad2(up.m),
          " └ ⏳ SECONDS ➤ " + pad2(up.s),
          " ✦ " + up.d + "d " + pad2(up.h) + "h " + pad2(up.m) + "m " + pad2(up.s) + "s"
        ],
        [
          "📅 Started: " + stamp(START),
          "🕒 Stopped: " + stamp(Date.now())
        ]
      ]);

      if (text.indexOf(ORIGINAL_CREDIT) === -1) { console.log("[BYEBYE] নোটিশে আসল ক্রেডিট নেই — পাঠানো বন্ধ"); return; }
      console.log("[BYEBYE] " + groups.length + "টি গ্রুপে বন্ধের নোটিশ পাঠানো হচ্ছে...");
      const deadline = Date.now() + cfg.waitMs;
      const sendOne = tid => new Promise(resolve => {
        const t = setTimeout(resolve, Math.max(200, deadline - Date.now()));
        try {
          const r = apiRef.sendMessage(text, tid, () => { clearTimeout(t); resolve(); });
          if (r && typeof r.then === "function") r.then(() => { clearTimeout(t); resolve(); }, () => { clearTimeout(t); resolve(); });
        } catch (_) { clearTimeout(t); resolve(); }
      });
      const BATCH = 10;
      for (let i = 0; i < groups.length && Date.now() < deadline; i += BATCH) {
        await Promise.race([
          Promise.all(groups.slice(i, i + BATCH).map(sendOne)),
          new Promise(r => setTimeout(r, Math.max(100, deadline - Date.now())))
        ]);
      }
    } catch (e) { console.log("[BYEBYE] error:", e && e.message); }
  })();
  return sentOnce;
}

/* ───────────── হুক বসানো ───────────── */
function install(api) {
  apiRef = (global.client && global.client.api) || api;
  // juwelalert.js এই ফাংশনটা বন্ধের সময় ডাকে, আর শেষ হওয়া পর্যন্ত অপেক্ষা করে
  global.__juwelGroupStopNotice = groupNotice;

  // juwelalert.js লোড না থাকলে নিজেই বন্ধের হুক বসাই
  if (!global.__juwelAlertShutdownHooked && !global.__byebyeHooked) {
    global.__byebyeHooked = true;
    const origExit = process.exit.bind(process);
    process.exit = function (code) {
      const c = code === undefined ? 0 : code;
      groupNotice("process.exit(" + c + ")").then(() => origExit(c), () => origExit(c));
    };
    ["SIGINT", "SIGTERM", "SIGHUP"].forEach(sig => {
      try { process.on(sig, () => groupNotice(sig).then(() => origExit(0), () => origExit(0))); } catch (_) {}
    });
  }
}

module.exports = { install, groupNotice, groupList, reasonText, creditOk };
