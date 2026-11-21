/*
 * ════════════════════════════════════════════════════════════
 *  CPT — শুধু প্রিফিক্স লিখলেই র‍্যান্ডম ইসলামিক ফটো + ক্যাপশন
 *  Author : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 * ════════════════════════════════════════════════════════════
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";

module.exports.config = {
  name: "cpt",
  version: "5.1.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "প্রিফিক্স লিখলেই র‍্যান্ডম ইসলামিক ফটো ও ক্যাপশন",
  commandCategory: "Islamic",
  usages: "শুধু বটের প্রিফিক্স লিখো",
  prefixOnly: true,
  cooldowns: 1
};

const creditOK = () =>
  crypto.createHash("sha256").update(String(module.exports.config.credits)).digest("hex") === CREDIT_HASH;

// ───────────── ছবির লিংক ─────────────
const PHOTOS = [
  "https://i.imgur.com/gZcJ2gm.jpeg",
  "https://i.imgur.com/bYI2cFh.jpeg",
  "https://i.imgur.com/ugQkPSd.jpeg",
  "https://i.imgur.com/qaMp4VQ.jpeg",
  "https://i.imgur.com/yOz7bGs.jpeg",
  "https://i.imgur.com/VixY7uO.jpeg",
  "https://i.imgur.com/Gl9JLuF.jpeg",
  "https://i.imgur.com/JxFAxOP.jpeg",
  "https://i.imgur.com/4CJzJ9p.jpeg",
  "https://i.imgur.com/J45ZoV7.jpeg",
  "https://i.imgur.com/7bv4EG2.jpeg",
  "https://i.imgur.com/Sn3hyRZ.jpeg",
  "https://i.imgur.com/SZECFwu.jpeg",
  "https://i.imgur.com/bHYkOWD.jpeg",
  "https://i.imgur.com/b4GvEZy.jpeg",
  "https://i.imgur.com/quAxcp6.jpeg",
  "https://i.imgur.com/QyPDvbh.jpeg",
  "https://i.imgur.com/lLCsU62.jpeg",
  "https://i.imgur.com/vNRAQ7h.jpeg",
  "https://i.imgur.com/G2JsRWO.jpeg",
  "https://i.imgur.com/MKOORyp.jpeg",
  "https://i.imgur.com/JBtGoEO.jpeg",
  "https://i.imgur.com/wAU474C.jpeg",
  "https://i.imgur.com/DomINwP.jpeg",
  "https://i.imgur.com/kKw1N8P.jpeg",
  "https://i.imgur.com/dhSJWPW.jpeg",
  "https://i.imgur.com/qGR9GJf.jpeg",
  "https://i.imgur.com/rUjT2EZ.jpeg"
];

// ───────────── ইসলামিক ক্যাপশন (নতুন ৩০টা — লাইন বাই লাইন সাজানো) ─────────────
const CAPTIONS = [
  `🌙 "নিশ্চয়ই নামাজ মুমিনের উপর নির্ধারিত সময়ে ফরজ"
📖 সূরা আন-নিসা: ১০৩
🕌 আজান শুনলে দেরি করো না
🤲 নামাজ তোমাকে সবকিছু থেকে রক্ষা করবে`,

  `💚 "জেনে রাখো, আল্লাহর স্মরণেই অন্তর প্রশান্ত হয়"
📖 সূরা আর-রাদ: ২৮
📿 এক মুহূর্ত থেমে যিকির করো
🌸 দেখো মন কেমন হালকা লাগে`,

  `🌹 "তোমার প্রভু বলেছেন — আমাকে ডাকো, আমি উত্তর দেবো"
📖 সূরা গাফির: ৬০
🤲 হাত তুলে চাও — ছোট বা বড় যাই হোক
💚 তিনি শুনছেন, শুধু অপেক্ষা করছেন`,

  `🌿 "নিশ্চয়ই কষ্টের সাথেই স্বস্তি আছে"
📖 সূরা আশ-শারহ: ৫
💚 কষ্টে ভেঙে পড়ো না
🤲 আল্লাহর উপর ভরসা রাখো — তিনি জানেন`,

  `🕌 রাসূল (ﷺ) বলেছেন: "নামাজ জান্নাতের চাবি"
✨ প্রতিটা নামাজ যেন শেষ নামাজের মতো পড়ো
💧 চোখের পানি দিয়ে আল্লাহকে ডাকো
🤲 কে জানে কোন নামাজে কবুল হয়ে যাবে`,

  `📿 "যে ব্যক্তি সকাল-সন্ধ্যা আল্লাহকে স্মরণ করে, সে কখনো নিরাশ হয় না"
🌅 সকালে বলো — সুবহানাল্লাহি ওয়া বিহামদিহি
🌇 সন্ধ্যায় বলো — আস্তাগফিরুল্লাহ
💚 জিহ্বা ভেজা থাকুক তাঁর নামে`,

  `🌸 "তোমার প্রতিপালকের কাছে চাও — তিনি দিতে ভালোবাসেন"
🤲 চাওয়া ছোট করে না তুমি
💚 যিনি আসমান-জমিনের মালিক, তাঁর কাছে সবই সহজ
✨ আজ একটা দোয়া করো — মন থেকে`,

  `🌙 রাতের শেষ প্রহরে আল্লাহ ডাক দেন
🤲 "কে আছে যে আমাকে ডাকবে, আমি উত্তর দেবো?"
💚 "কে আছে যে ক্ষমা চাইবে, আমি ক্ষমা করবো?"
📿 ঘুম থেকে উঠে দুই রাকাত পড়ো — জীবন বদলে যাবে`,

  `📖 "তোমরা ধৈর্য ধরো — নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন"
🌿 বিপদে পড়ো — ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন
💚 ধৈর্যের প্রতিদান জান্নাত
🤲 একটু সবর করো — সব ঠিক হয়ে যাবে`,

  `💚 রাসূল (ﷺ) বলেছেন: "হাসিমুখ নিয়ে মানুষের সাথে দেখা করাও সদকা"
😊 ভাবো — হাসিটা তো টাকা লাগে না
🌸 তবু কত বড় সওয়াব
✨ আজ হাসিমুখে সবাইকে সালাম দাও`,

  `🤲 "হে আল্লাহ, আমি তোমার কাছে জান্নাত চাই, জাহান্নাম থেকে আশ্রয় চাই"
🌿 এটা রাসূল (ﷺ)-এর শেখানো দোয়া
💚 প্রতিদিন অন্তত একবার বলো
✨ জান্নাতের স্বপ্ন দেখা বন্ধ করো না`,

  `📿 "যে সকালে ঘুম থেকে উঠে আলহামদুলিল্লাহ বলে — তার শুকরিয়া আদায় হয়ে যায়"
🌅 চোখ খুলেই প্রথম কথা — আলহামদুলিল্লাহ
💚 তুমি আজ বেঁচে আছো, এটাই আল্লাহর দান
🤲 একটা দিন আরেকটা নিয়ামত`,

  `🌹 মা-বাবার জন্য রাসূল (ﷺ) বলেছেন: "তাদের সেবা করো, তাদের জান্নাতের পথ"
🤲 মায়ের জন্য একবার এই দোয়া করো:
💚 "রাব্বির হামহুমা কামা রাব্বায়ানি সাগিরা"
🌸 ছোটবেলা তাঁরা যত্ন করেছিলেন — এখন তুমি করো`,

  `💧 রাসূল (ﷺ) বলেছেন: "পবিত্রতা ঈমানের অর্ধেক"
🚿 ওযু করলে গুনাহ ঝরে যায়
🌿 মিসওয়াক করো — এটি নবীজির সুন্নাহ
✨ পরিষ্কার থাকো — ইসলাম পরিচ্ছন্নতার ধর্ম`,

  `🌙 "যে ব্যক্তি একদিন রোজা রাখলো আল্লাহর পথে, আল্লাহ তার মুখকে জাহান্নাম থেকে ৭০ বছরের দূরে রাখবেন"
🍽️ সোম-বৃহস্পতিবার রোজা রাখো
💚 সুন্নাহ রোজার সওয়াব কম নয়
🤲 আল্লাহ কবুল করুন`,

  `📖 "আমি মানুষকে সৃষ্টি করেছি শুধু আমার ইবাদতের জন্য"
🌿 সূরা যারিয়াত: ৫৬
💚 জীবনের আসল উদ্দেশ্য — আল্লাহর বন্দেগি
🤲 দিনের ব্যস্ততায় এটা ভুলে যেও না`,

  `🕋 "নিশ্চয়ই আল্লাহ সুন্দর, তিনি সৌন্দর্য ভালোবাসেন"
✨ পোশাক পরিষ্কার রাখো, সুগন্ধি ব্যবহার করো
💚 ভেতরটা যেমন, বাইরটাও তেমন হোক
🌸 পরিচ্ছন্ন মুমিন আল্লাহকে খুশি করে`,

  `🤲 দোয়া করো নিজের জন্য, পরিবারের জন্য, উম্মতের জন্য
🌿 রাসূল (ﷺ) বলেছেন: "মুসলিমের জন্য অপর মুসলিমের দোয়া কবুল হয়"
💚 আজ ফিলিস্তিনের জন্য, সিরিয়ার জন্য দোয়া করো
✨ কেউ জানে না — তোমার দোয়াতেই কারও জীবন বদলে যায়`,

  `📿 "যে ব্যক্তি প্রতিদিন ১০০ বার দরূদ পড়ে, কিয়ামতের দিন সে নবীজির (ﷺ) কাছে থাকবে"
🌹 সকালে ৩৩, সন্ধ্যায় ৩৩, রাতে ৩৪
💚 প্রতিটা দরূদে ১০ রহমত
✨ আজ থেকে শুরু করো — চেনা বদলে যাবে`,

  `🌙 রাতের খাবার শেষে এই দোয়া পড়ো:
🤲 "আলহামদুলিল্লাহিল্লাজি আতআমানা ওয়া সাকানা ওয়া জাআলানা মিনাল মুসলিমিন"
💚 যিনি খাওয়ালেন, পান করালেন
🌿 তাঁর শুকরিয়া আদায় করো`,

  `💚 "মানুষের মধ্যে সর্বোত্তম সে, যে মানুষের সবচেয়ে বেশি উপকার করে"
🌸 আজ কারো কাজে লাগো
🤲 কাউকে সাহায্য করো, হাসাও, পাশে দাঁড়াও
✨ উপকার করলে আল্লাহ তোমাকে ভালোবাসেন`,

  `📖 "তোমরা একে অপরের প্রতি সহানুভূতিশীল হও"
🌿 রাসূল (ﷺ) বলেছেন: "মুমিনরা এক শরীরের মতো"
💚 কারো কষ্টে কষ্ট পাও — এটাই ঈমান
🤲 উম্মতকে একতাবদ্ধ রাখো`,

  `🌅 ফজরের পর সূরা ইয়াসিন পড়ো — দিন বরকতময় হয়
📖 সন্ধ্যায় সূরা ওয়াকিয়া পড়ো — রিজিক বাড়ে
📿 ঘুমের আগে সূরা মুলক পড়ো — কবরের আজাব থেকে বাঁচো
💚 এগুলো ছোট আমল, কিন্তু সওয়াব বিশাল`,

  `🕌 "মসজিদে যাওয়ার প্রতিটা কদমে একটি নেকি, একটি গুনাহ মাফ"
🚶 পায়ে হেঁটে যাও — সওয়াব নাও
💚 যত দূর, তত সওয়াব
✨ মসজিদের নূর টানছে তোমাকে`,

  `🤲 "আল্লাহুম্মা ইন্নি আসআলুকাল হুদা ওয়াত তুকা ওয়াল আফাফা ওয়াল ঘিনা"
📿 হেদায়েত, তাকওয়া, পবিত্রতা, সম্পদ — এই চারটি চাও
💚 রাসূল (ﷺ)-এর সবচেয়ে সুন্দর দোয়া
✨ প্রতিদিন একবার পড়ো`,

  `🌹 "তোমার হৃদয় পরিষ্কার করো — আল্লাহ সেখানে তাকান"
🤲 হিংসা, অহংকার, রিয়া — সব বের করে দাও
💚 আল্লাহ তোমার ভেতরটা দেখেন, বাইরে না
🌸 সাদা মন নিয়ে তাঁর কাছে যাও`,

  `📿 "তাসবিহে ফাতিমা" — ঘুমানোর আগে ৩৩ + ৩৩ + ৩৪
🌙 ক্লান্ত দেহে এটা পড়লে ক্লান্তি দূর হয়
💚 রাসূল (ﷺ) ফাতিমা (রা.)-কে শিখিয়েছিলেন
✨ অল্প আমলে বড় সওয়াব`,

  `💚 "যে ব্যক্তি জান্নাত চায়, সে যেন বেশি বেশি করে 'আল্লাহুম্মা আসআলুকাল জান্না' বলে"
🌿 দোয়াই ইবাদত, এবং কবুল হয়
🤲 আল্লাহ দয়ালু — চাইলে দেন
✨ চাওয়া বন্ধ করো না`,

  `🕋 "জুমার দিনে দরূদ পড়লে কিয়ামতের দিন নূর হবে"
🌹 জুমার দিনে কমপক্ষে ১০০ বার দরূদ
💚 নবীজির (ﷺ) প্রতি ভালোবাসা বাড়াও
📿 জুমা মোবারক`,

  `🌙 রাতে ঘুমানোর আগে নিজেকে প্রশ্ন করো:
❓ আজ নামাজ পড়েছি? — হ্যাঁ ✅ / না ❌
❓ কুরআন পড়েছি?
❓ কাউকে কষ্ট দিয়েছি?
💚 ভুল হলে কাল থেকে ঠিক করো — আল্লাহ ক্ষমাশীল`,

  `📖 "নিশ্চয়ই আল্লাহ তাদের ভালোবাসেন যারা পবিত্র থাকে"
💧 প্রতিদিন গোসল করো, দাঁত ব্রাশ করো, নখ কাটো
🌿 পরিষ্কার পোশাক পরো — সুন্নাহ
💚 পরিচ্ছন্ন মুমিন আল্লাহর প্রিয়`,

  `🤲 "আল্লাহুম্মা বারিক লানা ফি রজব ওয়া শা'বান, ওয়া বাল্লিগনা রমাদান"
🌙 রজব-শাবান-রমাদান — তিনটি পবিত্র মাস
💚 রমাদানের জন্য আগে থেকেই দোয়া করো
✨ যিনি রমাদান পান, তিনি ভাগ্যবান`
];

// একই ক্যাপশন বারবার না আসে
let bag = [];
function nextCaption() {
  if (!bag.length) {
    bag = CAPTIONS.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return CAPTIONS[bag.pop()];
}

// ───────────── ছবি ডিস্ক-ক্যাশ ─────────────
const CACHE_DIR = path.join(__dirname, "cache", "cpt");
try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (_) {}

const THUMB_SUFFIX = "l";
const thumbUrl = (u) => u.replace(/\.(jpe?g|png)$/i, `${THUMB_SUFFIX}.jpg`);
const fileOf = (i) => path.join(CACHE_DIR, `t${i}.jpg`);
const isCached = (i) => { try { return fs.statSync(fileOf(i)).size > 2000; } catch (_) { return false; } };

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
  "Referer": "https://imgur.com/",
  "Accept": "image/avif,image/webp,image/*,*/*;q=0.8"
};

