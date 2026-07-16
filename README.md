<div align="center">

# 🔮 Crypto Sentiment Oracle v2

**Multi-timeframe, on-chain crypto sentiment — analyzed and judged entirely by GenLayer AI validators**

⚠️ **The contract was just updated** (added owner tracking + optional CoinGecko API key support), so it needs a fresh deployment — the address below is a placeholder until that happens.

**🎮 Deployed Contract:** `PENDING_REDEPLOY — see GenLayer Explorer for the current address`

</div>

---

Crypto Sentiment Oracle is a decentralized application that uses GenLayer's Intelligent Contracts and AI consensus to analyze real-time cryptocurrency market sentiment — fetching live market data on-chain and returning **Bullish 📈 / Bearish 📉 / Neutral ➡️** verdicts, verified by independent AI validators reaching Byzantine consensus.

No off-chain oracle. No centralized API. The LLM call and the web fetch both happen *inside* the smart contract itself.

## What's new in v2

This is a rebuild of the original Crypto Sentiment Oracle, focused on richer data, a more reliable architecture, and a smoother experience.

### 1. Richer market data, not just one number
The original contract asked the LLM to judge sentiment from a single 24h price-change figure. v2 fetches a full market snapshot from CoinGecko's `/coins/markets` endpoint and hands the AI:
- Current price, market cap, and market cap rank
- 24h trading volume
- **24h, 7d, and 30d price change** — so a coin that dipped today but is up strongly over the month isn't misjudged as Bearish
- Distance from all-time high
- Circulating supply

### 2. A confidence score and a headline, not just one word
Each verdict now comes with:
- **Bullish / Bearish / Neutral** (kept as a strict enum — free-form verdicts are far less likely to reach validator consensus)
- A **0–100 confidence score**
- A punchy one-line **headline**
- A **reasoning** sentence that cites the actual numbers, not a generic statement

### 3. An on-chain history feed
Every analysis is stored as its own permanent record (not overwritten by the next one): `get_recent_analyses(limit)` powers a live "Recent Activity" feed of the last N analyses from *any* user, `get_latest_for_coin(coin)` gets the most recent result for a specific coin, and `get_analysis(id)` gets any historical analysis by ID.

### 4. Rebuilt on the architecture that's actually proven to work
The original app was a Next.js + React app pinned to `genlayer-js@0.7.0`, which cost real debugging time: a missing `studionet` chain export, a branded `Address` type mismatch, and a build that silently failed on Vercel. v2 is plain HTML/JS using `genlayer-js@latest` via CDN plus a small Vercel proxy function — the exact architecture already proven end-to-end on two other GenLayer projects (Bounty Hunter, Truth or Lie).

### 5. A data source that won't silently return garbage
The very first version of this app scraped CoinMarketCap's HTML directly, which is heavily bot-protected — automated fetches almost always got blocked, so every result quietly came back "Neutral" no matter the coin. v2 uses CoinGecko's public JSON API instead, which is built for exactly this kind of programmatic access.

### 6. A real coin search, not a guessing game
Instead of typing a raw CoinGecko ID and hoping it's right, the app has a live search box — type a name or ticker, get a dropdown of real matches, and click to select. Trending coin chips are still there for one-click access to the most common ones.

### 7. A cooldown that actually prevents the rate-limit issue, not just reports it
Live testing surfaced a real bug: CoinGecko's free, keyless API allows only ~5-15 calls/minute, and each on-chain analysis triggers multiple validators fetching independently — so a few analyses in quick succession could exhaust that limit and cause valid coins to (correctly, but unhelpfully) report "temporarily rate-limited." The contract fix distinguishes that case from a genuinely invalid coin ID; the frontend enforces a 20-second cooldown on the Analyze button after each use, so the tool itself keeps you within the free tier instead of just explaining after the fact why it failed.

### 8. A proper visual identity
A custom hexagon-and-crystal-ball logo now appears as both the in-page logo and the browser tab favicon — embedded directly as inline SVG / a data URI, no extra image files to host.

### 9. A verified curated coin list, searched locally first
Rather than firing a network request to CoinGecko on every keystroke (which competes for the same limited rate-limit quota as the actual on-chain analysis), the search box filters a **45-coin curated list** instantly, client-side, with zero network calls. Coin IDs in this list were either directly confirmed live against CoinGecko during development (`bitcoin`, `cardano`, `the-open-network`, `multiversx`) or are long-stable, unambiguous top-market-cap IDs. **Deliberately excluded:** Polygon/MATIC, which is genuinely mid-rebrand to POL right now with an ambiguous ID (`polygon-ecosystem-token` vs the legacy `matic-network`) — rather than guess, it's left out of the curated list; use the live-search fallback for it if needed. If a search doesn't match the curated list, a "Search CoinGecko for..." link appears to fall back to the live API on-demand, not automatically.

