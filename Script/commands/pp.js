const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const OWNER_CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

function creditOk() {
  return module.exports.config.credits === OWNER_CREDIT;
}

module.exports.config = {
  name: "pp",
  version: "1.3.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Show Facebook profile picture and info",
  commandCategory: "Info",
  usages: "pp (reply / mention / UID)",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": ""
  }
};

module.exports.onLoad = function () {
  if (!creditOk()) console.log("❌ [pp] Credit was changed, command disabled.");
};

async function getImage(uid, fallbackUrl) {
  const urls = [
    `https://graph.facebook.com/${uid}/picture?width=1080&height=1080&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
    `https://graph.facebook.com/${uid}/picture?width=720&height=720`,
    fallbackUrl
  ].filter(Boolean);

  for (const url of urls) {
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 15000,
        maxRedirects: 5,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const type = String(res.headers["content-type"] || "");
      if (type.startsWith("image/") && res.data.length > 1000) {
        return Buffer.from(res.data);
      }
    } catch (e) {}
  }
  return null;
}

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply, mentions } = event;

  // 🔒 Credit lock
  if (!creditOk()) {
    return api.sendMessage("⛔ Credit was changed! Command disabled.", threadID, messageID);
  }

  let uid = String(senderID);
  if (messageReply && messageReply.senderID) {
    uid = String(messageReply.senderID);
  } else if (mentions && Object.keys(mentions).length > 0) {
    uid = String(Object.keys(mentions)[0]);
  } else if (args[0] && /^\d{5,}$/.test(args[0])) {
    uid = String(args[0]);
  }

  const imgPath = path.join(__dirname, "cache", `pp_${uid}_${Date.now()}.jpg`);

  try {
    const info = await new Promise((resolve, reject) => {
      api.getUserInfo(uid, (err, data) => (err ? reject(err) : resolve(data)));
    });

    const u = info && info[uid];
    if (!u) return api.sendMessage("❌ User info not found.", threadID, messageID);

    const name = u.name || "Unknown";
    const link = `https://facebook.com/${uid}`;

    let buffer = await getImage(uid, u.thumbSrc);
    if (!buffer) return api.sendMessage("❌ Picture not found.", threadID, messageID);

    // Optional sharpen (works only if sharp is installed)
    try {
      const sharp = require("sharp");
      buffer = await sharp(buffer)
        .resize(2160, 2160, { fit: "inside", kernel: "lanczos3" })
        .sharpen()
        .jpeg({ quality: 95 })
        .toBuffer();
    } catch (e) {}

    fs.ensureDirSync(path.dirname(imgPath));
    fs.writeFileSync(imgPath, buffer);

    const body =
`🖼️ 𝗣𝗥𝗢𝗙𝗜𝗟𝗘 𝗣𝗜𝗖
👤 ${name}
🆔 ${uid}
🔗 ${link}
👑 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐`;

    return api.sendMessage(
      { body, attachment: fs.createReadStream(imgPath) },
      threadID,
      () => fs.removeSync(imgPath),
      messageID
    );
  } catch (e) {
    console.log("pp error:", e);
    if (fs.existsSync(imgPath)) fs.removeSync(imgPath);
    return api.sendMessage("❌ Something went wrong.", threadID, messageID);
  }
};
