const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage, registerFont } = require("canvas");

/* ───────────── ফন্ট (নেই থাকলে নিজে ডাউনলোড করে নেবে) ───────────── */
const fontDir = path.join(__dirname, "fonts");
if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });

const FONT_BASE =
  "https://github.com/notofonts/notofonts.github.io/raw/main/fonts";
const FONT_LIST = [
  ["NotoSans", "Noto Sans"],
  ["NotoSansBengali", "Noto Sans Bengali"],
  ["NotoSansDevanagari", "Noto Sans Devanagari"],
  ["NotoSansGurmukhi", "Noto Sans Gurmukhi"]
];

let fontsReady = null;
function ensureFonts() {
  if (fontsReady) return fontsReady;
  fontsReady = (async () => {
    for (const [name, family] of FONT_LIST) {
      for (const [style, weight] of [["Regular", "normal"], ["Bold", "bold"]]) {
        const file = `${name}-${style}.ttf`;
        const fp = path.join(fontDir, file);
        try {
          const ok = fs.existsSync(fp) && fs.statSync(fp).size > 10000;
          if (!ok) {
            const { data } = await axios.get(
              `${FONT_BASE}/${name}/hinted/ttf/${file}`,
              { responseType: "arraybuffer", timeout: 60000 }
            );
            fs.writeFileSync(fp, Buffer.from(data));
          }
          registerFont(fp, { family, weight });
        } catch (e) {
          console.log(`[song] ফন্ট লোড হয়নি: ${file} → ${e.message}`);
        }
      }
    }
  })();
  return fontsReady;
}
ensureFonts();

const FONT =
  '"Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", "Noto Sans Gurmukhi", sans-serif';

/* ───────────── সেটিংস ───────────── */
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_HASH =
  "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const creditOK = () => {
  try {
    const h = c =>
      require("crypto").createHash("sha256").update(String(c), "utf8").digest("hex");
    return h(CREDIT) === CREDIT_HASH && h(module.exports.config.credits) === CREDIT_HASH;
  } catch (e) {
    return false;
  }
};
const CREDIT_MSG = "⛔ ক্রেডিট পরিবর্তন করা হয়েছে, তাই এই কমান্ড বন্ধ।\nআসল ক্রেডিট ফিরিয়ে দিন।";
const DL_API = "https://eryxenx.agi.bd/api/song"; // ?url=<youtube link>
const SELECT_TIMEOUT = 2 * 60 * 1000; // ২ মিনিট
const MAX_RESULTS = 5;
const PRELOAD_COUNT = 2; // প্রথম কয়টা গানের লিংক আগে থেকে আনবে (০ দিলে বন্ধ)
const RATE_LIMIT = 5; // সর্বোচ্চ কমান্ড
const RATE_WINDOW = 60 * 60 * 1000; // ১ ঘন্টা
const API_TIMEOUT = 90 * 1000;

const usage = new Map(); // senderID -> [timestamp, ...]

function checkRate(uid) {
  const now = Date.now();
  const list = (usage.get(uid) || []).filter(t => now - t < RATE_WINDOW);
  usage.set(uid, list);
  if (list.length >= RATE_LIMIT)
    return { ok: false, wait: RATE_WINDOW - (now - list[0]) };
  list.push(now);
  return { ok: true, stamp: now };
}
function refundRate(uid, stamp) {
  const list = usage.get(uid) || [];
  const i = list.indexOf(stamp);
  if (i !== -1) list.splice(i, 1);
}

const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

module.exports.config = {
  name: "song",
  aliases: ["music", "songs", "gan"],
  version: "3.0.0",
  credits: CREDIT,
  countDown: 0,
  hasPermssion: 0,
  description: "YouTube music downloader",
  category: "media",
  commandCategory: "media",
  usePrefix: true,
  usages: "{pn} song name"
};

