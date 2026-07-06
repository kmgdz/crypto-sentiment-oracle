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
        # CoinMarketCap's page is heavily bot-protected (Cloudflare,
        # anti-scraping challenges). Automated validator fetches almost
        # always get blocked/empty/challenge content — with no real data
        # to analyze, the LLM has nothing to work with and consistently
        # falls back to "Neutral" regardless of the actual coin, which is
        # exactly the symptom this fixes. CoinGecko's public API is a
        # lightweight, scrape-friendly JSON endpoint (no key needed for
        # basic use), giving the LLM real numeric price-change data to
        # reason from instead of a likely-blocked HTML page.
        api_url = (
            "https://api.coingecko.com/api/v3/simple/price?ids="
            + coin.lower()
            + "&vs_currencies=usd&include_24hr_change=true&include_market_cap=true"
        )

        # Fetching AND judging happen inside the SAME non-deterministic
        # block, checked with a single prompt_comparative call — validators
        # only need to agree on the final sentiment word, not on byte-exact
        # fetched content, which is what let earlier strict_eq-based
        # versions hang indefinitely.
        def fetch_and_judge() -> str:
            response = gl.nondet.web.get(api_url)
            web_data = response.body.decode("utf-8", errors="replace")

            prompt = (
                "You are a crypto market analyst. Here is live market data "
                "for \"" + coin + "\" from CoinGecko's API:\n\n"
                + web_data[:1000] +
                "\n\nIf this data is missing, empty, or shows an error "
                "(e.g. the coin name wasn't recognized), respond exactly: "
                "Neutral\n\n"
                "Otherwise, judge sentiment using the 24h price change: "
                "a notable rise is Bullish, a notable drop is Bearish, "
                "little change is Neutral.\n\n"
                "Respond ONLY with one word: Bullish, Bearish, or Neutral"
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
