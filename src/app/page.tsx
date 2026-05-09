"use client";
import { useState } from "react";

const CONTRACT_ADDRESS = "0xe41097D3e22B5d10D1ec5D8e7f24c0E1A296f064";
const RPC_URL = "https://studio.genlayer.com/api";
const EXPLORER_URL = "https://explorer-studio.genlayer.com/tx/";

export default function Home() {
  const [coin, setCoin] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showHow, setShowHow] = useState(false);

  const connectWallet = async () => {
    try {
      const eth = (window as any).ethereum;
      if (!eth) { alert("Please install MetaMask!"); return; }
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch {
      alert("Wallet connection failed");
    }
  };

  const readSentiment = async () => {
    try {
      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "gen_call",
          params: [{ to: CONTRACT_ADDRESS, data: { method: "get_sentiment", args: [] } }, "latest"],
          id: 1,
        }),
      });
      const data = await res.json();
      if (data.result && data.result !== '""') {
        setSentiment(data.result.replace(/"/g, ""));
        return true;
      }
      return false;
    } catch { return false; }
  };

  const analyzeSentiment = async () => {
    if (!coin) return;
    setLoading(true);
    setSentiment("");
    setTxHash("");
    setStatus("⏳ Sending transaction to GenLayer...");

    try {
      const methodData = JSON.stringify({ method: "analyze_sentiment", args: [coin] });
      const txData = "0x" + Array.from(new TextEncoder().encode(methodData))
        .map(b => b.toString(16).padStart(2, "0")).join("");

      const hash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: account, to: CONTRACT_ADDRESS, data: txData, gas: "0x30D40" }],
      });

      setTxHash(hash);
      setStatus("✅ Transaction submitted! AI validators are reaching consensus...");

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        setStatus(`🔄 Waiting for consensus... (attempt ${attempts}/20)`);
        const got = await readSentiment();
        if (got) {
          setStatus("✅ Result verified on-chain by GenLayer validators!");
          clearInterval(poll);
          setLoading(false);
        }
        if (attempts >= 20) {
          clearInterval(poll);
          setStatus("⚠️ Taking longer than usual. Click 'Read Latest Result' manually.");
          setLoading(false);
        }
      }, 8000);

    } catch (err: any) {
      setStatus("❌ Error: " + (err.message || "Transaction failed"));
      setLoading(false);
    }
  };

  const handleRead = async () => {
    setLoading(true);
    setStatus("📖 Reading from chain...");
    await readSentiment();
    setStatus("✅ Done!");
    setLoading(false);
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
    <div style={{ minHeight: "100vh", background: "#030712", color: "white", fontFamily: "sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingTop: "40px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: "bold", marginBottom: "8px" }}>🔮 Crypto Sentiment Oracle</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Powered by GenLayer AI Consensus • On-Chain Results</p>
        </div>

        {/* How it works */}
        <div style={{ background: "#111827", borderRadius: "12px", padding: "16px", marginBottom: "20px", border: "1px solid #1f2937" }}>
          <button onClick={() => setShowHow(!showHow)}
            style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", width: "100%", textAlign: "left" }}>
            ℹ️ How does this work? {showHow ? "▲" : "▼"}
          </button>
          {showHow && (
            <div style={{ marginTop: "12px", color: "#9ca3af", fontSize: "0.85rem", lineHeight: "1.6" }}>
              <p style={{ marginBottom: "8px" }}>1️⃣ <strong style={{ color: "white" }}>You submit</strong> a coin name — this sends a real transaction to the GenLayer smart contract.</p>
              <p style={{ marginBottom: "8px" }}>2️⃣ <strong style={{ color: "white" }}>GenLayer fetches</strong> live data from CoinMarketCap directly on-chain — no oracles needed.</p>
              <p style={{ marginBottom: "8px" }}>3️⃣ <strong style={{ color: "white" }}>5 AI validators</strong> independently analyze the data using LLMs and vote on the sentiment.</p>
              <p style={{ marginBottom: "8px" }}>4️⃣ <strong style={{ color: "white" }}>Consensus is reached</strong> via GenLayer's Optimistic Democracy mechanism.</p>
              <p>5️⃣ <strong style={{ color: "white" }}>Result stored on-chain</strong> — Bullish 📈 / Bearish 📉 / Neutral ➡️ — permanently and verifiably.</p>
            </div>
          )}
        </div>

        {/* Wallet / Main */}
        {!account ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "#9ca3af", marginBottom: "20px" }}>Connect your wallet to analyze crypto sentiment on-chain</p>
            <button onClick={connectWallet}
              style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: "12px", padding: "14px 32px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" }}>
              🦊 Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: "#111827", borderRadius: "16px", padding: "24px", marginBottom: "16px", border: "1px solid #1f2937" }}>
              <p style={{ color: "#6b7280", fontSize: "0.75rem", marginBottom: "16px" }}>
                🟢 Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
              <label style={{ color: "#9ca3af", fontSize: "0.85rem", display: "block", marginBottom: "8px" }}>
                Enter a cryptocurrency name
              </label>
              <input
                type="text"
                value={coin}
                onChange={(e) => setCoin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyzeSentiment()}
                placeholder="Bitcoin, Ethereum, FTX..."
                style={{ width: "100%", background: "#1f2937", color: "white", border: "1px solid #374151", borderRadius: "12px", padding: "12px 16px", fontSize: "1rem", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
              />
              <button onClick={analyzeSentiment} disabled={loading || !coin}
                style={{ width: "100%", background: loading || !coin ? "#374151" : "#2563eb", color: "white", border: "none", borderRadius: "12px", padding: "14px", fontSize: "1rem", fontWeight: "600", cursor: loading || !coin ? "not-allowed" : "pointer", marginBottom: "8px" }}>
                {loading ? "Processing..." : "⚡ Analyze Sentiment On-Chain"}
              </button>
              <button onClick={handleRead} disabled={loading}
                style={{ width: "100%", background: "transparent", color: "#9ca3af", border: "1px solid #374151", borderRadius: "12px", padding: "10px", fontSize: "0.9rem", cursor: "pointer" }}>
                📖 Read Latest Result
              </button>
            </div>

            {/* Status */}
            {status && (
              <div style={{ background: "#111827", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", border: "1px solid #1f2937", color: "#9ca3af", fontSize: "0.85rem" }}>
                {status}
              </div>
            )}

            {/* TX Hash */}
            {txHash && (
              <div style={{ background: "#111827", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", border: "1px solid #1f2937", fontSize: "0.8rem" }}>
                <p style={{ color: "#6b7280", marginBottom: "4px" }}>🔗 Transaction Hash:</p>
                <a href={EXPLORER_URL + txHash} target="_blank" rel="noopener noreferrer"
                  style={{ color: "#60a5fa", wordBreak: "break-all", textDecoration: "none" }}>
                  {txHash} ↗
                </a>
              </div>
            )}

            {/* Result */}
            {sentiment && (
              <div style={{ background: "#111827", borderRadius: "16px", padding: "32px", border: "1px solid #1f2937", textAlign: "center", marginBottom: "16px" }}>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "8px" }}>AI Sentiment Result</p>
                <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: getColor(), marginBottom: "8px" }}>
                  {getEmoji()} {sentiment}
                </div>
                <p style={{ color: "#6b7280", fontSize: "0.75rem" }}>Verified by 5 GenLayer AI validators on-chain</p>
              </div>
            )}
          </>
        )}

        <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.75rem", marginTop: "20px" }}>
          Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)} • GenLayer Testnet
        </p>
      </div>
    </div>
  );
}
