# 🔮 Crypto Sentiment Oracle

**AI-powered crypto sentiment analysis on GenLayer's blockchain using Intelligent Contracts**

Crypto Sentiment Oracle is a decentralized application that uses GenLayer's Intelligent Contracts and AI consensus to analyze real-time cryptocurrency market sentiment — fetching live web data on-chain and returning Bullish, Bearish, or Neutral verdicts verified by multiple AI validators.

---

## How It Works

1. **User submits** a cryptocurrency name (e.g. Bitcoin, Ethereum)
2. **GenLayer AI** fetches live data from CoinMarketCap on-chain
3. **Validators** reach consensus using the Equivalence Principle
4. **Result stored on-chain** — Bullish 📈 / Bearish 📉 / Neutral ➡️
5. **Frontend displays** the verified sentiment in real time

---

## Architecture
┌─────────────────────────────────────────────────┐
│  Layer 2 — CLIENT (Next.js + TypeScript)        │
│  • Input coin name                              │
│  • Display AI sentiment result                  │
│  • Connected to GenLayer via RPC                │
└─────────────────────────────────────────────────┘
│
┌─────────────────────────────────────────────────┐
│  Layer 1 — PROTOCOL (GenLayer Optimistic Demo)  │
│  • Validators fetch live CoinMarketCap data     │
│  • AI analyzes sentiment via LLM                │
│  • Consensus reached via prompt_comparative     │
│  • Result stored permanently on-chain           │
└─────────────────────────────────────────────────┘
│
┌─────────────────────────────────────────────────┐
│  Layer 0 — CONTRACT (sentiment.py)              │
│  • gl.nondet.web.get() — fetch live web data   │
│  • gl.eq_principle.strict_eq() — deterministic │
│  • gl.eq_principle.prompt_comparative() — AI   │
│  • Stores: coin_name, sentiment                 │
└─────────────────────────────────────────────────┘

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Python (GenLayer Intelligent Contract) |
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS |
| AI Consensus | GenLayer Optimistic Democracy + LLMs |
| Data Fetching | `gl.nondet.web.get()` (native GenLayer) |
| Deployed | Vercel |

---

## Contract Details

- **Contract Address:** `0xe41097D3e22B5d10D1ec5D8e7f24c0E1A296f064`
- **Network:** GenLayer Testnet
- **Language:** Python (Intelligent Contract)

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `gl.eq_principle.strict_eq` for web fetch | Ensures all validators get identical web content |
| `gl.eq_principle.prompt_comparative` for AI | Allows subjective AI judgment with validator consensus |
| CoinMarketCap as data source | Reliable, always accessible, rich crypto data |
| Single word response (Bullish/Bearish/Neutral) | Maximizes consensus success rate across validators |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The contract is deployed on GenLayer Testnet at the address above.

---

## License

MIT
