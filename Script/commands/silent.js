// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ══════════════════════════════════════════════
const silent = require("../../includes/silent");

module.exports.config = {
  name: "silent",
  version: "2.0.1",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Silent Mode: যে গ্রুপে চালু করবেন শুধু ওই গ্রুপে বট বন্ধের মতো হবে, শুধু বট অ্যাডমিনের কমান্ড কাজ করবে",
  commandCategory: "Admin",
  usages: "on / off / status",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const reply = msg => silent.runAsAdmin(() => api.sendMessage(msg, threadID, messageID));

  // config.json-এ থাকা UID (ADMINBOT + DEVELOPER)
  if (!silent.isAdmin(senderID)) {
    return reply("⛔ শুধু বট অ্যাডমিন এই কমান্ড ব্যবহার করতে পারবে।");
  }

  const mode = String(args[0] || "").toLowerCase();

  if (mode === "on") {
    if (silent.isEnabled(threadID)) return reply("⚠️ এই গ্রুপে Silent Mode আগে থেকেই চালু আছে।");
    silent.set(threadID, true, senderID);
    return reply(
      "🔇 এই গ্রুপে Silent Mode চালু!\n" +
      "━━━━━━━━━━━━━━━━━━\n" +
      "এখন এই গ্রুপে বট বন্ধের মতো — সাধারণ মেম্বারের কমান্ড, অটো-রিপ্লাই, join/leave ইভেন্ট, রিঅ্যাকশন কিছুই কাজ করবে না।\n" +
      "শুধু বট অ্যাডমিনের সবকিছু কাজ করবে।\n" +
      "বন্ধ করতে: silent off"
    );
  }

  if (mode === "off") {
    if (!silent.isEnabled(threadID)) return reply("⚠️ এই গ্রুপে Silent Mode আগে থেকেই বন্ধ আছে।");
    silent.set(threadID, false, senderID);
    return reply("🔊 এই গ্রুপে Silent Mode বন্ধ! বট আবার স্বাভাবিকভাবে কাজ করছে।");
  }

  if (mode === "status" || mode === "") {
    return reply(
      (silent.isEnabled(threadID) ? "🔇 এই গ্রুপে Silent Mode: চালু" : "🔊 এই গ্রুপে Silent Mode: বন্ধ") +
      "\n\nব্যবহার: silent on | silent off | silent status"
    );
  }

  return reply("ব্যবহার: silent on | silent off | silent status");
};
