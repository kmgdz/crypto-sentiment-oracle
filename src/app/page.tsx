"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient, chains, createAccount } from "genlayer-js";

const CONTRACT_ADDRESS = "0xe41097D3e22B5d10D1ec5D8e7f24c0E1A296f064" as `0x${string}`;
const EXPLORER_URL = "https://explorer-studio.genlayer.com/tx/";

const client = createClient({
  chain: chains.studionet,
  endpoint: "https://studio.genlayer.com/api",
});

const COIN_INFO: Record<string, { desc: string; symbol: string; color: string }> = {
  bitcoin:  { desc: "The first and largest cryptocurrency by market cap.", symbol: "BTC", color: "#f97316" },
  ethereum: { desc: "Leading smart contract platform powering DeFi and NFTs.", symbol: "ETH", color: "#6366f1" },
  ftx:      { desc: "Collapsed crypto exchange, filed for bankruptcy in 2022.", symbol: "FTT", color: "#ef4444" },
  solana:   { desc: "High-speed blockchain for DeFi and Web3 applications.", symbol: "SOL", color: "#8b5cf6" },
  bnb:      { desc: "Binance's native token powering the BNB Chain ecosystem.", symbol: "BNB", color: "#eab308" },
  xrp:      { desc: "Cross-border payment token by Ripple Labs.", symbol: "XRP", color: "#06b6d4" },
  dogecoin: { desc: "Meme coin turned mainstream, backed by Elon Musk.", symbol: "DOGE", color: "#ca8a04" },
  luna:     { desc: "Collapsed algorithmic stablecoin ecosystem (Terra).", symbol: "LUNA", color: "#ef4444" },
};