/* ───────────── হেল্পার ───────────── */
const safeUnsend = (api, id) => {
  if (!id) return;
  try {
    const p = api.unsendMessage(id);
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
};
const cleanup = files =>
  setTimeout(() => {
    files.forEach(f => {
      try {
        if (f && fs.existsSync(f)) fs.unlinkSync(f);
      } catch (e) {}
    });
  }, 15000);

function formatLeft(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} ঘন্টা ${m} মিনিট`;
  return m > 0 ? `${m} মিনিট ${sec} সেকেন্ড` : `${sec} সেকেন্ড`;
}

function getThumb(song) {
  const id = song.videoId || song.id;
  return (
    song.thumbnail ||
    song.image ||
    song.thumbnails?.[0]?.url ||
    song.thumb ||
    (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null)
  );
}

function formatDuration(d) {
  if (d === undefined || d === null || d === "") return "N/A";
  if (typeof d === "object") {
    d = d.timestamp || d.text || d.seconds || d.duration || null;
    if (d === null) return "N/A";
  }
  if (typeof d === "number" || /^\d+(\.\d+)?$/.test(String(d).trim())) {
    const total = Math.floor(Number(d));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = n => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }
  return String(d);
}

const formatViews = v => {
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "string" && /[a-zA-Z]/.test(v)) return v;
  const n = Number(String(v).replace(/[^\d.]/g, ""));
  if (!n) return "";
  let out;
  if (n >= 1e9) out = (n / 1e9).toFixed(1).replace(".0", "") + "B";
  else if (n >= 1e6) out = Math.round(n / 1e6) + "M";
  else if (n >= 1e3) out = Math.round(n / 1e3) + "K";
  else out = String(n);
  return out + " views";
};

/* ───────────── সার্চ (yt-search: npm i yt-search) ───────────── */
async function searchSongs(query) {
  let yts;
  try {
    yts = require("yt-search");
  } catch (e) {
    throw new Error("yt-search প্যাকেজ নেই। টার্মিনালে চালান: npm i yt-search");
  }
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await yts(query);
      const videos = (r.videos || []).slice(0, 15);
      if (videos.length) return videos;
      throw new Error("কোনো গান পাওয়া যায়নি");
    } catch (e) {
      lastErr = e;
      console.log(`[song] সার্চ চেষ্টা ${attempt} ব্যর্থ: ${e.message}`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw lastErr || new Error("সার্চ ব্যর্থ");
}

/* ───────────── API রেসপন্স থেকে ডাউনলোড লিংক বের করা ─────────────
   রেসপন্সের key-এর নাম না জানা থাকায় নেস্টেড অবজেক্টেও খোঁজে */
const LINK_KEYS = [
  "download_url", "downloadUrl", "download", "file_url", "fileUrl",
  "audio_url", "audioUrl", "audio", "mp3", "link", "url"
];
function pickLink(obj, ytUrl, depth = 0) {
  if (!obj || depth > 4) return null;
  if (typeof obj === "string")
    return /^https?:\/\//.test(obj) && obj !== ytUrl ? obj : null;
  if (typeof obj !== "object") return null;

  for (const k of LINK_KEYS) {
    const v = obj[k];
    if (typeof v === "string" && /^https?:\/\//.test(v) && v !== ytUrl)
      return v;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object") {
      const found = pickLink(v, ytUrl, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/* ───────────── গানের ডাউনলোড লিংক আনা ───────────── */
async function fetchSong(song) {
  const ytUrl =
    song.url ||
    (song.videoId ? `https://www.youtube.com/watch?v=${song.videoId}` : null);
  if (!ytUrl) throw new Error("গানের লিংক পাওয়া যায়নি");

  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.get(DL_API, {
        params: { url: ytUrl },
        responseType: "arraybuffer",
        timeout: API_TIMEOUT,
        validateStatus: () => true
      });
      const type = String(res.headers["content-type"] || "").toLowerCase();
      const buf = Buffer.from(res.data);

      // API সরাসরি অডিও ফাইল দিলে
      if (/audio|octet-stream/.test(type) && buf.length > 10000)
        return { buffer: buf, title: song.title };

      // নইলে JSON ধরে লিংক খুঁজবে
      let json = null;
      try {
        json = JSON.parse(buf.toString("utf8"));
      } catch (e) {}

      if (!json) throw new Error(`API থেকে বোধগম্য উত্তর আসেনি (HTTP ${res.status})`);
      if (json.success === false || json.error)
        throw new Error(
          typeof json.error === "string" ? json.error : "API এরর দিয়েছে"
        );

      const link = pickLink(json, ytUrl);
      if (!link) {
        console.log("[song] লিংক পাওয়া যায়নি, রেসপন্স:", JSON.stringify(json).slice(0, 500));
        throw new Error("API রেসপন্সে ডাউনলোড লিংক পাওয়া যায়নি");
      }
      return { link, title: json.title || json.data?.title || song.title };
    } catch (e) {
      lastErr = e;
      console.log(`[song] API চেষ্টা ${attempt} ব্যর্থ: ${e.message}`);
      if (attempt < 2) await new Promise(r => setTimeout(r, 1500));
    }
  }
  throw lastErr || new Error("ডাউনলোড ব্যর্থ");
}

