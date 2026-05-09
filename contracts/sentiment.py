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

        def fetch_news() -> str:
            response = gl.nondet.web.get(news_url)
            return response.body.decode("utf-8")

        web_data = gl.eq_principle.strict_eq(fetch_news)

        prompt = (
            "You are a crypto market analyst. "
            "Based on this page content about " + coin + ":\n\n"
            + web_data[:2000] +
            "\n\nRespond ONLY with one word: Bullish, Bearish, or Neutral"
        )

        def get_sentiment() -> str:
            return gl.nondet.exec_prompt(prompt)

        result = gl.eq_principle.prompt_comparative(
            get_sentiment,
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
