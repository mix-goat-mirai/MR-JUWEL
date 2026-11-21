const axios = require("axios");

const OWNER_CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const creditOk = () => module.exports.config.credits === OWNER_CREDIT;
const LOCK_MSG = "🔒 কমান্ড লক!\nএই কমান্ডের ক্রেডিট বদলানো হয়েছে, তাই এটা কাজ করবে না।\n👑 আসল ক্রেডিট: " + OWNER_CREDIT;
const footer = () => "\n\n🔰 Credit: " + OWNER_CREDIT;

module.exports.config = {
  name: "cricket",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "ক্রিকেট লাইভ স্কোর ও রেজাল্ট (ESPNcricinfo)",
  usePrefix: true,
  commandCategory: "other",
  usages: "cricket [live | recent | all]",
  cooldowns: 10,
  dependencies: { axios: "" }
};

const API = "https://hs-consumer-api.espncricinfo.com/v1/pages/matches/current?lang=en&latest=true";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36",
  Accept: "application/json",
  Referer: "https://www.espncricinfo.com/",
  Origin: "https://www.espncricinfo.com",
  "Accept-Language": "en-US,en;q=0.9"
};
const MAX_LIST = 8;
const REPLY_TIMEOUT = 2 * 60 * 1000;

/* ---------- helpers ---------- */

// রেসপন্স যেভাবেই আসুক, ম্যাচের অ্যারে খুঁজে বের করে
function findMatches(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.matches)) return data.matches;
  if (data.content && Array.isArray(data.content.matches)) return data.content.matches;
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (v && typeof v === "object") {
      const found = findMatches(v);
      if (found.length) return found;
    }
  }
  return [];
}

const stateOf = (m) => String(m.state || "").toUpperCase(); // LIVE / PRE / POST

function teamLine(t) {
  const name = (t.team && (t.team.name || t.team.longName || t.team.abbreviation)) || "Team";
  const score = t.score ? String(t.score) : "—";
  let info = "";
  if (t.scoreInfo) {
    const pi = parseInfo(t.scoreInfo);
    info = pi.overs !== null
      ? ` (${pi.overs}${pi.maxOvers ? "/" + pi.maxOvers : ""} ov${pi.target ? ", T:" + pi.target : ""})`
      : ` (${t.scoreInfo})`;
  }
  return `${name}: ${score}${info}`;
}

function matchTitle(m) {
  const teams = (m.teams || []).map((t) => (t.team && (t.team.abbreviation || t.team.name)) || "?");
  const vs = teams.length >= 2 ? `${teams[0]} vs ${teams[1]}` : m.title || "Match";
  return m.title && teams.length >= 2 && !/vs/i.test(m.title) ? `${vs} (${m.title})` : vs;
}

function badge(m) {
  const s = stateOf(m);
  if (s === "LIVE") return "🔴 LIVE";
  if (s === "POST") return "✅ শেষ";
  return "🕒 আসছে";
}

/* ---------- রান / বল / ওভার হিসাব ---------- */

function parseRuns(score) {
  const m = String(score || "").match(/(\d+)(?:\/(\d+))?/);
  return m ? { runs: +m[1], wkts: m[2] !== undefined ? +m[2] : 10 } : null;
}

// "15.2/20 ov, T:157" বা "(15.2/20 ov, T:157)" থেকে ওভার, মোট ওভার, টার্গেট
function parseInfo(info) {
  const s = String(info || "");
  const ov = s.match(/(\d+(?:\.\d)?)\s*(?:\/\s*(\d+))?\s*(?:ov|$)/i) || s.match(/(\d+(?:\.\d)?)(?:\/(\d+))?/);
  const tg = s.match(/T\s*:\s*(\d+)/i);
  return {
    overs: ov ? parseFloat(ov[1]) : null,
    maxOvers: ov && ov[2] ? +ov[2] : null,
    target: tg ? +tg[1] : null
  };
}

const oversToBalls = (o) => Math.floor(o) * 6 + Math.round((o - Math.floor(o)) * 10);
const ballsToOvers = (b) => Math.floor(b / 6) + "." + (b % 6);

function formatOvers(m) {
  const f = String(m.format || m.class || "").toUpperCase();
  if (/T20|IT20|WT20/.test(f)) return 20;
  if (/T10/.test(f)) return 10;
  if (/ODI|WODI|LISTA/.test(f)) return 50;
  return null; // টেস্ট/ফার্স্ট-ক্লাস: ওভার লিমিট নেই
}