async function saveToFile(url, file, timeout = 120000) {
  const res = await axios.get(url, { responseType: "stream", timeout });
  await new Promise((resolve, reject) => {
    const w = fs.createWriteStream(file);
    const timer = setTimeout(() => {
      res.data.destroy();
      w.destroy();
      reject(new Error("ফাইল ডাউনলোডে অনেক সময় লাগছে"));
    }, timeout);
    const fail = e => {
      clearTimeout(timer);
      reject(e);
    };
    res.data.pipe(w);
    w.on("finish", () => {
      clearTimeout(timer);
      resolve();
    });
    w.on("error", fail);
    res.data.on("error", fail);
  });
}

async function downloadSong(event, song, prefetched) {
  let data = null;
  if (prefetched) {
    try {
      data = await Promise.race([
        prefetched,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("prefetch timeout")), API_TIMEOUT)
        )
      ]);
    } catch (e) {
      console.log("[song] প্রিলোড ফেল:", e.message);
      data = null;
    }
  }
  if (!data) data = await fetchSong(song);

  const file = path.join(cacheDir, `song_${Date.now()}_${event.senderID}.mp3`);
  if (data.buffer) fs.writeFileSync(file, data.buffer);
  else await saveToFile(data.link, file, 120000);

  if (!fs.existsSync(file) || fs.statSync(file).size < 1000) {
    try { fs.unlinkSync(file); } catch (e) {}
    throw new Error("ফাইল ঠিকমতো ডাউনলোড হয়নি");
  }
  return { file, title: data.title || song.title || "Unknown" };
}