const tryRequire = (name) => {
  try { return require(name); } catch (_) {}
  try { return global.nodemodule && global.nodemodule[name]; } catch (_) {}
  return null;
};

async function fetchBuf(url, timeoutMs) {
  const axios = tryRequire("axios");
  if (axios) {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: timeoutMs,
      headers: HEADERS,
      maxRedirects: 5
    });
    return Buffer.from(res.data);
  }
  const request = tryRequire("request");
  if (!request) throw new Error("axios/request পাওয়া যায়নি");
  return new Promise((resolve, reject) => {
    request({ url, timeout: timeoutMs, headers: HEADERS, encoding: null }, (e, r, b) => {
      if (e || !r || r.statusCode !== 200) return reject(e || new Error("HTTP " + (r && r.statusCode)));
      resolve(b);
    });
  });
}

async function download(i, timeoutMs = 10000) {
  const tmp = fileOf(i) + ".tmp";
  try {
    let buf = null;
    for (const url of [thumbUrl(PHOTOS[i]), PHOTOS[i]]) {
      try {
        const b = await fetchBuf(url, timeoutMs);
        if (b && b.length >= 2000) { buf = b; break; }
      } catch (_) {}
    }
    if (!buf) return false;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, fileOf(i));
    return true;
  } catch (_) {
    try { fs.unlinkSync(tmp); } catch (__) {}
    return false;
  }
}

