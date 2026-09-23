"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

// Fallback seed data (used while loading real data or if fetch fails)
const FALLBACK: TickerItem[] = [
  { symbol: "SPX", price: 0, change: 0, changePct: 0 },
  { symbol: "NDX", price: 0, change: 0, changePct: 0 },
  { symbol: "VIX", price: 0, change: 0, changePct: 0 },
  { symbol: "UST10Y", price: 0, change: 0, changePct: 0 },
  { symbol: "GOLD", price: 0, change: 0, changePct: 0 },
  { symbol: "WTI", price: 0, change: 0, changePct: 0 },
  { symbol: "BTC", price: 0, change: 0, changePct: 0 },
  { symbol: "ETH", price: 0, change: 0, changePct: 0 },
];

export function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  // Fetch real quotes from yfinance
  useEffect(() => {
    let cancelled = false;

    async function fetchQuotes() {
      try {
        const res = await fetch("/api/quotes");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.quotes) return;
        const valid = data.quotes.filter((q: TickerItem) => q.price > 0);
        if (valid.length > 0) {
          setItems(valid);
          setLoading(false);
        }
      } catch {
        // Silently fall back to seed data
      }
    }

    fetchQuotes();
    // Refresh every 60 seconds
    const id = setInterval(fetchQuotes, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Duplicate the list for seamless scroll
  const looped = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-border bg-card/50 h-9 flex items-center">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-1.5 px-3 bg-card border-r border-border">
        <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot text-emerald-500" />
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          {loading ? "Loading" : "Live"}
        </span>
      </div>
      <div className="flex ticker-scroll whitespace-nowrap pl-20">
        {looped.map((it, i) => {
          const up = it.changePct >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs font-mono tabular-nums">
              <span className="font-semibold text-foreground">{it.symbol}</span>
              <span className="text-muted-foreground">{formatPrice(it.price, it.symbol)}</span>
              <span className={up ? "text-emerald-400" : "text-rose-400"}>
                {up ? "▲" : "▼"} {Math.abs(it.changePct).toFixed(2)}%
              </span>
              <span className="text-border">|</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function formatPrice(p: number, symbol: string) {
  if (p === 0) return "—";
  if (symbol === "VIX" || symbol === "UST10Y") return p.toFixed(3);
  if (symbol === "BTC" || symbol === "NDX" || symbol === "DJI" || symbol === "SPX") return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === "EURUSD" || symbol === "GBPUSD") return p.toFixed(4);
  return p.toFixed(2);
}
