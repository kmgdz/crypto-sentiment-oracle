"use client";
import { useState, useEffect, useRef } from "react";

const CONTRACT_ADDRESS = "0xe41097D3e22B5d10D1ec5D8e7f24c0E1A296f064";
const RPC_URL = "https://studio.genlayer.com/api";
const EXPLORER_URL = "https://explorer-studio.genlayer.com/tx/";

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
  const [prevSentiment, setPrevSentiment] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [account, setAccount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [showHow, setShowHow] = useState(false);
  const [analyzedCoin, setAnalyzedCoin] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      clearInterval(pollRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

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

  const fetchSentiment = async (): Promise<string> => {
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
        return data.result.replace(/"/g, "").trim();
      }
    } catch {}
    return "";
  };

  const fetchCoin = async (): Promise<string> => {
    try {
      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "gen_call",
          params: [{ to: CONTRACT_ADDRESS, data: { method: "get_coin", args: [] } }, "latest"],
          id: 3,
        }),
      });
      const data = await res.json();
      if (data.result) return data.result.replace(/"/g, "").trim();
    } catch {}
    return "";
  };

  const analyzeSentiment = async () => {
    if (!coin) return;
    setLoading(true);
    setSentiment("");
    setTxHash("");
    setElapsed(0);
    setAnalyzedCoin(coin);

    // Save current sentiment to detect change
    const current = await fetchSentiment();
    setPrevSentiment(current);

    setStatus("⏳ Sending transaction...");

    try {
      const methodData = JSON.stringify({ method: "analyze_sentiment", args: [coin] });
      const txData = "0x" + Array.from(new TextEncoder().encode(methodData))
        .map(b => b.toString(16).padStart(2, "0")).join("");

      const hash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: account, to: CONTRACT_ADDRESS, data: txData, gas: "0x30D40" }],
      });

      setTxHash(hash);
      setStatus("✅ Transaction sent! Waiting for AI consensus...");

      // Start elapsed timer
      let secs = 0;
      timerRef.current = setInterval(() => {
        secs++;
        setElapsed(secs);
      }, 1000);

      // Poll every 5 seconds — detect when coin AND sentiment both change
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;

        const newCoin = await fetchCoin();
        const newSentiment = await fetchSentiment();

        // Result is new when the coin matches what we submitted
        if (
          newCoin.toLowerCase() === coin.toLowerCase() &&
          newSentiment !== "" &&
          newSentiment !== current
        ) {
          setSentiment(newSentiment);
          setStatus("✅ Consensus reached! Result verified on-chain.");
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          setLoading(false);
          return;
        }

        setStatus(`🔄 AI validators analyzing... ${secs}s elapsed`);

        if (attempts >= 36) { // 3 minutes max
          clearInterval(pollRef.current);
          clearInterval(timerRef.current);
          // Try one last read
          const final = await fetchSentiment();
          if (final) setSentiment(final);
          setStatus("⚠️ Done waiting. Showing latest on-chain result.");
          setLoading(false);
        }
      }, 5000);

    } catch (err: any) {
      setStatus("❌ " + (err.message || "Transaction failed"));
      clearInterval(timerRef.current);
      setLoading(false);
    }
  };

  const handleRead = async () => {
    setLoading(true);
    setStatus("📖 Reading from chain...");
    const s = await fetchSentiment();
    const c = await fetchCoin();
    if (s) { setSentiment(s); setAnalyzedCoin(c); }
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

  const coinKey = analyzedCoin.toLowerCase();
  const coinInfo = COIN_INFO[coinKey];

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
            <div style={{ marginTop: "12px", color: "#9ca3af", fontSize: "0.85rem", lineHeight: "1.8" }}>
              <p>1️⃣ <strong style={{ color: "white" }}>You submit</strong> a coin name — signs a real on-chain transaction.</p>
              <p>2️⃣ <strong style={{ color: "white" }}>GenLayer fetches</strong> live data from CoinMarketCap directly on-chain.</p>
              <p>3️⃣ <strong style={{ color: "white" }}>5 AI validators</strong> independently analyze the data with LLMs.</p>
              <p>4️⃣ <strong style={{ color: "white" }}>Consensus reached</strong> via GenLayer's Optimistic Democracy.</p>
              <p>5️⃣ <strong style={{ color: "white" }}>Result stored permanently</strong> on-chain — Bullish / Bearish / Neutral.</p>
            </div>
          )}
        </div>

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
              <div style={{ background: "#111827", borderRadius: "16px", padding: "28px", border: `1px solid ${getColor()}44`, marginBottom: "16px" }}>
                
                {/* Coin Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #1f2937" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: coinInfo?.color || "#374151", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold" }}>
                    {coinInfo?.symbol?.[0] || analyzedCoin[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: "bold", fontSize: "1.1rem", textTransform: "capitalize" }}>{analyzedCoin}</p>
                    {coinInfo && <p style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{coinInfo.symbol} • {coinInfo.desc}</p>}
                  </div>
                </div>

                {/* Sentiment */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginBottom: "8px" }}>AI SENTIMENT VERDICT</p>
                  <div style={{ fontSize: "3rem", fontWeight: "bold", color: getColor() }}>
                    {getEmoji()} {sentiment}
                  </div>
                </div>

                {/* Details */}
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
          </>
        )}

        <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.75rem", marginTop: "20px" }}>
          Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)} • GenLayer Testnet
        </p>
      </div>
    </div>
  );
}
