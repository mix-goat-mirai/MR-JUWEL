/**
 * Credit: 乛 M𝆠፝֟R ཐི༏ཋྀ JU𝆠፝֟W𝆠፝֟ELꜛཐི༏ཋྀ࿐
 *
 * JuwelKeepalive.js — Juwel.js-এর একদম প্রথম লাইনে শুধু এটা যোগ করুন:
 *
 *     require("./JuwelKeepalive");
 *
 * কাজ (সব অটো):
 *  - Render-এর PORT-এ ছোট health সার্ভার তোলে
 *  - বটের (Main.js) জন্য PORT এক ধাপ সরিয়ে দেয়, যাতে পোর্ট নিয়ে কনফ্লিক্ট না হয়
 *  - RENDER_EXTERNAL_URL থেকে নিজের লিংক নিয়ে প্রতি ৪ মিনিটে পিং করে
 */

const https = require("https");
const http = require("http");

if (!global.__juwelKeepAlive) {
  global.__juwelKeepAlive = true;

  const PORT = Number(process.env.PORT) || 3000;
  const INTERVAL_MS = Number(process.env.KEEPALIVE_INTERVAL_MS) || 4 * 60 * 1000;
  const TARGET = (process.env.KEEPALIVE_URL || process.env.RENDER_EXTERNAL_URL || "").trim();

  // ---- স্ট্যাটাস UI: আপটাইম কিপারের সেভ করা ফাইল থেকে পড়ে ----
  const fs = require("fs");
  const path = require("path");
  const STATE_FILE = path.join(
    process.env.UPTIME_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.RENDER_DISK_PATH ||
      path.join(__dirname, "Script", "commands", "cache"),
    "uptime_state.json"
  );
  function readStatus() {
    const now = Date.now();
    let s = null;
    try { s = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch (_) {}
    const online = !!(s && now - Number(s.lastAlive) < 60 * 1000);
    return {
      online,
      startedAt: s ? Number(s.startedAt) || 0 : 0,
      lastAlive: s ? Number(s.lastAlive) || 0 : 0,
      restored: !!(s && s.restored),
      store: (s && s.store) || "-",
      now
    };
  }
  const STATUS_HTML = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>MR JUWEL • Uptime</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;color:#fff;
font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
background:radial-gradient(circle at top left,rgba(139,92,246,.35),transparent 35%),radial-gradient(circle at bottom right,rgba(59,130,246,.25),transparent 35%),linear-gradient(135deg,#0f0c29,#302b63,#24243e)}
.card{width:100%;max-width:420px;padding:26px;border-radius:26px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 25px 70px rgba(0,0,0,.35);text-align:center}
h1{font-size:15px;letter-spacing:2px;opacity:.85;margin-bottom:16px}
.badge{display:inline-flex;align-items:center;gap:8px;padding:7px 16px;border-radius:99px;font-size:13px;font-weight:700;background:rgba(255,255,255,.1)}
.dot{width:10px;height:10px;border-radius:50%;background:#888}
.on .dot{background:#22e07a;box-shadow:0 0 12px #22e07a;animation:p 1.6s infinite}
.off .dot{background:#ff4d6d;box-shadow:0 0 12px #ff4d6d}
@keyframes p{50%{opacity:.35}}
.time{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}
.box{padding:14px 4px;border-radius:16px;background:rgba(0,0,0,.25)}
.num{font-size:28px;font-weight:800;font-family:ui-monospace,Menlo,Consolas,monospace}
.lbl{font-size:11px;opacity:.65;margin-top:4px}
.row{display:flex;justify-content:space-between;font-size:13px;padding:10px 4px;border-top:1px solid rgba(255,255,255,.1)}
.row span:first-child{opacity:.65}
.ft{margin-top:14px;font-size:11px;opacity:.5}
</style></head><body><div class="card">
<h1>⏱ UPTIME KEEPER</h1>
<div id="b" class="badge off"><i class="dot"></i><span id="bt">লোড হচ্ছে…</span></div>
<div class="time">
<div class="box"><div class="num" id="d">0</div><div class="lbl">দিন</div></div>
<div class="box"><div class="num" id="h">00</div><div class="lbl">ঘণ্টা</div></div>
<div class="box"><div class="num" id="m">00</div><div class="lbl">মিনিট</div></div>
<div class="box"><div class="num" id="s">00</div><div class="lbl">সেকেন্ড</div></div>
</div>
<div class="row"><span>চালু হয়েছে</span><span id="st">-</span></div>
<div class="row"><span>সেভ হচ্ছে</span><span id="sv">-</span></div>
<div class="row"><span>আগের আপটাইম</span><span id="rs">-</span></div>
<div class="ft">MR JUWEL</div></div>
<script>
var D={online:false,startedAt:0,now:Date.now()},off=0;
function p(n){return String(n).padStart(2,"0")}
function tick(){
 var up=D.online&&D.startedAt?Math.max(0,Math.floor((Date.now()+off-D.startedAt)/1000)):0;
 d.textContent=Math.floor(up/86400);h.textContent=p(Math.floor(up%86400/3600));
 m.textContent=p(Math.floor(up%3600/60));s.textContent=p(up%60);
}
function load(){fetch("/api/status",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
 D=j;off=j.now-Date.now();
 b.className="badge "+(j.online?"on":"off");bt.textContent=j.online?"অনলাইন":"অফলাইন";
 st.textContent=j.startedAt?new Date(j.startedAt).toLocaleString("bn-BD"):"-";
 sv.textContent=j.store;rs.textContent=j.restored?"ধরে রাখা হয়েছে ✅":"নতুন শুরু";
}).catch(function(){b.className="badge off";bt.textContent="সংযোগ নেই"})}
load();setInterval(load,10000);setInterval(tick,1000);tick();
</script></body></html>`;

  // health সার্ভার: Render এই পোর্টই চেক করে
  const server = http.createServer((req, res) => {
    const url = (req.url || "/").split("?")[0];
    if (url === "/api/status") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(JSON.stringify(readStatus()));
    }
    if (url === "/" || url === "/status") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(STATUS_HTML);
    }
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bot is alive");
  });
  server.on("error", (e) => console.log(`[KEEPALIVE] server error: ${e.message}`));
  server.listen(PORT, "0.0.0.0", () => console.log(`[KEEPALIVE] health সার্ভার চালু, পোর্ট ${PORT}`));

  // Main.js (child) যদি নিজের সার্ভার চালায়, সে যেন অন্য পোর্ট পায়
  process.env.KEEPALIVE_PORT = String(PORT);
  process.env.PORT = String(PORT + 1);

  function ping(url) {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { timeout: 20000, headers: { "User-Agent": "self-keepalive" } }, (res) => {
      res.resume();
      console.log(`[KEEPALIVE] ${new Date().toISOString()} -> ${url} (${res.statusCode})`);
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e) => console.log(`[KEEPALIVE] ping failed: ${e.message}`));
  }

  if (!TARGET) {
    console.log("[KEEPALIVE] RENDER_EXTERNAL_URL নেই (লোকাল রান?), পিং বন্ধ।");
  } else {
    console.log(`[KEEPALIVE] চালু: ${TARGET} প্রতি ${Math.round(INTERVAL_MS / 60000)} মিনিটে পিং`);
    setTimeout(() => {
      ping(TARGET);
      setInterval(() => ping(TARGET), INTERVAL_MS);
    }, 30 * 1000);
  }
                          }
