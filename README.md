<div align="center">

# 🔮 Crypto Sentiment Oracle

**AI-powered crypto sentiment analysis running natively on-chain via GenLayer Intelligent Contracts**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://crypto-sentiment-oracle.vercel.app)
[![View Contract](https://img.shields.io/badge/View_Contract-Explorer-8A2BE2?style=for-the-badge)](https://explorer-studio.genlayer.com/address/0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6)
[![Network](https://img.shields.io/badge/Network-GenLayer_Studionet-2563eb?style=for-the-badge)](https://studio.genlayer.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#license)

**🚀 [crypto-sentiment-oracle.vercel.app](https://crypto-sentiment-oracle.vercel.app)** · **🔍 [View on Explorer](https://explorer-studio.genlayer.com/address/0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6)**

</div>

---

Crypto Sentiment Oracle is a decentralized application that uses GenLayer's Intelligent Contracts and AI consensus to analyze real-time cryptocurrency market sentiment — fetching live web data on-chain and returning **Bullish 📈 / Bearish 📉 / Neutral ➡️** verdicts, verified by independent AI validators reaching Byzantine consensus.

No off-chain oracle. No centralized API. The LLM call and the web fetch both happen *inside* the smart contract itself.

## 📑 Table of Contents

- [How It Works](#-how-it-works)
- [Verified On-Chain](#-verified-on-chain)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Contract Details](#-contract-details)
- [Key Design Decisions](#-key-design-decisions)
- [Getting Started](#-getting-started)
- [How To Test](#-how-to-test)
- [License](#-license)

---

## ⚙️ How It Works

1. **User submits** a cryptocurrency name (e.g. Bitcoin, Ethereum, Solana)
2. **GenLayer AI** fetches live data from CoinMarketCap directly inside the contract
3. **Validators** independently analyze the data and reach consensus using the Equivalence Principle
4. **Result stored on-chain** — Bullish 📈 / Bearish 📉 / Neutral ➡️
5. **Frontend displays** the verified sentiment in real time, with a link to the on-chain proof

---

## ✅ Verified On-Chain

This isn't a mockup — every result is a real, finalized transaction you can independently verify:

**Contract:** [`0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6`](https://explorer-studio.genlayer.com/address/0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6) on GenLayer Studionet

Click through to the Explorer link above and check any `analyze_sentiment` transaction for:
- **GenVM Result:** `SUCCESS`
- **Consensus Result:** `Accepted`
- **Status:** `FINALIZED`

> An earlier deployment (superseded by the address above) had a bug where consensus could hang indefinitely on certain inputs — see [Key Design Decisions](#-key-design-decisions) for what was fixed and why.

---

## 🏗️ Architecture

```
Layer 2 — CLIENT
Next.js 15 + TypeScript
- User inputs coin name
- Signs transactions with a local App Wallet key (generated once per browser, stored in localStorage — not MetaMask)
- Displays AI sentiment result + on-chain proof link
        ↓
Layer 1 — PROTOCOL
GenLayer Optimistic Democracy
- Validators fetch live CoinMarketCap data
- Each runs LLM analysis independently
- Consensus reached via a single prompt_comparative check
- Result stored permanently on-chain
        ↓
Layer 0 — CONTRACT (sentiment.py)
- gl.nondet.web.get()             → fetch live web data
- gl.nondet.exec_prompt()         → LLM sentiment judgment
- gl.eq_principle.prompt_comparative() → one consensus check covering both the fetch and the AI verdict together
- Stores: coin_name + sentiment on-chain
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Frontend | Next.js 15, React 19, TypeScript |
| Wallet | Local App Wallet (`genlayer-js` `createAccount()`), persisted per-browser |
| AI Consensus | GenLayer Optimistic Democracy + LLMs |
| Data Fetching | `gl.nondet.web.get()` (native GenLayer, no external oracle) |
| Deployed | Vercel |

---

## 📜 Contract Details

| | |
|---|---|
| **Contract Address** | [`0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6`](https://explorer-studio.genlayer.com/address/0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6) |
| **Network** | GenLayer Studionet |
| **Language** | Python (Intelligent Contract) |

---

## 🔑 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Fetch + LLM judgment combined in one `prompt_comparative` call | An earlier version used `strict_eq` on the raw fetched HTML as a separate step. That requires every validator to get byte-identical content from a live, bot-protected commercial site — which rarely happens (ads, timestamps, anti-bot challenges vary per request) and caused transactions to hang indefinitely, since consensus could never be reached. Judging only the final sentiment word is far more robust. |
| `gl.eq_principle.prompt_comparative` for the verdict | Allows subjective AI judgment with validator consensus; validators only need to agree the *conclusion* is equivalent, not that every byte of input matched |
| CoinMarketCap as data source | Reliable, always accessible, rich crypto data |
| Single-word response (Bullish/Bearish/Neutral) | Maximizes consensus success rate across validators |
| Local persistent "App Wallet" key instead of MetaMask | `genlayer-js@0.7.0`'s injected-wallet support only routes standard `eth_`-prefixed JSON-RPC methods through the browser wallet; GenLayer's actual contract-write calls don't reliably go through that path, so a MetaMask-only integration silently failed to broadcast. A local key (generated once via `createAccount()`, persisted in `localStorage`) is the officially-documented, proven-working signing method. It's clearly labeled "App Wallet" in the UI so it's never confused with a MetaMask connection. |
| No throwaway key per click | An earlier version generated a brand-new random signing key on every single transaction — the on-chain sender changed every time and had to be funded fresh. The persistent key fixes this: same address across sessions. |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/kmgdz/crypto-sentiment-oracle.git
cd crypto-sentiment-oracle

# Install dependencies
npm install

# Start dev server
npm run dev
```

The contract is already deployed on GenLayer Studionet at the address above — no redeployment needed to run the frontend locally.

## 🧪 How To Test

1. Open the [live app](https://crypto-sentiment-oracle.vercel.app) — an "App Wallet" address is generated automatically for your browser on first load (top-right pill), no MetaMask connection required
2. Enter a coin name (e.g. "solana") and click **Analyze Sentiment On-Chain**
3. Wait roughly 30–90 seconds — the page polls automatically. It should resolve to a real Bullish/Bearish/Neutral verdict, not hang indefinitely
4. Click the transaction hash shown — it links directly to the [GenLayer Explorer](https://explorer-studio.genlayer.com/), where you can confirm `GenVM Result: SUCCESS` and `Status: FINALIZED`

> Note: your App Wallet address is generated fresh the first time you load the app in a given browser, and reused after that (saved in `localStorage`). If it's a brand-new address with no GEN, GenLayer Studionet auto-funds test accounts that submit transactions — no manual faucet step should be needed.

---

## 📄 License

MIT