/* ───────────── ক্যানভাস হেল্পার ───────────── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxW, maxLines) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines - 1) {
        line = words.slice(i).join(" ");
        break;
      }
    } else line = test;
  }
  lines.push(line);

  let last = lines[lines.length - 1];
  if (ctx.measureText(last).width > maxW) {
    while (last.length > 1 && ctx.measureText(last + "…").width > maxW)
      last = last.slice(0, -1);
    lines[lines.length - 1] = last + "…";
  }
  return lines.slice(0, maxLines);
}

async function makeListImage(songs, outFile) {
  await ensureFonts();
  const W = 720,
    ROW = 168,
    PAD = 12;
  const canvas = createCanvas(W, ROW * songs.length + PAD);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0f0f0f";
  ctx.fillRect(0, 0, W, canvas.height);

  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];
    const y = PAD + i * ROW + 6;
    const tx = 50,
      tw = 248,
      th = 140;

    ctx.fillStyle = "#aaaaaa";
    ctx.font = `bold 22px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(String(i + 1), 24, y + th / 2 + 8);
    ctx.textAlign = "left";

    try {
      const url = getThumb(s);
      const { data } = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 5000
      });
      const img = await loadImage(Buffer.from(data));
      ctx.save();
      roundRect(ctx, tx, y, tw, th, 12);
      ctx.clip();
      const scale = Math.max(tw / img.width, th / img.height);
      const dw = img.width * scale,
        dh = img.height * scale;
      ctx.drawImage(img, tx + (tw - dw) / 2, y + (th - dh) / 2, dw, dh);
      ctx.restore();
    } catch (e) {
      ctx.fillStyle = "#272727";
      roundRect(ctx, tx, y, tw, th, 12);
      ctx.fill();
    }

    const dur = formatDuration(s.duration ?? s.timestamp ?? s.duration_seconds);
    ctx.font = `bold 16px ${FONT}`;
    const bw = ctx.measureText(dur).width + 14;
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    roundRect(ctx, tx + tw - bw - 8, y + th - 30, bw, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(dur, tx + tw - bw - 1, y + th - 13);

    const x2 = tx + tw + 20;
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold 20px ${FONT}`;
    const lines = wrapText(ctx, s.title || "Unknown", W - x2 - 20, 2);
    lines.forEach((l, k) => ctx.fillText(l, x2, y + 26 + k * 25));

    const ch = s.channel?.name || s.channel || s.author?.name || "Unknown";
    ctx.fillStyle = "#aaaaaa";
    ctx.font = `bold 17px ${FONT}`;
    ctx.fillText(String(ch).slice(0, 28), x2, y + 92);

    const views = formatViews(s.views ?? s.view_count ?? s.viewCount);
    const ago = s.published || s.ago || s.uploaded || s.uploadedAt || "";
    const meta = [views, ago].filter(Boolean).join(" • ");
    ctx.font = `16px ${FONT}`;
    ctx.fillText(meta, x2, y + 118);
  }

  fs.writeFileSync(outFile, canvas.toBuffer("image/png"));
}

/* ───────────── কমান্ড রান ───────────── */
module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;

  if (!creditOK()) return api.sendMessage(CREDIT_MSG, threadID, messageID);

  if (!args.length)
    return api.sendMessage(
      "🎵 গানের নাম লিখুন!\n\n📌 উদাহরণ: song tum hi ho",
      threadID,
      messageID
    );

  // ১ ঘন্টায় সর্বোচ্চ ৫ বার
  const rate = checkRate(senderID);
  if (!rate.ok)
    return api.sendMessage(
      `⏳ লিমিট শেষ!\n\n১ ঘন্টায় সর্বোচ্চ ${RATE_LIMIT} বার কমান্ড দেওয়া যায়।\nআবার দিতে পারবেন: ${formatLeft(rate.wait)} পর`,
      threadID,
      messageID
    );

  const query = args.join(" ");

  const searchMsg = await api.sendMessage(
    `🔎 ইউটিউব থেকে তোমার গান সার্চ করা হচ্ছে...\n\n🎶 "${query}"\n⏳ একটু অপেক্ষা করো`,
    threadID,
    messageID
  );

  const thumbFiles = [];
  try {
    const results = await searchSongs(query);

    const seen = new Set();
    const songs = results
      .filter(s => {
        const id = s.videoId || s.id || s.url;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, MAX_RESULTS);

    if (!songs.length) throw new Error("কোনো গান পাওয়া যায়নি");

    // প্রথম কয়েকটা গানের ডাউনলোড লিংক ব্যাকগ্রাউন্ডে আগেই আনা
    const jobs = songs.map((s, i) => {
      if (i >= PRELOAD_COUNT) return null;
      const p = fetchSong(s);
      p.catch(() => {});
      return p;
    });

    const stamp = Date.now();
    const listImg = path.join(cacheDir, `list_${stamp}_${senderID}.png`);
    await makeListImage(songs, listImg);
    thumbFiles.push(listImg);

    const body = `🎵 "${query}" এর রেজাল্ট

📩 গান পেতে এই মেসেজে রিপ্লাই করে
🔢 1-${songs.length} নম্বর লিখুন
⏰ ২ মিনিটের মধ্যে সিলেক্ট করুন
━━━━━━━━━━━━━━━━━━
👑 ${CREDIT}`;

    const msg = { body, attachment: fs.createReadStream(listImg) };

    api.sendMessage(msg, threadID, (err, info) => {
      safeUnsend(api, searchMsg?.messageID);
      cleanup(thumbFiles);
      if (err || !info) {
        refundRate(senderID, rate.stamp);
        return;
      }

      const entry = {
        name: "song",
        messageID: info.messageID,
        commandMessageID: messageID,
        author: senderID,
        results: songs,
        jobs,
        busy: false
      };
      global.client.handleReply.push(entry);

      // ২ মিনিটে সিলেক্ট না করলে লিস্ট ডিলিট
      setTimeout(() => {
        const list = global.client.handleReply;
        const idx = list.findIndex(h => h.messageID === info.messageID);
        if (idx === -1) return;
        if (entry.busy) return;
        list.splice(idx, 1);
        safeUnsend(api, info.messageID);
      }, SELECT_TIMEOUT);
    });
  } catch (error) {
    safeUnsend(api, searchMsg?.messageID);
    cleanup(thumbFiles);
    refundRate(senderID, rate.stamp); // সার্চ ব্যর্থ হলে লিমিট কাটবে না
    const reason = /timeout/i.test(error.message)
      ? "সার্চ সার্ভার সাড়া দিচ্ছে না, একটু পরে আবার চেষ্টা করুন।"
      : error.message;
    return api.sendMessage(
      `⚠️ সার্চ ব্যর্থ হয়েছে\n${reason}`,
      threadID,
      messageID
    );
  }
};

