// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ══════════════════════════════════════════════

let approval = null;
try {
  approval = require("../../includes/approval");
} catch (e) {
  console.log("[out] approval module লোড হয়নি:", e.message);
}

module.exports.config = {
  name: "out",
  version: "3.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "বটকে গ্রুপ থেকে বের করা: out | out <গ্রুপ আইডি>",
  commandCategory: "Admin",
  usages: "out | out <গ্রুপ আইডি>",
  cooldowns: 3
};

function leaveThread(api, botID, tid) {
  return new Promise((resolve, reject) => {
    let done = false;
    const cb = err => {
      if (done) return;
      done = true;
      err ? reject(err) : resolve();
    };
    try {
      const r = api.removeUserFromGroup(botID, tid, cb);
      if (r && typeof r.then === "function") r.then(() => cb(), cb);
    } catch (e) {
      cb(e);
    }
  });
}

function removeRecord(tid) {
  try {
    if (approval && typeof approval.remove === "function") approval.remove(tid);
  } catch (e) {
    console.log("[out] approval.remove এরর:", e);
  }
}

const errText = e => (e && (e.message || e.error)) || String(e);

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const botID = api.getCurrentUserID();
  const target = args[0];

  // out <গ্রুপ আইডি> → ওই গ্রুপ থেকে চুপচাপ বের হবে
  if (target) {
    if (!/^\d{8,}$/.test(target)) {
      return api.sendMessage("❌ সঠিক গ্রুপ আইডি দিন।\nউদাহরণ: out 1234567890123456", threadID, messageID);
    }
    try {
      await leaveThread(api, botID, target);
      removeRecord(target);
    } catch (e) {
      console.log("[out] OUT ERROR:", e);
      return api.sendMessage(`⚠️ ${target} থেকে বের হতে পারিনি।\nকারণ: ${errText(e)}`, threadID, messageID);
    }
    return;
  }

  // out → এই গ্রুপ থেকে চুপচাপ বের হবে
  try {
    await leaveThread(api, botID, threadID);
    removeRecord(threadID);
  } catch (e) {
    console.log("[out] OUT ERROR:", e);
    return api.sendMessage(`⚠️ গ্রুপ থেকে বের হতে পারিনি।\nকারণ: ${errText(e)}`, threadID, messageID);
  }
};
