module.exports.config = {
  name: "config",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "Bot admin control panel",
  commandCategory: "admin",
  usages: "config",
  cooldowns: 5
};

module.exports.languages = { "vi": {}, "en": {} };

const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");

const NAME = "config";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const APPSTATE_PATH = path.join(__dirname, "../../appstate.json");

/* ───────── CREDIT LOCK ───────── */
function creditOK() {
  const c = String(module.exports.config.credits);
  return crypto.createHash("sha256").update(c).digest("hex") === CREDIT_HASH;
}

/* ───────── FONT: 𝚊𝚋𝚌𝚍 ───────── */
function mono(t) {
  return String(t).replace(/[A-Za-z0-9]/g, (c) => {
    const k = c.charCodeAt(0);
    if (k >= 65 && k <= 90) return String.fromCodePoint(0x1D670 + k - 65);
    if (k >= 97 && k <= 122) return String.fromCodePoint(0x1D68A + k - 97);
    return String.fromCodePoint(0x1D7F6 + k - 48);
  });
}
// tagged template: static text -> mono font, ${values} (IDs, links, names) stay raw
const m = (s, ...v) => s.reduce((a, p, i) => a + mono(p) + (i < v.length ? v[i] : ""), "");

const creditMsg = () => m`❌ Credit changed! This command is disabled. Restore the original credit.`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ids = (t) => String(t || "").split(/\s+/).filter(Boolean);

function getHeaders() {
  let cookie = "";
  try {
    cookie = JSON.parse(fs.readFileSync(APPSTATE_PATH, "utf8")).map((i) => i.key + "=" + i.value).join(";");
  } catch (e) {}
  return {
    "Host": "mbasic.facebook.com",
    "user-agent": "Mozilla/5.0 (Linux; Android 11; M2101K7BG Build/RP1A.200720.011;) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/97.0.4692.98 Mobile Safari/537.36",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "navigate",
    "sec-fetch-user": "?1",
    "sec-fetch-dest": "document",
    "referer": "https://mbasic.facebook.com/?refsrc=deprecated&_rdr",
    "accept-encoding": "gzip, deflate",
    "accept-language": "en-US,en;q=0.9",
    "Cookie": cookie
  };
}

function getGUID() {
  let t = Date.now();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const a = Math.floor((t + Math.random() * 16) % 16);
    t = Math.floor(t / 16);
    return (c == "x" ? a : (a & 7) | 8).toString(16);
  });
}

function updateConfigFile(fn) {
  const p = global.client.configPath || path.join(process.cwd(), "config.json");
  delete require.cache[require.resolve(p)];
  const cfg = require(p);
  fn(cfg);
  fs.writeFileSync(p, JSON.stringify(cfg, null, 4), "utf8");
}

async function listThreads(api, filter) {
  const list = await api.getThreadList(500, null, [filter]);
  return list.reduce((a, b) => a + `» ${b.name || "Unknown"} | ${b.threadID} | ${b.snippet || ""}\n`, "").slice(0, 15000);
}

const send = (api, msg, tid) => new Promise((res) => api.sendMessage(msg, tid, (e) => res(!e)));

global.__cfgBackup = global.__cfgBackup || new Map();
global.__cmdDisabled = global.__cmdDisabled || new Map();

