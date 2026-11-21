// extraprefix.js — মেন প্রিফিক্স ছাড়াও সর্বোচ্চ ৪টা এক্সট্রা প্রিফিক্স (শুধু config.json-এর ADMINBOT)
const fs = require("fs");
const path = require("path");

const crypto = require("crypto");

/* ───────── Credit protection ─────────
   ক্রেডিট বদলালে বা মুছলে এই কোড কাজ করবে না, আর আসল ক্রেডিট ফিরিয়ে দিতে বলবে। */
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const ORIGINAL_CREDIT = Buffer.from("5LmbIE3wnYag4Y2d1p9SIOC9kOC9suC8j+C9i+C+gCBKVfCdhqDhjZ3Wn1fwnYag4Y2d1p9FTOqcm+C9kOC9suC8j+C9i+C+gOC/kA==", "base64").toString("utf8");
const _sha = (s) => crypto.createHash("sha256").update(String(s == null ? "" : s).normalize("NFC")).digest("hex");
let _creditWarned = false;
function creditOk() {
  try {
    const cfg = module.exports.config || {};
    const ok = _sha(CREDIT) === CREDIT_HASH && _sha(cfg.credits) === CREDIT_HASH;
    if (!ok && !_creditWarned) { _creditWarned = true; console.log("[EXTRAPREFIX] credit was modified — command disabled"); }
    return ok;
  } catch (_) { return false; }
}
function creditNotice(api, event) {
  try {
    api.sendMessage(
      "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
      "┃ ⛔ CREDIT CHANGED\n" +
      "┣━━━━━━━━━━━━━━━━━━━━┫\n" +
      "┃ ❌ ক্রেডিট পরিবর্তন/মুছে ফেলার কারণে\n" +
      "┃    এই কোড কাজ করছে না।\n" +
      "┃ ✅ আসল ক্রেডিট ফিরিয়ে দিন:\n" +
      "┃ 👑 " + ORIGINAL_CREDIT + "\n" +
      "╰━━━━━━━━━━━━━━━━━━━━╯",
      event.threadID, event.messageID
    );
  } catch (_) {}
}

// ★ ডিফল্ট এক্সট্রা প্রিফিক্স (সর্বোচ্চ ৫টা)। এখানে বদলালে নতুন করে কমান্ড দিয়ে যোগ করা লাগবে না।
const DEFAULT_EXTRA = [".", "!", "#", "*", "&"];

const MAX_EXTRA = 5;
const MAX_LEN = 5;
const FILE = path.join(__dirname, "cache", "extraprefix.json");

function clean(list) {
  const out = [];
  for (const p of Array.isArray(list) ? list : []) {
    const s = String(p || "").trim();
    if (s && s.length <= MAX_LEN && !/\s/.test(s) && !out.includes(s)) out.push(s);
  }
  return out.slice(0, MAX_EXTRA);
}
function load() {
  try {
    if (fs.existsSync(FILE)) return clean(JSON.parse(fs.readFileSync(FILE, "utf8")).prefixes);
  } catch (_) {}
  // ফাইল না থাকলে: config.json-এর "EXTRA_PREFIXES", তাও না থাকলে নিচের DEFAULT_EXTRA (রিডিপ্লয়ের পরেও টিকে থাকে)
  const fromCfg = clean(global.config && global.config.EXTRA_PREFIXES);
  return fromCfg.length ? fromCfg : clean(DEFAULT_EXTRA);
}
function save(list) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ prefixes: list }, null, 2));
  } catch (e) { console.log("[EXTRAPREFIX] save error:", e.message); }
}


module.exports.config = {
  name: "extraprefix",
  version: "1.0.0",
  hasPermssion: 0, // অ্যাডমিন চেক নিচে run() এর ভেতরে (শুধু ADMINBOT)
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Add/remove/check up to 5 extra prefixes (bot admin only). Turn on/off with: prefix on / prefix off",
  commandCategory: "Admin",
  usages: "[list | add <prefix> | remove <prefix> | clear]",
  cooldowns: 3
};

