// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ══════════════════════════════════════════════
// গ্রুপ অ্যাপ্রুভাল গেট
// গ্রুপে কোনো মেসেজ যাবে না, শুধু অ্যাডমিনের ইনবক্সে নোটিশ যাবে
// ══════════════════════════════════════════════
const fs = require("fs");
const path = require("path");

const CREDITS = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const FILE = path.join(__dirname, "..", "Script", "commands", "cache", "approvedThreads.json");
const CONFIG_FILE = path.join(__dirname, "..", "config.json");

let state = { seeded: false, threads: {}, pending: {} };

try {
  if (fs.existsSync(FILE)) {
    const s = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (s && typeof s.threads === "object") {
      state = {
        seeded: !!s.seeded,
        threads: s.threads,
        pending: (s.pending && typeof s.pending === "object") ? s.pending : {}
      };
    }
  }
} catch (_) {}

function save() {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.log("[APPROVAL] save error:", e.message);
  }
}

// ── অনুমোদন / পেন্ডিং ──
const isApproved = id => !!state.threads[String(id)];
const isPending = id => !!state.pending[String(id)];

function approve(id, by) {
  const k = String(id);
  state.threads[k] = { by: by ? String(by) : null, at: new Date().toISOString() };
  delete state.pending[k];
  save();
}

function addPending(id, by) {
  const k = String(id);
  if (state.threads[k]) return;
  state.pending[k] = { by: by ? String(by) : null, at: new Date().toISOString() };
  save();
}

function remove(id) {
  const k = String(id);
  let changed = false;
  if (state.threads[k]) { delete state.threads[k]; changed = true; }
  if (state.pending[k]) { delete state.pending[k]; changed = true; }
  if (changed) save();
}

const list = () => Object.keys(state.threads);
const pendingList = () => Object.keys(state.pending);
const getPendingInfo = id => state.pending[String(id)] || null;

// pending কমান্ড থেকে কল করার জন্য — গ্রুপে কোনো মেসেজ পাঠায় না
async function approveById(api, tid, by) {
  approve(tid, by);
  return true;
}

// ── কনফিগ / অ্যাডমিন ──
function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch (_) {
    return global.config || {};
  }
}

function getAdminBots() {
  const cfg = readConfig();
  const g = global.config || {};
  return [...new Set([...(cfg.ADMINBOT || []), ...(g.ADMINBOT || [])].map(String))];
}

function isAdmin(id) {
  const cfg = readConfig();
  const g = global.config || {};
  const all = [
    ...(cfg.ADMINBOT || []), ...(cfg.DEVELOPER || []),
    ...(g.ADMINBOT || []), ...(g.DEVELOPER || [])
  ].map(String);
  return all.includes(String(id));
}

