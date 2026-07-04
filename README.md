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

```
Layer 2 — CLIENT
Next.js 15 + TypeScript + Tailwind CSS
- User inputs coin name
- Displays AI sentiment result
- Connected to GenLayer via RPC
        ↓
Layer 1 — PROTOCOL
GenLayer Optimistic Democracy
- Validators fetch live CoinMarketCap data
- Each runs LLM analysis independently
- Consensus reached via prompt_comparative
- Result stored permanently on-chain
        ↓
Layer 0 — CONTRACT (sentiment.py)
- gl.nondet.web.get() → fetch live web data
- gl.nondet.exec_prompt() → LLM sentiment judgment
- gl.eq_principle.prompt_comparative() → single consensus check covering both the fetch and the AI verdict together
- Stores: coin_name + sentiment on-chain
```

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

- **Contract Address:** `0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6`
- **Network:** GenLayer Studionet
- **Language:** Python (Intelligent Contract)

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Fetch + LLM judgment combined in one `prompt_comparative` call | An earlier version used `strict_eq` on the raw fetched HTML as a separate step. That requires every validator to get byte-identical content from a live, bot-protected commercial site — which rarely happens (ads, timestamps, anti-bot challenges vary per request) and caused transactions to hang indefinitely, since consensus could never be reached. Judging only the final sentiment word is far more robust. |
| `gl.eq_principle.prompt_comparative` for the verdict | Allows subjective AI judgment with validator consensus; validators only need to agree the *conclusion* is equivalent, not that every byte of input matched |
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

The contract is deployed on GenLayer Studionet at the address above.

### How To Test

1. Open the live app, click **Connect Wallet**, and approve MetaMask (it will prompt to add/switch to GenLayer Studionet if needed)
2. Enter a coin name (e.g. "solana") and click **Analyze Sentiment On-Chain**
3. Confirm the transaction in MetaMask
4. Wait roughly 30–90 seconds — the page polls automatically. It should resolve to a real Bullish/Bearish/Neutral verdict, not hang indefinitely
5. The transaction hash shown links directly to the [GenLayer Explorer](https://explorer-studio.genlayer.com/) — check that it shows `GenVM Result: SUCCESS` and `Status: FINALIZED`

---

## License

MIT
