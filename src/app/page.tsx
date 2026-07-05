"use client";
import { useState, useEffect, useRef } from "react";
import { createClient, createAccount, chains } from "genlayer-js";

const CONTRACT_ADDRESS = "0x0aecf94FE53B9C269FDB38371c3628fAF424c4D6" as `0x${string}`;
const EXPLORER_URL = "https://explorer-studio.genlayer.com/tx/";
const RPC_URL = "https://studio.genlayer.com/api";
const STORAGE_KEY = "gl_sentiment_oracle_privkey";

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
  const [appWalletAddr, setAppWalletAddr] = useState<string | null>(null);

  // genlayer-js's officially documented, working signing method is a local
  // private-key account (createAccount()) — there is no working example
  // anywhere of MetaMask/injected-wallet signing actually broadcasting a
  // transaction for this SDK version. To avoid a new random throwaway
  // account on every click (which is what this app did before, and which
  // is misleading), we generate ONE key the first time this app runs in
  // this browser and persist it in localStorage, reusing it from then on.
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);

  useEffect(() => {
    let privateKey = localStorage.getItem(STORAGE_KEY);
    let account;
    if (privateKey) {
      account = createAccount(privateKey as `0x${string}`);
    } else {
      account = createAccount();
      localStorage.setItem(STORAGE_KEY, account.privateKey);
    }
    setAppWalletAddr(account.address);
    clientRef.current = createClient({
      chain: chains.studionet,
      endpoint: RPC_URL,
      account,
    });
  }, []);

  const fetchSentiment = async () => {
    if (!clientRef.current) return { sentiment: "", coin: "" };
    try {
      const s = await clientRef.current.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_sentiment",
        args: [],
      });
      const c = await clientRef.current.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_coin",
        args: [],
      });
      return {
        sentiment: String(s || "").replace(/"/g, "").trim(),
        coin: String(c || "").replace(/"/g, "").trim(),
      };
    } catch (e) {
      console.error("readContract error:", e);
      return { sentiment: "", coin: "" };
    }
  };

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
    if (!clientRef.current) {
      setStatus("⚠️ Wallet not ready yet, try again in a second.");
      return;
    }
    setLoading(true);
    setSentiment("");
    setTxHash("");
    setElapsed(0);
    setAnalyzedCoin(coin);
    setStatus("⏳ Sending transaction...");

    try {
      const hash = await clientRef.current.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "analyze_sentiment",
        args: [coin],
        value: BigInt(0),
      });

      setTxHash(String(hash));
      setStatus("✅ Transaction sent! Waiting for AI consensus...");

      const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

      setStatus("🔄 Waiting for validators to reach consensus...");
      const receipt = await clientRef.current.waitForTransactionReceipt({ hash });
      clearInterval(timer);

      console.log("receipt:", receipt);
      setStatus("✅ Consensus reached! Reading result...");

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

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
          {appWalletAddr ? (
            <div title="A signing key generated for this browser and stored locally — not MetaMask."
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#111827", border: "1px solid #1f2937", borderRadius: "999px", padding: "6px 14px", fontSize: "0.8rem", color: "#9ca3af" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              App Wallet: {appWalletAddr.slice(0, 6)}...{appWalletAddr.slice(-4)}
            </div>
          ) : (
            <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>Setting up wallet...</div>
          )}
        </div>

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
              <p>3️⃣ <strong style={{ color: "white" }}>AI validators</strong> independently analyze with LLMs and vote.</p>
              <p>4️⃣ <strong style={{ color: "white" }}>Consensus reached</strong> via GenLayer's Optimistic Democracy.</p>
              <p>5️⃣ <strong style={{ color: "white" }}>Result stored permanently</strong> on-chain — Bullish / Bearish / Neutral.</p>
              <p style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #1f2937", fontSize: "0.78rem" }}>
                💡 Transactions are signed by a local <strong style={{ color: "white" }}>App Wallet</strong> — a key pair generated for this browser and stored only in your browser's local storage, not a MetaMask connection.
              </p>
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
          <button onClick={analyzeSentiment} disabled={loading || !coin || !appWalletAddr}
            style={{ width: "100%", background: loading || !coin || !appWalletAddr ? "#374151" : "#2563eb", color: "white", border: "none", borderRadius: "12px", padding: "14px", fontSize: "1rem", fontWeight: "600", cursor: loading || !coin || !appWalletAddr ? "not-allowed" : "pointer", marginBottom: "8px" }}>
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
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>AI Nodes</p>
              </div>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: "0.7rem", marginBottom: "4px" }}>NETWORK</p>
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>GenLayer Studionet</p>
              </div>
              <div style={{ background: "#0f172a", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: "0.7rem", marginBottom: "4px" }}>METHOD</p>
                <p style={{ fontSize: "0.85rem", fontWeight: "600" }}>Optimistic AI</p>
              </div>
            </div>

            <p style={{ color: "#6b7280", fontSize: "0.72rem", textAlign: "center", marginTop: "16px" }}>
              ✅ Verified by GenLayer AI validators on-chain
            </p>
          </div>
        )}

        <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.75rem", marginTop: "20px" }}>
          Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)} • GenLayer Studionet
        </p>
      </div>
    </div>
  );
}
