/* 战绩日志验证器:重算哈希链 + 逐条验签。任何一条被改动 → 链断或验签失败。
   用法:node track/verify.js <BTC|ETH> [--tamper]   (--tamper 演示篡改后如何被发现) */
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const coin = (process.argv[2] || "BTC").toUpperCase();
const tamper = process.argv.includes("--tamper");
const log = JSON.parse(fs.readFileSync(path.join(ROOT, `track_log_${coin.toLowerCase()}.json`), "utf8"));
const pub = JSON.parse(fs.readFileSync(path.join(ROOT, "track_pubkey.json"), "utf8"));
const pubKey = crypto.createPublicKey(pub.pubkey);
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
// 与 daily_freeze.js 一致的递归稳定序列化
function canon(o) {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canon).join(",") + "]";
  return "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + canon(o[k])).join(",") + "}";
}

const entries = log.entries;
if (tamper && entries.length) { entries[0].price = entries[0].price * 1.5; console.log(`⚠️  演示:把第 1 条(${entries[0].date})价格偷改高 50%\n`); }

let prev = "0".repeat(64), ok = true, chainBreak = -1, sigFail = -1;
for (let k = 0; k < entries.length; k++) {
  const e = entries[k];
  const { prevHash, hash, sig, outcome, ...core } = e;   // 哈希只覆盖 core(outcome 为事后追加,不入链)
  const h = sha(canon(core) + prev);
  if (h !== hash) { ok = false; if (chainBreak < 0) chainBreak = k; }
  if (prevHash !== prev) { ok = false; if (chainBreak < 0) chainBreak = k; }
  try { if (!crypto.verify(null, Buffer.from(hash), pubKey, Buffer.from(sig, "base64"))) { ok = false; if (sigFail < 0) sigFail = k; } }
  catch { ok = false; if (sigFail < 0) sigFail = k; }
  prev = hash;
}

console.log(`验证 ${coin} 日志:${entries.length} 条,genesis ${log.genesis},链头 ${log.head?.slice(0, 16)}…`);
if (ok) console.log("✅ 通过:哈希链完整、全部验签成功、未被篡改。");
else {
  console.log("❌ 失败:检测到篡改!");
  if (chainBreak >= 0) console.log(`   哈希链在第 ${chainBreak + 1} 条(${entries[chainBreak].date})断裂`);
  if (sigFail >= 0) console.log(`   第 ${sigFail + 1} 条验签失败`);
}