export default function Home() {
  const [coin, setCoin] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [analyzedCoin, setAnalyzedCoin] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showHow, setShowHow] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const fetchSentiment = useCallback(async () => {
    try {
      const s = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_sentiment",
        args: [],
      });
      const c = await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_coin",
        args: [],
      });
      console.log("readContract sentiment:", s, "coin:", c);
      return {
        sentiment: String(s || "").replace(/"/g, "").trim(),
        coin: String(c || "").replace(/"/g, "").trim(),
      };
    } catch (e) {
      console.error("readContract error:", e);
      return { sentiment: "", coin: "" };
    }
  }, []);

  const handleRead = async () => {
    setLoading(true);
    setStatus("📖 Reading from chain...");
    const { sentiment: s, coin: c } = await fetchSentiment();
    if (s) {
      setSentiment(s);
      setAnalyzedCoin(c);
      setStatus("✅ Done!");
    } else {
      setStatus("⚠️ No result yet. Try again in a moment.");
    }
    setLoading(false);
  };

  const analyzeSentiment = async () => {
    if (!coin) return;
    setLoading(true);
    setSentiment("");
    setTxHash("");
    setElapsed(0);
    setAnalyzedCoin(coin);
    setStatus("⏳ Sending transaction...");

    try {
      // Use createAccount() like Aequitas does
      const account = createAccount();

      const hash = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "analyze_sentiment",
        args: [coin],
        account,
        value: BigInt(0),
      });

      setTxHash(String(hash));
      setStatus("✅ Transaction sent! Waiting for AI consensus...");

      // Wait for receipt like Aequitas does
      let secs = 0;
      const timer = setInterval(() => { secs++; setElapsed(secs); }, 1000);

      setStatus("🔄 Waiting for validators to reach consensus...");

      const receipt = await client.waitForTransactionReceipt({ hash });
      clearInterval(timer);

      console.log("receipt:", receipt);
      setStatus("✅ Consensus reached! Reading result...");

      // Read result after receipt
      const { sentiment: s, coin: c } = await fetchSentiment();
      if (s) {
        setSentiment(s);
        setAnalyzedCoin(c || coin);
        setStatus("✅ Result verified on-chain by GenLayer validators!");
      } else {
        setStatus("⚠️ Transaction done. Click '📖 Read Latest Result'.");
      }

    } catch (err: any) {
      console.error("writeContract error:", err);
      setStatus("❌ " + (err.message || "Transaction failed"));
    } finally {
      setLoading(false);
    }
  };

  const getColor = () => {
    if (sentiment.includes("Bullish")) return "#22c55e";
    if (sentiment.includes("Bearish")) return "#ef4444";
    return "#eab308";
  };

  const getEmoji = () => {
    if (sentiment.includes("Bullish")) return "📈";
    if (sentiment.includes("Bearish")) return "📉";
    return "➡️";
  };

  const coinKey = analyzedCoin.toLowerCase();
  const coinInfo = COIN_INFO[coinKey];

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "white", fontFamily: "sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "40px" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "bold", marginBottom: "8px" }}>🔮 Crypto Sentiment Oracle</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Powered by GenLayer AI Consensus • On-Chain Results</p>
        </div>

        <div style={{ background: "#111827", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid #1f2937" }}>
          <button onClick={() => setShowHow(!showHow)}
            style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", width: "100%", textAlign: "left" }}>
            ℹ️ How does this work? {showHow ? "▲" : "▼"}
          </button>
          {showHow && (
            <div style={{ marginTop: "12px", color: "#9ca3af", fontSize: "0.85rem", lineHeight: "1.8" }}>
              <p>1️⃣ <strong style={{ color: "white" }}>You submit</strong> a coin name — sends a real transaction to GenLayer.</p>
              <p>2️⃣ <strong style={{ color: "white" }}>GenLayer fetches</strong> live data from CoinMarketCap directly on-chain.</p>
              <p>3️⃣ <strong style={{ color: "white" }}>5 AI validators</strong> independently analyze with LLMs and vote.</p>
              <p>4️⃣ <strong style={{ color: "white" }}>Consensus reached</strong> via GenLayer's Optimistic Democracy.</p>
              <p>5️⃣ <strong style={{ color: "white" }}>Result stored permanently</strong> on-chain — Bullish / Bearish / Neutral.</p>
            </div>
          )}
        </div>

        <div style={{ background: "#111827", borderRadius: "16px", padding: "24px", marginBottom: "16px", border: "1px solid #1f2937" }}>
          <label style={{ color: "#9ca3af", fontSize: "0.85rem", display: "block", marginBottom: "8px" }}>
            Enter a cryptocurrency name
          </label>
          <input
            type="text"
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeSentiment()}
            placeholder="Bitcoin, Ethereum, Solana..."
            style={{ width: "100%", background: "#1f2937", color: "white", border: "1px solid #374151", borderRadius: "12px", padding: "12px 16px", fontSize: "1rem", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
          />
          <button onClick={analyzeSentiment} disabled={loading || !coin}
            style={{ width: "100%", background: loading || !coin ? "#374151" : "#2563eb", color: "white", border: "none", borderRadius: "12px", padding: "14px", fontSize: "1rem", fontWeight: "600", cursor: loading || !coin ? "not-allowed" : "pointer", marginBottom: "8px" }}>
            {loading ? `⏳ Analyzing... ${elapsed}s` : "⚡ Analyze Sentiment On-Chain"}
          </button>
          <button onClick={handleRead} disabled={loading}
            style={{ width: "100%", background: "transparent", color: "#9ca3af", border: "1px solid #374151", borderRadius: "12px", padding: "10px", fontSize: "0.9rem", cursor: "pointer" }}>
            📖 Read Latest Result
          </button>
        </div>

        {status && (
          <div style={{ background: "#111827", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", border: "1px solid #1f2937", color: "#9ca3af", fontSize: "0.85rem" }}>
            {status}
          </div>
        )}

        {txHash && (
          <div style={{ background: "#111827", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", border: "1px solid #1f2937", fontSize: "0.8rem" }}>
            <p style={{ color: "#6b7280", marginBottom: "4px" }}>🔗 Transaction Hash:</p>
            <a href={EXPLORER_URL + txHash} target="_blank" rel="noopener noreferrer"
              style={{ color: "#60a5fa", wordBreak: "break-all", textDecoration: "none" }}>
              {txHash} ↗
            </a>
          </div>
        )}

        {sentiment && (
          <div style={{ background: "#111827", borderRadius: "16px", padding: "28px", border: `1px solid ${getColor()}44`, marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #1f2937" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: coinInfo?.color || "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                {coinInfo?.symbol?.[0] || analyzedCoin[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: "bold", fontSize: "1.1rem", textTransform: "capitalize" }}>{analyzedCoin}</p>
                {coinInfo && <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{coinInfo.symbol} • {coinInfo.desc}</p>}
              </div>
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginBottom: "8px" }}>AI SENTIMENT VERDICT</p>
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: getColor() }}>
                {getEmoji()} {sentiment}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: "0.7rem", marginBottom: "4px" }}>DATA SOURCE</p>
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>CoinMarketCap</p>
              </div>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: "0.7rem", marginBottom: "4px" }}>VALIDATORS</p>
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>5 AI Nodes</p>
              </div>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: "0.7rem", marginBottom: "4px" }}>NETWORK</p>
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>GenLayer Testnet</p>
              </div>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: "0.7rem", marginBottom: "4px" }}>METHOD</p>
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>Optimistic AI</p>
              </div>
            </div>

            <p style={{ color: "#6b7280", fontSize: "0.72rem", textAlign: "center", marginTop: "16px" }}>
              ✅ Verified by 5 GenLayer AI validators on-chain
            </p>
          </div>
        )}

        <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.75rem", marginTop: "20px" }}>
          Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)} • GenLayer Testnet
        </p>
      </div>
    </div>
  );
}