let preloading = false;
async function preload() {
  if (preloading) return;
  preloading = true;
  try {
    const queue = PHOTOS.map((_, i) => i).filter((i) => !isCached(i));
    const worker = async () => { while (queue.length) { await download(queue.shift()); } };
    await Promise.all([worker(), worker(), worker()]);
  } finally {
    preloading = false;
  }
}

module.exports.onLoad = function () {
  console.log(`[cpt] ✅ v${module.exports.config.version} লোড হয়েছে`);
  try {
    for (const f of fs.readdirSync(CACHE_DIR)) if (/^p\d+\.jpg(\.tmp)?$/.test(f)) fs.unlinkSync(path.join(CACHE_DIR, f));
  } catch (_) {}
  setTimeout(() => preload().catch(() => {}), 1500);
};

function buildText(c) {
  return `${c}

⁽━━━━━━━━━━━━━━━━━━━━₎
✦ 𝗖𝗥𝗘𝗗𝗜𝗧 ➤ ${module.exports.config.credits} ✦`;
}

// ───────────── ডুপ্লিকেট প্রোটেকশন (এক প্রিফিক্সে এক মেসেজ) ─────────────
const recent = new Map();
const DEDUP_MS = 5000;
function isDupe(messageID) {
  if (!messageID) return false;
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > DEDUP_MS) recent.delete(k);
  if (recent.has(messageID)) return true;
  recent.set(messageID, now);
  return false;
}

