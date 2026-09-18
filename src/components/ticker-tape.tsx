"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

const SEED: TickerItem[] = [
  { symbol: "SPX", price: 5670.25, change: 0, changePct: 0 },
  { symbol: "NDX", price: 20145.80, change: 0, changePct: 0 },
  { symbol: "DJI", price: 42120.55, change: 0, changePct: 0 },
  { symbol: "VIX", price: 14.82, change: 0, changePct: 0 },
  { symbol: "UST10Y", price: 4.285, change: 0, changePct: 0 },
  { symbol: "DXY", price: 104.35, change: 0, changePct: 0 },
  { symbol: "GOLD", price: 2658.40, change: 0, changePct: 0 },
  { symbol: "WTI", price: 71.92, change: 0, changePct: 0 },
  { symbol: "BTC", price: 67450.0, change: 0, changePct: 0 },
  { symbol: "ETH", price: 3285.5, change: 0, changePct: 0 },
  { symbol: "EURUSD", price: 1.0512, change: 0, changePct: 0 },
  { symbol: "USDJPY", price: 156.85, change: 0, changePct: 0 },
  { symbol: "GBPUSD", price: 1.2645, change: 0, changePct: 0 },
  { symbol: "XLE", price: 94.18, change: 0, changePct: 0 },
  { symbol: "XLF", price: 48.72, change: 0, changePct: 0 },
  { symbol: "XLK", price: 222.05, change: 0, changePct: 0 },
  { symbol: "COPPER", price: 4.165, change: 0, changePct: 0 },
  { symbol: "WHEAT", price: 588.5, change: 0, changePct: 0 },
];

export function TickerTape() {
  const [items, setItems] = useState<TickerItem[]>(SEED);

  useEffect(() => {
    const id = setInterval(() => {
      setItems((prev) =>
        prev.map((it) => {
          const vol = it.symbol === "VIX" ? 0.02 : it.symbol === "BTC" ? 0.015 : 0.005;
          const shock = (Math.random() - 0.5) * 2 * vol;
          const newPrice = Math.max(0.001, it.price * (1 + shock));
          const change = newPrice - (it.price - it.change);
          return {
            ...it,
            price: newPrice,
            change,
            changePct: (change / (it.price - it.change || it.price)) * 100,
          };
        }),
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Duplicate the list for seamless scroll
  const looped = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-b border-border bg-card/50 h-9 flex items-center">
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-1.5 px-3 bg-card border-r border-border">
        <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot text-emerald-500" />
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">Live</span>
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
  if (symbol === "VIX" || symbol === "UST10Y") return p.toFixed(3);
  if (symbol === "BTC" || symbol === "NDX" || symbol === "DJI") return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (symbol === "EURUSD" || symbol === "GBPUSD") return p.toFixed(4);
  return p.toFixed(2);
}