### 10. Optional CoinGecko API key support (owner-configurable)
CoinGecko's free "Demo" API key plan (just an email signup, no cost) raises the rate limit from ~5-15 calls/minute to **100 calls/minute**. The contract has a `set_api_key(key)` method, restricted to the contract's deployer, that stores a key and automatically appends it to every CoinGecko request once set. This is gated to the owner because it's a one-time admin config step — unlike an earlier bug in a sibling project where gating `close_betting` to the owner blocked every other reviewer from ever finishing a test, this doesn't block anyone from calling `analyze_sentiment` itself; it just optionally raises the ceiling for everyone using the contract.

---

## How It Works

1. **Connect your wallet** — MetaMask, prompts to add/switch to GenLayer Studionet automatically
2. **Pick a coin** — search by name/ticker in the live search box, click a trending chip, or type a CoinGecko coin ID directly
3. **Analyze on-chain** — `analyze_sentiment(coin)` fetches live market data and runs it through GenLayer's AI validators
4. **Consensus via the Equivalence Principle** — fetching the market data and judging it both happen inside one non-deterministic block, checked with a single `prompt_comparative` call, so validators only need to agree on the final structured verdict — not on byte-identical API responses
5. **Result appears** — verdict, confidence, live price/market cap/volume, and multi-timeframe momentum, all pulled from what's actually stored on-chain
6. **It joins the public feed** — anyone loading the app sees the last 10 analyses from all users

---

## Contract Interface

```python
analyze_sentiment(coin: str) -> u256       # write — returns the new analysis's ID
set_api_key(key: str) -> None              # write, owner-only — sets an optional CoinGecko Demo API key
get_analysis(analysis_id: u256) -> str     # view — full JSON record
get_latest_for_coin(coin: str) -> str      # view — most recent result for a coin
get_analysis_count() -> u256               # view — total analyses ever made
get_recent_analyses(limit: u256) -> str    # view — JSON array of the last N analyses
has_api_key() -> bool                      # view — whether an API key is currently set (doesn't expose the key itself)
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

### Getting a CoinGecko API Key (optional, recommended)
1. Sign up for free at [coingecko.com/en/developers/dashboard](https://www.coingecko.com/en/developers/dashboard) — no cost, no credit card
2. Generate a "Demo" API key
3. Call `set_api_key("your-key-here")` on the deployed contract (only the deployer wallet can do this)
4. From then on, every analysis automatically uses the key, raising the rate limit from ~5-15/min to 100/min

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
3. Try the search box — type a name or ticker (e.g. "eth", "doge") and confirm a dropdown of matching coins appears, or click a trending chip
4. Click **⚡ Analyze On-Chain**, confirm in your wallet
5. Wait ~30–90 seconds for validator consensus — a loading indicator shows progress
6. Confirm the result shows real, varied numbers (price, market cap, volume, multi-timeframe % changes) — not the same static output every time
7. Notice the Analyze button is disabled with a countdown for ~20 seconds after each analysis — this is intentional, it keeps you within CoinGecko's free-tier rate limit
8. Click the transaction link — it should show `GenVM Result: SUCCESS`, `Consensus: Accepted`, `Status: FINALIZED` on the [GenLayer Explorer](https://explorer-studio.genlayer.com/)
9. Analyze a second coin (after the cooldown), then refresh — confirm the "Recent Activity" feed shows both

---

## Honesty Note

The contract interface was just changed (added `owner` tracking and `set_api_key`/`has_api_key`), so it needs a fresh deployment — the address in this README is a placeholder until that happens. A prior version of this contract (without these additions) was confirmed deployed and working live on GenLayer Studionet, including a real, live-tested bug fix for CoinGecko's rate limit being misreported as "coin not found." The 45-coin curated list has 4 entries directly confirmed via live lookups during development (`bitcoin`, `cardano`, `the-open-network`, `multiversx`); the rest are well-established, stable top-market-cap IDs, not individually re-verified in this session — spot-check any you're unsure of using the app's own search feature before relying on them for a submission.