// ───────────── অ্যান্টি-স্প্যাম ─────────────
const COOLDOWN_MS = 60 * 1000;
const BAN_AT = 5;
const NOTICE_DELETE_MS = 2000;

const spam = new Map();
const localBans = new Set();

const cleaner = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of spam) if (now - v.start > COOLDOWN_MS * 5) spam.delete(k);
}, 5 * 60 * 1000);
if (cleaner.unref) cleaner.unref();

function isAdmin(id) {
  const cfg = global.config || {};
  return [].concat(cfg.ADMINBOT || [], cfg.DEVELOPER || [], cfg.OPERATOR || [])
    .map(String).includes(String(id));
}

function isBanned(id) {
  if (localBans.has(id)) return true;
  try { return !!(global.data && global.data.userBanned && global.data.userBanned.has(id)); }
  catch (_) { return false; }
}

async function banUser(Users, id) {
  const reason = "cpt কমান্ড স্প্যাম";
  const dateAdded = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  let saved = false;
  try {
    if (Users && typeof Users.getData === "function" && typeof Users.setData === "function") {
      const d = ((await Users.getData(id)) || {}).data || {};
      d.banned = 1; d.reason = reason; d.dateAdded = dateAdded;
      await Users.setData(id, { data: d });
      saved = true;
    }
    if (global.data && global.data.userBanned && typeof global.data.userBanned.set === "function") {
      global.data.userBanned.set(id, { reason, dateAdded });
      saved = true;
    }
  } catch (e) {
    console.log("[cpt] ব্যান সেভ এরর:", (e && e.message) || e);
  }
  if (!saved) localBans.add(id);
}

