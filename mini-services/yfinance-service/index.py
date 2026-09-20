"""
yfinance data service — provides real market data to the Next.js app.
Runs on port 3001.
"""
import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

PORT = 3001

# Cache for ticker quotes (avoid hitting yfinance too often)
_quote_cache = {}
_cache_time = {}
CACHE_TTL = 30  # 30 seconds

# Default tickers for the ticker tape
TICKER_SYMBOLS = {
    "SPX": "^GSPC",
    "NDX": "^NDX",
    "DJI": "^DJI",
    "VIX": "^VIX",
    "UST10Y": "^TNX",
    "DXY": "DX-Y.NYB",
    "GOLD": "GC=F",
    "WTI": "CL=F",
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "EURUSD": "EURUSD=X",
    "USDJPY": "JPY=X",
    "GBPUSD": "GBPUSD=X",
    "XLE": "XLE",
    "XLF": "XLF",
    "XLK": "XLK",
    "COPPER": "HG=F",
    "WHEAT": "ZW=F",
}

# Symbols available for backtesting
BACKTEST_SYMBOLS = [
    "SPY", "QQQ", "IWM", "DIA", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA",
    "META", "JPM", "BAC", "XOM", "CVX", "GLD", "SLV", "TLT", "HYG", "XLE",
    "XLF", "XLK", "XLV", "XLY", "XLP", "XLB", "XLI", "XLU", "XLRE", "XLC",
]


def fetch_quotes(symbols):
    """Fetch current quotes for multiple symbols"""
    results = []
    now = datetime.now()
    for label, sym in symbols.items():
        # Check cache
        if sym in _quote_cache and sym in _cache_time:
            if (now - _cache_time[sym]).total_seconds() < CACHE_TTL:
                q = _quote_cache[sym]
                results.append({"symbol": label, **q})
                continue
        try:
            ticker = yf.Ticker(sym)
            info = ticker.info
            price = info.get("currentPrice") or info.get("regularMarketPrice")
            prev = info.get("regularMarketPreviousClose") or info.get("previousClose")
            if price and prev:
                change = price - prev
                change_pct = (change / prev) * 100 if prev else 0
                q = {"price": round(price, 2), "change": round(change, 2), "changePct": round(change_pct, 2)}
                _quote_cache[sym] = q
                _cache_time[sym] = now
                results.append({"symbol": label, **q})
        except Exception as e:
            results.append({"symbol": label, "price": 0, "change": 0, "changePct": 0, "error": str(e)})
    return results


def fetch_history(symbol, period="1y", interval="1d"):
    """Fetch price history for a symbol"""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        # Convert to list of {date, price}
        prices = []
        for idx, row in hist.iterrows():
            prices.append({
                "date": idx.strftime("%Y-%m-%d"),
                "price": round(float(row["Close"]), 2),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "volume": int(row["Volume"]) if row["Volume"] > 0 else 0,
            })
        info = ticker.info
        name = info.get("shortName", symbol)
        return {"symbol": symbol, "name": name, "prices": prices}
    except Exception as e:
        return {"symbol": symbol, "error": str(e), "prices": []}


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        if path == "/api/quotes":
            quotes = fetch_quotes(TICKER_SYMBOLS)
            self._send_json({"quotes": quotes})

        elif path == "/api/history":
            symbol = qs.get("symbol", ["SPY"])[0]
            period = qs.get("period", ["1y"])[0]
            data = fetch_history(symbol, period)
            self._send_json(data)

        elif path == "/api/symbols":
            self._send_json({"symbols": BACKTEST_SYMBOLS})

        elif path == "/api/health":
            self._send_json({"status": "ok", "service": "yfinance"})

        else:
            self._send_json({"error": "Not found"}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        pass  # Suppress logs


if __name__ == "__main__":
    print(f"yfinance service starting on port {PORT}...")
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"yfinance service running on port {PORT}")
    server.serve_forever()