// ক্রেডিট ঠিক না থাকলে কোনো এক্সট্রা প্রিফিক্স লোডই হবে না
global.extraPrefixes = creditOk() ? load() : [];
global.extraPrefixEnabled = false; // বট চালু হলে সবসময় বন্ধ; "prefix on" কমান্ডে চালু হয়

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!creditOk()) { global.extraPrefixes = []; global.extraPrefixEnabled = false; return creditNotice(api, event); }
  const reply = t => api.sendMessage(t, threadID, messageID);

  const admins = ((global.config && global.config.ADMINBOT) || []).map(String);
  if (!admins.includes(String(senderID))) return reply("⛔ শুধু বটের অ্যাডমিন এই কমান্ড ব্যবহার করতে পারবে।");

  const main = String((global.config && global.config.PREFIX) || "/");
  const list = global.extraPrefixes || (global.extraPrefixes = []);
  const sub = String(args[0] || "list").toLowerCase();
  const val = args[1] ? String(args[1]).trim() : "";

  const on = global.extraPrefixEnabled === true;
  const NUM = ["①", "②", "③", "④", "⑤"];
  const running = () => on
    ? "এখন চলছে: " + [main, ...list].join("  ")
    : "এক্সট্রা এখন বন্ধ (শুধু " + main + " চলছে)। চালু করতে: prefix on";
  const show = () => reply(
    "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
    "┃ 🔣 PREFIX LIST\n" +
    "┣━━━━━━━━━━━━━━━━━━━━┫\n" +
    "┃ ⭐ Main: " + main + "\n" +
    "┃ ➕ Extra (" + list.length + "/" + MAX_EXTRA + ") " + (on ? "🟢 ON" : "🔴 OFF") + "\n" +
    (list.length ? list.map((x, i) => "┃   " + NUM[i] + " 『 " + x + " 』\n").join("") : "┃   none\n") +
    "┣━━━━━━━━━━━━━━━━━━━━┫\n" +
    "┃ add <p> | remove <p> | clear\n" +
    "┃ prefix on | prefix off\n" +
    "╰━━━━━━━━━━━━━━━━━━━━╯"
  );

  if (sub === "list" || sub === "check" || sub === "status") return show();

  if (sub === "add") {
    if (!val) return reply("⚠️ ব্যবহার: extraprefix add <prefix>   (যেমন: extraprefix add !)");
    if (val.length > MAX_LEN) return reply("⚠️ প্রিফিক্স সর্বোচ্চ " + MAX_LEN + " অক্ষরের হতে পারবে।");
    if (val === main) return reply("⚠️ এটা তো মেন প্রিফিক্সই (" + main + ")।");
    if (list.includes(val)) return reply("⚠️ \"" + val + "\" আগেই যোগ করা আছে।");
    if (list.length >= MAX_EXTRA) return reply("⚠️ সর্বোচ্চ " + MAX_EXTRA + "টা এক্সট্রা প্রিফিক্স যোগ করা যায়। আগে একটা remove করুন।");
    list.push(val);
    save(list);
    return reply("✅ যোগ হয়েছে: " + val + "\n" + running());
  }

  if (sub === "remove" || sub === "del" || sub === "delete") {
    if (!val) return reply("⚠️ ব্যবহার: extraprefix remove <prefix>");
    const i = list.indexOf(val);
    if (i < 0) return reply("⚠️ \"" + val + "\" তালিকায় নেই।");
    list.splice(i, 1);
    save(list);
    return reply("🗑️ মুছে ফেলা হয়েছে: " + val + "\n" + running());
  }

  if (sub === "clear" || sub === "reset") {
    list.length = 0;
    save(list);
    return reply("🧹 সব এক্সট্রা প্রিফিক্স মুছে ফেলা হয়েছে। শুধু মেন প্রিফিক্স (" + main + ") চলবে।");
  }

  return reply("⚠️ ব্যবহার: extraprefix [list | add <p> | remove <p> | clear]");
};