/* ───────────── নম্বর রিপ্লাই ───────────── */
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const { threadID, messageID, senderID } = event;

  if (!creditOK()) return api.sendMessage(CREDIT_MSG, threadID, messageID);

  const choice = parseInt(String(event.body || "").trim(), 10);

  if (senderID !== handleReply.author) {
    if (!isNaN(choice))
      return api.sendMessage(
        `🚫 এটা তোমার কমান্ড না!\n\n⚠️ শুধু যে কমান্ড দিয়েছে সে-ই গান সিলেক্ট করতে পারবে।\n🎵 নিজে গান পেতে নিজে কমান্ড দাও।`,
        threadID,
        messageID
      );
    return;
  }

  if (isNaN(choice) || choice < 1 || choice > handleReply.results.length)
    return api.sendMessage(
      `❌ ভুল নম্বর! 1 থেকে ${handleReply.results.length} এর মধ্যে লিখুন।`,
      threadID,
      messageID
    );

  if (handleReply.busy) return;
  handleReply.busy = true;

  const song = handleReply.results[choice - 1];
  const waitMsg = await api.sendMessage(
    `⏳ গান আনা হচ্ছে...\n\n🎼 ${song.title || "Unknown"}\n🚀 একটু অপেক্ষা করুন`,
    threadID,
    messageID
  );

  let file;
  try {
    const res = await downloadSong(event, song, handleReply.jobs?.[choice - 1]);
    file = res.file;

    const dur = formatDuration(
      song.duration ?? song.timestamp ?? song.duration_seconds
    );

    const body = `╭━━━━━━━━━━━━━━━━━━╮
   ${CREDIT}
╰━━━━━━━━━━━━━━━━━━╯
🎼 ${res.title}
👤 ${song.channel?.name || song.channel || song.author?.name || "Unknown"}
⏱️ সময়: ${dur}
🎚️ MP3
━━━━━━━━━━━━━━━━━━
👑 ${CREDIT}`;

    api.sendMessage(
      { body, attachment: fs.createReadStream(file) },
      threadID,
      err => {
        safeUnsend(api, waitMsg?.messageID);
        cleanup([file]);
        if (err) {
          console.log("[song] পাঠাতে সমস্যা:", err);
          handleReply.busy = false;
          return api.sendMessage(
            `❌ গান পাঠানো যায়নি\n\n${
              err.message || err.error || "অজানা সমস্যা"
            }\n\n🔁 আবার নম্বর দিয়ে রিপ্লাই করুন।`,
            threadID
          );
        }
        safeUnsend(api, handleReply.messageID);
        const list = global.client.handleReply;
        const idx = list.findIndex(h => h.messageID === handleReply.messageID);
        if (idx !== -1) list.splice(idx, 1);
      },
      handleReply.commandMessageID || messageID
    );
  } catch (error) {
    console.log("[song] ডাউনলোড এরর:", error.message);
    handleReply.busy = false;
    safeUnsend(api, waitMsg?.messageID);
    cleanup([file]);
    return api.sendMessage(
      `❌ ডাউনলোড ব্যর্থ\n\n${error.message}\n\n🔁 অন্য একটি নম্বর দিয়ে রিপ্লাই করুন।`,
      threadID,
      messageID
    );
  }
};
