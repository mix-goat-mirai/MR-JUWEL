const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

// Credit lock: if CREDIT or config.credits is changed, the command stops working
const LOCK = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const sha = (s) => crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
const creditOk = () =>
  sha(CREDIT) === LOCK && sha(module.exports.config.credits) === LOCK;

module.exports.config = {
  name: "anime",
  version: "2.1.0",
  hasPermssion: 0,
  credits: CREDIT,
  description: "Random Anime Video",
  commandCategory: "Video",
  usages: "anime",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": ""
  }
};

const LINKS = [
  "https://i.imgur.com/R3ptum9.mp4",
  "https://i.imgur.com/tUed2nt.mp4",
  "https://i.imgur.com/sqHWn6v.mp4",
  "https://i.imgur.com/CU2KBTj.mp4",
  "https://i.imgur.com/en18l6Z.mp4",
  "https://i.imgur.com/FrRANZq.mp4",
  "https://i.imgur.com/GmVN0IA.mp4",
  "https://i.imgur.com/OVjxg39.mp4",
  "https://i.imgur.com/2ZxQMZT.mp4",
  "https://i.imgur.com/35i7fZn.mp4",
  "https://i.imgur.com/h4YJi4u.mp4",
  "https://i.imgur.com/hECxsV2.mp4",
  "https://i.imgur.com/wPNLVdB.mp4",
  "https://i.imgur.com/MLnjK9Z.mp4",
  "https://i.imgur.com/2jlAzWF.mp4",
  "https://i.imgur.com/scTn8LO.mp4",
  "https://i.imgur.com/oZlfcRM.mp4",
  "https://i.imgur.com/yAF2Vv8.mp4"
];

// Random mood shown in every caption
const MOODS = [
  "Anime Mode 🎌",
  "Otaku Vibes 🔥",
  "Senpai Energy 🌸",
  "Epic Fight ⚔️",
  "Kawaii Mood 💖",
  "Hero Arc 🦸",
  "Villain Era 😈",
  "Power Up ⚡",
  "Final Boss 👹",
  "Chill Slice of Life ☕",
  "Sad Edit 🥀",
  "Sigma Aura 😎",
  "Shonen Spirit 🔥",
  "Cherry Blossom Dream 🌸",
  "Tokyo Night 🌃",
  "Sakura Breeze 🍃",
  "Plot Twist 🌀",
  "Opening Theme 🎶",
  "Training Arc 💪",
  "Waifu Material 💞",
  "Dark Mode 🌑",
  "Legend Unlocked 🏆",
  "Ninja Vibes 🥷",
  "Dragon Energy 🐉",
  "Cat Girl Mode 🐱"
];

// Random one-line caption shown under the mood
const TAGLINES = [
  "Time to power up!",
  "Believe in the hype you feel.",
  "Every legend has an opening scene.",
  "Grab some snacks, the episode is starting.",
  "Plot armor: activated.",
  "Another day, another epic edit.",
  "Senpai noticed this one!",
  "This scene hits different.",
  "Main character energy only.",
  "Is this the final episode already?",
  "Fan service for the soul.",
  "Rewatch value: infinite.",
  "Straight from the anime multiverse.",
  "Your daily dose of anime.",
  "Today's episode is brought to you by hype.",
  "Pause the world, press play on anime.",
  "That moment when the music kicks in.",
  "Cinematic mode: on.",
  "Nothing beats a good opening.",
  "Enjoy the ride, nakama!"
];

const MAX_SIZE = 25 * 1024 * 1024; // Messenger limit is about 25MB
const MIN_SIZE = 10 * 1024;        // smaller than this means a broken file
const MAX_TRIES = 8;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Check the file header to be sure it is really a video (mp4 / webm)
function isVideoFile(file) {
  const fd = fs.openSync(file, "r");
  const buf = Buffer.alloc(12);
  fs.readSync(fd, buf, 0, 12, 0);
  fs.closeSync(fd);
  const isMp4 = buf.slice(4, 8).toString("ascii") === "ftyp";
  const isWebm = buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  return isMp4 || isWebm;
}