function liveBlock(m) {
  const teams = m.teams || [];
  const out = [];
  teams.forEach((t) => {
    const r = parseRuns(t.score);
    if (!r) return;
    const inf = parseInfo(t.scoreInfo);
    if (inf.overs === null) return;
    const name = (t.team && (t.team.abbreviation || t.team.name)) || "Team";
    const balls = oversToBalls(inf.overs);
    const limit = inf.maxOvers || formatOvers(m);
    out.push(`📊 ${name}`);
    out.push(`🏃 রান: ${r.runs}/${r.wkts}`);
    out.push(`🔴 বল খেলা হয়েছে: ${balls}  (${ballsToOvers(balls)} ওভার)`);
    if (balls > 0) out.push(`📈 রান রেট (CRR): ${(r.runs * 6 / balls).toFixed(2)}`);
    const finished = r.wkts >= 10 || (limit && balls >= limit * 6);
    if (finished) {
      out.push("✅ ইনিংস শেষ");
    } else if (limit) {
      const left = Math.max(limit * 6 - balls, 0);
      out.push(`⏳ বাকি ওভার: ${ballsToOvers(left)}  (বাকি বল: ${left})`);
      out.push(`🧤 হাতে উইকেট: ${Math.max(10 - r.wkts, 0)}`);
      let target = inf.target;
      let need = null;
      const st = String(m.statusText || m.status || "");
      const nm = st.match(/(.+?)\s+need\s+(\d+)\s+runs?/i);
      const tn = t.team || {};
      const mine = nm && [tn.name, tn.longName, tn.abbreviation].filter(Boolean)
        .some((x) => nm[1].toLowerCase().includes(String(x).toLowerCase()));
      if (mine) need = +nm[2];
      if (target && need === null) need = Math.max(target - r.runs, 0);
      if (target || need !== null) {
        if (!target && need !== null) target = r.runs + need;
        out.push(`🎯 টার্গেট: ${target}  |  দরকার: ${need} রান`);
        if (left > 0 && need > 0) out.push(`🔥 দরকারি রান রেট (RRR): ${(need * 6 / left).toFixed(2)}`);
      }
    }
    out.push("");
  });
  return out;
}

function detailText(m) {
  const lines = [];
  lines.push(`🏏 ${matchTitle(m)}  ${badge(m)}`);
  if (m.series && m.series.name) lines.push(`🏆 ${m.series.name}`);
  const fmt = m.format || m.class;
  if (fmt) lines.push(`📋 ফরম্যাট: ${fmt}`);
  if (m.ground && (m.ground.name || m.ground.longName)) {
    const g = m.ground;
    lines.push(`📍 ${g.name || g.longName}${g.town && g.town.name ? ", " + g.town.name : ""}`);
  }
  lines.push("");
  (m.teams || []).forEach((t) => lines.push(teamLine(t)));
  const status = m.statusText || m.status || "";
  if (status) lines.push("", `📢 ${status}`);
  const live = liveBlock(m);
  if (live.length) lines.push("", "━━━━━━━━━━━━━━", ...live);
  return lines.join("\n") + footer();
}

async function fetchMatches() {
  const res = await axios.get(API, { headers: HEADERS, timeout: 15000 });
  return findMatches(res.data);
}

const RSS = "https://static.cricinfo.com/rss/livescores.xml";

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .trim();
}

// ব্যাকআপ সোর্স: Cricinfo-র লাইভ স্কোর RSS (শুধু টাইটেল লাইন)
async function fetchRssLines() {
  const res = await axios.get(RSS, { headers: HEADERS, timeout: 15000, responseType: "text" });
  const items = String(res.data).match(/<item>[\s\S]*?<\/item>/g) || [];
  return items
    .map((it) => ({
      title: decode((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1]),
      link: decode((it.match(/<link>([\s\S]*?)<\/link>/) || [])[1])
    }))
    .filter((x) => x.title);
}

// RSS টাইটেল ("Pakistan 434/9 v Sri Lanka 404/4 *") থেকে বিস্তারিত বানায়
function rssDetail(item) {
  const parts = item.title.split(/\s+v\s+/);
  const lines = ["🏏 ম্যাচের তথ্য", "━━━━━━━━━━━━━━"];
  const batting = /\*\s*$/.test(item.title);
  parts.forEach((p) => lines.push("▪️ " + p.replace(/\s*\*\s*$/, "").trim()));
  const hasScore = /\d+\/\d+|\d{2,}/.test(item.title);
  lines.push("", hasScore ? "🔴 ম্যাচ চলছে / সদ্য খেলা হয়েছে" : "🕒 ম্যাচ এখনো শুরু হয়নি");
  if (batting) lines.push("ℹ️ * চিহ্ন = যে দল এখন ব্যাট করছে");
  if (item.link) lines.push("", "🔗 পূর্ণ স্কোরকার্ড: " + item.link);
  lines.push("", "⚠️ রান/ওভারের বিস্তারিত এই ব্যাকআপ সোর্সে নেই");
  return lines.join("\n") + footer();
}

function errReason(e) {
  if (e && e.response) return "HTTP " + e.response.status;
  if (e && e.code) return e.code;
  return (e && e.message) || "unknown";
}