/* ───────── REPLY HANDLER ───────── */
module.exports.handleReply = async function ({ api, event, handleReply, Users }) {
  const { type, author } = handleReply;
  const { threadID, messageID, senderID } = event;
  if (author != senderID) return;

  const botID = api.getCurrentUserID();
  const body = (event.body || "").trim();
  const args = body.split(/\s+/);

  const reply = (msg, cb) => cb ? api.sendMessage(msg, threadID, cb, messageID) : api.sendMessage(msg, threadID, messageID);
  const ask = (text, nextType, extra = {}) => reply(text, (e, info) => {
    if (e || !info) return;
    global.client.handleReply.push({ name: NAME, messageID: info.messageID, author: senderID, type: nextType, ...extra });
  });
  const fail = () => reply(m`An error occurred, please try again later`);

  if (!creditOK()) return reply(creditMsg());

  /* ───── MENU ───── */
  if (type == "menu") {
    const n = parseInt(args[0], 10);
    switch (n) {
      case 1: return ask(m`Reply with the bio you want to set, or 'delete' to remove the bio`, "changeBio");
      case 2: return ask(m`Reply with the nickname you want to set, or 'delete' to remove the nickname`, "changeNickname");
      case 3: return reply(m`Pending message list:\n\n` + (await listThreads(api, "PENDING") || m`No messages`));
      case 4: return reply(m`Unread message list:\n\n` + (await listThreads(api, "unread") || m`No messages`));
      case 5: return reply(m`Spam message list:\n\n` + (await listThreads(api, "OTHER") || m`No messages`));
      case 6: return ask(m`Reply with a photo or an image link to set as the bot avatar`, "changeAvatar");
      case 7: {
        if (!["on", "off"].includes(args[1])) return reply(m`Please reply like: 07 on  or  07 off`);
        const form = {
          av: botID,
          variables: JSON.stringify({ "0": { is_shielded: args[1] == "on", actor_id: botID, client_mutation_id: Math.round(Math.random() * 19) } }),
          doc_id: "100017985245260"
        };
        return api.httpPost("https://www.facebook.com/api/graphql/", form, (err, data) => {
          let bad = err;
          try { if (JSON.parse(data).errors) bad = true; } catch (e) { bad = true; }
          if (bad) return fail();
          reply(m`» Avatar shield turned ${args[1]} successfully`);
        });
      }
      case 8: return ask(m`Reply with the UID(s) to block (space or new line separated)`, "blockUser");
      case 9: return ask(m`Reply with the UID(s) to unblock (space or new line separated)`, "unBlockUser");
      case 10: return ask(m`Reply with the content of the post`, "createPost");
      case 11: return ask(m`Reply with the post ID(s) to delete`, "deletePost");
      case 12: return ask(m`Reply with the post ID(s) to comment on (user post)`, "choiceIdCommentPost", { isGroup: false });
      case 13: return ask(m`Reply with the post ID(s) to comment on (group post)`, "choiceIdCommentPost", { isGroup: true });
      case 14: return ask(m`Reply with the post ID(s) to react to`, "choiceIdReactionPost");
      case 15: return ask(m`Reply with the UID(s) to send friend requests`, "addFiends");
      case 16: return ask(m`Reply with the UID(s) to accept friend requests`, "acceptFriendRequest");
      case 17: return ask(m`Reply with the UID(s) to decline friend requests`, "deleteFriendRequest");
      case 18: return ask(m`Reply with the UID(s) to unfriend`, "unFriends");
      case 19: return ask(m`Reply with the UID(s) / thread ID(s) to send a message`, "choiceIdSendMessage");
      case 20: return ask(m`Reply with the code you want to save as a note`, "noteCode");
      case 21: return api.logout((e) => { if (e) return fail(); console.log("»» LOGOUT SUCCESS ««"); });

      /* ── new: groups ── */
      case 22: {
        const list = (await api.getThreadList(500, null, ["INBOX"])).filter((t) => t.isGroup);
        const txt = list.reduce((a, b, i) => a + `${i + 1}. ${b.name || "Unnamed"} | ${b.threadID} | ${(b.participantIDs || []).length} members\n`, "");
        return reply(m`Group list (${list.length}):\n\n` + (txt.slice(0, 15000) || m`No groups`));
      }
      case 23: return ask(m`Reply with the group thread ID(s) for the bot to leave`, "leaveGroup");
      case 24: return ask(m`Reply like:  <threadID> <new group name>`, "setGroupName");
      case 25: return ask(m`Reply with the group thread ID to change its image`, "choiceGroupImage");
      case 26: return ask(m`Reply like:  <threadID> <uid>  (add user to group)`, "addToGroup");
      case 27: return ask(m`Reply like:  <threadID> <uid>  (kick user from group)`, "kickFromGroup");

      /* ── new: broadcast ── */
      case 28: return ask(m`Reply with the message to broadcast to ALL groups`, "broadcastAll");
      case 29: return ask(m`Reply like:  <id1> <id2> ... | <message>`, "broadcastSelected");

      /* ── new: bot control ── */
      case 30:
        return reply(m`♻️ Restarting bot...`, () => setTimeout(() => process.exit(1), 1500));
      case 31: {
        const up = Math.floor(process.uptime());
        const h = Math.floor(up / 3600), mi = Math.floor((up % 3600) / 60), s = up % 60;
        const mem = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
        const t0 = Date.now();
        await new Promise((r) => api.getUserInfo(botID, () => r()));
        const ping = Date.now() - t0;
        return reply(m`📊 BOT STATUS\n\n» Uptime: ${h}h ${mi}m ${s}s\n» RAM: ${mem} MB\n» Ping: ${ping} ms\n» Commands: ${global.client.commands.size}\n» Bot ID: ${botID}\n» Prefix: ${global.config.PREFIX}`);
      }
      case 32: return ask(m`Reply with the UID(s) to add as admin`, "addAdmin");
      case 33: return ask(m`Reply with the UID(s) to remove from admin`, "removeAdmin");
      case 34: {
        if (!["on", "off"].includes(args[1])) return reply(m`Please reply like: 34 on  or  34 off`);
        if (args[1] == "on") {
          for (const [name, cmd] of global.client.commands) {
            if (name === NAME) continue;
            if (!global.__cfgBackup.has(name)) global.__cfgBackup.set(name, cmd.config.hasPermssion);
            cmd.config.hasPermssion = 2;
          }
          return reply(m`🛠️ Maintenance mode ON (admin only)`);
        }
        for (const [name, perm] of global.__cfgBackup) {
          const cmd = global.client.commands.get(name);
          if (cmd) cmd.config.hasPermssion = perm;
        }
        global.__cfgBackup.clear();
        return reply(m`✅ Maintenance mode OFF`);
      }
      case 35: {
        const list = await api.getThreadList(500, null, ["PENDING"]);
        let ok = 0;
        for (const t of list) {
          try {
            await new Promise((res, rej) => api.handleMessageRequest(t.threadID, true, (e) => e ? rej(e) : res()));
            ok++;
          } catch (e) {}
          await sleep(1500);
        }
        return reply(m`» Accepted ${ok}/${list.length} pending requests`);
      }

      /* ── new: users ── */
      case 36: return ask(m`Reply with the UID(s) to ban from using the bot`, "banUser");
      case 37: return ask(m`Reply with the UID(s) to unban`, "unbanUser");
      case 38: {
        const list = [...global.data.userBanned.keys()];
        let txt = "";
        for (const id of list) {
          let name = "Unknown";
          try { name = await Users.getNameUser(id); } catch (e) {}
          txt += `» ${name} | ${id}\n`;
        }
        return reply(m`Banned users (${list.length}):\n\n` + (txt || m`No banned users`));
      }
      case 39: return ask(m`Reply with the UID to view user info`, "userInfo");

      /* ── new: security ── */
      case 40: return ask(m`Paste the new appstate JSON here (your message will be unsent for safety)`, "updateAppstate");
      case 41: {
        try {
          const dir = path.join(__dirname, "cache");
          fs.ensureDirSync(dir);
          const tmp = path.join(dir, "appstate_export.txt");
          fs.copyFileSync(APPSTATE_PATH, tmp);
          return api.sendMessage({ body: m`🔐 appstate export. Keep it private!`, attachment: fs.createReadStream(tmp) }, senderID, () => fs.unlink(tmp, () => {}));
        } catch (e) { return fail(); }
      }
      case 42: {
        try {
          const info = await new Promise((res, rej) => api.getUserInfo(botID, (e, d) => e ? rej(e) : res(d)));
          const name = info && info[botID] ? info[botID].name : "Unknown";
          return reply(m`✅ Session is alive\n» Name: ${name}\n» ID: ${botID}`);
        } catch (e) { return reply(m`❌ Session is dead or expired. Update appstate (40).`); }
      }

      /* ── new: small ── */
      case 43: return ask(m`Reply with the new bot prefix`, "setPrefix");
      case 44: return ask(m`Reply with the command name to turn OFF`, "cmdOff");
      case 45: return ask(m`Reply with the command name to turn ON`, "cmdOn");
      default: return reply(m`Invalid option. Reply with a number from the menu.`);
    }
  }

  /* ───── profile ───── */
  else if (type == "changeBio") {
    const bio = body.toLowerCase() == "delete" ? "" : body;
    api.changeBio(bio, false, (err) => {
      if (err) return fail();
      reply(!bio ? m`Bot bio deleted successfully` : m`Bot bio changed to: ${bio}`);
    });
  }

  else if (type == "changeNickname") {
    const nickname = body.toLowerCase() == "delete" ? "" : body;
    let res;
    try {
      res = (await axios.get("https://mbasic.facebook.com/" + botID + "/about", {
        headers: getHeaders(),
        params: { nocollections: "1", lst: `${botID}:${botID}:${Date.now().toString().slice(0, 10)}`, refid: "17" }
      })).data;
    } catch (e) { return fail(); }

    const marker = 'href="/profile/edit/info/nicknames/?entid=';
    const name_id = res.includes(marker) ? res.split(marker)[1].split("&amp;")[0] : null;
    const collectionToken = Buffer.from("app_collection:" + botID + ":2327158227:206").toString("base64");
    const sectionToken = Buffer.from("app_section:" + botID + ":2327158227").toString("base64");
    let form;

    if (nickname) {
      const variables = {
        collectionToken,
        input: { name_text: nickname, name_type: "NICKNAME", show_as_display_name: true, actor_id: botID, client_mutation_id: Math.round(Math.random() * 19).toString() },
        scale: 3,
        sectionToken
      };
      if (name_id) variables.input.name_id = name_id;
      form = { av: botID, fb_api_req_friendly_name: "ProfileCometNicknameSaveMutation", fb_api_caller_class: "RelayModern", doc_id: "100017985245260", variables: JSON.stringify(variables) };
    } else {
      if (!name_id) return reply(m`The bot has no nickname set`);
      form = {
        av: botID,
        fb_api_req_friendly_name: "ProfileCometAboutFieldItemDeleteMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "100037743553265",
        variables: JSON.stringify({
          collectionToken,
          input: { entid: name_id, field_type: "nicknames", actor_id: botID, client_mutation_id: Math.round(Math.random() * 19).toString() },
          scale: 3, sectionToken, isNicknameField: true, useDefaultActor: false
        })
      };
    }

    api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
      if (e) return fail();
      let j; try { j = JSON.parse(i); } catch (x) { return fail(); }
      if (j.errors) return reply(m`Error: ${j.errors[0].summary}, ${j.errors[0].description}`);
      reply(!nickname ? m`Bot nickname deleted successfully` : m`Bot nickname changed to: ${nickname}`);
    });
  }

  else if (type == "changeAvatar") {
    let imgUrl;
    if (/^https?:\/\/\S+$/i.test(body)) imgUrl = body;
    else if (event.attachments && event.attachments[0] && event.attachments[0].type == "photo") imgUrl = event.attachments[0].url;
    else return ask(m`Please send a valid image link or a photo`, "changeAvatar");
    try {
      const imgBuffer = (await axios.get(imgUrl, { responseType: "stream" })).data;
      let up = await api.httpPostFormData(`https://www.facebook.com/profile/picture/upload/?profile_id=${botID}&photo_source=57&av=${botID}`, { file: imgBuffer });
      up = JSON.parse(up.split("for (;;);")[1]);
      if (up.error) return reply(m`Error: ${up.error.errorDescription}`);
      const form = {
        av: botID,
        fb_api_req_friendly_name: "ProfileCometProfilePictureSetMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "100037743553265",
        variables: JSON.stringify({
          input: {
            caption: "", existing_photo_id: up.payload.fbid, expiration_time: null, profile_id: botID,
            profile_pic_method: "EXISTING", profile_pic_source: "TIMELINE",
            scaled_crop_rect: { height: 1, width: 1, x: 0, y: 0 }, skip_cropping: true,
            actor_id: botID, client_mutation_id: Math.round(Math.random() * 19).toString()
          },
          isPage: false, isProfile: true, scale: 3
        })
      };
      api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
        if (e) return fail();
        try {
          const j = JSON.parse(i.slice(0, i.indexOf("\n") + 1));
          if (j.errors) return reply(m`Error: ${j.errors[0].description}`);
        } catch (x) {}
        reply(m`Bot avatar changed successfully`);
      });
    } catch (err) { fail(); }
  }

  /* ───── block / unblock ───── */
  else if (type == "blockUser" || type == "unBlockUser") {
    const block = type == "blockUser";
    const list = ids(body);
    if (!list.length) return ask(m`Please enter at least one UID`, type);
    const ok = [], bad = [];
    for (const uid of list) {
      try { await api.changeBlockedStatus(uid, block); ok.push(uid); } catch (e) { bad.push(uid); }
    }
    reply(m`» ${block ? "Blocked" : "Unblocked"} ${ok.length} user(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  /* ───── posts ───── */
  else if (type == "createPost") {
    if (!body) return ask(m`Please enter the post content`, "createPost");
    const sid = getGUID();
    const form = {
      av: botID,
      fb_api_req_friendly_name: "ComposerStoryCreateMutation",
      fb_api_caller_class: "RelayModern",
      doc_id: "100017985245260",
      variables: JSON.stringify({
        input: {
          composer_entry_point: "inline_composer", composer_source_surface: "timeline",
          idempotence_token: sid + "_FEED", source: "WWW", attachments: [],
          audience: { privacy: { allow: [], base_state: "EVERYONE", deny: [], tag_expansion_state: "UNSPECIFIED" } },
          message: { ranges: [], text: body }, with_tags_ids: [], inline_activities: [],
          explicit_place_id: "0", text_format_preset_id: "0", logging: { composer_session_id: sid },
          tracking: [null], actor_id: botID, client_mutation_id: Math.round(Math.random() * 19)
        },
        displayCommentsFeedbackContext: null, displayCommentsContextEnableComment: null,
        displayCommentsContextIsAdPreview: null, displayCommentsContextIsAggregatedShare: null,
        displayCommentsContextIsStorySet: null, feedLocation: "TIMELINE", feedbackSource: 0,
        focusCommentID: null, gridMediaWidth: 230, scale: 3, privacySelectorRenderLocation: "COMET_STREAM",
        renderLocation: "timeline", useDefaultActor: false, inviteShortLinkKey: null, isFeed: false,
        isFundraiser: false, isFunFactPost: false, isGroup: false, isTimeline: true, isSocialLearning: false,
        isPageNewsFeed: false, isProfileReviews: false, isWorkSharedDraft: false,
        UFI2CommentsProvider_commentsKey: "ProfileCometTimelineRoute",
        useCometPhotoViewerPlaceholderFrag: true, hashtag: null, canUserManageOffers: false
      })
    };
    api.httpPost("https://www.facebook.com/api/graphql/", form, (e, i) => {
      try {
        const j = JSON.parse(i);
        if (e || j.errors) throw new Error();
        const s = j.data.story_create.story;
        reply(m`» Post created successfully\n» postID: ${s.legacy_story_hideable_id}\n» url: ${s.url}`);
      } catch (x) { reply(m`Failed to create the post, please try again later`); }
    });
  }

  else if (type == "choiceIdCommentPost") {
    if (!body) return ask(m`Please enter the post ID(s)`, "choiceIdCommentPost", { isGroup: handleReply.isGroup });
    ask(m`Reply with the comment text`, "commentPost", { postIDs: ids(body), isGroup: handleReply.isGroup });
  }

  else if (type == "commentPost") {
    const { postIDs, isGroup } = handleReply;
    if (!body) return ask(m`Please enter the comment text`, "commentPost", { postIDs, isGroup });
    const ok = [], bad = [];
    for (const id of postIDs) {
      const form = {
        av: botID,
        fb_api_req_friendly_name: "CometUFICreateCommentMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: "4744517358977326",
        variables: JSON.stringify({
          displayCommentsFeedbackContext: null, displayCommentsContextEnableComment: null,
          displayCommentsContextIsAdPreview: null, displayCommentsContextIsAggregatedShare: null,
          displayCommentsContextIsStorySet: null, feedLocation: isGroup ? "GROUP" : "TIMELINE",
          feedbackSource: 0, focusCommentID: null, includeNestedComments: false,
          input: {
            attachments: null, feedback_id: Buffer.from("feedback:" + id).toString("base64"),
            formatting_style: null, message: { ranges: [], text: body }, is_tracking_encrypted: true,
            tracking: [], feedback_source: "PROFILE", idempotence_token: "client:" + getGUID(),
            session_id: getGUID(), actor_id: botID, client_mutation_id: Math.round(Math.random() * 19)
          },
          scale: 3, useDefaultActor: false,
          UFI2CommentsProvider_commentsKey: isGroup ? "CometGroupDiscussionRootSuccessQuery" : "ProfileCometTimelineRoute"
        })
      };
      try {
        const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        if (JSON.parse(res).errors) bad.push(id); else ok.push(id);
      } catch (e) { bad.push(id); }
      await sleep(2000);
    }
    reply(m`» Commented on ${ok.length} post(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "deletePost") {
    const ok = [], bad = [];
    for (const postID of ids(body)) {
      try {
        const headers = getHeaders();
        let res = (await axios.get("https://mbasic.facebook.com/story.php?story_fbid=" + postID + "&id=" + botID, { headers })).data;
        const session_ID = decodeURIComponent(res.split("session_id%22%3A%22")[1].split("%22%2C%22")[0]);
        const hideable_token = decodeURIComponent(res.split("%22%2C%22hideable_token%22%3A%")[1].split("%22%2C%22")[0]);
        let URl = "https://mbasic.facebook.com/nfx/basic/direct_actions/?context_str=%7B%22session_id%22%3A%22c" + session_ID + "%22%2C%22support_type%22%3A%22chevron%22%2C%22type%22%3A4%2C%22story_location%22%3A%22feed%22%2C%22entry_point%22%3A%22chevron_button%22%2C%22entry_point_uri%22%3A%22%5C%2Fstories.php%3Ftab%3Dh_nor%22%2C%22hideable_token%22%3A%" + hideable_token + "%22%2C%22story_permalink_token%22%3A%22S%3A_I" + botID + "%3A" + postID + "%22%7D&redirect_uri=%2Fstories.php%3Ftab%3Dh_nor&refid=8&__tn__=%2AW-R";
        res = (await axios.get(URl, { headers })).data;
        URl = res.split('method="post" action="/nfx/basic/handle_action/?')[1].split('"')[0];
        URl = "https://mbasic.facebook.com/nfx/basic/handle_action/?" + URl
          .replace(/&amp;/g, "&")
          .replace("%5C%2Fstories.php%3Ftab%3Dh_nor", "https%3A%2F%2Fmbasic.facebook.com%2Fprofile.php%3Fv%3Dfeed")
          .replace("%2Fstories.php%3Ftab%3Dh_nor", "https%3A%2F%2Fmbasic.facebook.com%2Fprofile.php%3Fv%3Dfeed");
        const fb_dtsg = res.split('type="hidden" name="fb_dtsg" value="')[1].split('" autocomplete="off" /><input')[0];
        const jazoest = res.split('type="hidden" name="jazoest" value="')[1].split('" autocomplete="off" />')[0];
        const data = "fb_dtsg=" + encodeURIComponent(fb_dtsg) + "&jazoest=" + encodeURIComponent(jazoest) + "&action_key=DELETE&submit=G%E1%BB%ADi";
        const dt = await axios({ url: URl, method: "post", headers, data });
        if (dt.data.includes("Sorry, an error has occurred")) throw new Error();
        ok.push(postID);
      } catch (e) { bad.push(postID); }
    }
    reply(m`» Deleted ${ok.length} post(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "choiceIdReactionPost") {
    if (!body) return ask(m`Please enter the post ID(s)`, "choiceIdReactionPost");
    const listID = ids(body);
    ask(m`Enter the reaction for ${listID.length} post(s): unlike/like/love/heart/haha/wow/sad/angry`, "reactionPost", { listID });
  }

  else if (type == "reactionPost") {
    const listID = handleReply.listID;
    const feeling = body.toLowerCase();
    if (!"unlike/like/love/heart/haha/wow/sad/angry".split("/").includes(feeling))
      return ask(m`Choose one: unlike/like/love/heart/haha/wow/sad/angry`, "reactionPost", { listID });
    const ok = [], bad = [];
    for (const id of listID) {
      try { await api.setPostReaction(Number(id), feeling); ok.push(id); } catch (e) { bad.push(id); }
    }
    reply(m`» Reacted ${feeling} on ${ok.length} post(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  /* ───── friends / messages ───── */
  else if (type == "addFiends") {
    const ok = [], bad = [];
    for (const uid of ids(body)) {
      const form = {
        av: botID, fb_api_caller_class: "RelayModern", fb_api_req_friendly_name: "FriendingCometFriendRequestSendMutation",
        doc_id: "5090693304332268",
        variables: JSON.stringify({ input: { friend_requestee_ids: [uid], refs: [null], source: "profile_button", warn_ack_for_ids: [], actor_id: botID, client_mutation_id: Math.round(Math.random() * 19).toString() }, scale: 3 })
      };
      try {
        const r = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        if (JSON.parse(r).errors) bad.push(uid); else ok.push(uid);
      } catch (e) { bad.push(uid); }
      await sleep(3000);
    }
    reply(m`» Friend request sent to ${ok.length} id(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "acceptFriendRequest" || type == "deleteFriendRequest") {
    const accept = type == "acceptFriendRequest";
    const ok = [], bad = [];
    for (const uid of ids(body)) {
      const form = {
        av: botID,
        fb_api_req_friendly_name: accept ? "FriendingCometFriendRequestConfirmMutation" : "FriendingCometFriendRequestDeleteMutation",
        fb_api_caller_class: "RelayModern",
        doc_id: accept ? "3147613905362928" : "4108254489275063",
        variables: JSON.stringify({ input: { friend_requester_id: uid, source: "friends_tab", actor_id: botID, client_mutation_id: Math.round(Math.random() * 19).toString() }, scale: 3, refresh_num: 0 })
      };
      try {
        const r = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        if (JSON.parse(r).errors) bad.push(uid); else ok.push(uid);
      } catch (e) { bad.push(uid); }
      await sleep(2000);
    }
    reply(m`» ${accept ? "Accepted" : "Declined"} ${ok.length} request(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "unFriends") {
    const ok = [], bad = [];
    for (const uid of ids(body)) {
      const form = {
        av: botID, fb_api_req_friendly_name: "FriendingCometUnfriendMutation", fb_api_caller_class: "RelayModern",
        doc_id: "4281078165250156",
        variables: JSON.stringify({ input: { source: "bd_profile_button", unfriended_user_id: uid, actor_id: botID, client_mutation_id: Math.round(Math.random() * 19) }, scale: 3 })
      };
      try {
        const r = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        if (JSON.parse(r).errors) bad.push(uid); else ok.push(uid);
      } catch (e) { bad.push(uid); }
      await sleep(2000);
    }
    reply(m`» Unfriended ${ok.length} user(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "choiceIdSendMessage") {
    const listID = ids(body);
    if (!listID.length) return ask(m`Please enter at least one ID`, "choiceIdSendMessage");
    ask(m`Enter the message to send to ${listID.length} id(s)`, "sendMessage", { listID });
  }

  else if (type == "sendMessage") {
    const ok = [], bad = [];
    for (const uid of handleReply.listID) {
      (await send(api, body, uid)) ? ok.push(uid) : bad.push(uid);
      await sleep(2000);
    }
    reply(m`» Message sent to ${ok.length} id(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "noteCode") {
    axios({
      url: "https://buildtool.dev/verification", method: "post",
      data: `content=${encodeURIComponent(body)}&code_class=language${encodeURIComponent("-")}javascript`
    }).then((r) => {
      const href = r.data.split('<a href="code-viewer.php?')[1].split('">Permanent link</a>')[0];
      reply(m`Note created, link: ` + "https://buildtool.dev/code-viewer.php?" + href);
    }).catch(() => fail());
  }

  /* ───── groups ───── */
  else if (type == "leaveGroup") {
    const ok = [], bad = [];
    for (const tid of ids(body)) {
      try {
        await new Promise((res, rej) => api.removeUserFromGroup(botID, tid, (e) => e ? rej(e) : res()));
        ok.push(tid);
      } catch (e) { bad.push(tid); }
      await sleep(1500);
    }
    reply(m`» Left ${ok.length} group(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "setGroupName") {
    const tid = args[0], title = args.slice(1).join(" ");
    if (!tid || !title) return ask(m`Reply like:  <threadID> <new group name>`, "setGroupName");
    api.setTitle(title, tid, (e) => e ? fail() : reply(m`Group name changed to: ${title}`));
  }

  else if (type == "choiceGroupImage") {
    if (!args[0]) return ask(m`Please enter the group thread ID`, "choiceGroupImage");
    ask(m`Now reply with a photo or an image link`, "setGroupImage", { tid: args[0] });
  }

  else if (type == "setGroupImage") {
    let imgUrl;
    if (/^https?:\/\/\S+$/i.test(body)) imgUrl = body;
    else if (event.attachments && event.attachments[0] && event.attachments[0].type == "photo") imgUrl = event.attachments[0].url;
    else return ask(m`Please send a valid image link or a photo`, "setGroupImage", { tid: handleReply.tid });
    try {
      const stream = (await axios.get(imgUrl, { responseType: "stream" })).data;
      api.changeGroupImage(stream, handleReply.tid, (e) => e ? fail() : reply(m`Group image changed successfully`));
    } catch (e) { fail(); }
  }

  else if (type == "addToGroup" || type == "kickFromGroup") {
    const [tid, uid] = args;
    if (!tid || !uid) return ask(m`Reply like:  <threadID> <uid>`, type);
    const cb = (e) => e ? fail() : reply(type == "addToGroup" ? m`User added to the group` : m`User removed from the group`);
    if (type == "addToGroup") api.addUserToGroup(uid, tid, cb);
    else api.removeUserFromGroup(uid, tid, cb);
  }

  /* ───── broadcast ───── */
  else if (type == "broadcastAll" || type == "broadcastSelected") {
    let targets, text;
    if (type == "broadcastAll") {
      if (!body) return ask(m`Please enter the message`, "broadcastAll");
      targets = (await api.getThreadList(500, null, ["INBOX"])).filter((t) => t.isGroup).map((t) => t.threadID);
      text = body;
    } else {
      const i = body.indexOf("|");
      if (i < 0) return ask(m`Reply like:  <id1> <id2> ... | <message>`, "broadcastSelected");
      targets = ids(body.slice(0, i));
      text = body.slice(i + 1).trim();
      if (!targets.length || !text) return ask(m`Reply like:  <id1> <id2> ... | <message>`, "broadcastSelected");
    }
    reply(m`📢 Broadcasting to ${targets.length} group(s)...`);
    let ok = 0;
    for (const tid of targets) {
      if (await send(api, text, tid)) ok++;
      await sleep(3000);
    }
    reply(m`✅ Broadcast done: ${ok}/${targets.length} sent`);
  }

  /* ───── admins ───── */
  else if (type == "addAdmin" || type == "removeAdmin") {
    const list = ids(body);
    if (!list.length) return ask(m`Please enter at least one UID`, type);
    try {
      updateConfigFile((cfg) => {
        for (const id of list) {
          if (type == "addAdmin") {
            if (!cfg.ADMINBOT.includes(id)) cfg.ADMINBOT.push(id);
            if (!global.config.ADMINBOT.includes(id)) global.config.ADMINBOT.push(id);
          } else {
            cfg.ADMINBOT = cfg.ADMINBOT.filter((x) => x != id);
            global.config.ADMINBOT = global.config.ADMINBOT.filter((x) => x != id);
          }
        }
      });
      reply(m`» ${type == "addAdmin" ? "Added" : "Removed"} ${list.length} admin(s)`);
    } catch (e) { fail(); }
  }

  /* ───── ban / unban ───── */
  else if (type == "banUser" || type == "unbanUser") {
    const ban = type == "banUser";
    const ok = [], bad = [];
    for (const uid of ids(body)) {
      try {
        const data = ((await Users.getData(uid)).data) || {};
        if (ban) {
          data.banned = 1; data.reason = "Banned by admin"; data.dateAdded = new Date().toLocaleString();
          global.data.userBanned.set(uid, { reason: data.reason, dateAdded: data.dateAdded });
        } else {
          data.banned = 0; data.reason = null; data.dateAdded = null;
          global.data.userBanned.delete(uid);
        }
        await Users.setData(uid, { data });
        ok.push(uid);
      } catch (e) { bad.push(uid); }
    }
    reply(m`» ${ban ? "Banned" : "Unbanned"} ${ok.length} user(s)` + (bad.length ? m`\n» Failed ${bad.length}: ` + bad.join(" ") : ""));
  }

  else if (type == "userInfo") {
    if (!body) return ask(m`Please enter a UID`, "userInfo");
    api.getUserInfo(args[0], (e, d) => {
      if (e || !d || !d[args[0]]) return fail();
      const u = d[args[0]];
      const gender = u.gender == 1 ? "Female" : u.gender == 2 ? "Male" : "Unknown";
      reply(m`👤 USER INFO\n\n» Name: ${u.name}\n» UID: ${args[0]}\n» Gender: ${gender}\n» Username: ${u.vanity || "none"}\n» Friend: ${u.isFriend ? "yes" : "no"}\n» Profile: ${u.profileUrl}`);
    });
  }

  /* ───── security ───── */
  else if (type == "updateAppstate") {
    try { api.unsendMessage(messageID); } catch (e) {}
    try {
      const j = JSON.parse(body);
      if (!Array.isArray(j) || !j.length || !j.every((x) => x.key && x.value !== undefined)) throw new Error();
      fs.writeFileSync(APPSTATE_PATH, JSON.stringify(j, null, 2), "utf8");
      reply(m`✅ appstate updated. Restart the bot (30) to use the new session.`);
    } catch (e) { reply(m`❌ Invalid appstate JSON`); }
  }

  /* ───── small ───── */
  else if (type == "setPrefix") {
    if (!body || body.length > 5 || /\s/.test(body)) return ask(m`Enter a valid prefix (1-5 characters, no spaces)`, "setPrefix");
    try {
      updateConfigFile((cfg) => { cfg.PREFIX = body; });
      global.config.PREFIX = body;
      reply(m`Prefix changed to: ${body}`);
    } catch (e) { fail(); }
  }

  else if (type == "cmdOff") {
    const name = body.toLowerCase();
    if (name == NAME) return reply(m`You cannot turn off this command`);
    const cmd = global.client.commands.get(name);
    if (!cmd) return reply(m`Command not found`);
    global.__cmdDisabled.set(name, cmd);
    global.client.commands.delete(name);
    reply(m`Command turned OFF: ${name}`);
  }

  else if (type == "cmdOn") {
    const name = body.toLowerCase();
    const cmd = global.__cmdDisabled.get(name);
    if (!cmd) return reply(m`This command is not in the disabled list`);
    global.client.commands.set(name, cmd);
    global.__cmdDisabled.delete(name);
    reply(m`Command turned ON: ${name}`);
  }
};

/* ───────── RUN (MENU) ───────── */
module.exports.run = async ({ event, api }) => {
  const { threadID, messageID, senderID } = event;
  if (!creditOK()) return api.sendMessage(creditMsg(), threadID, messageID);

  const credit = module.exports.config.credits;
  const menu =
`╔══════════════════════╗
  ⚙️ ${credit} ⚙️
╚══════════════════════╝

${m`┏━━ 👤 PROFILE ━━┓
┃ 01 ➤ Edit bot bio
┃ 02 ➤ Edit bot nickname
┃ 06 ➤ Change bot avatar
┃ 07 ➤ Avatar shield (07 on/off)
┗━━━━━━━━━━━━━┛

┏━━ 📩 INBOX ━━┓
┃ 03 ➤ Pending messages
┃ 04 ➤ Unread messages
┃ 05 ➤ Spam messages
┃ 19 ➤ Send message by ID
┃ 35 ➤ Accept all pending
┗━━━━━━━━━━━━━┛

┏━━ 🚫 BLOCK ━━┓
┃ 08 ➤ Block user
┃ 09 ➤ Unblock user
┗━━━━━━━━━━━━━┛

┏━━ 📝 POST ━━┓
┃ 10 ➤ Create post
┃ 11 ➤ Delete post
┃ 12 ➤ Comment (user post)
┃ 13 ➤ Comment (group post)
┃ 14 ➤ React to post
┗━━━━━━━━━━━━━┛

┏━━ 👥 FRIENDS ━━┓
┃ 15 ➤ Add friend by ID
┃ 16 ➤ Accept request
┃ 17 ➤ Decline request
┃ 18 ➤ Unfriend by ID
┗━━━━━━━━━━━━━━┛

┏━━ 👨‍👩‍👧 GROUPS ━━┓
┃ 22 ➤ Group list
┃ 23 ➤ Leave group
┃ 24 ➤ Change group name
┃ 25 ➤ Change group image
┃ 26 ➤ Add user to group
┃ 27 ➤ Kick user from group
┗━━━━━━━━━━━━━━┛

┏━━ 📢 BROADCAST ━━┓
┃ 28 ➤ Send to all groups
┃ 29 ➤ Send to selected groups
┗━━━━━━━━━━━━━━━┛

┏━━ 🤖 BOT CONTROL ━━┓
┃ 30 ➤ Restart bot
┃ 31 ➤ Status (uptime/RAM/ping)
┃ 32 ➤ Add admin
┃ 33 ➤ Remove admin
┃ 34 ➤ Maintenance (34 on/off)
┃ 43 ➤ Change prefix
┃ 44 ➤ Turn command OFF
┃ 45 ➤ Turn command ON
┗━━━━━━━━━━━━━━━━┛

┏━━ 👤 USERS ━━┓
┃ 36 ➤ Ban user
┃ 37 ➤ Unban user
┃ 38 ➤ Banned list
┃ 39 ➤ User info
┗━━━━━━━━━━━━━┛

┏━━ 🔐 SECURITY ━━┓
┃ 40 ➤ Update appstate
┃ 41 ➤ Export appstate (inbox)
┃ 42 ➤ Check session
┃ 20 ➤ Make note (buildtool.dev)
┃ 21 ➤ Logout bot
┗━━━━━━━━━━━━━━━┛`}

👑 ${mono("Admin ID")}:
${global.config.ADMINBOT.join("\n")}
🤖 ${mono("Bot ID")}: ${api.getCurrentUserID()}

${m`💬 Reply to this message with the number you want to run`}`;

  api.sendMessage(menu, threadID, (err, info) => {
    if (err || !info) return;
    global.client.handleReply.push({ name: NAME, messageID: info.messageID, author: senderID, type: "menu" });
  }, messageID);
};
