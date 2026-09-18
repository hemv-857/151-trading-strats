"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ASSET_CLASSES, TOTAL_STRATEGIES } from "@/lib/strategies-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { chapter: 2, title: "Options", count: 19, desc: "Payoff engineering across 57 structures" },
  { chapter: 3, title: "Stocks", count: 21, desc: "Momentum, value, stat-arb, ML & market-making" },
  { chapter: 4, title: "ETFs", count: 8, desc: "Sector rotation, dual-momentum, LETF decay" },
  { chapter: 5, title: "Fixed Income", count: 14, desc: "Curve trades, carry, CDS & swap basis" },
  { chapter: 7, title: "Volatility", count: 6, desc: "VIX basis, VRP, variance swaps & skew" },
  { chapter: 8, title: "FX", count: 6, desc: "Carry, momentum & triangular arb" },
  { chapter: 10, title: "Futures", count: 6, desc: "Hedging, calendar spreads & CTA trends" },
  { chapter: 18, title: "Crypto", count: 2, desc: "Neural nets & sentiment classification" },
];

export function AboutView() {
  const { setView, setLibraryCategory } = useAppStore();

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      {/* Hero */}
      <Card className="relative overflow-hidden p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <Badge variant="outline" className="mb-3 gap-1.5 border-primary/30 text-primary">
            <Icons.BookOpen className="h-3 w-3" /> Source Paper
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">151 Trading Strategies</h1>
          <p className="text-sm text-muted-foreground mb-3">Zura Kakushadze &amp; Juan Andrés Serur · 2018 · SSRN #3247865</p>
          <p className="text-sm leading-relaxed text-foreground/90 max-w-3xl">
            An encyclopedic survey of over 150 trading strategies across every major asset class. The paper provides
            detailed descriptions, over 550 mathematical formulas, source code for out-of-sample backtesting, around
            2,000 bibliographic references, and over 900 glossary, acronym and math definitions. The presentation is
            descriptive and pedagogical — a guided tour of the quant trading landscape.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <Stat label="Strategies" value={`${TOTAL_STRATEGIES}+`} icon="Layers" />
            <Stat label="Asset Classes" value={`${ASSET_CLASSES.length}`} icon="Grid3x3" />
            <Stat label="Formulas" value="550+" icon="Sigma" />
            <Stat label="References" value="2,000+" icon="BookMarked" />
          </div>
        </div>
      </Card>

      {/* Chapter highlights */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Icons.BookMarked className="h-4 w-4 text-primary" /> Chapter Highlights
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {HIGHLIGHTS.map((h) => (
            <Card key={h.chapter} className="p-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => { setLibraryCategory(Object.keys(ASSET_CLASSES).find(() => false) || "all"); setView("library"); }}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground">Ch. {h.chapter}</span>
                <Badge variant="outline" className="text-[9px] font-mono">{h.count}</Badge>
              </div>
              <div className="text-sm font-semibold mb-1">{h.title}</div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{h.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* What this app does */}
      <section className="mb-6">
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Icons.Cpu className="h-4 w-4 text-primary" /> What This Terminal Does
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <FeatureCard
            icon="Library"
            title="Strategy Library"
            desc="Browse all 151 strategies with searchable filters by asset class, market view, type, risk and complexity. Each strategy includes its formula, key concepts, instruments, and max profit/loss."
            action={() => { setLibraryCategory("all"); setView("library"); }}
            actionLabel="Open Library"
          />
          <FeatureCard
            icon="FlaskConical"
            title="Backtest Lab"
            desc="Run 10 systematic strategies (MA, Bollinger Bands, RSI, MACD, channel breakout, mean reversion, momentum, pairs trading) on synthetic GBM price series with full metrics: Sharpe, Sortino, Calmar, max drawdown, win rate."
            action={() => setView("backtest")}
            actionLabel="Open Lab"
          />
          <FeatureCard
            icon="LineChart"
            title="Options Lab"
            desc="Visualize payoff diagrams for 13+ option structures (straddles, butterflies, iron condors, collars) plus a custom strategy builder. Live Black-Scholes Greeks, breakevens, and net cost."
            action={() => setView("options")}
            actionLabel="Open Lab"
          />
          <FeatureCard
            icon="BookMarked"
            title="Glossary"
            desc="475 curated quant finance definitions across 7 categories — from options Greeks to yield-curve trades. Searchable, expandable, with related-strategy links."
            action={() => setView("glossary")}
            actionLabel="Open Glossary"
          />
        </div>
      </section>

      {/* Methodology */}
      <section className="mb-6">
        <Card className="p-5">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Icons.Microscope className="h-4 w-4 text-primary" /> Methodology &amp; Limitations
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Icons.Check className="h-3 w-3 text-emerald-400" /> What's modeled</h3>
              <ul className="space-y-1.5 text-xs text-foreground/80">
                <li className="flex gap-1.5"><span className="text-emerald-400">•</span> Geometric Brownian Motion price generation with regime shifts</li>
                <li className="flex gap-1.5"><span className="text-emerald-400">•</span> Seeded RNG for reproducible backtests</li>
                <li className="flex gap-1.5"><span className="text-emerald-400">•</span> Black-Scholes option pricing with Greeks</li>
                <li className="flex gap-1.5"><span className="text-emerald-400">•</span> Cointegrated pair simulation for stat-arb</li>
                <li className="flex gap-1.5"><span className="text-emerald-400">•</span> Full performance attribution metrics</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Icons.AlertTriangle className="h-3 w-3 text-amber-400" /> Not modeled</h3>
              <ul className="space-y-1.5 text-xs text-foreground/80">
                <li className="flex gap-1.5"><span className="text-amber-400">•</span> Transaction costs, slippage, market impact</li>
                <li className="flex gap-1.5"><span className="text-amber-400">•</span> Funding costs, dividends, borrow fees</li>
                <li className="flex gap-1.5"><span className="text-amber-400">•</span> Real historical market data</li>
                <li className="flex gap-1.5"><span className="text-amber-400">•</span> Portfolio-level risk constraints</li>
                <li className="flex gap-1.5"><span className="text-amber-400">•</span> Out-of-sample validation across regimes</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border rounded-md bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
            <p className="text-xs text-amber-200/90 flex items-start gap-2">
              <Icons.ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span><strong>Educational use only.</strong> This terminal is a pedagogical companion to the source paper. Synthetic data is used throughout — no results here constitute investment advice or a recommendation to trade any security.</span>
            </p>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-4">
        <Button onClick={() => setView("dashboard")} variant="outline" className="gap-2">
          <Icons.Home className="h-4 w-4" /> Dashboard
        </Button>
        <Button onClick={() => { setLibraryCategory("all"); setView("library"); }} className="gap-2">
          <Icons.Library className="h-4 w-4" /> Explore Strategies
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  const Icon = Icons[icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <Icon className="h-4 w-4 text-primary mb-1.5" />
      <div className="text-xl font-bold font-mono tnum">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, action, actionLabel }: { icon: string; title: string; desc: string; action: () => void; actionLabel: string }) {
  const Icon = Icons[icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
  return (
    <Card className="p-4 flex flex-col">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>
      <button onClick={action} className="mt-3 text-xs text-primary hover:underline flex items-center gap-1 self-start">
        {actionLabel} <Icons.ArrowRight className="h-3 w-3" />
      </button>
    </Card>
  );
}