/* ---------- run ---------- */

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!creditOk()) return api.sendMessage(LOCK_MSG, threadID, messageID);
  const mode = (args[0] || "live").toLowerCase();

  let matches;
  let primaryErr = null;
  try {
    matches = await fetchMatches();
  } catch (e) {
    primaryErr = e;
    console.log("[cricket] primary API failed:", errReason(e));
  }

  // মূল সোর্স ফেল করলে RSS ব্যাকআপ
  if (primaryErr) {
    try {
      const lines = await fetchRssLines();
      if (!lines.length) {
        return api.sendMessage("😕 এই মুহূর্তে কোনো ম্যাচের তথ্য পাওয়া যায়নি।", threadID, messageID);
      }
      const list = lines.slice(0, 12);
      const shown = list.map((l, i) => `${i + 1}. ${l.title}`).join("\n");
      return api.sendMessage(
        `🏏 ক্রিকেট স্কোর (ব্যাকআপ সোর্স)\n━━━━━━━━━━━━━━\n${shown}\n━━━━━━━━━━━━━━\n💬 বিস্তারিতের জন্য নম্বর লিখে রিপ্লাই দিন`,
        threadID,
        (err, info) => {
          if (err || !info) return;
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            rss: list
          });
          setTimeout(() => {
            const i = global.client.handleReply.findIndex((h) => h.messageID === info.messageID);
            if (i !== -1) global.client.handleReply.splice(i, 1);
          }, REPLY_TIMEOUT);
        },
        messageID
      );
    } catch (e2) {
      console.log("[cricket] RSS fallback failed:", errReason(e2));
      return api.sendMessage(
        `❌ স্কোর আনা যায়নি।\n🔎 কারণ: মূল সোর্স = ${errReason(primaryErr)}, ব্যাকআপ = ${errReason(e2)}\n(এই কোডগুলো আমাকে পাঠালে ঠিক করে দিতে পারব)`,
        threadID,
        messageID
      );
    }
  }

  if (!matches.length) {
    return api.sendMessage("😕 এই মুহূর্তে কোনো ম্যাচের তথ্য পাওয়া যায়নি।", threadID, messageID);
  }

  let list;
  if (mode === "all") list = matches;
  else if (mode === "recent") list = matches.filter((m) => stateOf(m) === "POST");
  else list = matches.filter((m) => stateOf(m) === "LIVE");

  if (!list.length) {
    const label = mode === "recent" ? "সম্প্রতি শেষ হওয়া" : "চলমান";
    return api.sendMessage(
      `😴 এখন কোনো ${label} ম্যাচ নেই।\n\n💡 অন্য অপশন:\n➤ cricket recent  (শেষ হওয়া ম্যাচ)\n➤ cricket all  (সব ম্যাচ)`,
      threadID,
      messageID
    );
  }

  list = list.slice(0, MAX_LIST);

  let body = `🏏 ক্রিকেট ${mode === "recent" ? "রেজাল্ট" : mode === "all" ? "ম্যাচ লিস্ট" : "লাইভ স্কোর"}\n━━━━━━━━━━━━━━\n`;
  list.forEach((m, i) => {
    const t = m.teams || [];
    body += `\n${i + 1}. ${matchTitle(m)}  ${badge(m)}\n`;
    t.forEach((x) => (body += `   ${teamLine(x)}\n`));
    if (m.statusText || m.status) body += `   📢 ${m.statusText || m.status}\n`;
  });
  body += `\n━━━━━━━━━━━━━━\n💬 বিস্তারিত দেখতে এই মেসেজে নম্বর লিখে রিপ্লাই দিন (১-${list.length})`;

  return api.sendMessage(body, threadID, (err, info) => {
    if (err || !info) return;
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: senderID,
      matches: list
    });
    setTimeout(() => {
      const i = global.client.handleReply.findIndex((h) => h.messageID === info.messageID);
      if (i !== -1) global.client.handleReply.splice(i, 1);
    }, REPLY_TIMEOUT);
  }, messageID);
};

/* ---------- reply: নম্বর দিলে বিস্তারিত ---------- */

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (!creditOk()) return api.sendMessage(LOCK_MSG, threadID, messageID);
  if (senderID !== handleReply.author) return;

  // বাংলা সংখ্যা → ইংরেজি
  const bn = "০১২৩৪৫৬৭৮৯";
  const num = parseInt(
    String(body || "").trim().replace(/[০-৯]/g, (d) => bn.indexOf(d)),
    10
  );
  if (handleReply.rss) {
    const it = handleReply.rss[num - 1];
    if (!it) {
      return api.sendMessage(`⚠️ ১ থেকে ${handleReply.rss.length}-এর মধ্যে একটা নম্বর দিন।`, threadID, messageID);
    }
    return api.sendMessage(rssDetail(it), threadID, messageID);
  }
  const m = handleReply.matches[num - 1];
  if (!m) {
    return api.sendMessage(`⚠️ ১ থেকে ${handleReply.matches.length}-এর মধ্যে একটা নম্বর দিন।`, threadID, messageID);
  }
  return api.sendMessage(detailText(m), threadID, messageID);
};
