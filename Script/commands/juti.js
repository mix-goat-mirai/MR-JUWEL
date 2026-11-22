module.exports.config = {
  name: "juti",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Juti banner: ছেলে (মেনশন/রিপ্লাই) + গ্রুপের র‍্যান্ডম মেয়ে",
  commandCategory: "banner",
  usePrefix: true,
  usages: "[@ছেলে মেনশন | ছেলের মেসেজে রিপ্লাই]",
  cooldowns: 15,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "canvas": ""
  }
};

// ====== Template settings ======
const TEMPLATE_URL = "https://i.imgur.com/R339POP.jpeg";
const REF_W = 1254;
const REF_H = 1254;

// বাম বৃত্ত = কনের (মেয়ের) মাথার উপরে (গ্রুপের র‍্যান্ডম মেয়ে)
// ডান বৃত্ত = বরের (ছেলের) মাথার উপরে (মেনশন/রিপ্লাই করা ছেলে)
// ছবি ঠিকমতো না বসলে শুধু এই x, y, rx, ry মান বদলাও
const LEFT = { x: 482, y: 359, rx: 92, ry: 92 };
const RIGHT = { x: 784, y: 359, rx: 92, ry: 92 };

// true হলে যে কমান্ড দিবে তারও ছেলে হতে হবে
const REQUIRE_MALE_SENDER = true;

// যাদের Facebook-এ ভুল করে "মেয়ে" দেওয়া আছে, তাদের আইডি এখানে দিলে কখনো মেয়ে হিসেবে বাছা হবে না
// উদাহরণ: ["100012345678901", "100098765432109"]
const NOT_GIRL_IDS = [];

// ====== ফানি ক্যাপশন (প্রতিবার র‍্যান্ডম একটা আসবে) ======
// নতুন ক্যাপশন যোগ করতে চাইলে নিচে একটা লাইন বাড়িয়ে দাও
const CAPTIONS = [
  "😂 পারফেক্ট জুটি! বউ পাহাড়, জামাই পাহাড়ের খুঁটি!",
  "🤣 বউ যেন চলন্ত পাহাড়, জামাই তার পাশে ঠেকনা দেওয়া খুঁটি!",
  "😆 এক পাশে পাহাড়, আরেক পাশে খুঁটি, মাঝখানে ভালোবাসার ভূমিকম্প!",
  "💍 বউয়ের এক ধাক্কায় জামাই সোজা পাশের গ্রামে গিয়ে পড়বে!",
  "😜 জামাই বউয়ের পাশে বসে ভাবছে, আমি কি মানুষ নাকি বউয়ের হাতের লাঠি!",
  "🥳 বউ খায় ডেকচি ভরে, জামাই খায় চামচ ভরে, তবু জুটি পারফেক্ট!",
  "🤭 বিয়ের দিনে জামাইয়ের একটাই চিন্তা: বউয়ের কোলে উঠবে নাকি বউ জামাইকে কোলে নিবে!",
  "😂 এই জুটির ছবি দেখে ওজন মাপার মেশিনও হাল ছেড়ে দিয়েছে!",
  "🔥 বউ হলো সুমো পালোয়ান, জামাই হলো তার সুতার বেল্ট!",
  "😍 বউ ঘরে হাঁটলে ভূমিকম্প হয়, জামাই কাঁপতে কাঁপতে বলে: আমি কিছু করি নাই!",
  "🤣 জামাই বউয়ের ছায়ায় বসেই পুরো জীবন কাটিয়ে দিবে, রোদ লাগবে না!",
  "💖 বউ পাহাড় হলে কী হইছে, জামাইও তো খুঁটি, ঠিক ঠিক ঠেকনা দিয়া রাখবে!",
  "😆 দুইজনের মাঝে এক ইঞ্চি ফাঁক নাই, কারণ বউ একাই পুরো সোফা দখল করছে!",
  "🥰 বিরিয়ানির প্লেট সামনে আসলে বউ আগে, জামাই পরে, বাকিটা ভাগ্য!",
  "😂 গ্রুপের সিঙ্গেলরা বলছে: আমরা না হয় একাই ভালো আছি!",
  "🤭 এই জুটি একসাথে হাঁটলে রাস্তার অর্ধেকটা বউ আর বাকিটা জামাইয়ের ছায়া!",
  "😜 কাজি সাহেব বলছেন: কবুল বলার আগে জামাই একবার ওজন মেপে নাও!",
  "💍 জুটি তো নয়, যেন হাতি আর কাঠি, তবু ভালোবাসায় একদম ফিট!",
  "🔥 বউ ভাত বেড়ে দেয়, জামাই গুনে গুনে সেই ভাত খায়, কারণ বউয়ের নজর সবখানে!",
  "😂 আল্লাহ জোড়া মিলাইয়া দিছে, এখন শুধু বিরিয়ানি আর দাওয়াতের অপেক্ষা!"
];

