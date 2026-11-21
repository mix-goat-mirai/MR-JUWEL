const fs = require("fs-extra");
const path = require("path");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const DATA = path.join(__dirname, "cache", "adminadd.json");

// ফন্ট (𝚊𝚋𝚌𝚍)
const f = (t) => String(t).replace(/[A-Za-z0-9]/g, (c) => {
  const n = c.charCodeAt(0);
  if (n >= 97 && n <= 122) return String.fromCodePoint(0x1D68A + n - 97);
  if (n >= 65 && n <= 90) return String.fromCodePoint(0x1D670 + n - 65);
  return String.fromCodePoint(0x1D7F6 + n - 48);
});

// ফ্রেম
const frame = (icon, title, cards = []) =>
`╭──「 ${icon} ${f(title)} 」──╮
${cards.map((c) => c.map((l) => "│ " + l).join("\n")).join("\n├┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n")}
╰─⚡ ${f("Powered By Juwel")} ⚡─╯
   ${CREDIT}`;

const when = (ts) =>
  new Date(ts).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: true });

const ok = () => module.exports.config.credits === CREDIT;
const load = () => { try { return fs.readJsonSync(DATA); } catch { return {}; } };
const save = (d) => fs.writeJsonSync(DATA, d, { spaces: 2 });

// ===== অ্যাডমিন লিস্ট (সরাসরি কনফিগ থেকে) =====
const lists = () => {
  const out = [];
  if (global.config) {
    for (const k of ["ADMINBOT", "OPERATOR"])
      if (Array.isArray(global.config[k])) out.push(global.config[k]);
  }
  const g = global.GoatBot && global.GoatBot.config;
  if (g && Array.isArray(g.adminBot)) out.push(g.adminBot);
  return out;
};
const adminList = () => lists().flat().map(String);

// কনফিগের অ্যাডমিন = লিস্টে আছে, কিন্তু এই কমান্ড দিয়ে যোগ করা না
const isBase = (id) => adminList().includes(String(id)) && !load()[String(id)];

const grant = (id) => {
  id = String(id);
  const target = (global.config && Array.isArray(global.config.ADMINBOT))
    ? global.config.ADMINBOT
    : (global.GoatBot && global.GoatBot.config && global.GoatBot.config.adminBot);
  if (target && !target.map(String).includes(id)) target.push(id);
  const g = global.GoatBot && global.GoatBot.config;
  if (g && Array.isArray(g.adminBot) && g.adminBot !== target && !g.adminBot.map(String).includes(id)) g.adminBot.push(id);
};
const revoke = (id) => {
  id = String(id);
  for (const arr of lists()) {
    for (let i = arr.length - 1; i >= 0; i--) if (String(arr[i]) === id) arr.splice(i, 1);
  }
};

// M1 / 1M, H2 / 2H, D3 / 3D
function parseTime(tok) {
  let m = /^(\d+)([mhd])$/i.exec(tok);
  let n, u;
  if (m) { n = +m[1]; u = m[2].toLowerCase(); }
  else {
    m = /^([mhd])(\d+)$/i.exec(tok);
    if (!m) return null;
    n = +m[2]; u = m[1].toLowerCase();
  }
  if (!n) return null;
  const ms = { m: 60000, h: 3600000, d: 86400000 }[u];
  const name = { m: "মিনিট", h: "ঘণ্টা", d: "দিন" }[u];
  return { ms: n * ms, label: `${n} ${name}` };
}

function left(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return `${d ? d + "d " : ""}${h ? h + "h " : ""}${m}m`;
}

function getTargets(event, args) {
  const ids = new Set();
  if (event.type === "message_reply" && event.messageReply) ids.add(String(event.messageReply.senderID));
  if (event.mentions) Object.keys(event.mentions).forEach((i) => ids.add(String(i)));
  args.forEach((a) => { if (/^\d{8,}$/.test(a)) ids.add(a); });
  return [...ids];
}

async function nameOf(Users, id) {
  try { return await Users.getNameUser(id); } catch { return String(id); }
}

// সময় শেষ হলে অটো রিমুভ
function sweep(api) {
  const db = load();
  const now = Date.now();
  let changed = false;
  for (const id of Object.keys(db)) {
    if (db[id].expires && db[id].expires <= now) {
      revoke(id);
      const t = db[id].threadID;
      delete db[id];
      changed = true;
      if (t) api.sendMessage(frame("⌛", "ADMIN EXPIRED", [[
        `🆔 ${f("UID")} : ${f(id)}`,
        `📛 ${f("Status")} : সময় শেষ, অ্যাডমিন রিমুভ হয়েছে`
      ]]), t);
    }
  }
  if (changed) save(db);
}

// প্রথমবার চালু হলে সেভ করা অ্যাডমিনদের ফেরত আনে ও টাইমার চালায়
function init(api) {
  if (global.mrjuwelAdminInit || !ok()) return;
  global.mrjuwelAdminInit = true;
  fs.ensureDirSync(path.dirname(DATA));
  if (!fs.existsSync(DATA)) save({});
  const db = load();
  const now = Date.now();
  for (const id of Object.keys(db)) {
    if (db[id].expires && db[id].expires <= now) delete db[id];
    else grant(id);
  }
  save(db);
  if (global.mrjuwelAdminTimer) clearInterval(global.mrjuwelAdminTimer);
  global.mrjuwelAdminTimer = setInterval(() => sweep(api), 15000);
}

const noPerm = () => frame("🚫", "NO PERMISSION", [[
  "❌ এই কমান্ড শুধু কনফিগারেশনের",
  "   অ্যাডমিন চালাতে পারবে"
]]);

