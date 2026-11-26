const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createCanvas, loadImage } = require("canvas");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_SHOW = "MR JUWEL";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";

// টোকেন: পারলে environment variable ব্যবহার করুন (FB_TOKEN)
const TOKEN = process.env.FB_TOKEN || "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

const sha = s => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");

function creditOk() {
  try {
    return (
      sha(CREDIT) === CREDIT_HASH &&
      sha(module.exports.config && module.exports.config.credits) === CREDIT_HASH
    );
  } catch (e) {
    return false;
  }
}

const CREDIT_WARNING =
  "⛔ নোটিশ: এই কোডের ক্রেডিট পরিবর্তন করা হয়েছে!\n" +
  "ক্রেডিট বদলানোর কারণে কমান্ডটি বন্ধ করে দেওয়া হয়েছে।\n" +
  "আবার চালু করতে আসল ক্রেডিট ফিরিয়ে দিন।";

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

try {
  for (const f of fs.readdirSync(cacheDir)) {
    if (f.startsWith("hack2_")) {
      try { fs.unlinkSync(path.join(cacheDir, f)); } catch (e) {}
    }
  }
} catch (e) {}

module.exports.config = {
  name: "hack2",
  aliases: ["hk2"],
  version: "3.0.2",
  credits: CREDIT,
  countDown: 5,
  hasPermssion: 0,
  description: "রিপ্লাই করা ইউজারের বড় প্রোফাইল ফটো সহ রেড-গ্রিন হ্যাকার স্টাইলে ফানি হ্যাকিং GIF বানায়",
  category: "fun",
  commandCategory: "fun",
  usePrefix: true,
  usages: "কারো মেসেজে রিপ্লাই করে: {pn}"
};

if (!creditOk()) console.error("[hack2] " + CREDIT_WARNING.replace(/\n/g, " "));

const cleanup = f =>
  setTimeout(() => {
    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
  }, 15000);

function send(api, msg, threadID, replyID) {
  return new Promise(resolve => {
    try {
      const r = api.sendMessage(msg, threadID, (err, info) => resolve(err ? null : info), replyID);
      if (r && typeof r.then === "function") r.then(resolve).catch(() => resolve(null));
    } catch (e) { resolve(null); }
  });
}

async function loadImg(url) {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
    return await loadImage(Buffer.from(res.data));
  } catch (e) { return null; }
}

