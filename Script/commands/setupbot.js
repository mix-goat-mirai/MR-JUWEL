module.exports.config = {
  name: "setupbot",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "সহজ বট সেটআপ গাইড",
  commandCategory: "system",
  cooldowns: 3
};

const videoLink = "https://youtu.be/kNHDYw8GoQg";
const repoLink = "https://github.com/mix-goat-mirai/MR-JUWEL.git";

module.exports.run = async function ({ api, event }) {

  return api.sendMessage(
`╭━━〔 🤖 বট সেটআপ গাইড 〕━━╮

📌 কীভাবে বট সেটআপ করবেন (সহজ ধাপ)

1️⃣ ভিডিওটি আগে পুরোটা দেখুন
2️⃣ বট ফাইল ডাউনলোড করুন
3️⃣ যেই জায়গায় বট চালাবেন সেখানে আপলোড করুন
4️⃣ বটের সেটিংস ফাইল খুলুন
5️⃣ নাম ঠিক করুন
6️⃣ প্রিফিক্স (যেমন ! / .) ঠিক করুন
7️⃣ আপনার নাম/আইডি অ্যাডমিন হিসেবে দিন
8️⃣ প্রয়োজনীয় সব সেটিংস ঠিক করুন
9️⃣ বট চালু করুন
🔟 গ্রুপে বট যোগ করুন

1️⃣1️⃣ বট ঠিকভাবে কাজ করছে কিনা চেক করুন
1️⃣2️⃣ কোনো সমস্যা হলে আবার ভিডিও দেখুন
1️⃣3️⃣ ধীরে ধীরে সব স্টেপ ফলো করুন
1️⃣4️⃣ ভুল সেটিংস দিলে বট কাজ নাও করতে পারে
1️⃣5️⃣ একবারে সব না করে ধাপে ধাপে করুন
1️⃣6️⃣ ইন্টারনেট ঠিক আছে কিনা দেখুন
1️⃣7️⃣ বট চালু হওয়ার পর টেস্ট কমান্ড দিন
1️⃣8️⃣ গ্রুপে পারমিশন ঠিক আছে কিনা দেখুন
1️⃣9️⃣ যদি বন্ধ হয় আবার চালু করুন
2️⃣0️⃣ সব ঠিক হলে বট রেডি 🎉

⚠️ গুরুত্বপূর্ণ কথা:
• তাড়াহুড়া করবেন না
• ভিডিও দেখে মিলিয়ে করবেন
• ভুল করলে বট কাজ করবে না

────────────────────

🎥 সেটআপ ভিডিও দেখুন:
🔗 ${videoLink}

📁 বটের রিপো (Fork করুন):
🔗 ${repoLink}

╰━━━━━━━━━━━━━━━━━━╯`,
    event.threadID,
    event.messageID
  );
};

// অটো কমান্ড
module.exports.handleEvent = async function ({ api, event }) {

  if (!event.body) return;

  const msg = event.body.toLowerCase();

  const trigger = [
    "set",
    "setup",
    "bot setup",
    "setup bot",
    "সেট",
    "বট সেটআপ"
  ];

  if (trigger.includes(msg)) {

    return api.sendMessage(
`╭━━〔 🤖 বট সেটআপ সাহায্য 〕━━╮

📌 সহজভাবে:
• ভিডিও দেখে সেটআপ করুন
• ধাপে ধাপে কাজ করুন
• ভুল করলে আবার ভিডিও দেখুন

🎥 সেটআপ ভিডিও:
🔗 ${videoLink}

📁 বটের রিপো (Fork করুন):
🔗 ${repoLink}

╰━━━━━━━━━━━━━━━━━━╯`,
      event.threadID,
      event.messageID
    );
  }
};
