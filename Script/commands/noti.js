const fs = require("fs");
const path = require("path");
const axios = require("axios");

const CMD = "noti";
const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const FALLBACK_LINK = "fb.com/mrjuwel2025";

// config.json এর ADMINBOT এর ১ নাম্বার UID থেকে লিংক বানায়
const getAdminLink = () => {
  try {
    const list = (global.config && global.config.ADMINBOT) || [];
    const uid = String(list[0] || "").trim();
    if (uid) return "fb.com/" + uid;
  } catch (e) {}
  return FALLBACK_LINK;
};

// শুধু বট অ্যাডমিন (config.json ADMINBOT) কমান্ড চালাতে পারবে
const isBotAdmin = uid => {
  const list = ((global.config && global.config.ADMINBOT) || []).map(String);
  return list.includes(String(uid));
};

// Credit lock: credits বদলালে কমান্ড কাজ করবে না
const _LOCK = "5LmbIE3wnYag4Y2d1p9SIOC9kOC9suC8j+C9i+C+gCBKVfCdhqDhjZ3Wn1fwnYag4Y2d1p9FTOqcm+C9kOC9suC8j+C9i+C+gOC/kA==";
const creditOk = () =>
  Buffer.from(String(module.exports.config.credits), "utf8").toString("base64") === _LOCK &&
  CREDIT === Buffer.from(_LOCK, "base64").toString("utf8");
const LOCK_MSG = "⛔ Credits পরিবর্তন করা হয়েছে! তাই এই কমান্ড কাজ করবে না।\nআসল ক্রেডিট: " + CREDIT;

module.exports.config = {
  name: CMD,
  version: "2.0.0",
  hasPermssion: 2,
  credits: CREDIT,
  description: "সব গ্রুপে অ্যাডমিন নোটিশ পাঠান",
  commandCategory: "sandnoto",
  usages: "[msg]",
  cooldowns: 5
};

/* ---------- UI ---------- */
const adminNoticeUI = (msg, adminName) =>
`╔═══════════════════╗
   📢 𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐂𝐄 📢
╚═══════════════════╝

💬 𝐌𝐞𝐬𝐬𝐚𝐠𝐞:
┏━━━━━━━━━━━━━━━━┓
${msg}
┗━━━━━━━━━━━━━━━━┛

👤 𝐅𝐫𝐨𝐦 : ${adminName}
🕒 𝐓𝐢𝐦𝐞 : ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}

✦•┈┈┈┈•✦ 🌺 ✦•┈┈┈┈•✦
📩 অ্যাডমিনের সাথে কথা বলতে এই মেসেজে রিপ্লাই দিন, আমি পৌঁছে দেব।
🔗 সরাসরি যোগাযোগ: ${getAdminLink()}
✦•┈┈┈┈•✦ 🌺 ✦•┈┈┈┈•✦
⚡ ${CREDIT}`;

const userReplyUI = (msg, userName, groupName) =>
`╔═══════════════════╗
   📨 𝐔𝐒𝐄𝐑 𝐑𝐄𝐏𝐋𝐘 📨
╚═══════════════════╝

💬 𝐑𝐞𝐩𝐥𝐲:
┏━━━━━━━━━━━━━━━━┓
${msg}
┗━━━━━━━━━━━━━━━━┛

👤 𝐔𝐬𝐞𝐫  : ${userName}
👥 𝐆𝐫𝐨𝐮𝐩 : ${groupName}

✦•┈┈┈┈•✦ 🌺 ✦•┈┈┈┈•✦
⚡ ${CREDIT}`;

const adminReplyUI = (msg, adminName) =>
`╔═══════════════════╗
   📢 𝐀𝐃𝐌𝐈𝐍 𝐑𝐄𝐏𝐋𝐘 📢
╚═══════════════════╝

💬 𝐌𝐞𝐬𝐬𝐚𝐠𝐞:
┏━━━━━━━━━━━━━━━━┓
${msg}
┗━━━━━━━━━━━━━━━━┛

👤 𝐀𝐝𝐦𝐢𝐧 : ${adminName}

✦•┈┈┈┈•✦ 🌺 ✦•┈┈┈┈•✦
📩 আবার কথা বলতে এই মেসেজে রিপ্লাই দিন।
🔗 সরাসরি যোগাযোগ: ${getAdminLink()}
⚡ ${CREDIT}`;

/* ---------- Attachment helpers ---------- */
const cacheDir = path.join(__dirname, "cache");

// Download attachments once, return list of local file paths
async function downloadAttachments(attachments = []) {
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const files = [];
  let i = 0;
  for (const att of attachments) {
    try {
      if (!att.url) continue;
      let ext = "";
      try {
        ext = path.extname(new URL(att.url).pathname).replace(".", "");
      } catch (e) {}
      if (!ext) {
        const map = { photo: "jpg", video: "mp4", audio: "mp3", animated_image: "gif" };
        ext = map[att.type] || "bin";
      }
      const filePath = path.join(cacheDir, `${CMD}_${Date.now()}_${i++}.${ext}`);
      const res = await axios.get(att.url, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(res.data));
      files.push(filePath);
    } catch (e) {
      console.log("[noti] attachment download failed:", e.message);
    }
  }
  return files;
}

