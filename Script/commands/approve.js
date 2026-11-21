// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ══════════════════════════════════════════════
const approval = require("../../includes/approval");

module.exports.config = {
  name: "approve",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "গ্রুপ অনুমোদন: approve | approve <গ্রুপ আইডি> | approve list | approve remove",
  commandCategory: "system",
  usages: "approve | approve <threadID> | approve list | approve remove",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const sub = (args[0] || "").toLowerCase();

  // /approve list
  if (sub === "list") {
    const l = approval.list();
    return api.sendMessage(`✅ অনুমোদিত গ্রুপ: ${l.length} টি\n` + l.slice(0, 40).join("\n"), threadID, messageID);
  }

  // /approve remove
  if (sub === "remove") {
    approval.remove(threadID);
    return api.sendMessage("🛑 এই গ্রুপের অনুমোদন তুলে নেওয়া হলো।", threadID, messageID);
  }

  // /approve <গ্রুপ আইডি>  (যেকোনো জায়গা থেকে, যেমন আপনার ইনবক্স থেকে)
  if (/^\d{8,}$/.test(sub)) {
    const ok = await approval.approveById(api, sub, senderID);
    return api.sendMessage(
      ok ? `✅ ${sub} গ্রুপ অনুমোদিত হয়েছে।` : `⚠️ ${sub} অনুমোদিত হয়েছে, কিন্তু গ্রুপে মেসেজ পাঠানো যায়নি।`,
      threadID, messageID
    );
  }

  // /approve  (এই গ্রুপেই)
  approval.approve(threadID, senderID);
  return api.sendMessage("✅ এই গ্রুপ অনুমোদিত হয়েছে। বট এখন সক্রিয়।", threadID, messageID);
};
