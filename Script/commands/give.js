/*
 ⚠️ WARNING: CREDIT LOCKED
 Credit change korle ba kono AI diye edit korle command kaj korbe na.
*/

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const https = require("https");

const agent = new https.Agent({ rejectUnauthorized: false });

const OWNER = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const LOCK = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

function creditOk() {
  try {
    return sha(OWNER) === LOCK && sha(module.exports.config.credits) === LOCK;
  } catch {
    return false;
  }
}

module.exports.config = {
  name: "give",
  version: "4.3.0",
  hasPermssion: 2,
  credits: "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐",
  description: "2-step upload UI (animation → file info)",
  commandCategory: "utility",
  usages: "[filename]",
  cooldowns: 5
};

// credit বদলালে কমান্ড লোডই হবে না
module.exports.onLoad = function () {
  if (!creditOk()) {
    throw new Error("⛔ Credit changed! Command locked.");
  }
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// একাধিক সার্ভিসে আপলোড (একটা ব্যর্থ হলে পরেরটা চেষ্টা করবে)
async function uploadPaste(text) {
  const errors = [];

  // ১) dpaste.org
  try {
    const params = new URLSearchParams({
      content: text,
      syntax: "js",
      expiry_days: "365"
    });
    const res = await axios.post("https://dpaste.org/api/", params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
        "User-Agent": UA
      },
      httpsAgent: agent,
      responseType: "text",
      timeout: 20000
    });
    const url = String(res.data).trim().replace(/^"|"$/g, "");
    if (/^https?:\/\//.test(url)) return url + "/raw";
  } catch (e) {
    errors.push("dpaste.org: " + e.message);
  }

  // ২) dpaste.com
  try {
    const params = new URLSearchParams({
      content: text,
      syntax: "js",
      expiry_days: "365"
    });
    const res = await axios.post("https://dpaste.com/api/v2/", params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
        "User-Agent": UA
      },
      httpsAgent: agent,
      responseType: "text",
      timeout: 20000
    });
    const url = String(res.data).trim();
    if (/^https?:\/\//.test(url)) return url + ".txt";
  } catch (e) {
    errors.push("dpaste.com: " + e.message);
  }

  // ৩) paste.rs (সরাসরি raw লিংক দেয়)
  try {
    const res = await axios.post("https://paste.rs/", Buffer.from(text, "utf8"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Accept": "*/*",
        "User-Agent": UA
      },
      httpsAgent: agent,
      transformRequest: [(d) => d],
      responseType: "text",
      timeout: 20000
    });
    const url = String(res.data).trim();
    if (/^https?:\/\//.test(url)) return url;
  } catch (e) {
    errors.push("paste.rs: " + e.message);
  }

  // ৪) hst.sh
  try {
    const res = await axios.post("https://hst.sh/documents", text, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "User-Agent": UA },
      httpsAgent: agent,
      timeout: 20000
    });
    if (res.data && res.data.key) return "https://hst.sh/raw/" + res.data.key;
  } catch (e) {
    errors.push("hst.sh: " + e.message);
  }

  throw new Error("সব আপলোড ব্যর্থ → " + errors.join(" | "));
}

module.exports.run = async function ({ api, event, args }) {
  if (!creditOk()) {
    return api.sendMessage("⛔ Credit changed! Command locked.", event.threadID);
  }

  if (!args[0]) {
    return api.sendMessage("❌ ফাইল নাম দাও", event.threadID);
  }

  const fileName = args[0];
  const commandsPath = path.join(__dirname, "..", "commands");

  const filePath1 = path.join(commandsPath, fileName);
  const filePath2 = path.join(commandsPath, fileName + ".js");

  let fileToRead;
  if (fs.existsSync(filePath1)) fileToRead = filePath1;
  else if (fs.existsSync(filePath2)) fileToRead = filePath2;
  else return api.sendMessage("❌ ফাইল পাওয়া যায়নি", event.threadID);

  try {
    const data = fs.readFileSync(fileToRead, "utf8");

    // যে ফাইলটা দেওয়া হচ্ছে তার config
    let c = {};
    try {
      delete require.cache[require.resolve(fileToRead)];
      c = require(fileToRead).config || {};
    } catch {}

    const stats = fs.statSync(fileToRead);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const lines = data.split("\n").length;

    // আপলোড (কোনো অ্যানিমেশন নেই)
    let link = null;
    try {
      link = await uploadPaste(data);
    } catch (e) {
      console.error(e.message);
    }

    // ফ্রেমে: লিংক + ফাইলের নাম, ক্রেডিট, ভার্সন; নিচে আমার ক্রেডিট
    const fileInfo =
`╔════════════════════════╗
║ 📄 FILE INFO
╠════════════════════════╣
║ 📌 Name : ${c.name || fileName}
║ ⚙️ Version : ${c.version || "1.0.0"}
║ 📊 Size : ${sizeKB} KB
║ 📜 Lines : ${lines}
╠════════════════════════╣
║ 🔗 LINK:
║ ${link || "Upload failed – ফাইল নিচে attach করা হলো"}
╠════════════════════════╣
║ 👑 Made By : ${OWNER}
╚════════════════════════╝`;

    if (!link) {
      return api.sendMessage(
        { body: fileInfo, attachment: fs.createReadStream(fileToRead) },
        event.threadID
      );
    }
    return api.sendMessage(fileInfo, event.threadID);
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ ERROR: " + err.message, event.threadID);
  }
};
