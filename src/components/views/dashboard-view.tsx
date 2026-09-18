"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ASSET_CLASSES, TOTAL_STRATEGIES, getFeaturedStrategies, getStrategyById, STRATEGIES, CATEGORY_COLORS, AssetClassId } from "@/lib/strategies-data";
import { StrategyCard } from "@/components/strategy-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, ReferenceLine } from "recharts";

const STATS = [
  { label: "Trading Strategies", value: 151, suffix: "", icon: "Layers", color: "text-emerald-400" },
  { label: "Asset Classes", value: 19, suffix: "", icon: "Grid3x3", color: "text-amber-400" },
  { label: "Backtestable Models", value: 10, suffix: "", icon: "FlaskConical", color: "text-sky-400" },
  { label: "Glossary Terms", value: 233, suffix: "", icon: "BookMarked", color: "text-violet-400" },
];

const HERO_CHART = [
  { t: 0, eq: 100000, bench: 100000 },
  { t: 1, eq: 102500, bench: 101000 },
  { t: 2, eq: 101800, bench: 100500 },
  { t: 3, eq: 105200, bench: 102200 },
  { t: 4, eq: 109800, bench: 103800 },
  { t: 5, eq: 108100, bench: 103200 },
  { t: 6, eq: 114500, bench: 104900 },
  { t: 7, eq: 121800, bench: 106100 },
  { t: 8, eq: 119200, bench: 105500 },
  { t: 9, eq: 128400, bench: 107200 },
  { t: 10, eq: 135900, bench: 108800 },
  { t: 11, eq: 142300, bench: 110100 },
];

const chartConfig = {
  eq: { label: "Strategy", color: "var(--bull)" },
  bench: { label: "Buy & Hold", color: "var(--muted-foreground)" },
};

