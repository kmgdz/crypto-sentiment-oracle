"use client";
import { useState } from "react";

const CONTRACT_ADDRESS = "0xe41097D3e22B5d10D1ec5D8e7f24c0E1A296f064";
const RPC_URL = "https://studio.genlayer.com/api";

export default function Home() {
  const [coin, setCoin] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeSentiment = async () => {
    if (!coin) return;
    setLoading(true);
    setError("");
    setSentiment("");
    try {
      const response = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "gen_call",
          params: [{ to: CONTRACT_ADDRESS, data: { method: "get_sentiment", args: [] } }, "latest"],
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.result) setSentiment(data.result);
      else setError("Could not fetch sentiment. Try again.");
    } catch {
      setError("Error connecting to GenLayer network.");
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

  return (
    <div style={{ minHeight: "100vh", background: "#030712", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "500px", width: "100%" }}>
        
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>🔮 Crypto Sentiment Oracle</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Powered by GenLayer AI Consensus • On-Chain Results</p>
        </div>

        <div style={{ background: "#111827", borderRadius: "16px", padding: "24px", marginBottom: "16px", border: "1px solid #1f2937" }}>
          <label style={{ color: "#9ca3af", fontSize: "0.85rem", display: "block", marginBottom: "8px" }}>Enter a cryptocurrency name</label>
          <input
            type="text"
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeSentiment()}
            placeholder="Bitcoin, Ethereum, FTX..."
            style={{ width: "100%", background: "#1f2937", color: "white", border: "1px solid #374151", borderRadius: "12px", padding: "12px 16px", fontSize: "1rem", outline: "none", marginBottom: "16px", boxSizing: "border-box" }}
          />
          <button
            onClick={analyzeSentiment}
            disabled={loading || !coin}
            style={{ width: "100%", background: loading || !coin ? "#374151" : "#2563eb", color: "white", border: "none", borderRadius: "12px", padding: "14px", fontSize: "1rem", fontWeight: "600", cursor: loading || !coin ? "not-allowed" : "pointer" }}
          >
            {loading ? "Analyzing on-chain..." : "Analyze Sentiment"}
          </button>
        </div>

        {sentiment && (
          <div style={{ background: "#111827", borderRadius: "16px", padding: "24px", border: "1px solid #1f2937", textAlign: "center" }}>
            <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "8px" }}>AI Sentiment for {coin}</p>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: getColor() }}>
              {getEmoji()} {sentiment.replace(/"/g, "")}
            </div>
            <p style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "16px" }}>Verified by GenLayer validators on-chain</p>
          </div>
        )}

        {error && (
          <div style={{ background: "#7f1d1d", borderRadius: "16px", padding: "16px", border: "1px solid #991b1b", textAlign: "center", color: "#fca5a5", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.75rem", marginTop: "32px" }}>
          Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)} • GenLayer Testnet
        </p>
      </div>
    </div>
  );
}