function buildCaption(index, total) {
  return [
    "╔═══════════════════╗",
    "      🎌 𝗔𝗡𝗜𝗠𝗘 𝗭𝗢𝗡𝗘 🎌",
    "╚═══════════════════╝",
    "",
    `  🎬 Video  ➜  ${index} / ${total}`,
    `  ⚡ Mood   ➜  ${pick(MOODS)}`,
    "",
    "━━━━━━━━━━━━━━━━━━━━",
    `  💬 ${pick(TAGLINES)}`,
    "  🍿 Type \"anime\" to watch another one!"
  ].join("\n");
}

function download(url, dest) {
  return axios({
    url,
    method: "GET",
    responseType: "stream",
    timeout: 60000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
      "Accept": "*/*"
    }
  }).then((res) => {
    const type = String(res.headers["content-type"] || "").toLowerCase();
    // html/image means the link is dead or removed
    if (type.includes("text/html") || type.includes("image/")) {
      res.data.destroy();
      throw new Error("Not a video (content-type: " + type + ")");
    }

    const len = parseInt(res.headers["content-length"] || "0", 10);
    if (len > MAX_SIZE) {
      res.data.destroy();
      throw new Error("File too large: " + len);
    }

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(dest);
      let received = 0;
      let failed = false;

      const fail = (err) => {
        if (failed) return;
        failed = true;
        try { res.data.destroy(); } catch (e) {}
        try { writer.destroy(); } catch (e) {}
        reject(err);
      };

      res.data.on("data", (chunk) => {
        received += chunk.length;
        if (received > MAX_SIZE) fail(new Error("File too large (stream)"));
      });

      res.data.pipe(writer);
      writer.on("finish", () => { if (!failed) resolve(); });
      writer.on("error", fail);
      res.data.on("error", fail);
    });
  });
}

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  if (!creditOk()) {
    return api.sendMessage(
      "⛔ The credit has been changed, so this command is disabled.\nPlease restore the original credit.",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  const videoPath = path.join(cacheDir, `anime_${Date.now()}_${threadID}.mp4`);

  const cleanup = () => {
    try {
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    } catch (e) {
      console.error("[anime] cleanup error:", e.message);
    }
  };

  const waitMsg = await new Promise((resolve) =>
    api.sendMessage(
      "⏳ Loading your anime video, please wait...",
      threadID,
      (err, info) => resolve(err ? null : info)
    )
  );

  const pool = shuffle(LINKS).slice(0, MAX_TRIES);
  let usedUrl = null;

  for (const url of pool) {
    try {
      await download(url, videoPath);
      const size = fs.statSync(videoPath).size;
      if (size >= MIN_SIZE && size <= MAX_SIZE && isVideoFile(videoPath)) {
        usedUrl = url;
        break;
      }
      console.error(`[anime] invalid video (${url}): size=${size}`);
      cleanup();
    } catch (err) {
      const status = err.response ? ` [HTTP ${err.response.status}]` : "";
      console.error(`[anime] download failed (${url})${status}:`, err.message);
      cleanup();
    }
  }

  if (waitMsg && waitMsg.messageID) {
    try { api.unsendMessage(waitMsg.messageID); } catch (e) {}
  }

  if (!usedUrl) {
    return api.sendMessage(
      "❌ Could not send an anime video right now!\nPlease try again in a moment.",
      threadID,
      messageID
    );
  }

  const caption = buildCaption(LINKS.indexOf(usedUrl) + 1, LINKS.length);

  api.sendMessage(
    {
      body: caption,
      attachment: fs.createReadStream(videoPath)
    },
    threadID,
    (err) => {
      if (err) console.error("[anime] send error:", err);
      cleanup();
    },
    messageID
  );
};

// Credit check at load time: if changed, the command is disabled
if (!creditOk()) {
  module.exports.run = async ({ api, event }) =>
    api.sendMessage(
      "⛔ The credit has been changed, so this command is disabled.",
      event.threadID,
      event.messageID
    );
  }
