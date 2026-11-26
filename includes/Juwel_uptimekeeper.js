// ══════════════════════════════════════════════
// Credit : 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
// includes/Juwel_uptimekeeper.js — রিডিপ্লয়/কোড এডিটে আপটাইম ধরে রাখে
//
//  • প্রতি ১৫ সেকেন্ডে "এখনও বেঁচে আছি" (lastAlive) সময় সেভ করে
//  • বট নতুন করে চালু হলে: শেষ lastAlive যদি GRACE সময়ের (ডিফল্ট ৫ মিনিট) ভেতরে হয়
//    → আগের আপটাইম চলতে থাকে (গিটহাবে কোড এডিট → রিডিপ্লয় হলে এটাই হয়)
//  • lastAlive অনেক পুরনো হলে (বট আসলেই বন্ধ ছিল) → আপটাইম নতুন করে শুরু
//  • process.uptime() এখান থেকেই হিসাব হয়, তাই uptime/up2/upt/menu/info সব ঠিক দেখাবে
//
// কোথায় সেভ হয় (অগ্রাধিকার):
//   ১) UPTIME_DIR                       — নিজে ফোল্ডার ঠিক করলে
//   ২) RAILWAY_VOLUME_MOUNT_PATH        — Railway Volume যোগ করলে অটো সেট হয়
//   ৩) RENDER_DISK_PATH                 — Render Disk
//   ৪) UPSTASH_REDIS_REST_URL + _TOKEN  — ফ্রি Redis (Volume ছাড়া রিডিপ্লয়েও টিকে থাকে)
//   ৫) Script/commands/cache            — শুধু একই কন্টেইনারে রিস্টার্টে টিকে (রিডিপ্লয়ে না)
//
// ENV: UPTIME_GRACE_MIN (ডিফল্ট 5)
// ══════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CREDIT = "乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐";
const CREDIT_HASH = "8f74924e81a157abaf089d90717e48a4949617a7379d20a2df567cb0ab0dad81";
const sha = (s) => crypto.createHash("sha256").update(String(s == null ? "" : s).normalize("NFC")).digest("hex");

// ক্রেডিট ঠিক আছে কিনা: কনস্ট্যান্টের হ্যাশ মিলতে হবে + ফাইলের হেডারেও ক্রেডিট থাকতে হবে
function creditOk() {
  try {
    if (sha(CREDIT) !== CREDIT_HASH) return false;
    const src = fs.readFileSync(__filename, "utf8");
    return src.split(CREDIT).length - 1 >= 2;
  } catch (_) { return false; }
}