export function DashboardView() {
  const { setView, setLibraryCategory } = useAppStore();
  const featured = getFeaturedStrategies();

  return (
    <div className="grid-bg">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 mb-4"
              >
                <Icons.Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary">Interactive Research Terminal</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] mb-3"
              >
                Explore <span className="text-primary">151 Trading Strategies</span> across every asset class
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-xl"
              >
                An interactive companion to Kakushadze &amp; Serur&apos;s encyclopedic paper. Browse the full
                strategy library, run quantitative backtests on synthetic price series, visualize options
                payoff diagrams, and compare strategies side-by-side.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="flex flex-wrap items-center gap-2"
              >
                <button
                  onClick={() => setView("library")}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Icons.Library className="h-4 w-4" /> Browse the Library
                </button>
                <button
                  onClick={() => setView("backtest")}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/40 transition-colors"
                >
                  <Icons.FlaskConical className="h-4 w-4" /> Open Backtest Lab
                </button>
                <button
                  onClick={() => setView("options")}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/40 transition-colors"
                >
                  <Icons.LineChart className="h-4 w-4" /> Options Lab
                </button>
              </motion.div>
            </div>

            {/* Hero chart card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Strategy Equity Curve</div>
                    <div className="text-base font-semibold">Momentum vs Buy &amp; Hold</div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15">
                    +42.3%
                  </Badge>
                </div>
                <ChartContainer config={chartConfig} className="aspect-[16/9] w-full">
                  <AreaChart data={HERO_CHART} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="heroEq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--bull)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--bull)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" hide />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ReferenceLine y={100000} stroke="var(--border)" strokeDasharray="3 3" />
                    <Area dataKey="bench" type="monotone" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
                    <Area dataKey="eq" type="monotone" stroke="var(--bull)" strokeWidth={2} fill="url(#heroEq)" />
                  </AreaChart>
                </ChartContainer>
                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-border">
                  <Metric label="Sharpe" value="1.84" tone="bull" />
                  <Metric label="Max DD" value="-8.2%" tone="bear" />
                  <Metric label="Win Rate" value="58%" tone="neutral" />
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8"
          >
            {STATS.map((s) => {
              const Icon = Icons[s.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
              return (
                <Card key={s.label} className="p-4 hover:border-primary/30 transition-colors group/stat">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={cn("h-4 w-4 transition-transform group-hover/stat:scale-110", s.color)} />
                    <Icons.ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-2xl font-bold font-mono tnum">
                    <AnimatedCounter value={s.value} />{s.suffix}
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
                </Card>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Strategy of the Day */}
      <StrategyOfDaySection />

      {/* Asset class grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icons.Grid3x3 className="h-4 w-4 text-primary" /> Explore by Asset Class
            </h2>
            <p className="text-xs text-muted-foreground mt-1">18 asset classes spanning the entire investable universe</p>
          </div>
          <button
            onClick={() => { setLibraryCategory("all"); setView("library"); }}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View all <Icons.ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {ASSET_CLASSES.map((ac, i) => {
            const colors = CATEGORY_COLORS[ac.id as AssetClassId];
            const Icon = (Icons as any)[ac.icon] || Icons.Circle;
            return (
              <motion.button
                key={ac.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                onClick={() => { setLibraryCategory(ac.id); setView("library"); }}
                className={cn(
                  "group relative text-left rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
                  colors.border
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", colors.bg)}>
                    <Icon className={cn("h-5 w-5", colors.text)} />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Ch.{ac.chapter}</span>
                </div>
                <div className="text-sm font-semibold mb-0.5">{ac.name}</div>
                <div className="text-[11px] text-muted-foreground leading-tight mb-3">{ac.tagline}</div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Strategies</span>
                  <span className={cn("text-sm font-mono font-bold tnum", colors.text)}>{ac.count}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Featured strategies */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icons.Star className="h-4 w-4 text-amber-400 fill-amber-400" /> Featured Strategies
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Hand-picked canonical strategies from the paper</p>
          </div>
          <button
            onClick={() => { setLibraryCategory("all"); setView("library"); }}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            All strategies <Icons.ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {featured.map((s, i) => (
            <StrategyCard key={s.id} strategy={s} index={i} />
          ))}
        </div>
      </section>

      {/* Recently viewed */}
      <RecentlyViewedSection />

      {/* CTA strip */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Ready to run the numbers?</h3>
              <p className="text-sm text-muted-foreground max-w-2xl">
                The Backtest Lab runs 10 systematic strategies on synthetic GBM price series with full metrics
                (Sharpe, Sortino, max drawdown, drawdown chart). The Options Lab renders live payoff diagrams with
                Black-Scholes Greeks for 13+ preset structures plus a custom strategy builder. The Glossary defines
                60+ key quant finance terms.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setView("backtest")}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90"
              >
                <Icons.FlaskConical className="h-4 w-4" /> Backtest Lab
              </button>
              <button
                onClick={() => setView("options")}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/40"
              >
                <Icons.LineChart className="h-4 w-4" /> Options Lab
              </button>
              <button
                onClick={() => setView("glossary")}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/40"
              >
                <Icons.BookMarked className="h-4 w-4" /> Glossary
              </button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "bull" | "bear" | "neutral" }) {
  const color = tone === "bull" ? "text-emerald-400" : tone === "bear" ? "text-rose-400" : "text-amber-400";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-sm font-mono font-bold tnum", color)}>{value}</div>
    </div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
}

function RecentlyViewedSection() {
  const { recentlyViewed, openStrategy, setLibraryCategory } = useAppStore();
  const strategies = recentlyViewed.map(getStrategyById).filter(Boolean) as NonNullable<ReturnType<typeof getStrategyById>>[];

  if (strategies.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icons.History className="h-4 w-4 text-cyan-400" /> Recently Viewed
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Pick up where you left off</p>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-terminal pb-2 -mx-1 px-1">
        {strategies.map((s, i) => {
          const colors = CATEGORY_COLORS[s.category as AssetClassId];
          const ac = ASSET_CLASSES.find((a) => a.id === s.category)!;
          const Icon = (Icons as any)[ac.icon] || Icons.Circle;
          return (
            <button
              key={s.id}
              onClick={() => openStrategy(s.id)}
              className={cn(
                "group shrink-0 w-64 text-left rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
                colors.border
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", colors.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", colors.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] text-muted-foreground tnum">{s.number}</span>
                  </div>
                  <h3 className="text-xs font-semibold leading-tight truncate">{s.name}</h3>
                </div>
                <span className="text-[9px] font-mono text-muted-foreground/60">#{i + 1}</span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{s.shortDesc}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StrategyOfDaySection() {
  const { openStrategy } = useAppStore();
  // Deterministic "strategy of the day" — changes daily based on date
  const strategy = React.useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const idx = dayOfYear % STRATEGIES.length;
    return STRATEGIES[idx];
  }, []);

  const colors = CATEGORY_COLORS[strategy.category as AssetClassId];
  const ac = ASSET_CLASSES.find((a) => a.id === strategy.category)!;
  const Icon = (Icons as any)[ac.icon] || Icons.Circle;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-6 border-t border-border">
      <Card className={cn("relative overflow-hidden p-5 sm:p-6", colors.border)}>
        <div className={cn("absolute inset-0 opacity-30 pointer-events-none", colors.bg)} />
        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
            <Icon className={cn("h-7 w-7", colors.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("gap-1", colors.text, colors.border)}>
                <Icons.Sparkles className="h-2.5 w-2.5" /> Strategy of the Day
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">{today}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className={cn("text-[10px] uppercase tracking-wide font-medium", colors.text)}>{ac.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">§{strategy.number}</span>
            </div>
            <h2 className="text-xl font-bold mb-1.5">{strategy.name}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3 max-w-3xl">{strategy.description}</p>
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              {strategy.keyConcepts.slice(0, 4).map((c) => (
                <Badge key={c} variant="secondary" className="text-[10px] bg-muted/60">{c}</Badge>
              ))}
            </div>
            <button
              onClick={() => openStrategy(strategy.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Icons.BookOpen className="h-3.5 w-3.5" /> View Full Details
              <Icons.ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {strategy.formula && (
            <div className="w-full sm:w-64 shrink-0 rounded-lg border border-border bg-card/60 px-3 py-2">
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                <Icons.Sigma className="h-2.5 w-2.5" /> Formula
              </div>
              <div className="font-mono text-[11px] text-foreground/90 break-words">{strategy.formula}</div>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}