// প্রোফাইল ফটো (hack কমান্ডের পদ্ধতি)
function getAvatar(uid) {
  return loadImg(`https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=${TOKEN}`);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function coverDraw(ctx, img, x, y, w, h) {
  const sc = Math.max(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function fitText(ctx, text, maxW, size, weight = "bold", family = "sans-serif") {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxW && s > 12) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  let t = text;
  if (ctx.measureText(t).width > maxW) {
    while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
    t += "…";
  }
  return t;
}

const hsh = n => {
  n = Math.imul(n ^ (n >>> 15), 2246822507);
  n = Math.imul(n ^ (n >>> 13), 3266489909);
  return (n ^ (n >>> 16)) >>> 0;
};

const K = {
  bg: "#04060a", panel: "#070b09", bar: "#111915",
  green: "#00ff66", red: "#ff1744", amber: "#ffb000", cyan: "#00e5ff",
  white: "#f2f2f2", dim: "#4b5a52",
  kw: "#ff5370", str: "#ffd54f", num: "#c792ea", cm: "#5c6b73"
};

const W = 720, H = 1330;
const CX = 360, CY = 262, AR = 165;
const SCALE = 1; // GIF সাইজ: 0.75 = ছোট, 1 = বড়
const N = 72;
const DELAY = 14; // কম = দ্রুত

const LAY = {
  term: { x: 20, y: 520, w: 680, h: 230 },
  hex: { x: 20, y: 760, w: 335, h: 200 },
  net: { x: 365, y: 760, w: 335, h: 200 },
  tool: { x: 20, y: 970, w: 400, h: 290 },
  pass: { x: 430, y: 970, w: 270, h: 290 }
};

const CRED = { x: 20, y: 1274, w: 680, h: 40 };

const FAKE_PASS = "mrjuwel44838";
const FAKE_MAIL = "mrjuwel@gmail.com";

function codeLines(name, uid) {
  const n = String(name).replace(/["\\\n]/g, "");
  const u = String(uid).replace(/[^0-9]/g, "");
  const T = K.white;
  return [
    [0, [["// HACK2 :: intrusion module", K.cm]]],
    [0, [["const ", K.kw], ["target", K.cyan], [" = ", T], [`"${n}"`, K.str], [";", T]]],
    [0, [["const ", K.kw], ["uid", K.cyan], [" = ", T], [`"${u}"`, K.str], [";", T]]],
    [0, []],
    [0, [["await ", K.kw], ["net.", T], ["connect", K.green], ["(", T], ['"facebook.com:443"', K.str], [");", T]]],
    [0, [["firewall.", T], ["bypass", K.green], ["(", T], ['"lol"', K.str], [");", T]]],
    [0, [["let ", K.kw], ["session = token.", T], ["steal", K.green], ["(uid);", T]]],
    [0, [["for ", K.kw], ["(", T], ["let ", K.kw], ["i = ", T], ["0", K.num], ["; i < friends.length; i++) {", T]]],
    [1, [["inbox.", T], ["read", K.green], ["(friends[i]);", T]]],
    [1, [["gallery.", T], ["copy", K.green], ["(photos[i]);", T]]],
    [1, [["if ", K.kw], ["(", T], ["session.valid", K.cyan], [") ", T], ["break", K.kw], [";", T]]],
    [0, [["}", T]]],
    [0, [["password.", T], ["crack", K.green], ["(target, ", T], ['"rockyou.txt"', K.str], [");", T]]],
    [0, [["$.ajax", K.green], ["({", T]]],
    [1, [["url: ", T], ['"/api/hack2/" + uid', K.str], [",", T]]],
    [1, [["method: ", T], ['"POST"', K.str]]],
    [0, [["}).", T], ["done", K.green], ["(", T], ["function", K.kw], ["(res) {", T]]],
    [1, [["status = ", T], ['"HACKED x_x"', K.str], [";", T]]],
    [0, [["});", T]]],
    [0, [["// access_token revoked ✔", K.cm]]],
    [0, [["// friends removed ✔  posts deleted ✔", K.cm]]],
    [0, [["// rip", K.cm]]],
    [0, [["fb.", T], ["login", K.green], ["(target);", T]]],
    [0, [["while ", K.kw], ["(", T], ["true", K.num], [") { ", T], ["hack", K.green], ["(target); }", T]]],
    [0, [["// password: ", K.cm], [`"${FAKE_PASS}"`, K.str], [" (lmao)", K.cm]]]
  ];
}

function drawWindow(ctx, b, title, accent) {
  const { x, y, w, h } = b;
  ctx.fillStyle = accent;
  rr(ctx, x - 1, y - 1, w + 2, h + 2, 8);
  ctx.fill();
  ctx.fillStyle = K.panel;
  rr(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.save();
  rr(ctx, x, y, w, h, 7);
  ctx.clip();
  ctx.fillStyle = K.bar;
  ctx.fillRect(x, y, w, 30);
  ctx.restore();
  [[K.red, 16], [K.amber, 34], [K.green, 52]].forEach(([c, dx]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + dx, y + 15, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#8aa396";
  ctx.font = "14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(title, x + 72, y + 20);
}

function makeBase({ name, uid, avatar }) {
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = K.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(0,255,102,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.fillStyle = "#1a0508";
  ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = K.red;
  ctx.fillRect(0, 55, W, 2);

  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, AR, 0, Math.PI * 2);
  ctx.clip();
  if (avatar) {
    coverDraw(ctx, avatar, CX - AR, CY - AR, AR * 2, AR * 2);
  } else {
    ctx.fillStyle = "#14241c";
    ctx.fillRect(CX - AR, CY - AR, AR * 2, AR * 2);
    ctx.fillStyle = K.dim;
    ctx.font = "bold 110px monospace";
    ctx.textAlign = "center";
    ctx.fillText("?", CX, CY + 36);
  }
  ctx.fillStyle = "rgba(255,23,68,0.14)";
  ctx.fillRect(CX - AR, CY - AR, AR * 2, AR * 2);
  ctx.restore();

  ctx.lineWidth = 6;
  ctx.strokeStyle = K.green;
  ctx.beginPath();
  ctx.arc(CX, CY, AR + 6, 0, Math.PI * 2);
  ctx.stroke();

  const b = AR + 30, L = 40;
  ctx.strokeStyle = K.red;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    const px = CX + sx * b, py = CY + sy * b;
    ctx.beginPath();
    ctx.moveTo(px, py - sy * L);
    ctx.lineTo(px, py);
    ctx.lineTo(px - sx * L, py);
    ctx.stroke();
  });

  ctx.textAlign = "center";
  ctx.fillStyle = K.white;
  ctx.fillText(fitText(ctx, name, W - 60, 40), CX, 486);
  ctx.font = "18px monospace";
  ctx.fillStyle = K.green;
  ctx.fillText(`TARGET ID : ${String(uid).replace(/[^0-9]/g, "")}`, CX, 510);

  drawWindow(ctx, LAY.term, "root@hack2:~# intrusion.js", "#1f3a2b");
  drawWindow(ctx, LAY.hex, "Memory Dump - 0x7ffe", "#1f3a2b");
  drawWindow(ctx, LAY.net, "Network Scanner", "#1f3a2b");
  drawWindow(ctx, LAY.tool, "Hack2 Tool v3.0", "#5a0f1c");
  drawWindow(ctx, LAY.pass, "Password Cracker", "#1f3a2b");

  ctx.fillStyle = "#1f3a2b";
  rr(ctx, CRED.x - 1, CRED.y - 1, CRED.w + 2, CRED.h + 2, 8);
  ctx.fill();
  ctx.fillStyle = K.panel;
  rr(ctx, CRED.x, CRED.y, CRED.w, CRED.h, 7);
  ctx.fill();
  ctx.fillStyle = K.dim;
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  ctx.fillText("CREDIT", CRED.x + 12, CRED.y + 25);

  return c;
}

function stateOf(f) {
  return {
    done: f >= Math.round(0.7 * N),
    pct: Math.min(100, Math.round((f / (0.66 * N)) * 100))
  };
}

function drawHeader(ctx, f, done) {
  ctx.textAlign = "left";
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = f % 2 === 0 ? K.red : K.white;
  ctx.fillText(done ? "[!] HACK2 // TARGET COMPROMISED" : "[!] HACK2 // INTRUSION IN PROGRESS", 20, 37);
  ctx.fillStyle = f % 2 === 0 ? K.red : "#5a0f1c";
  ctx.beginPath();
  ctx.arc(W - 26, 28, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawAvatarLive(ctx, f, done) {
  const rot = (f / N) * Math.PI * 4;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = done ? K.red : K.green;
  for (let i = 0; i < 3; i++) {
    const a = rot + (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.arc(CX, CY, AR + 20, a, a + 0.9);
    ctx.stroke();
  }

  if (!done) {
    const sy = CY - AR + (((f * 2) % N) / N) * AR * 2;
    const half = Math.sqrt(Math.max(0, AR * AR - (sy - CY) * (sy - CY)));
    ctx.fillStyle = "rgba(0,255,102,0.18)";
    ctx.fillRect(CX - half, sy - 26, half * 2, 24);
    ctx.fillStyle = "rgba(0,255,102,0.9)";
    ctx.fillRect(CX - half, sy - 2, half * 2, 4);
  } else {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(-0.2);
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(-190, -48, 380, 96);
    ctx.strokeStyle = f % 2 ? K.red : K.white;
    ctx.lineWidth = 6;
    ctx.strokeRect(-190, -48, 380, 96);
    ctx.fillStyle = f % 2 ? K.red : K.white;
    ctx.font = "bold 62px monospace";
    ctx.textAlign = "center";
    ctx.fillText("HACKED", 0, 22);
    ctx.restore();
  }

  ctx.font = "16px monospace";
  ctx.textAlign = "center";
  [18, 44, W - 44, W - 18].forEach((x, ci) => {
    for (let r = 0; r < 12; r++) {
      const k = hsh((r + f * (ci % 2 ? 1 : 2)) * 13 + ci * 7);
      const ch = "01ABCDEF<>/\\#$"[k % 14];
      const fade = ((r + f) % 12) / 12;
      ctx.fillStyle = `rgba(0,255,102,${(0.12 + 0.6 * (1 - fade)).toFixed(2)})`;
      ctx.fillText(ch, x, 84 + r * 32);
    }
  });
  ctx.textAlign = "left";
}

function drawTerminal(ctx, f, lines) {
  const { x, y, w, h } = LAY.term;
  const n = lines.length, lh = 24;
  const rows = Math.floor((h - 30 - 12) / lh);
  const top = y + 30 + 6;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, top - 2, w - 2, rows * lh + 4);
  ctx.clip();
  ctx.font = "15px monospace";
  ctx.textAlign = "left";
  for (let r = 0; r < rows; r++) {
    const [lvl, toks] = lines[(f + r) % n];
    const yy = top + 17 + r * lh;
    let xx = x + 12 + lvl * 22;
    for (const [text, color] of toks) {
      ctx.fillStyle = color;
      ctx.fillText(text, xx, yy);
      xx += ctx.measureText(text).width;
      if (xx > x + w) break;
    }
    if (r === rows - 1 && f % 2 === 0) {
      ctx.fillStyle = K.green;
      ctx.fillRect(xx + 4, yy - 14, 9, 18);
    }
  }
  ctx.restore();
}

function drawHex(ctx, f) {
  const { x, y, w, h } = LAY.hex;
  const lh = 22;
  const rows = Math.floor((h - 30 - 10) / lh);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 31, w - 2, h - 32);
  ctx.clip();
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  for (let r = 0; r < rows; r++) {
    const seed = f * 3 + r;
    const addr = (0x7ffe0000 + seed * 16).toString(16);
    const bytes = [];
    let ascii = "";
    for (let i = 0; i < 6; i++) {
      const b = hsh(seed * 8 + i) & 255;
      bytes.push(b.toString(16).padStart(2, "0"));
      ascii += b >= 33 && b <= 126 ? String.fromCharCode(b) : ".";
    }
    const yy = y + 30 + 22 + r * lh;
    let xx = x + 10;
    const parts = [
      [`0x${addr}  `, K.cyan],
      [bytes.join(" ") + "  ", r % 3 === 0 ? K.red : K.green],
      [`|${ascii}|`, "#8aa396"]
    ];
    for (const [t, c] of parts) {
      ctx.fillStyle = c;
      ctx.fillText(t, xx, yy);
      xx += ctx.measureText(t).width;
    }
  }
  ctx.restore();
}

function drawNet(ctx, f, n) {
  const { x, y, w, h } = LAY.net;
  const ports = [21, 22, 80, 443, 3306, 8080, 5900];
  const rows = Math.floor((h - 30 - 10) / 24);
  ctx.font = "15px monospace";
  for (let r = 0; r < rows; r++) {
    const k = (f + r) % n;
    const ip = `192.168.${(k * 7 + 11) % 250}.${(k * 31 + 5) % 250}`;
    const port = ports[(k * 3) % ports.length];
    const open = k % 3 !== 1;
    const yy = y + 30 + 26 + r * 24;
    ctx.textAlign = "left";
    ctx.fillStyle = open ? K.green : K.amber;
    ctx.fillText(`[+] ${ip}:${port}`, x + 12, yy);
    ctx.textAlign = "right";
    ctx.fillStyle = open ? K.red : "#8aa396";
    ctx.fillText(open ? "OPEN" : "filtered", x + w - 12, yy);
  }
  ctx.textAlign = "left";
}

function drawTool(ctx, f, name, uid) {
  const { x, y, w } = LAY.tool;
  const { done, pct } = stateOf(f);
  const u = String(uid).replace(/[^0-9]/g, "");
  const steps = [
    "Connecting to server",
    "Bypassing firewall",
    `Finding target ${u}`,
    "Cracking password",
    "Stealing session",
    `Logged in: ${name}`
  ];
  const stepAt = steps.map((_, i) => Math.round(((i + 1) / steps.length) * 0.66 * N));
  const spin = ["|", "/", "-", "\\"][f % 4];
  for (let i = 0; i < steps.length; i++) {
    const yy = y + 30 + 24 + i * 24;
    const fin = f >= stepAt[i];
    const active = !fin && (i === 0 || f >= stepAt[i - 1]);
    ctx.fillStyle = fin ? K.white : active ? K.amber : "#3b4a43";
    ctx.textAlign = "left";
    ctx.fillText(fitText(ctx, steps[i], w - 120, 16, "bold", "monospace"), x + 14, yy);
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = fin ? K.green : active ? K.amber : "#3b4a43";
    ctx.fillText(fin ? "[ OK ]" : active ? `[ ${spin} ]` : "[ -- ]", x + w - 14, yy);
  }
  ctx.textAlign = "left";

  const by = y + 30 + 24 + steps.length * 24 - 6;
  ctx.fillStyle = "#14241c";
  rr(ctx, x + 14, by, w - 28, 14, 7);
  ctx.fill();
  ctx.fillStyle = done ? K.red : K.green;
  rr(ctx, x + 14, by, Math.max(14, ((w - 28) * pct) / 100), 14, 7);
  ctx.fill();

  ctx.font = "bold 22px monospace";
  if (done) {
    ctx.fillStyle = f % 2 === 0 ? K.red : K.white;
    ctx.fillText("[ HACKING DONE ]", x + 14, by + 44);
  } else {
    ctx.fillStyle = f % 2 === 0 ? K.amber : "#8aa396";
    ctx.fillText("[ HACKING... ]", x + 14, by + 44);
  }
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = K.cyan;
  ctx.fillText("Login    :", x + 14, by + 72);
  ctx.fillText("Password :", x + 14, by + 96);
  ctx.fillStyle = done ? K.str : "#3b4a43";
  ctx.fillText(done ? fitText(ctx, FAKE_MAIL, w - 140, 16, "bold", "monospace") : "********", x + 120, by + 72);
  ctx.font = "bold 16px monospace";
  ctx.fillStyle = done ? K.red : "#3b4a43";
  ctx.fillText(done ? fitText(ctx, FAKE_PASS, w - 140, 16, "bold", "monospace") : "********", x + 120, by + 96);
}

const WORDS = [
  "123456", "password", "qwerty", "iloveyou", "admin123", "12345678", "abc123",
  "letmein", "bangladesh", "dragon", "monkey", "football", "sunshine",
  "111111", "fb12345", "welcome1", "ami_tomake", "bhalobashi", "trustno1"
];

function drawCracker(ctx, f) {
  const { x, y, w, h } = LAY.pass;
  const { done } = stateOf(f);
  const rows = 8;
  ctx.font = "16px monospace";
  for (let r = 0; r < rows; r++) {
    const yy = y + 30 + 26 + r * 26;
    const last = r === rows - 1;
    ctx.textAlign = "left";
    if (last && done) {
      ctx.fillStyle = K.green;
      ctx.fillText(fitText(ctx, `> ${FAKE_PASS}`, w - 100, 16, "normal", "monospace"), x + 12, yy);
      ctx.font = "16px monospace";
      ctx.textAlign = "right";
      ctx.fillText("[FOUND]", x + w - 12, yy);
    } else {
      ctx.fillStyle = "#8aa396";
      ctx.fillText(`> ${WORDS[(f + r) % WORDS.length]}`, x + 12, yy);
      ctx.textAlign = "right";
      ctx.fillStyle = K.red;
      ctx.fillText("[FAIL]", x + w - 12, yy);
    }
  }
  ctx.textAlign = "left";
  ctx.fillStyle = K.cyan;
  ctx.font = "14px monospace";
  ctx.fillText(`speed: ${1000 + ((f * 731) % 9000)} pw/s`, x + 12, y + h - 12);
}

function drawPopup(ctx, f, name) {
  const dx = 100, dy = 548, dw = 520, dh = 150;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  rr(ctx, dx + 6, dy + 6, dw, dh, 8);
  ctx.fill();
  ctx.fillStyle = "#101614";
  rr(ctx, dx, dy, dw, dh, 8);
  ctx.fill();
  ctx.save();
  rr(ctx, dx, dy, dw, dh, 8);
  ctx.clip();
  ctx.fillStyle = f % 2 ? K.red : "#a5102a";
  ctx.fillRect(dx, dy, dw, 34);
  ctx.restore();
  ctx.fillStyle = K.white;
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "left";
  ctx.fillText("SECURITY ALERT", dx + 14, dy + 23);
  ctx.fillStyle = K.red;
  ctx.beginPath();
  ctx.moveTo(dx + 50, dy + 56);
  ctx.lineTo(dx + 82, dy + 112);
  ctx.lineTo(dx + 18, dy + 112);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#101614";
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.fillText("!", dx + 50, dy + 106);
  ctx.textAlign = "left";
  ctx.fillStyle = K.white;
  ctx.font = "bold 24px monospace";
  ctx.fillText("Account hacked!", dx + 108, dy + 78);
  ctx.fillStyle = "#8aa396";
  ctx.fillText(fitText(ctx, `Target: ${name}`, dw - 130, 18, "normal", "monospace"), dx + 108, dy + 108);
  ctx.textAlign = "left";
}

function drawCredit(ctx, f) {
  const { x, y, w, h } = CRED;
  const hue = Math.round((f / N) * 360);

  ctx.strokeStyle = f % 2 === 0 ? K.green : "#1f3a2b";
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 7);
  ctx.stroke();

  ctx.save();
  rr(ctx, x, y, w, h, 7);
  ctx.clip();

  ctx.textAlign = "center";
  const txt = fitText(ctx, CREDIT_SHOW, w - 160, 20, "bold", "monospace");
  ctx.fillStyle = `hsla(${hue}, 100%, 55%, 0.25)`;
  ctx.fillText(txt, x + w / 2 + 1, y + 27 + 1);
  ctx.fillStyle = `hsl(${hue}, 100%, 62%)`;
  ctx.fillText(txt, x + w / 2, y + 27);

  const sx = x - 120 + ((f % N) / N) * (w + 240);
  const g = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(sx - 60, y, 120, h);

  ctx.restore();
  ctx.textAlign = "left";
}

function drawLive(ctx, f, name, uid, lines) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const { done } = stateOf(f);
  drawHeader(ctx, f, done);
  drawAvatarLive(ctx, f, done);
  drawTerminal(ctx, f, lines);
  drawHex(ctx, f);
  drawNet(ctx, f, lines.length);
  drawTool(ctx, f, name, uid);
  drawCracker(ctx, f);
  drawCredit(ctx, f);
  if (done) {
    drawPopup(ctx, f, name);
    ctx.strokeStyle = f % 2 ? K.red : "#5a0010";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);
  }
  ctx.restore();
}

async function makeGif({ name, uid, avatar, file }) {
  const base = makeBase({ name, uid, avatar });
  const ow = Math.round(W * SCALE);
  const oh = Math.round(H * SCALE);
  const lines = codeLines(name, uid);

  const frame = createCanvas(W, H);
  const fctx = frame.getContext("2d");
  const out = createCanvas(ow, oh);
  const octx = out.getContext("2d");

  const render = f => {
    fctx.drawImage(base, 0, 0);
    drawLive(fctx, f, name, uid, lines);
    octx.drawImage(frame, 0, 0, ow, oh);
    return octx.getImageData(0, 0, ow, oh).data;
  };

  const raw = [];
  const sample = [];
  for (let f = 0; f < N; f++) {
    const d = Uint8ClampedArray.from(render(f));
    raw.push(d);
    if (f % 4 === 0 || f === N - 1) {
      for (let i = 0; i < d.length; i += 48) sample.push((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    }
  }
  const pal = buildPalette(sample);
  const map = mapper(pal);

  const list = [];
  let prev = null;
  for (let f = 0; f < N; f++) {
    const d = raw[f];
    const idx = new Uint8Array(ow * oh);
    for (let i = 0, j = 0; j < idx.length; i += 4, j++) idx[j] = map(d[i], d[i + 1], d[i + 2]);

    if (!prev) {
      list.push({ x: 0, y: 0, w: ow, h: oh, idx });
    } else {
      let minX = ow, maxX = -1, minY = oh, maxY = -1;
      for (let y = 0; y < oh; y++) {
        const row = y * ow;
        for (let x = 0; x < ow; x++) {
          if (idx[row + x] !== prev[row + x]) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) {
        list.push({ x: 0, y: 0, w: 1, h: 1, idx: Uint8Array.of(prev[0]) });
      } else {
        const cw = maxX - minX + 1, ch = maxY - minY + 1;
        const crop = new Uint8Array(cw * ch);
        for (let y = 0; y < ch; y++) {
          crop.set(idx.subarray((minY + y) * ow + minX, (minY + y) * ow + minX + cw), y * cw);
        }
        list.push({ x: minX, y: minY, w: cw, h: ch, idx: crop });
      }
    }
    prev = idx;
  }

  fs.writeFileSync(file, encodeGif(list, ow, oh, pal, DELAY));
  return file;
}

const FIXED = [
  "#04060a", "#070b09", "#111915", "#00ff66", "#ff1744", "#ffb000", "#00e5ff", "#f2f2f2",
  "#4b5a52", "#ffd54f", "#c792ea", "#ff5370", "#5c6b73", "#000000", "#ffffff", "#1a0508",
  "#14241c", "#5a0f1c", "#a5102a", "#8aa396", "#3b4a43", "#101614", "#1f3a2b", "#5a0010"
].map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);

function buildPalette(pts) {
  const want = 256 - FIXED.length;
  const ch = (v, c) => (v >> (16 - c * 8)) & 255;
  const boxes = [pts];
  while (boxes.length < want) {
    let bi = -1, bs = 1;
    boxes.forEach((b, i) => { if (b.length > bs) { bs = b.length; bi = i; } });
    if (bi < 0) break;
    const b = boxes[bi];
    let best = 0, range = -1;
    for (let c = 0; c < 3; c++) {
      let mn = 255, mx = 0;
      for (const v of b) { const x = ch(v, c); if (x < mn) mn = x; if (x > mx) mx = x; }
      if (mx - mn > range) { range = mx - mn; best = c; }
    }
    if (range <= 0) { boxes[bi] = [b[0]]; continue; }
    b.sort((p, q) => ch(p, best) - ch(q, best));
    const m = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, m), b.slice(m));
  }
  const pal = FIXED.map(c => c.slice());
  for (const b of boxes) {
    let r = 0, g = 0, bl = 0;
    for (const v of b) { r += v >> 16; g += (v >> 8) & 255; bl += v & 255; }
    const k = b.length || 1;
    pal.push([Math.round(r / k), Math.round(g / k), Math.round(bl / k)]);
  }
  while (pal.length < 256) pal.push([0, 0, 0]);
  return pal.slice(0, 256);
}

function mapper(pal) {
  const cache = new Int16Array(32768).fill(-1);
  return (r, g, b) => {
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let v = cache[key];
    if (v < 0) {
      let bd = 1e12;
      for (let i = 0; i < 256; i++) {
        const dr = pal[i][0] - r, dg = pal[i][1] - g, db = pal[i][2] - b;
        const d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
        if (d < bd) { bd = d; v = i; }
      }
      cache[key] = v;
    }
    return v;
  };
}

function lzw(px) {
  const CLEAR = 256, EOI = 257;
  const out = [];
  let size = 9, next = 258, cur = 0, bits = 0;
  const dict = new Map();
  const emit = c => {
    cur |= c << bits;
    bits += size;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  };
  emit(CLEAR);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i];
    const key = (prefix << 8) | k;
    const v = dict.get(key);
    if (v !== undefined) { prefix = v; continue; }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next - 1 === (1 << size) && size < 12) size++;
    } else {
      emit(CLEAR);
      dict.clear();
      size = 9;
      next = 258;
    }
    prefix = k;
  }
  emit(prefix);
  emit(EOI);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function encodeGif(frames, w, h, pal, delay) {
  const o = [];
  const w16 = v => o.push(v & 255, (v >> 8) & 255);
  [..."GIF89a"].forEach(c => o.push(c.charCodeAt(0)));
  w16(w); w16(h);
  o.push(0xf7, 0, 0);
  for (const c of pal) o.push(c[0], c[1], c[2]);
  o.push(0x21, 0xff, 0x0b);
  [..."NETSCAPE2.0"].forEach(c => o.push(c.charCodeAt(0)));
  o.push(0x03, 0x01, 0x00, 0x00, 0x00);
  for (const f of frames) {
    o.push(0x21, 0xf9, 0x04, 0x04);
    w16(delay);
    o.push(0x00, 0x00);
    o.push(0x2c);
    w16(f.x); w16(f.y); w16(f.w); w16(f.h);
    o.push(0x00, 8);
    const data = lzw(f.idx);
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255);
      o.push(chunk.length);
      for (const b of chunk) o.push(b);
    }
    o.push(0x00);
  }
  o.push(0x3b);
  return Buffer.from(o);
}

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  if (!creditOk()) {
    return api.sendMessage(CREDIT_WARNING, threadID, messageID);
  }

  let uid = event.messageReply?.senderID;
  if (!uid && event.mentions && Object.keys(event.mentions).length)
    uid = Object.keys(event.mentions)[0];

  if (!uid)
    return api.sendMessage("⚠️ যাকে হ্যাক করবেন তার মেসেজে রিপ্লাই করে লিখুন: hack2", threadID, messageID);

  const wait = await send(api, "☠️ HACK2 চালু হচ্ছে... টার্গেট লক করা হচ্ছে ⚠️", threadID);
  const removeWait = () => {
    try { if (wait?.messageID) api.unsendMessage(wait.messageID); } catch (e) {}
  };
  const file = path.join(cacheDir, `hack2_${Date.now()}_${uid}.gif`);

  try {
    const info = await new Promise((resolve, reject) =>
      api.getUserInfo(uid, (err, data) => (err ? reject(err) : resolve(data)))
    );
    const name = info?.[uid]?.name || "Facebook User";
    const avatar = await getAvatar(uid);

    await makeGif({ name, uid, avatar, file });

    api.sendMessage(
      { attachment: fs.createReadStream(file) },
      threadID,
      () => { removeWait(); cleanup(file); },
      messageID
    );
  } catch (error) {
    removeWait();
    cleanup(file);
    return api.sendMessage(`❌ ছবি বানানো যায়নি\n${error.message}`, threadID, messageID);
  }
};