if (global.__uptimeKeeper) {
  module.exports = global.__uptimeKeeper;
} else if (!creditOk()) {
  // ক্রেডিট বদলানো হয়েছে → আপটাইম ধরে রাখা বন্ধ (বট ক্র্যাশ করবে না, শুধু এই ফিচার কাজ করবে না)
  console.error("[UPTIME] ⛔ ক্রেডিট পরিবর্তন করা হয়েছে, তাই Uptime Keeper বন্ধ। আসল ক্রেডিট ফিরিয়ে দিন।");
  const _t = Date.now();
  module.exports = global.__uptimeKeeper = {
    getStartedAt: () => _t,
    getUptimeSec: () => (Date.now() - _t) / 1000,
    reset: () => {},
    wasRestored: () => false
  };
} else {
  const GRACE_MS = (Number(process.env.UPTIME_GRACE_MIN) > 0 ? Number(process.env.UPTIME_GRACE_MIN) : 5) * 60 * 1000;
  const BEAT_MS = 15 * 1000;
  const REMOTE_BEAT_MS = 60 * 1000;

  const VOLUME_DIR = process.env.UPTIME_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.RENDER_DISK_PATH || "";
  const DIR = VOLUME_DIR || path.join(__dirname, "..", "Script", "commands", "cache");
  const FILE = path.join(DIR, "uptime_state.json");

  const REDIS_URL = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/+$/, "");
  const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  const REDIS_KEY = "bot:uptime_state";
  const useRedis = !!(REDIS_URL && REDIS_TOKEN);

  let startedAt = Date.now();
  let remoteReady = !useRedis; // Redis থেকে পুরনো মান পড়া শেষ না হওয়া পর্যন্ত Redis-এ লিখব না
  let lastRemoteBeat = 0;

  const isFresh = (s) => {
    if (!s) return false;
    const now = Date.now();
    const a = Number(s.startedAt), b = Number(s.lastAlive);
    return a > 0 && b > 0 && a <= now + 60000 && now - b <= GRACE_MS;
  };

  // ---- সিঙ্ক: লোকাল ফাইল থেকে পড়া ----
  let restored = false;
  try {
    const s = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (isFresh(s)) { startedAt = Number(s.startedAt); restored = true; }
  } catch (_) {}

  function snapshot() { return JSON.stringify({ startedAt, lastAlive: Date.now() }); }

  function writeLocal() {
    try {
      fs.mkdirSync(DIR, { recursive: true });
      fs.writeFileSync(FILE, snapshot());
    } catch (_) {}
  }

  function redis(cmd) {
    const axios = require("axios");
    return axios.post(REDIS_URL, cmd, {
      headers: { Authorization: "Bearer " + REDIS_TOKEN },
      timeout: 8000
    }).then((r) => r.data && r.data.result);
  }

  function writeRemote() {
    if (!useRedis || !remoteReady) return;
    lastRemoteBeat = Date.now();
    redis(["SET", REDIS_KEY, snapshot()]).catch(() => {});
  }

  // ---- Redis থেকে পড়া (অ্যাসিঙ্ক) ----
  if (useRedis) {
    redis(["GET", REDIS_KEY]).then((v) => {
      try {
        const s = v ? JSON.parse(v) : null;
        if (isFresh(s) && (!restored || Number(s.startedAt) < startedAt)) {
          startedAt = Number(s.startedAt);
          restored = true;
        }
      } catch (_) {}
    }).catch((e) => {
      console.log("[UPTIME] Redis পড়া যায়নি: " + (e && e.message));
    }).then(() => {
      remoteReady = true;
      writeLocal();
      writeRemote();
    });
  }

  function beat() {
    writeLocal();
    if (useRedis && Date.now() - lastRemoteBeat >= REMOTE_BEAT_MS) writeRemote();
  }

  function reset(ts) {
    startedAt = ts || Date.now();
    beat();
    if (useRedis) { lastRemoteBeat = 0; writeRemote(); }
  }

  writeLocal();
  setInterval(beat, BEAT_MS).unref();
  process.on("exit", () => { try { writeLocal(); } catch (_) {} });

  // process.uptime() এখন থেকে এই হিসাবে চলবে
  process.uptime = () => (Date.now() - startedAt) / 1000;
  process.__powerUptimePatched = true;

  const persistent = !!VOLUME_DIR || useRedis;
  const ago = () => Math.round((Date.now() - startedAt) / 1000);
  console.log(
    "[UPTIME] " + (restored ? "আগের আপটাইম ধরে রাখা হয়েছে (" + ago() + "s)" : "নতুন আপটাইম শুরু") +
    " | সেভ: " + (useRedis ? "Redis" : DIR) +
    (persistent ? "" : " | ⚠️ রিডিপ্লয়ে টিকবে না — Railway Volume বা UPSTASH_REDIS যোগ করুন")
  );

  // Railway-তে Volume না থাকলে লগে সহজ ধাপ দেখানো (ইউজাররা যাতে নিজেরাই ঠিক করতে পারে)
  if (!persistent && (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)) {
    console.log(
      "\n[UPTIME] ⚠️ Volume যোগ করা নেই, তাই গিটহাবে কোড এডিট করলে আপটাইম নতুন করে শুরু হবে।\n" +
      "[UPTIME] ঠিক করার সহজ উপায় (একবারই করতে হবে):\n" +
      "[UPTIME]   1) Railway প্রজেক্ট পেজের নিচের ডানের বেগুনি বোতাম চাপুন\n" +
      "[UPTIME]   2) সার্চ বক্সে এই লেখাটা বসিয়ে Enter/Go চাপুন:\n" +
      "[UPTIME]        Attach a volume to my service with mount path /data\n" +
      "[UPTIME]   3) Railway নিজে রিডিপ্লয় দেবে। এরপর লগে \"সেভ: /data\" দেখা যাবে।\n"
    );
  }

  module.exports = global.__uptimeKeeper = {
    getStartedAt: () => startedAt,
    getUptimeSec: () => (Date.now() - startedAt) / 1000,
    reset,
    wasRestored: () => restored
  };
}
