<div align="center">

# 🔮 Crypto Sentiment Oracle v2

**Multi-timeframe, on-chain crypto sentiment — analyzed and judged entirely by GenLayer AI validators**

**🎮 Deployed Contract:** [`0xBf0613De3880d39b07f5eb02c3a0771C70b05c6E`](https://explorer-studio.genlayer.com/address/0xBf0613De3880d39b07f5eb02c3a0771C70b05c6E) on GenLayer Studionet

</div>

---

## What's new in v2

This is a rebuild of the original Crypto Sentiment Oracle, focused on three things: richer data, a more reliable architecture, and a smoother experience.

### 1. Richer market data, not just one number
The original contract asked the LLM to judge sentiment from a single 24h price-change figure. v2 fetches a full market snapshot from CoinGecko's `/coins/markets` endpoint and hands the AI:
- Current price, market cap, and market cap rank
- 24h trading volume
- **24h, 7d, and 30d price change** — so a coin that dipped today but is up strongly over the month isn't misjudged as Bearish
- Distance from all-time high
- Circulating supply

The AI is explicitly prompted to weigh all timeframes together, not just react to the most recent 24 hours.

### 2. A confidence score and a headline, not just one word
Each verdict now comes with:
- **Bullish / Bearish / Neutral** (kept as a strict enum — free-form verdicts are far less likely to reach validator consensus)
- A **0–100 confidence score**
- A punchy one-line **headline**
- A **reasoning** sentence that cites the actual numbers, not a generic statement

### 3. An on-chain history feed
Every analysis is stored as its own permanent record (not overwritten by the next one), so the contract can serve:
- `get_recent_analyses(limit)` — a live feed of the last N analyses from *any* user, shown on the homepage as "Recent Activity"
- `get_latest_for_coin(coin)` — the most recent result for a specific coin
- `get_analysis(id)` — any historical analysis by ID

This turns the app from "one number that gets overwritten" into a small public ledger of AI-judged market calls.

### 4. Rebuilt on the architecture that's actually proven to work
The original app was a Next.js + React app pinned to `genlayer-js@0.7.0`, which cost real debugging time: a missing `studionet` chain export, a branded `Address` type mismatch, and a build that silently failed on Vercel. v2 is plain HTML/JS using `genlayer-js@latest` via CDN plus a small Vercel proxy function — the exact architecture already proven end-to-end on two other GenLayer projects (Bounty Hunter, Truth or Lie), with real on-chain transactions confirmed working.

### 5. A data source that won't silently return garbage
The very first version of this app scraped CoinMarketCap's HTML directly, which is heavily bot-protected — automated fetches almost always got blocked, so every result quietly came back "Neutral" no matter the coin. Both v1's fix and v2 use CoinGecko's public JSON API instead, which is built for exactly this kind of programmatic access.

---

## How It Works

1. **Connect your wallet** — MetaMask, prompts to add/switch to GenLayer Studionet automatically
2. **Pick a coin** — click a trending chip (Bitcoin, Ethereum, Solana, etc.) or type any CoinGecko coin ID
3. **Analyze on-chain** — `analyze_sentiment(coin)` fetches live market data and runs it through GenLayer's AI validators
4. **Consensus via the Equivalence Principle** — fetching the market data and judging it both happen inside one non-deterministic block, checked with a single `prompt_comparative` call, so validators only need to agree on the final structured verdict — not on byte-identical API responses
5. **Result appears** — verdict, confidence, live price/market cap/volume, and multi-timeframe momentum, all pulled from what's actually stored on-chain
6. **It joins the public feed** — anyone loading the app sees the last 10 analyses from all users

---

## Contract Interface

```python
analyze_sentiment(coin: str) -> u256       # write — returns the new analysis's ID
get_analysis(analysis_id: u256) -> str     # view — full JSON record
get_latest_for_coin(coin: str) -> str      # view — most recent result for a coin
get_analysis_count() -> u256               # view — total analyses ever made
get_recent_analyses(limit: u256) -> str    # view — JSON array of the last N analyses
```

Each analysis record:
```json
{
  "id": 42,
  "coin": "bitcoin",
  "requester": "0x...",
  "verdict": "Bullish",
  "confidence": 78,
  "headline": "Strong momentum across all timeframes 🚀",
  "reasoning": "24h up 3.2%, 7d up 11%, 30d up 24%, volume elevated...",
  "price": 68420.5,
  "market_cap": 1348000000000,
  "volume_24h": 32100000000,
  "change_24h": 3.2,
  "change_7d": 11.4,
  "change_30d": 24.1,
  "rank": 1,
  "ath_change_pct": -18.3
}
```

---

## Getting Started

### Deploy the contract
1. Open `sentiment_v2.py` in [GenLayer Studio](https://studio.genlayer.com)
2. Deploy — constructor takes no arguments
3. Copy the deployed contract address

### Run the frontend
No build step, no framework, no `npm install` needed for local use:
```bash
git clone <this-repo>
cd crypto-sentiment-oracle-v2
vercel dev
```
`vercel dev` is needed (not a plain static server) because the app depends on the `/api/rpc` serverless function to avoid browser CORS restrictions when talking to GenLayer Studionet.

---

## How To Test

1. Open the live app and click **Connect Wallet**
2. Paste your deployed contract address and click **Load Contract**
3. Click a trending coin chip (or type any CoinGecko coin ID, e.g. `bitcoin`, `ethereum`, `solana`, `dogecoin`, `chainlink`)
4. Click **⚡ Analyze On-Chain**, confirm in your wallet
5. Wait ~30–90 seconds for validator consensus — a loading indicator shows progress
6. Confirm the result shows real, varied numbers (price, market cap, volume, multi-timeframe % changes) — not the same static output every time
7. Click the transaction link — it should show `GenVM Result: SUCCESS`, `Consensus: Accepted`, `Status: FINALIZED` on the [GenLayer Explorer](https://explorer-studio.genlayer.com/)
8. Analyze a second coin, then refresh — confirm the "Recent Activity" feed shows both

---

## Honesty Note

The contract is deployed and confirmed live on GenLayer Studionet — `GenVM Result: SUCCESS`, `Consensus: Accepted`, `Status: FINALIZED` (see the address link above). Getting a clean deploy took a real debugging round: an earlier version used two `TreeMap` storage fields with distinct, non-repeating type shapes, which triggered a GenVM storage-descriptor error (`Is right the same storage type?`) — this version uses a single `TreeMap` field instead, matching the pattern already proven to work across this project's other contracts.

What's still unverified: the `analyze_sentiment` write flow hasn't been exercised live yet — actual on-chain behavior (consensus timing, CoinGecko rate limits under real use, exact LLM output consistency across validators) can only be confirmed by actually calling it. That's the next thing to test.