const buildMessage = (body, files) => {
  const msg = { body };
  if (files.length) msg.attachment = files.map(f => fs.createReadStream(f)); // fresh streams each time
  return msg;
};

const cleanup = files => {
  for (const f of files) {
    try { fs.unlinkSync(f); } catch (e) {}
  }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Reply handler ---------- */
module.exports.handleReply = async function ({ api, event, handleReply, Users, Threads }) {
  const { threadID, messageID, senderID, body, attachments } = event;
  if (!creditOk()) return api.sendMessage(LOCK_MSG, threadID, messageID);
  const name = await Users.getNameUser(senderID);
  const text = body || "(কোনো টেক্সট নেই)";
  const files = await downloadAttachments(attachments || []);

  try {
    if (handleReply.type === "sendnoti") {
      // User replied to admin's notice -> forward to admin thread
      let groupName = "Unknown";
      try {
        groupName = (await Threads.getInfo(threadID)).threadName || "Unknown";
      } catch (e) {}

      api.sendMessage(
        buildMessage(userReplyUI(text, name, groupName), files),
        handleReply.threadID,
        (err, info) => {
          cleanup(files);
          if (err || !info) return;
          global.client.handleReply.push({
            name: CMD,
            type: "reply",
            messageID: info.messageID,
            messID: messageID,
            threadID: threadID
          });
        }
      );
    } else if (handleReply.type === "reply") {
      // Admin replied to user's message -> send back to that group
      api.sendMessage(
        buildMessage(adminReplyUI(text, name), files),
        handleReply.threadID,
        (err, info) => {
          cleanup(files);
          if (err || !info) return;
          global.client.handleReply.push({
            name: CMD,
            type: "sendnoti",
            messageID: info.messageID,
            threadID: threadID
          });
        },
        handleReply.messID
      );
    }
  } catch (e) {
    cleanup(files);
    console.log("[noti] handleReply error:", e);
  }
};

/* ---------- Main command ---------- */
module.exports.run = async function ({ api, event, args, Users, Threads }) {
  const { threadID, messageID, senderID, messageReply, type } = event;
  if (!creditOk()) return api.sendMessage(LOCK_MSG, threadID, messageID);
  if (!isBotAdmin(senderID)) {
    return api.sendMessage("⛔ এই কমান্ড শুধু বট অ্যাডমিন চালাতে পারবে।", threadID, messageID);
  }

  if (!args[0] && !(type === "message_reply" && messageReply)) {
    return api.sendMessage("⚠️ দয়া করে নোটিশের মেসেজ লিখুন।\nউদাহরণ: noti আপনার মেসেজ", threadID, messageID);
  }

  const adminName = await Users.getNameUser(senderID);
  const text = args.join(" ") || "—";
  const allThreads = global.data.allThreadID || [];

  // Attachments from the replied message (if any)
  const files =
    type === "message_reply" && messageReply
      ? await downloadAttachments(messageReply.attachments || [])
      : [];

  const notice = adminNoticeUI(text, adminName);

  api.sendMessage(`⏳ ${allThreads.length} টি গ্রুপে নোটিশ পাঠানো হচ্ছে...`, threadID);

  const successList = [];
  const failedList = [];
  const getGroupName = async tid => {
    try {
      const info = await Threads.getInfo(tid);
      return info.threadName || "Unknown";
    } catch (e) {
      return "Unknown";
    }
  };

  for (const tid of allThreads) {
    await new Promise(resolve => {
      try {
        api.sendMessage(buildMessage(notice, files), tid, async (err, info) => {
          const gName = await getGroupName(tid);
          if (err || !info) {
            failedList.push(`${gName} (${tid})`);
          } else {
            successList.push(`${gName} (${tid})`);
            global.client.handleReply.push({
              name: CMD,
              type: "sendnoti",
              messageID: info.messageID,
              messID: messageID,
              threadID: threadID
            });
          }
          resolve();
        });
      } catch (e) {
        failedList.push(`Unknown (${tid})`);
        resolve();
      }
    });
    await sleep(500); // avoid spam block
  }

  cleanup(files);

  const fmt = list => (list.length ? list.map((n, i) => `${i + 1}. ${n}`).join("\n") : "— কেউ নেই —");

  const report =
`╔═══════════════════╗
   ✅ 𝐑𝐄𝐏𝐎𝐑𝐓 ✅
╚═══════════════════╝
📤 সফল  : ${successList.length} টি গ্রুপ
❌ ব্যর্থ : ${failedList.length} টি গ্রুপ

✅ 𝐒𝐞𝐧𝐭 𝐆𝐫𝐨𝐮𝐩𝐬:
${fmt(successList)}

❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐆𝐫𝐨𝐮𝐩𝐬:
${fmt(failedList)}

⚡ ${CREDIT}`;

  // লম্বা হলে ভেঙে পাঠানো
  const chunks = report.match(/[\s\S]{1,1800}(\n|$)/g) || [report];
  for (const c of chunks) {
    await api.sendMessage(c, threadID);
    await sleep(500);
  }
};
