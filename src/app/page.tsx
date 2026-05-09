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
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: {
                method: "get_sentiment",
                args: [],
              },
            },
            "latest",
          ],
          id: 1,
        }),
      });

      const data = await response.json();
      if (data.result) {
        setSentiment(data.result);
      } else {
        setError("Could not fetch sentiment. Try again.");
      }
    } catch (err) {
      setError("Error connecting to GenLayer network.");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = () => {
    if (sentiment.includes("Bullish")) return "text-green-400";
    if (sentiment.includes("Bearish")) return "text-red-400";
    return "text-yellow-400";
  };

  const getSentimentEmoji = () => {
    if (sentiment.includes("Bullish")) return "📈";
    if (sentiment.includes("Bearish")) return "📉";
    return "➡️";
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">
            🔮 Crypto Sentiment Oracle
          </h1>
          <p className="text-gray-400 text-sm">
            Powered by GenLayer AI Consensus • On-Chain Results
          </p>
        </div>

        {/* Input */}
        <div className="bg-gray-900 rounded-2xl p-6 mb-4 border border-gray-800">
          <label className="text-sm text-gray-400 mb-2 block">
            Enter a cryptocurrency name
          </label>
          <input
            type="text"
            value={coin}
            onChange={(e) => setCoin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyzeSentiment()}
            placeholder="Bitcoin, Ethereum, FTX..."
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-blue-500 mb-4"
          />
          <button
            onClick={analyzeSentiment}
            disabled={loading || !coin}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
          >
            {loading ? "Analyzing on-chain..." : "Analyze Sentiment"}
          </button>
        </div>

        {/* Result */}
        {sentiment && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center">
            <p className="text-gray-400 text-sm mb-2">AI Sentiment for {coin}</p>
            <div className={`text-5xl font-bold mb-2 ${getSentimentColor()}`}>
              {getSentimentEmoji()} {sentiment.replace(/"/g, "")}
            </div>
            <p className="text-gray-500 text-xs mt-4">
              Result verified by GenLayer validators on-chain
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900 rounded-2xl p-4 border border-red-700 text-center text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8">
          Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)} • GenLayer Testnet
        </p>
      </div>
    </main>
  );
}