// ====== Speed settings ======
const API_TIMEOUT = 8000;
const THREAD_TIMEOUT = 8000;
const BATCH_SIZE = 8;
const BATCH_TIMEOUT = 6000;
const GENDER_CACHE_TTL = 30 * 60 * 1000;
// ================================

// gender: 1 = মেয়ে, 2 = ছেলে (অথবা "female"/"male")
const isFemale = (g) => g === 1 || g === "1" || String(g).toLowerCase() === "female";
const isMale = (g) => g === 2 || g === "2" || String(g).toLowerCase() === "male";

// মেমোরি ক্যাশ: একবার আনা info আবার আনতে হবে না
const userCache = new Map(); // id -> { data, t }
let templateImg = null;

// ====== ক্রেডিট লক ======
// config-এ credits বদলালে কমান্ড কাজ করবে না
const ORIGINAL_CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";

const sleep = (ms, val) => new Promise((res) => setTimeout(() => res(val), ms));

module.exports.run = async function ({ event, api }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");
  const { createCanvas, loadImage } = require("canvas");

  const { threadID, messageID, senderID, mentions, messageReply } = event;

  // ক্রেডিট চেক: বদলানো হলে কোড চলবে না
  if (module.exports.config.credits !== ORIGINAL_CREDIT) {
    return api.sendMessage(
      "⚠️ ক্রেডিট চুরি করার কারণে এই JUTI কোড কাজ করছে না!\n\n🔒 আসল ক্রেডিট ফিরিয়ে দিন, তারপর কমান্ড আবার কাজ করবে।\n\n✅ আসল ক্রেডিট: " + ORIGINAL_CREDIT,
      threadID,
      messageID
    );
  }

  // কলব্যাক ও প্রমিস দুই ধরনের api-তেই কাজ করে, ঝুলে গেলে API_TIMEOUT-এ এরর দেয়
  const callApi = (fn, arg, label) =>
    new Promise((resolve, reject) => {
      let done = false;
      const finish = (err, data) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        err
          ? reject(err instanceof Error ? err : new Error(label + " failed: " + JSON.stringify(err)))
          : resolve(data || {});
      };
      const timer = setTimeout(() => finish(new Error(label + " timeout")), API_TIMEOUT);
      try {
        const ret = fn(arg, (err, data) => finish(err, data));
        if (ret && typeof ret.then === "function") {
          ret.then((data) => finish(null, data)).catch((err) => finish(err || new Error(label + " error")));
        }
      } catch (e) {
        finish(e);
      }
    });

  // ক্যাশসহ ইউজার info; সব আইডি প্যারালালে আনে, ব্যর্থ আইডি বাদ যায়
  const getUserInfo = async (ids) => {
    const list = [...new Set((Array.isArray(ids) ? ids : [ids]).map(String))].filter((x) => /^\d+$/.test(x));
    const result = {};
    const now = Date.now();
    const need = [];
    for (const id of list) {
      const c = userCache.get(id);
      if (c && now - c.t < GENDER_CACHE_TTL) result[id] = c.data;
      else need.push(id);
    }
    await Promise.all(
      need.map(async (id) => {
        try {
          const d = await callApi(api.getUserInfo.bind(api), id, "getUserInfo");
          let data = null;
          if (d && d[id]) data = d[id];
          else if (d && typeof d === "object" && d.gender !== undefined) data = d;
          if (data) {
            userCache.set(id, { data, t: Date.now() });
            result[id] = data;
          }
        } catch (e) {
          console.log("JUTI getUserInfo skip", id, e.message);
        }
      })
    );
    return result;
  };

  const getThreadInfo = (tid) => callApi(api.getThreadInfo.bind(api), tid, "getThreadInfo");

  // ছেলে কে (মেনশন বা রিপ্লাই)
  let boyID = null;
  if (mentions && Object.keys(mentions).length > 0) {
    boyID = Object.keys(mentions)[0];
  } else if (messageReply && messageReply.senderID) {
    boyID = messageReply.senderID;
  }

  if (!boyID) {
    return api.sendMessage(
      "⚠️ কোনো ছেলেকে মেনশন করো বা তার মেসেজে রিপ্লাই দাও!\n\nউদাহরণ: juti @নাম",
      threadID,
      messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);
  const imgPath = path.join(cacheDir, `juti_${senderID}_${boyID}_${Date.now()}.png`);
  const templatePath = path.join(cacheDir, "juti_template.jpg");

  const getTemplate = async () => {
    if (templateImg) return templateImg;
    if (!fs.existsSync(templatePath)) {
      try {
        const res = await axios.get(TEMPLATE_URL, {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            "Referer": "https://imgur.com/"
          }
        });
        fs.writeFileSync(templatePath, Buffer.from(res.data));
      } catch (err) {
        throw new Error("TEMPLATE download failed: " + (err.response?.status || err.message));
      }
    }
    templateImg = await loadImage(templatePath);
    return templateImg;
  };

  const getAvatar = async (uid) => {
    const url = `https://graph.facebook.com/${uid}/picture?width=720&height=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
    try {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 12000 });
      return loadImage(Buffer.from(res.data));
    } catch (err) {
      throw new Error("AVATAR download failed: " + (err.response?.status || err.message));
    }
  };

  try {
    // ---- সব ধীর কাজ একসাথে শুরু (প্যারালাল) ----
    const templateP = getTemplate();
    const boyAvatarP = getAvatar(boyID);
    const threadP = Promise.race([
      getThreadInfo(threadID),
      sleep(THREAD_TIMEOUT).then(() => { throw new Error("getThreadInfo slow"); })
    ]).catch((e) => {
      console.log("JUTI threadInfo fallback:", e.message);
      return { participantIDs: [] };
    });
    const checkIDs = REQUIRE_MALE_SENDER ? [boyID, senderID] : [boyID];
    const infosP = getUserInfo(checkIDs);

    // কোনো প্রমিস আগে ফেল করলে unhandled rejection এড়াতে
    templateP.catch(() => {});
    boyAvatarP.catch(() => {});

    // ---- ছেলে কি না চেক ----
    const infos = await infosP;
    console.log("JUTI gender check:", "sender", senderID, infos[senderID]?.gender, "| boy", boyID, infos[boyID]?.gender);

    // শুধু স্পষ্টভাবে "মেয়ে" ধরা পড়লেই আটকাবে; জেন্ডার না পাওয়া গেলে চলতে দিবে
    if (REQUIRE_MALE_SENDER && isFemale(infos[senderID]?.gender)) {
      return api.sendMessage("⚠️ এই কমান্ড শুধু ছেলেরা ব্যবহার করতে পারবে!", threadID, messageID);
    }
    if (isFemale(infos[boyID]?.gender)) {
      return api.sendMessage("⚠️ কোনো ছেলেকে মেনশন করো বা রিপ্লাই দাও! (মেয়েকে নয়)", threadID, messageID);
    }

    // ---- গ্রুপ থেকে র‍্যান্ডম মেয়ে খোঁজা (শাফল + ব্যাচ, পেলেই থামবে) ----
    const threadInfo = await threadP;
    const botID = api.getCurrentUserID ? api.getCurrentUserID() : null;
    const members = (threadInfo.participantIDs || []).filter(
      (id) => id !== botID && id !== boyID && id !== senderID
    );

    // শাফল
    for (let i = members.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [members[i], members[j]] = [members[j], members[i]];
    }

    // গ্রুপ info-তে জেন্ডার থাকলে সেটাও দ্বিতীয় সোর্স হিসেবে কাজে লাগবে
    const threadGender = {};
    if (Array.isArray(threadInfo.userInfo)) {
      for (const u of threadInfo.userInfo) {
        if (u && u.id) threadGender[String(u.id)] = u.gender;
      }
    }

    let girlID = null;
    let girlName = null;
    for (let i = 0; i < members.length && !girlID; i += BATCH_SIZE) {
      const chunk = members.slice(i, i + BATCH_SIZE);
      const info = await Promise.race([getUserInfo(chunk), sleep(BATCH_TIMEOUT, {})]);

      // শুধু স্পষ্টভাবে মেয়ে এবং কোনো সোর্সে ছেলে নয়
      const candidates = chunk.filter(
        (id) =>
          !NOT_GIRL_IDS.includes(String(id)) &&
          isFemale(info[id]?.gender) &&
          !isMale(info[id]?.gender) &&
          !isMale(threadGender[id])
      );

      for (const id of candidates) {
        // ক্যাশ বাদ দিয়ে আবার সরাসরি চেক, যাতে ভুল জেন্ডারে ছেলে না আসে
        userCache.delete(id);
        const fresh = await Promise.race([getUserInfo([id]), sleep(BATCH_TIMEOUT, {})]);
        const g = fresh[id]?.gender;
        console.log("JUTI girl verify:", id, "gender:", g);
        if (fresh[id] && !isFemale(g)) continue; // ছেলে/অজানা হলে বাদ
        girlID = id;
        girlName = fresh[id]?.name || info[id]?.name || null;
        break;
      }
    }

    if (!girlID) {
      return api.sendMessage("⚠️ এই গ্রুপে কোনো মেয়ে নেই, তাই এই কমান্ড কাজ করবে না!", threadID, messageID);
    }

    console.log("JUTI picked girl:", girlID, girlName);

    const [template, boyAvatar, girlAvatar] = await Promise.all([templateP, boyAvatarP, getAvatar(girlID)]);

    const W = template.width;
    const H = template.height;
    const sx = W / REF_W;
    const sy = H / REF_H;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(template, 0, 0, W, H);

    const drawAvatar = (img, c) => {
      const cx = c.x * sx;
      const cy = c.y * sy;
      const rx = c.rx * sx;
      const ry = c.ry * sy;
      const w = rx * 2;
      const h = ry * 2;
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.restore();
    };

    drawAvatar(girlAvatar, LEFT); // র‍্যান্ডম মেয়ে → বামে (কনে)
    drawAvatar(boyAvatar, RIGHT); // ছেলে → ডানে (বর)

    fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

    // ---- রিয়েল মেনশন (নোটিফিকেশন যাবে) ----
    const cleanName = (n) => String(n || "").replace(/^@/, "").trim();
    const boyName = cleanName(infos[boyID]?.name) || cleanName(mentions && mentions[boyID]) || "বন্ধু";
    const girlTag = cleanName(girlName) || "মেয়েটা";

    const boyTag = "@" + boyName;
    const girlTagFull = "@" + girlTag;
    const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
    const body = `${boyTag} 💞 ${girlTagFull}\n\n${caption}`;

    const bodyMentions = [
      { tag: boyTag, id: boyID, fromIndex: body.indexOf(boyTag) },
      { tag: girlTagFull, id: girlID, fromIndex: body.indexOf(girlTagFull, boyTag.length) }
    ];

    return api.sendMessage(
      { body, mentions: bodyMentions, attachment: fs.createReadStream(imgPath) },
      threadID,
      () => fs.unlink(imgPath, () => {}),
      messageID
    );
  } catch (e) {
    console.log("JUTI CMD ERROR:", e.response?.status, e.message);
    return api.sendMessage("Error: " + (e.response?.status || e.message), threadID, messageID);
  }
};
