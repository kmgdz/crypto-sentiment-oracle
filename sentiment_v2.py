# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass
    class Write:
        pass


class CryptoSentimentOracle(gl.Contract):

    next_id:  u256
    analyses: TreeMap[u256, str]   # analysis_id -> JSON blob

    def __init__(self) -> None:
        self.next_id  = u256(0)
        self.analyses = TreeMap[u256, str]()

    # ── analyze_sentiment ─────────────────────────────────────
    @gl.public.write
    def analyze_sentiment(self, coin: str) -> u256:
        coin_id = coin.lower().strip()
        if len(coin_id) == 0:
            raise Exception("Coin name cannot be empty")

        api_url = (
            "https://api.coingecko.com/api/v3/coins/markets"
            "?vs_currency=usd&ids=" + coin_id +
            "&price_change_percentage=24h,7d,30d"
        )

        # Fetching AND judging happen inside the SAME non-deterministic
        # block, checked with a single prompt_comparative call. Validators
        # only need to agree on the final structured verdict, not on
        # byte-identical fetched JSON — a separate strict_eq step on live
        # API content is what causes consensus to hang indefinitely on
        # earlier designs, since exact bytes rarely match across parallel
        # requests to a live server.
        def fetch_and_judge() -> str:
            response = gl.nondet.web.get(api_url)
            raw_body = response.body.decode("utf-8", errors="replace")

            try:
                parsed = json.loads(raw_body)
            except Exception:
                parsed = None

            # CoinGecko's keyless public API has a tight rate limit
            # (roughly 5-15 calls/minute). When it's hit, the response is
            # an error object like {"status": {"error_code": 429, ...}},
            # not the expected price array — distinguish that from a
            # genuinely empty result (coin ID not recognized), since
            # treating both the same way misleadingly reports valid coins
            # as "not found" during normal, moderately frequent use.
            if isinstance(parsed, dict):
                status = parsed.get("status", {})
                err_code = status.get("error_code") if isinstance(status, dict) else None
                return json.dumps({
                    "verdict": "Neutral",
                    "confidence": 0,
                    "headline": "Data temporarily unavailable",
                    "reasoning": "CoinGecko's free API is rate-limited right now"
                        + (" (error " + str(err_code) + ")" if err_code else "")
                        + " — please wait a minute and try again.",
                    "price": None, "market_cap": None, "volume_24h": None,
                    "change_24h": None, "change_7d": None, "change_30d": None,
                    "rank": None, "ath_change_pct": None,
                })

            if not parsed or not isinstance(parsed, list):
                return json.dumps({
                    "verdict": "Neutral",
                    "confidence": 0,
                    "headline": "Coin not found",
                    "reasoning": "CoinGecko did not recognize \"" + coin + "\" as a coin ID.",
                    "price": None, "market_cap": None, "volume_24h": None,
                    "change_24h": None, "change_7d": None, "change_30d": None,
                    "rank": None, "ath_change_pct": None,
                })

            d = parsed[0]
            price = d.get("current_price")
            market_cap = d.get("market_cap")
            market_cap_rank = d.get("market_cap_rank")
            volume_24h = d.get("total_volume")
            change_24h = d.get("price_change_percentage_24h")
            change_7d = d.get("price_change_percentage_7d_in_currency")
            change_30d = d.get("price_change_percentage_30d_in_currency")
            ath_change_pct = d.get("ath_change_percentage")
            circulating_supply = d.get("circulating_supply")

            market_snapshot = (
                "Price: $" + str(price) + "\n"
                "Market cap: $" + str(market_cap) + " (rank #" + str(market_cap_rank) + ")\n"
                "24h volume: $" + str(volume_24h) + "\n"
                "24h change: " + str(change_24h) + "%\n"
                "7d change: " + str(change_7d) + "%\n"
                "30d change: " + str(change_30d) + "%\n"
                "Distance from all-time high: " + str(ath_change_pct) + "%\n"
                "Circulating supply: " + str(circulating_supply)
            )

            prompt = (
                "You are a professional crypto market analyst. Here is "
                "live market data for \"" + coin + "\" from CoinGecko:\n\n"
                + market_snapshot + "\n\n"
                "Judge overall sentiment using ALL timeframes together — "
                "weigh the 24h, 7d, and 30d changes and the distance from "
                "all-time high. A coin can be down 24h but still Bullish "
                "if the 7d/30d trend and volume are strong, and vice versa.\n\n"
                "Return ONLY a JSON object, no markdown, no extra text:\n"
                '{"verdict": "Bullish" | "Bearish" | "Neutral", '
                '"confidence": <0-100 integer>, '
                '"headline": "<punchy 5-8 word summary, may use one emoji>", '
                '"reasoning": "<one or two sentences citing specific numbers above>"}'
            )
            llm_raw = gl.nondet.exec_prompt(prompt)
            llm_raw = llm_raw.replace("```json", "").replace("```", "").strip()

            try:
                llm_parsed = json.loads(llm_raw)
            except Exception:
                llm_parsed = {}

            verdict = str(llm_parsed.get("verdict", "Neutral")).strip()
            if verdict not in ("Bullish", "Bearish", "Neutral"):
                verdict = "Neutral"
            confidence = llm_parsed.get("confidence", 0)
            try:
                confidence = max(0, min(100, int(confidence)))
            except Exception:
                confidence = 0
            headline = str(llm_parsed.get("headline", ""))[:80]
            reasoning = str(llm_parsed.get("reasoning", ""))[:400]

            return json.dumps({
                "verdict": verdict,
                "confidence": confidence,
                "headline": headline,
                "reasoning": reasoning,
                "price": price,
                "market_cap": market_cap,
                "volume_24h": volume_24h,
                "change_24h": change_24h,
                "change_7d": change_7d,
                "change_30d": change_30d,
                "rank": market_cap_rank,
                "ath_change_pct": ath_change_pct,
            })

        result_json = gl.eq_principle.prompt_comparative(
            fetch_and_judge,
            'The "verdict" field must be the same in both responses'
        )

        try:
            result = json.loads(result_json)
        except Exception:
            result = {"verdict": "Neutral", "confidence": 0, "headline": "",
                       "reasoning": "Failed to parse result", "price": None,
                       "market_cap": None, "volume_24h": None, "change_24h": None,
                       "change_7d": None, "change_30d": None, "rank": None,
                       "ath_change_pct": None}

        aid = self.next_id
        record = {
            "id": int(aid),
            "coin": coin,
            "requester": str(gl.message.sender_address),
        }
        record.update(result)
        self.analyses[aid] = json.dumps(record)
        self.next_id = self.next_id + u256(1)
        return aid

    # ── views ─────────────────────────────────────────────────
    @gl.public.view
    def get_analysis(self, analysis_id: u256) -> str:
        if analysis_id not in self.analyses:
            raise Exception("Analysis not found")
        return self.analyses[analysis_id]

    @gl.public.view
    def get_latest_for_coin(self, coin: str) -> str:
        coin_id = coin.lower().strip()
        total = int(self.next_id)
        for i in range(total - 1, -1, -1):
            aid = u256(i)
            if aid in self.analyses:
                rec = json.loads(self.analyses[aid])
                if str(rec.get("coin", "")).lower().strip() == coin_id:
                    return json.dumps(rec)
        raise Exception("No analysis yet for this coin")

    @gl.public.view
    def get_analysis_count(self) -> u256:
        return self.next_id

    @gl.public.view
    def get_recent_analyses(self, limit: u256) -> str:
        total = int(self.next_id)
        n = min(int(limit), total)
        result = []
        for i in range(total - 1, total - 1 - n, -1):
            if i < 0:
                break
            aid = u256(i)
            if aid in self.analyses:
                result.append(json.loads(self.analyses[aid]))
        return json.dumps(result)