// ===== রিমুভ =====
async function doRemove({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;
  const send = (t) => api.sendMessage(t, threadID, messageID);

  if (!ok()) return send("⚠️ ক্রেডিট পরিবর্তন করা হয়েছে, তাই কোড কাজ করবে না!");
  if (!isBase(senderID)) return send(noPerm());

  const targets = getTargets(event, args);
  if (!targets.length)
    return send(frame("⚠️", "NO TARGET", [[
      "কাকে রিমুভ করবে?",
      "রিপ্লাই দাও, @মেনশন করো বা UID দাও"
    ]]));

  const db = load();
  const cards = [];
  for (const id of targets) {
    const name = await nameOf(Users, id);
    if (!db[id]) {
      cards.push([
        `👤 ${f("Name")} : ${name}`,
        adminList().includes(String(id)) ? "🔒 কনফিগ অ্যাডমিন, রিমুভ করা যাবে না" : "❌ অ্যাডমিন লিস্টে নেই"
      ]);
      continue;
    }
    delete db[id];
    revoke(id);
    cards.push([
      `👤 ${f("Name")} : ${name}`,
      `🆔 ${f("UID")} : ${f(id)}`,
      `🗑️ ${f("Status")} : অ্যাডমিন রিমুভ হয়েছে`
    ]);
  }
  save(db);
  return send(frame("🗑️", "ADMIN REMOVED", cards));
}

module.exports.config = {
  name: "adminadd",
  version: "3.1.0",
  hasPermssion: 2,
  credits: CREDIT, // ক্রেডিট বদলালে কোড কাজ করবে না
  description: "রিপ্লাই/মেনশন/UID দিয়ে বটের অ্যাডমিন অ্যাড/রিমুভ (পার্মানেন্ট বা টাইমড)",
  commandCategory: "admin",
  usages: "adminadd [reply/@/uid] [M1|H1|D1] | adminremove [reply/@/uid] | adminadd list",
  cooldowns: 3
};

module.exports.onLoad = function ({ api }) {
  init(api);
};

// "adminremove" লিখলেও যেন কাজ করে (এই একই ফাইলে)
module.exports.handleEvent = async function ({ api, event, Users }) {
  init(api);
  if (!event.body) return;
  let prefix = global.config.PREFIX;
  try {
    const td = global.data.threadData.get(String(event.threadID)) || {};
    if (td.PREFIX) prefix = td.PREFIX;
  } catch {}
  const body = event.body.trim();
  if (!body.toLowerCase().startsWith((prefix + "adminremove").toLowerCase())) return;
  const args = body.split(/\s+/).slice(1);
  return doRemove({ api, event, args, Users });
};

module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, messageID, senderID } = event;
  const send = (t) => api.sendMessage(t, threadID, messageID);

  if (!ok()) return send("⚠️ ক্রেডিট পরিবর্তন করা হয়েছে, তাই কোড কাজ করবে না!");
  init(api);
  if (!isBase(senderID)) return send(noPerm());

  const first = (args[0] || "").toLowerCase();

  // adminadd remove ... ও কাজ করবে
  if (["remove", "rm", "del"].includes(first))
    return doRemove({ api, event, args: args.slice(1), Users });

  const db = load();

  // ===== LIST =====
  if (first === "list") {
    const ids = Object.keys(db);
    const baseCount = [...new Set(adminList())].filter((x) => !db[x]).length;
    const cards = [[
      `🔰 ${f("Config Admin")} : ${f(baseCount)}`,
      `➕ ${f("Added Admin")}  : ${f(ids.length)}`
    ]];
    if (!ids.length) cards.push(["📭 কোনো অ্যাডমিন যোগ করা হয়নি"]);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const name = await nameOf(Users, id);
      const rem = db[id].expires ? left(db[id].expires - Date.now()) : "∞";
      cards.push([`${f(i + 1)}. 👑 ${name}`, `🆔 ${f(id)}`, `⏳ ${f(rem)}`]);
    }
    return send(frame("📋", "ADMIN LIST", cards));
  }

  // ===== ADD =====
  const targets = getTargets(event, args);
  if (!targets.length)
    return send(frame("📖", "ADMINADD HELP", [[
      `👑 ${f("adminadd")} (রিপ্লাই/@/UID) → পার্মানেন্ট`,
      `⏱️ ${f("adminadd M1")} → ১ মিনিট`,
      `⏱️ ${f("adminadd H1")} → ১ ঘণ্টা`,
      `⏱️ ${f("adminadd D1")} → ১ দিন`,
      `🗑️ ${f("adminremove")} (রিপ্লাই/@/UID) → রিমুভ`,
      `📋 ${f("adminadd list")} → লিস্ট`
    ]]));

  let t = null;
  for (const a of args) { t = parseTime(a); if (t) break; }

  const cards = [];
  for (const id of targets) {
    const name = await nameOf(Users, id);
    if (isBase(id)) {
      cards.push([`👤 ${f("Name")} : ${name}`, "ℹ️ আগে থেকেই কনফিগ অ্যাডমিন"]);
      continue;
    }
    const expires = t ? Date.now() + t.ms : null;
    db[id] = { expires, threadID, addedBy: String(senderID), addedAt: Date.now() };
    grant(id);
    cards.push([
      `👑 ${f("Name")} : ${name}`,
      `🆔 ${f("UID")} : ${f(id)}`,
      t ? `⏳ ${f("Time")} : ${t.label}` : `♾️ ${f("Time")} : ${f("Permanent")}`,
      expires ? `📅 ${f("Ends")} : ${f(when(expires))}` : `📅 ${f("Ends")} : রিমুভ না করা পর্যন্ত`,
      `✅ ${f("Status")} : অ্যাডমিন হয়েছে`
    ]);
  }
  save(db);
  return send(frame("👑", "ADMIN ADDED", cards));
};