function getPrefix() {
  const cfg = readConfig();
  return cfg.PREFIX || (global.config && global.config.PREFIX) || "/";
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── অ্যাডমিনের ইনবক্সে নোটিশ (গ্রুপে কিছু যায় না) ──
async function notifyAdmins(api, tid, adderID) {
  try {
    let groupName = "নামহীন গ্রুপ";
    let members = "?";
    try {
      const info = await api.getThreadInfo(tid);
      groupName = info.threadName || info.name || groupName;
      members = (info.participantIDs || []).length || "?";
    } catch (_) {}

    let adderName = "অজানা";
    try {
      const u = await api.getUserInfo(adderID);
      adderName = (u && u[adderID] && u[adderID].name) || "অজানা";
    } catch (_) {}

    let time;
    try {
      time = require("moment-timezone").tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm:ss A");
    } catch (_) {
      time = new Date().toLocaleString();
    }

    const msg =
`🔔 বটকে একটি গ্রুপে অ্যাড করা হয়েছে, কিন্তু অ্যাপ্রুভ করা হয়নি

🏠 গ্রুপ: ${groupName}
🆔 গ্রুপ আইডি: ${tid}
👥 মেম্বার: ${members}

👤 অ্যাড করেছে: ${adderName}
🆔 ইউজার আইডি: ${adderID}
🔗 প্রোফাইল: https://www.facebook.com/${adderID}

🕒 সময়: ${time}
📌 অবস্থা: ⏳ পেন্ডিং (বট ওই গ্রুপে চুপ আছে)

👉 লিস্ট দেখতে: ${getPrefix()}pending`;

    for (const adminID of getAdminBots()) {
      try {
        await api.sendMessage(msg, adminID);
      } catch (e) {
        console.log("[APPROVAL] অ্যাডমিনকে নোটিশ পাঠানো যায়নি:", adminID);
      }
    }
  } catch (e) {
    console.log("[APPROVAL] notify error:", e.message);
  }
}

// প্রথমবার চালুর সময় আগের সব থ্রেড অনুমোদিত ধরা হয়
function seedOnce() {
  if (state.seeded) return true;
  const ids = (global.data && global.data.allThreadID) || [];
  if (ids.length === 0 && process.uptime() < 120) return false;
  ids.forEach(id => {
    state.threads[String(id)] = { by: "seed", at: new Date().toISOString() };
  });
  state.seeded = true;
  save();
  console.log(`[APPROVAL] ${ids.length} টি আগের থ্রেড অনুমোদিত তালিকায় ঢোকানো হলো`);
  return true;
}

const warned = new Map();
function warnOnce(tid) {
  const now = Date.now();
  if (now - (warned.get(tid) || 0) > 10 * 60 * 1000) {
    warned.set(tid, now);
    console.log(`[APPROVAL] ${tid} অনুমোদিত নয় — ইভেন্ট ইগনোর (পেন্ডিং)`);
  }
}

// true = ইভেন্ট চলতে দাও, false = সম্পূর্ণ ইগনোর
function allow(event, api) {
  const tid = String(event.threadID || "");
  if (!tid) return true;
  if (!seedOnce()) return true;

  const actor = String(
    event.type === "message_reaction"
      ? event.userID
      : event.type === "event"
      ? event.author || event.senderID
      : event.senderID
  );

  // ইনবক্স (১-টু-১) গেটের আওতায় নয়
  const isGroup = event.isGroup === true || (event.isGroup === undefined && actor !== tid);
  if (!isGroup) return true;

  let botID = "";
  try { botID = String(api.getCurrentUserID()); } catch (_) {}

  // বট কিক/লিভ হলে সব রেকর্ড মুছে ফেলা
  if (
    event.type === "event" &&
    event.logMessageType === "log:unsubscribe" &&
    String(event.logMessageData && event.logMessageData.leftParticipantFbId) === botID
  ) {
    remove(tid);
    return false;
  }

  // বটকে গ্রুপে অ্যাড করা হলে
  if (event.type === "event" && event.logMessageType === "log:subscribe") {
    const d = event.logMessageData || {};
    const added = (d.addedParticipants || []).map(p => String(p.userFbId));
    if (added.includes(botID)) {
      if (isAdmin(actor)) {
        approve(tid, actor);              // অ্যাডমিন অ্যাড করলে সরাসরি অনুমোদিত
        return true;
      }
      addPending(tid, actor);             // অন্য কেউ অ্যাড করলে পেন্ডিং
      notifyAdmins(api, tid, actor);      // অ্যাডমিনের ইনবক্সে নোটিশ
      warnOnce(tid);
      return false;
    }
  }

  if (isApproved(tid)) return true;

  // অনুমোদনহীন গ্রুপেও অ্যাডমিনের approve / pending / out কমান্ড চলবে
  const isMsg = event.type === "message" || event.type === "message_reply";
  if (isMsg && isAdmin(actor) && typeof event.body === "string") {
    const prefix = escapeRegex(getPrefix());
    const re = new RegExp("^\\s*(?:" + prefix + ")?\\s*(approve|pending|out)\\b", "i");
    if (re.test(event.body)) return true;
  }

  // তালিকায় নেই এমন গ্রুপ চুপচাপ পেন্ডিংয়ে যাবে (নোটিশ ছাড়া)
  if (!isPending(tid)) addPending(tid, null);

  warnOnce(tid);
  return false;
}

module.exports = {
  allow, approve, approveById, remove,
  isApproved, isPending, list, pendingList, getPendingInfo,
  isAdmin, credits: CREDITS
};
