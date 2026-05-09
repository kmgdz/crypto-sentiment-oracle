"use client";
import { useState } from "react";

const CONTRACT_ADDRESS = "0xe41097D3e22B5d10D1ec5D8e7f24c0E1A296f064";
const RPC_URL = "https://studio.genlayer.com/api";

export default function Home() {
  const [coin, setCoin] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState("");

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

  const analyzeSentiment = async () => {
    if (!coin) return;
    setLoading(true);
    setSentiment("");
    setStatus("Sending transaction to GenLayer...");

    try {
      // Step 1: Send write transaction
      const methodData = JSON.stringify({ method: "analyze_sentiment", args: [coin] });
      const txData = "0x" + Array.from(new TextEncoder().encode(methodData))
        .map(b => b.toString(16).padStart(2, "0")).join("");

      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: account,
          to: CONTRACT_ADDRESS,
          data: txData,
          gas: "0x5208",
        }],
      });

      setStatus("Transaction sent! Waiting for AI consensus... (30-60 seconds)");

      // Step 2: Poll for result
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
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
          if (data.result && data.result !== '""' && data.result !== "") {
            setSentiment(data.result.replace(/"/g, ""));
            setStatus("✅ Result verified on-chain!");
            clearInterval(poll);
            setLoading(false);
          }
        } catch {}

        if (attempts > 20) {
          clearInterval(poll);
          setStatus("Timed out. Try reading result manually.");
          setLoading(false);
        }
      }, 5000);

    } catch (err: any) {
      setStatus("Error: " + (err.message || "Transaction failed"));
      setLoading(false);
    }
  };

  const readSentiment = async () => {
    setLoading(true);
    setStatus("Reading latest result from chain...");
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
      if (data.result) setSentiment(data.result.replace(/"/g, ""));
      setStatus("✅ Done!");
    } catch {
      setStatus("Error reading from chain");
    }
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
    <div style={{ minHeight: "100vh", background: "#030712", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "500px", width: "100%" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>🔮 Crypto Sentiment Oracle</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>Powered by GenLayer AI Consensus • On-Chain Results</p>
        </div>

        {!account ? (
          <div style={{ textAlign: "center" }}>
            <button onClick={connectWallet}
              style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: "12px", padding: "14px 32px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" }}>
              🦊 Connect Wallet
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: "#111827", borderRadius: "16px", padding: "24px", marginBottom: "16px", border: "1px solid #1f2937" }}>
              <p style={{ color: "#6b7280", fontSize: "0.75rem", marginBottom: "16px" }}>
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
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
                {loading ? "Processing..." : "⚡ Analyze Sentiment"}
              </button>
              <button onClick={readSentiment} disabled={loading}
                style={{ width: "100%", background: "transparent", color: "#9ca3af", border: "1px solid #374151", borderRadius: "12px", padding: "10px", fontSize: "0.9rem", cursor: "pointer" }}>
                📖 Read Latest Result
              </button>
            </div>

            {status && (
              <div style={{ background: "#111827", borderRadius: "12px", padding: "12px 16px", marginBottom: "16px", border: "1px solid #1f2937", color: "#9ca3af", fontSize: "0.85rem" }}>
                {status}
              </div>
            )}

            {sentiment && (
              <div style={{ background: "#111827", borderRadius: "16px", padding: "24px", border: "1px solid #1f2937", textAlign: "center" }}>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", marginBottom: "8px" }}>AI Sentiment Result</p>
                <div style={{ fontSize: "3rem", fontWeight: "bold", color: getColor() }}>
                  {getEmoji()} {sentiment}
                </div>
                <p style={{ color: "#6b7280", fontSize: "0.75rem", marginTop: "16px" }}>Verified by GenLayer validators on-chain</p>
              </div>
            )}
          </>
        )}

        <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.75rem", marginTop: "32px" }}>
          Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)} • GenLayer Testnet
        </p>
      </div>
    </div>
  );
}
