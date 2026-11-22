module.exports.config = {
  name: "chor",
  version: "1.0.0",
  hasPermssion: 0, // 0 = সবাই চালাতে পারবে
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "chor template memes",
  commandCategory: "Picture",
  usages: "[@mention]",
  cooldowns: 5,
  dependencies: {
    "fs-extra": "",
    "axios": "",
    "canvas": ""
  }
};

module.exports.run = async ({ event, api }) => {
  const fs = global.nodemodule["fs-extra"];
  const axios = global.nodemodule["axios"];
  const canvas = global.nodemodule["canvas"];

  // ===== টেমপ্লেট লিস্ট =====
  // ref = টেমপ্লেট ছবির মাপ, avatar = গোল ফ্রেমের বাম-উপরের কোণ (x, y) আর ব্যাস (size)
  const TEMPLATES = [
    {
      url: "https://i.imgur.com/JZcD39P.jpeg",
      ref: { w: 1671, h: 941 },
      avatar: { x: 909, y: 59, size: 132 }
    }
  ];

  // ===== ক্যাপসন লিস্ট: প্রতিবার এলোমেলোভাবে একটা বাছাই হবে =====
  const CAPTIONS = [
    "আজকে এই টাকা দিয়ে পার্টি করব! 🤣 বিরিয়ানি খাবো, বন্ধুদের নিয়ে ফুর্তি করব! 😎",
    "টাকা যখন পকেটে চলে এসেছে! 🤑 আজকে আর কোনো দুঃখ-কষ্ট নাই! 😂",
    "আজকে সব টাকা উড়িয়ে দেব! 🤣 কালকে আবার নতুন শিকার খুঁজব! 😜",
    "এই টাকা দিয়ে আজকে রাজা হয়ে যাব! 👑 পার্টি হবে সারারাত, বিল দেবে কে? 😂",
    "আজকে বিরিয়ানি, কালকে কাচ্চি! 🍗 টাকা শেষ হলে আবার বুদ্ধি খাটাবো! 🤣",
    "জীবনে প্রথম এত টাকা পেলাম! 😍 আজকে বন্ধুদের সবাইকে ট্রিট দেব! 😂",
    "মালিক এখনো কিছু বুঝতে পারেনি! 🤫 এদিকে আমার পার্টির প্ল্যান রেডি! 🤣",
    "আজকে টাকা আমার, আনন্দ আমার! 🤑 দুনিয়ার সব চিন্তা আজকে ছুটি! 😎",
    "এই টাকা দিয়ে আজকে ফুর্তি করব! 😂 কালকে আবার নতুন গল্প শুরু হবে! 🤣",
    "চুরি করে যখন লাভ হয়েছে! 😁 আজকে পার্টি হবে একদম জমজমাট! 🔥"
  ];
  // =====================================================================

  const tpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];

  const cacheDir = __dirname + "/cache";
  const outputPath = cacheDir + "/chor_" + Date.now() + ".jpg";

  try {
    fs.ensureDirSync(cacheDir);

    // মেনশন > রিপ্লাই করা মেসেজের ইউজার > নিজে
    const targetUserId =
      Object.keys(event.mentions || {})[0] ||
      (event.type === "message_reply" && event.messageReply && event.messageReply.senderID) ||
      event.senderID;

    // টেমপ্লেট ছবি
    const templateRes = await axios.get(tpl.url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const templateImage = await canvas.loadImage(Buffer.from(templateRes.data));

    // প্রোফাইল ছবি
    let picData;
    try {
      const picRes = await axios.get(
        `https://graph.facebook.com/${targetUserId}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer", headers: { "User-Agent": "Mozilla/5.0" } }
      );
      picData = picRes.data;
    } catch (e) {
      // ব্যাকআপ: বটের নিজস্ব getUserInfo থেকে ছবি
      const info = await new Promise((resolve, reject) =>
        api.getUserInfo(targetUserId, (err, res) => (err ? reject(err) : resolve(res)))
      );
      const thumb = info[targetUserId] && info[targetUserId].thumbSrc;
      const r2 = await axios.get(thumb, { responseType: "arraybuffer" });
      picData = r2.data;
    }
    const avatar = await canvas.loadImage(Buffer.from(picData));

    const cv = canvas.createCanvas(templateImage.width, templateImage.height);
    const ctx = cv.getContext("2d");
    ctx.drawImage(templateImage, 0, 0);

    // টেমপ্লেটের আসল মাপ অনুযায়ী স্কেল
    const kx = templateImage.width / tpl.ref.w;
    const ky = templateImage.height / tpl.ref.h;
    const ax = tpl.avatar.x * kx;
    const ay = tpl.avatar.y * ky;
    const as = tpl.avatar.size * kx;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + as / 2, ay + as / 2, as / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, ax, ay, as, as);
    ctx.restore();

    fs.writeFileSync(outputPath, cv.toBuffer("image/jpeg"));

    return api.sendMessage(
      {
        body: caption,
        attachment: fs.createReadStream(outputPath)
      },
      event.threadID,
      () => {
        try { fs.unlinkSync(outputPath); } catch (e) {}
      },
      event.messageID
    );
  } catch (error) {
    try { fs.unlinkSync(outputPath); } catch (e) {}
    return api.sendMessage("Error: " + error.message, event.threadID, event.messageID);
  }
};
