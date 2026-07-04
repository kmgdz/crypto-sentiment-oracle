# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

class CryptoSentimentOracle(gl.Contract):
    coin_name: str
    sentiment: str

    def __init__(self):
        self.coin_name = ""
        self.sentiment = ""

    @gl.public.write
    def analyze_sentiment(self, coin: str) -> None:
        news_url = "https://coinmarketcap.com/currencies/" + coin.lower() + "/"

        # Fetching AND judging happen inside the SAME non-deterministic
        # block, checked with a single prompt_comparative call. The
        # previous version used strict_eq on the raw fetched HTML as a
        # separate step — that requires every validator to get a
        # byte-identical page from a live, bot-protected commercial site
        # (CoinMarketCap), which almost never happens (ads, timestamps,
        # anti-bot challenges vary per request). When validators can't
        # agree, consensus never completes and the transaction hangs
        # forever. Judging only the final sentiment word is far more
        # robust, since minor HTML differences rarely change the LLM's
        # conclusion.
        def fetch_and_judge() -> str:
            response = gl.nondet.web.get(news_url)
            web_data = response.body.decode("utf-8", errors="replace")

            prompt = (
                "You are a crypto market analyst. "
                "Based on this page content about " + coin + ":\n\n"
                + web_data[:2000] +
                "\n\nRespond ONLY with one word: Bullish, Bearish, or Neutral"
            )
            return gl.nondet.exec_prompt(prompt).strip()

        result = gl.eq_principle.prompt_comparative(
            fetch_and_judge,
            "The response must be exactly one of: Bullish, Bearish, or Neutral"
        )

        self.coin_name = coin
        self.sentiment = result

    @gl.public.view
    def get_sentiment(self) -> str:
        return self.sentiment

    @gl.public.view
    def get_coin(self) -> str:
        return self.coin_name
