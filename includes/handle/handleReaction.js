// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// ══════════════════════════════════════════════
module.exports = function ({ api, models, Users, Threads, Currencies }) {

  // ⏱️ বটের মেসেজ পাঠানোর কত মিলিসেকেন্ড পর পর্যন্ত আনসেন্ড রিয়েক্ট ইগনোর হবে
  const UNSEND_DELAY = 2000; // ২ সেকেন্ড

  // বটের পাঠানো প্রতিটি মেসেজের সময় সেভ করার জন্য (শুধু একবার প্যাচ হবে)
  if (!global.__botMsgTime) global.__botMsgTime = new Map();
  if (!api.__sendTimePatched) {
    api.__sendTimePatched = true;
    const origSend = api.sendMessage;
    api.sendMessage = function (...args) {
      const record = info => {
        try {
          if (info && info.messageID) {
            const id = String(info.messageID);
            global.__botMsgTime.set(id, Date.now());
            // মেমোরি ফাঁকা রাখতে ১০ মিনিট পর মুছে ফেলা
            const t = setTimeout(() => global.__botMsgTime.delete(id), 10 * 60 * 1000);
            if (t && t.unref) t.unref();
          }
        } catch (e) {}
      };

      let cbIndex = -1;
      for (let i = 1; i < args.length; i++) {
        if (typeof args[i] === 'function') { cbIndex = i; break; }
      }

      if (cbIndex !== -1) {
        const userCb = args[cbIndex];
        args[cbIndex] = function (err, info) {
          if (!err) record(info);
          return userCb.apply(this, arguments);
        };
      } else {
        args[2] = function (err, info) {
          if (!err) record(info);
        };
      }
      return origSend.apply(api, args);
    };
  }

  return async function ({ event }) {
    const { handleReaction, commands } = global.client;
    const { messageID, threadID, reaction, userID } = event;

    // 🦵 সাইলেন্ট কিক: বট অ্যাডমিন 🦵 দিলে
    //   - অন্য কারো মেসেজে  -> বট গ্রুপ অ্যাডমিন হলে তাকে কিক
    //   - বটের নিজের মেসেজে -> বট নিজে গ্রুপ ছেড়ে দিবে
    // কোনো মেসেজ পাঠানো হবে না (সম্পূর্ণ সাইলেন্ট)
    if (reaction && String(reaction).includes('🦵')) {
      const tag = '[reactkick]';
      try {
        const cfg = global.config || {};
        const adminBot = [...new Set(
          [...(cfg.ADMINBOT || []), ...(cfg.DEVELOPER || [])].map(String)
        )];
        const reactor = String(userID || '');
        const botID = String(api.getCurrentUserID());
        if (!reactor || !adminBot.includes(reactor)) {
          console.log(tag, 'বাদ: রিয়েক্টকারী (' + reactor + ') config.json-এর ADMINBOT/DEVELOPER-এ নেই');
          return;
        }

        // গ্রুপ কিনা: আগে event.isGroup; না থাকলে — ইনবক্সে threadID হয় অপর পক্ষের আইডি (রিয়েক্টকারী বা বট)
        const tid = String(threadID);
        const isGroup = event.isGroup !== undefined ? !!event.isGroup : (tid !== reactor && tid !== botID);
        if (!isGroup) { console.log(tag, 'বাদ: ইনবক্স'); return; }

        // মেসেজের মালিক বের করা — ক্রমানুসারে: ইভেন্ট → বটের পাঠানো ক্যাশ → ইউজারের মেসেজ ক্যাশ → api.getMessage
        const mid = String(messageID || '');
        let author = String(event.messageSenderID || '');
        if (!author && global.__botMsgs && global.__botMsgs.has(mid)) author = botID;
        if (!author && global.__botMsgTime && global.__botMsgTime.has(mid)) author = botID;
        if (!author && global.__msgOwner && global.__msgOwner.has(mid)) author = String(global.__msgOwner.get(mid));
        if (!author) {
          const s = String(event.senderID || '');
          if (s && s !== reactor) author = s; // কিছু fca-তে senderID = মেসেজের মালিক
        }
        if (!author) {
          author = await new Promise(resolve => {
            let done = false;
            const finish = v => { if (!done) { done = true; resolve(v); } };
            setTimeout(() => finish(''), 8000);
            try {
              if (typeof api.getMessage !== 'function') return finish('');
              const r = api.getMessage(threadID, messageID, (err, data) =>
                finish(err || !data ? '' : String(data.senderID || data.author || ''))
              );
              if (r && typeof r.then === 'function') {
                r.then(d => finish(d ? String(d.senderID || d.author || '') : ''))
                 .catch(() => finish(''));
              }
            } catch (e) { finish(''); }
          });
        }
        if (!author) {
          console.log(tag, 'বাদ: মেসেজের মালিক চেনা গেল না (msg=' + mid + '). বট চালু হওয়ার আগের পুরোনো মেসেজ হতে পারে');
          return;
        }
        console.log(tag, 'রিয়েক্ট by ' + reactor + ' → মেসেজের মালিক ' + author + (author === botID ? ' (বট নিজে)' : ''));

        // বটের নিজের মেসেজ -> বট গ্রুপ ছাড়বে
        if (author === botID) {
          api.removeUserFromGroup(botID, threadID, err => {
            if (err) console.log(tag, 'leave error:', err);
            else console.log(tag, 'বট গ্রুপ ছেড়েছে:', threadID);
          });
          return;
        }

        // বট অ্যাডমিনকে কিক করা যাবে না
        if (adminBot.includes(author)) { console.log(tag, 'বাদ: বট অ্যাডমিনকে কিক করা যায় না'); return; }

        // বট গ্রুপ অ্যাডমিন কিনা চেক
        const info = await Threads.getInfo(threadID);
        const botIsAdmin = (info.adminIDs || []).some(a => String(a && a.id !== undefined ? a.id : a) === botID);
        if (!botIsAdmin) { console.log(tag, 'বাদ: বট এই গ্রুপের অ্যাডমিন না, তাই কিক সম্ভব না'); return; }

        api.removeUserFromGroup(author, threadID, err => {
          if (err) console.log(tag, 'kick error:', err);
          else console.log(tag, 'কিক হয়েছে:', author);
        });
      } catch (e) {
        console.log(tag, 'error:', e);
      }
      return;
    }

    // ❌ 🤬 😡 😠 😤 আনসেন্ড
    // নতুন ইমোজি যোগ করতে চাইলে শুধু এই অ্যারেতে বসিয়ে দিন
    // বটের মেসেজ পাঠানোর ২ সেকেন্ডের মধ্যে রিয়েক্ট দিলে আনসেন্ড হবে না
    const unsendReactions = ['❌', '🤬', '😡', '😠', '😤'];
    if (reaction && unsendReactions.some(r => String(reaction).includes(r))) {
      const mid = String(messageID || '');
      let sentAt = null;

      if (global.__botMsgTime && global.__botMsgTime.has(mid)) {
        sentAt = global.__botMsgTime.get(mid);
      } else if (global.__botMsgs && typeof global.__botMsgs.get === 'function') {
        const v = global.__botMsgs.get(mid);
        if (typeof v === 'number') sentAt = v;
      }

      // ২ সেকেন্ড পার হয়নি → ইগনোর
      if (sentAt && Date.now() - sentAt < UNSEND_DELAY) return;

      return api.unsendMessage(messageID);
    }

    // কাস্টম হ্যান্ডলার (আগের মতোই)
    if (handleReaction.length !== 0) {
      const idx = handleReaction.findIndex(e => e.messageID == messageID);
      if (idx < 0) return;
      const handle = handleReaction[idx];
      const cmd = commands.get(handle.name);
      if (!cmd) {
        return api.sendMessage(global.getText('handleReaction', 'missingValue'), threadID, messageID);
      }
      try {
        let getText2 = () => {};
        if (cmd.languages && typeof cmd.languages == 'object') {
          getText2 = (...value) => {
            const react = cmd.languages || {};
            if (!react.hasOwnProperty(global.config.language)) {
              return api.sendMessage(
                global.getText('handleCommand', 'notFoundLanguage', cmd.config.name),
                threadID, messageID
              );
            }
            let lang = react[global.config.language][value[0]] || '';
            for (let i = value.length; i > 0; i--) {
              lang = lang.replace(RegExp('%' + i, 'g'), value[i]);
            }
            return lang;
          };
        }
        cmd.handleReaction({ api, event, models, Users, Threads, Currencies, handleReaction: handle, getText: getText2 });
      } catch (error) {
        return api.sendMessage(global.getText('handleReaction', 'executeError', error), threadID, messageID);
      }
    }
  };
};
