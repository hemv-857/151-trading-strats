"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { BACKTEST_STRATEGIES, BacktestResult, BacktestDef } from "@/lib/backtest-engine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const chartConfig = {
  equity: { label: "Strategy", color: "var(--bull)" },
  benchmark: { label: "Buy & Hold", color: "var(--muted-foreground)" },
};

export function BacktestView() {
  const [selectedId, setSelectedId] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("backtest:selectedId") || BACKTEST_STRATEGIES[0].id;
    }
    return BACKTEST_STRATEGIES[0].id;
  });
  const def = BACKTEST_STRATEGIES.find((b) => b.id === selectedId)!;
  const [params, setParams] = React.useState<Record<string, number>>({});
  const [result, setResult] = React.useState<BacktestResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Initialize params when strategy changes
  React.useEffect(() => {
    const init: Record<string, number> = {};
    for (const p of def.params) init[p.key] = p.default;
    setParams(init);
    localStorage.setItem("backtest:selectedId", selectedId);
  }, [def, selectedId]);

  const runBacktest = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategyId: selectedId, params }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = (await res.json()) as BacktestResult;
      setResult(data);
      toast.success(`Backtest complete · ${(data.metrics.totalReturn * 100).toFixed(1)}% return`);
    } catch (e: any) {
      toast.error(e?.message || "Backtest failed");
    } finally {
      setLoading(false);
    }
  }, [selectedId, params]);

  // Auto-run on first load / strategy change
  React.useEffect(() => {
    const t = setTimeout(() => runBacktest(), 50);
    return () => clearTimeout(t);
  }, [selectedId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
              <Icons.FlaskConical className="h-3.5 w-3.5 text-primary" /> Quantitative Backtest Engine
            </div>
            <h2 className="text-lg font-semibold">{def.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">{def.description}</p>
          </div>
          <Button onClick={runBacktest} disabled={loading} className="gap-2 shrink-0">
            {loading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Play className="h-4 w-4" />}
            {loading ? "Running…" : "Run Backtest"}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-[280px_1fr] min-h-0">
        {/* Left: strategy list + params */}
        <div className="border-r border-border bg-sidebar/30 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Strategy</div>
                <div className="space-y-1">
                  {BACKTEST_STRATEGIES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedId(b.id)}
                      className={cn(
                        "w-full text-left rounded-md px-2.5 py-2 text-xs transition-colors border",
                        selectedId === b.id
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "border-transparent hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <div className="font-medium leading-tight">{b.name}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{b.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">Parameters</div>
                <div className="space-y-3">
                  {def.params.map((p) => (
                    <div key={p.key} className="px-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-[11px] text-foreground/80">{p.label}{p.unit ? ` (${p.unit})` : ""}</Label>
                        <span className="text-[11px] font-mono font-semibold tnum bg-muted/60 px-1.5 py-0.5 rounded">
                          {params[p.key] ?? p.default}
                        </span>
                      </div>
                      <Slider
                        value={[params[p.key] ?? p.default]}
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        onValueChange={(v) => setParams((prev) => ({ ...prev, [p.key]: v[0] }))}
                        className="h-1.5"
                      />
                      <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono mt-0.5">
                        <span>{p.min}</span>
                        <span>{p.max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right: results */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-terminal">
          {loading && !result ? (
            <div className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-64 w-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            </div>
          ) : result ? (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Metrics row */}
              <MetricsGrid metrics={result.metrics} />

              {/* Equity curve */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.LineChart className="h-3.5 w-3.5 text-primary" /> Equity Curve
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Strategy vs Buy &amp; Hold benchmark</p>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Strategy</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> B&amp;H</span>
                  </div>
                </div>
                <ChartContainer config={chartConfig} className="aspect-[2.4/1] w-full">
                  <AreaChart data={result.equity} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--bull)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--bull)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(0, 7)} interval="preserveStartEnd" minTickGap={40} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area dataKey="benchmark" type="monotone" stroke="var(--muted-foreground)" strokeWidth={1} strokeDasharray="4 4" fill="none" />
                    <Area dataKey="equity" type="monotone" stroke="var(--bull)" strokeWidth={2} fill="url(#eqFill)" />
                  </AreaChart>
                </ChartContainer>
              </Card>

              {/* Price + position */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.CandlestickChart className="h-3.5 w-3.5 text-primary" /> Price &amp; Position
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Underlying price with position shading (green = long, red = short)</p>
                  </div>
                </div>
                <ChartContainer config={{ price: { label: "Price", color: "var(--foreground)" } }} className="aspect-[2.4/1] w-full">
                  <LineChart data={result.signals} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(0, 7)} interval="preserveStartEnd" minTickGap={40} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" width={36} domain={["auto", "auto"]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line dataKey="price" type="monotone" stroke="var(--foreground)" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ChartContainer>
                {/* Position strip */}
                <div className="mt-2 flex h-6 w-full overflow-hidden rounded">
                  {result.signals.map((s, i) => {
                    const pos = s.signal;
                    const bg = pos > 0 ? "bg-emerald-500/40" : pos < 0 ? "bg-rose-500/40" : "bg-muted/30";
                    return <div key={i} className={cn("flex-1", bg)} title={`${s.date}: ${pos > 0 ? "Long" : pos < 0 ? "Short" : "Flat"}`} />;
                  })}
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-3 bg-emerald-500/40" /> Long</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-3 bg-rose-500/40" /> Short</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-3 bg-muted/30" /> Flat</span>
                </div>
              </Card>

              {/* Trades table */}
              {result.trades.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.ListOrdered className="h-3.5 w-3.5 text-primary" /> Trade History
                    </h3>
                    <Badge variant="outline" className="font-mono text-[10px]">{result.trades.length} trades</Badge>
                  </div>
                  <div className="rounded-md border border-border overflow-hidden max-h-72 overflow-y-auto scrollbar-terminal">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 sticky top-0">
                        <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          <th className="text-left px-2 py-1.5 font-semibold">#</th>
                          <th className="text-left px-2 py-1.5 font-semibold">Side</th>
                          <th className="text-left px-2 py-1.5 font-semibold">Entry</th>
                          <th className="text-left px-2 py-1.5 font-semibold">Exit</th>
                          <th className="text-right px-2 py-1.5 font-semibold">Return</th>
                          <th className="text-right px-2 py-1.5 font-semibold">P&amp;L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trades.slice(0, 50).map((t, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-2 py-1.5 font-mono text-muted-foreground">{i + 1}</td>
                            <td className="px-2 py-1.5">
                              <Badge variant="outline" className={cn("text-[9px] py-0 h-4", t.side === "long" ? "text-emerald-400 border-emerald-500/30" : "text-rose-400 border-rose-500/30")}>
                                {t.side}
                              </Badge>
                            </td>
                            <td className="px-2 py-1.5 font-mono tnum">{t.entryPrice.toFixed(2)}</td>
                            <td className="px-2 py-1.5 font-mono tnum">{t.exitPrice.toFixed(2)}</td>
                            <td className={cn("px-2 py-1.5 text-right font-mono tnum", t.returnPct >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {t.returnPct >= 0 ? "+" : ""}{(t.returnPct * 100).toFixed(2)}%
                            </td>
                            <td className={cn("px-2 py-1.5 text-right font-mono tnum", t.pnl >= 0 ? "text-emerald-400" : "text-rose-400")}>
                              {t.pnl >= 0 ? "+" : ""}${Math.abs(t.pnl).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricsGrid({ metrics }: { metrics: BacktestResult["metrics"] }) {
  const items = [
    { label: "Total Return", value: `${metrics.totalReturn >= 0 ? "+" : ""}${(metrics.totalReturn * 100).toFixed(2)}%`, tone: metrics.totalReturn >= 0 ? "bull" : "bear", icon: "TrendingUp" },
    { label: "CAGR", value: `${(metrics.cagr * 100).toFixed(2)}%`, tone: metrics.cagr >= 0 ? "bull" : "bear", icon: "Percent" },
    { label: "Sharpe", value: metrics.sharpe.toFixed(2), tone: metrics.sharpe >= 1 ? "bull" : metrics.sharpe >= 0 ? "neutral" : "bear", icon: "Activity" },
    { label: "Sortino", value: metrics.sortino.toFixed(2), tone: metrics.sortino >= 1 ? "bull" : "neutral", icon: "Activity" },
    { label: "Max Drawdown", value: `${(metrics.maxDrawdown * 100).toFixed(2)}%`, tone: "bear", icon: "TrendingDown" },
    { label: "Volatility", value: `${(metrics.volatility * 100).toFixed(2)}%`, tone: "neutral", icon: "Waves" },
    { label: "Win Rate", value: `${(metrics.winRate * 100).toFixed(1)}%`, tone: metrics.winRate >= 0.5 ? "bull" : "neutral", icon: "Target" },
    { label: "Alpha", value: `${metrics.alpha >= 0 ? "+" : ""}${(metrics.alpha * 100).toFixed(2)}%`, tone: metrics.alpha >= 0 ? "bull" : "bear", icon: "Sigma" },
    { label: "Calmar", value: metrics.calmar.toFixed(2), tone: metrics.calmar >= 1 ? "bull" : "neutral", icon: "Scale" },
    { label: "Trades", value: String(metrics.numTrades), tone: "neutral", icon: "ListOrdered" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-2">
      {items.map((m) => {
        const Icon = Icons[m.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
        const color = m.tone === "bull" ? "text-emerald-400" : m.tone === "bear" ? "text-rose-400" : "text-amber-400";
        return (
          <Card key={m.label} className="p-3 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <Icon className={cn("h-3.5 w-3.5", color)} />
            </div>
            <div className={cn("text-base font-bold font-mono tnum", color)}>{m.value}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</div>
          </Card>
        );
      })}
    </div>
  );
}
