module.exports.config = {
 name: "fork",
 version: "2.1.0",
 hasPermssion: 0,
 credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
 description: "Stable fork system with live GitHub stats card",
 commandCategory: "other",
 usages: "fork",
 cooldowns: 3,
};

const OWNER = "mix-goat-mirai";
const REPO = "MR-JUWEL";
const repoLink = `https://github.com/${OWNER}/${REPO}`;

module.exports.run = async function({ api, event }) {

 const msg = `
🔥 𝗚𝗢𝗔𝗧 𝗠𝗜𝗥𝗔𝗜 𝗠𝗜𝗫 🔥

━━━━━━━━━━━━━━━━━━━━━━
⚡ 𝗚𝗢𝗔𝗧 𝗠𝗜𝗥𝗔𝗜 𝗠𝗜𝗫 𝗘𝗩𝗘𝗡 𝗣𝗟𝗨𝗦 𝗖𝗢𝗠𝗠𝗔𝗡𝗗
✅ 𝗚𝗢𝗔𝗧 𝗕𝗢𝗧 & 𝗠𝗜𝗥𝗔𝗜 𝗩𝗘𝗥𝗦𝗜𝗢𝗡 - 𝗗𝗨𝗜𝗧𝗔𝗥 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗘 𝗞𝗔𝗔𝗝 𝗞𝗢𝗥𝗘
━━━━━━━━━━━━━━━━━━━━━━
`;

 const setupVideo = "https://youtu.be/kNHDYw8GoQg";
 const linkMsg = `📌 𝗥𝗘𝗣𝗢 𝗟𝗜𝗡𝗞:\n${repoLink}\n\n🎬 𝗦𝗘𝗧-𝗨𝗣 𝗩𝗜𝗗𝗘𝗢:\n${setupVideo}`;

 return api.sendMessage(msg + "\n" + linkMsg, event.threadID, event.messageID);
};
