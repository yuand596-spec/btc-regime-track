# 币市罗盘 · 公开战绩日志

BTC/ETH 市场状态四轴判定模型的**逐日判定与结算**公开存证。每天冻结一条,经哈希链 + Ed25519 签名,
并由每日提交打上 GitHub 时间戳(外部时间锚定)。命中与未命中全部保留,绝不删改。

## 独立验证(任何人)
```bash
node verify.js BTC   # ✅ 通过 / ❌ 检测到篡改
node verify.js ETH
```
改动任一天记录 → 哈希链断裂或验签失败,立即暴露。

- `track_log_btc.json` / `track_log_eth.json`:逐日判定 + 到期自动结算(30/90天前向收益、命中判定)
- `track_pubkey.json`:验证签名用的 Ed25519 公钥
- 网站:https://btc-market-regime.pulsedesk596.workers.dev/track