function flash(api, text, threadID, messageID) {
  return api.sendMessage(text, threadID, (err, info) => {
    if (err || !info || !info.messageID) return;
    setTimeout(() => { try { api.unsendMessage(info.messageID); } catch (_) {} }, NOTICE_DELETE_MS);
  }, messageID);
}

// ───────────── রান ─────────────
module.exports.run = async function ({ api, event, Users }) {
  const { threadID, messageID } = event;

  // ⚡ ডুপ্লিকেট গার্ড — একই প্রিফিক্সে দুইবার মেসেজ যাবে না
  if (isDupe(messageID)) return;

  if (!creditOK()) {
    console.log("[cpt] ⛔ Credit changed — command disabled.");
    return api.sendMessage(
`⛔ 𝗖𝗥𝗘𝗗𝗜𝗧 𝗘𝗥𝗥𝗢𝗥
⚠️ এই কোডের ক্রেডিট চেঞ্জ করা হয়েছে!
🚫 তাই এই কমান্ডটি কাজ করবে না।
✅ আসল ক্রেডিট ফিরিয়ে দিন।`, threadID, messageID);
  }

  const uid = String(event.senderID);
  if (!isAdmin(uid)) {
    if (isBanned(uid)) return;
    const now = Date.now();
    let s = spam.get(uid);
    if (!s || now - s.start >= COOLDOWN_MS) {
      spam.set(uid, { start: now, count: 1 });
    } else {
      s.count++;
      if (s.count >= BAN_AT) {
        spam.delete(uid);
        await banUser(Users, uid);
        console.log(`[cpt] 🚫 ${uid} স্প্যামের কারণে ব্যান হয়েছে`);
        return api.sendMessage(
`🚫 𝗕𝗔𝗡𝗡𝗘𝗗
বারবার স্প্যাম করার কারণে তোমাকে বট থেকে ব্যান করা হয়েছে।
আনব্যানের জন্য অ্যাডমিনের সাথে যোগাযোগ করো।`, threadID, messageID);
      }
      const left = Math.ceil((COOLDOWN_MS - (now - s.start)) / 1000);
      return flash(api, `⏳ 𝗟𝗜𝗠𝗜𝗧\nএকটু অপেক্ষা করো, আরও ${left} সেকেন্ড পর আবার চেষ্টা করো।`, threadID, messageID);
    }
  }

  const t0 = Date.now();
  const body = buildText(nextCaption());

  const cached = PHOTOS.map((_, i) => i).filter(isCached);
  if (cached.length) {
    const idx = cached[Math.floor(Math.random() * cached.length)];
    return sendOnce(api, body, fs.createReadStream(fileOf(idx)), threadID, messageID, t0);
  }

  preload().catch(() => {});
  const pick = Math.floor(Math.random() * PHOTOS.length);
  const ok = await Promise.race([download(pick, 2500), new Promise((r) => setTimeout(() => r(false), 2500))]);
  if (ok && isCached(pick)) {
    return sendOnce(api, body, fs.createReadStream(fileOf(pick)), threadID, messageID, t0);
  }

  console.log("[cpt] ছবি পাওয়া যায়নি, শুধু টেক্সট গেল");
  return api.sendMessage(body, threadID, messageID);
};

function sendOnce(api, body, stream, threadID, messageID, t0) {
  return api.sendMessage({ body, attachment: stream }, threadID, (err) => {
    console.log(`[cpt] ছবিসহ মেসেজ গেল ${Date.now() - t0}ms-এ${err ? " (এরর)" : ""}`);
    if (err) {
      console.log("[cpt] ছবিসহ পাঠাতে এরর:", (err.message || JSON.stringify(err)).slice(0, 100));
      return api.sendMessage(body, threadID);
    }
  }, messageID);
                        }
