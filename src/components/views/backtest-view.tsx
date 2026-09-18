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
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";
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
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button onClick={runBacktest} disabled={loading} className="gap-2">
              {loading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.Play className="h-4 w-4" />}
              {loading ? "Running…" : "Run Backtest"}
            </Button>
            {result && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => exportCSV(result)} className="gap-1.5 h-9" title="Export equity curve as CSV">
                  <Icons.FileSpreadsheet className="h-3.5 w-3.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportJSON(result)} className="gap-1.5 h-9" title="Export full result as JSON">
                  <Icons.FileJson className="h-3.5 w-3.5" /> JSON
                </Button>
              </div>
            )}
          </div>
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
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Parameters</div>
                  <button
                    onClick={() => { const init: Record<string, number> = {}; for (const p of def.params) init[p.key] = p.default; setParams(init); toast("Reset to defaults"); }}
                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1"
                    title="Reset to defaults"
                  >
                    <Icons.RotateCcw className="h-2.5 w-2.5" /> Reset
                  </button>
                </div>
                {/* Quick presets — apply a regime to bars/drift/vol */}
                <div className="mb-3 px-1">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70 mb-1.5">Quick Regime</div>
                  <div className="grid grid-cols-2 gap-1">
                    {([
                      { label: "Trending", patch: { drift: 0.15, volatility: 0.12 }, icon: "TrendingUp", tone: "text-emerald-400" },
                      { label: "Volatile", patch: { drift: 0.05, volatility: 0.35 }, icon: "Activity", tone: "text-rose-400" },
                      { label: "Range-bound", patch: { drift: 0.0, volatility: 0.15 }, icon: "Minus", tone: "text-amber-400" },
                      { label: "Bearish", patch: { drift: -0.12, volatility: 0.25 }, icon: "TrendingDown", tone: "text-rose-400" },
                    ] as const).map((preset) => {
                      const PIcon = Icons[preset.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => setParams((prev) => ({ ...prev, ...preset.patch }))}
                          className="flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                          title={`Apply ${preset.label.toLowerCase()} regime`}
                        >
                          <PIcon className={cn("h-2.5 w-2.5", preset.tone)} />
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
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

              {/* Drawdown chart */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.TrendingDown className="h-3.5 w-3.5 text-rose-400" /> Drawdown
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Peak-to-trough decline (%) from the running max equity</p>
                  </div>
                  <Badge variant="outline" className="text-rose-400 border-rose-500/30 font-mono text-[10px]">
                    Max: -{(result.metrics.maxDrawdown * 100).toFixed(2)}%
                  </Badge>
                </div>
                <ChartContainer config={{ dd: { label: "Drawdown", color: "var(--bear)" } }} className="aspect-[3/1] w-full">
                  <AreaChart
                    data={(() => {
                      let peak = result.equity[0].equity;
                      return result.equity.map((e) => {
                        if (e.equity > peak) peak = e.equity;
                        const dd = e.equity / peak - 1;
                        return { date: e.date, dd: dd * 100 };
                      });
                    })()}
                    margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--bear)" stopOpacity={0.05} />
                        <stop offset="100%" stopColor="var(--bear)" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(0, 7)} interval="preserveStartEnd" minTickGap={40} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${v.toFixed(0)}%`} stroke="var(--muted-foreground)" width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, "Drawdown"]} />
                    <ReferenceLine y={0} stroke="var(--border)" />
                    <Area dataKey="dd" type="monotone" stroke="var(--bear)" strokeWidth={1.5} fill="url(#ddFill)" />
                  </AreaChart>
                </ChartContainer>
              </Card>

              {/* Monthly returns heatmap + return distribution */}
              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Icons.CalendarRange className="h-3.5 w-3.5 text-primary" /> Monthly Returns
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Performance by calendar month</p>
                    </div>
                  </div>
                  <MonthlyHeatmap equity={result.equity} />
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Icons.BarChart3 className="h-3.5 w-3.5 text-primary" /> Return Distribution
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Daily strategy returns histogram</p>
                    </div>
                  </div>
                  <ReturnDistribution equity={result.equity} />
                </Card>
              </div>

              {/* ACF (autocorrelation) chart */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.LineChart className="h-3.5 w-3.5 text-primary" /> Return Autocorrelation (ACF)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">Correlation of daily returns with their own lags — positive at lag 1 = momentum, negative = mean-reversion</p>
                  </div>
                </div>
                <ACFChart equity={result.equity} />
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

// Monthly returns heatmap — classic performance attribution viz
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function MonthlyHeatmap({ equity }: { equity: BacktestResult["equity"] }) {
  const data = React.useMemo(() => {
    // Group equity by year-month and compute monthly returns
    const monthly: Record<string, { year: number; month: number; start: number; end: number }> = {};
    for (let i = 0; i < equity.length; i++) {
      const d = new Date(equity[i].date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthly[key]) monthly[key] = { year: d.getFullYear(), month: d.getMonth(), start: equity[i].equity, end: equity[i].equity };
      monthly[key].end = equity[i].equity;
    }
    // Compute returns; carry over last equity of prev month as start
    const sorted = Object.values(monthly).sort((a, b) => a.year - b.year || a.month - b.month);
    // Use equity at start of each month = end of previous month (or first equity for first month)
    const returns: { year: number; month: number; ret: number | null }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const prevEnd = i > 0 ? sorted[i - 1].end : cur.start;
      const ret = prevEnd > 0 ? cur.end / prevEnd - 1 : null;
      returns.push({ year: cur.year, month: cur.month, ret });
    }
    // Build year → month matrix
    const years = [...new Set(returns.map((r) => r.year))].sort();
    return { years, returns };
  }, [equity]);

  if (data.years.length === 0) return <div className="text-xs text-muted-foreground">No monthly data</div>;

  // Find max abs return for color scaling
  const maxAbs = Math.max(...data.returns.map((r) => Math.abs(r.ret ?? 0)), 0.001);

  function colorFor(ret: number | null): string {
    if (ret === null) return "var(--muted)";
    const intensity = Math.min(Math.abs(ret) / maxAbs, 1);
    if (ret >= 0) {
      // green with intensity
      const alpha = 0.15 + intensity * 0.7;
      return `oklch(0.72 0.17 155 / ${alpha.toFixed(2)})`;
    }
    const alpha = 0.15 + intensity * 0.7;
    return `oklch(0.65 0.22 25 / ${alpha.toFixed(2)})`;
  }

  // Compute yearly totals
  const yearTotals: Record<number, number> = {};
  for (const r of data.returns) {
    if (r.ret === null) continue;
    yearTotals[r.year] = (yearTotals[r.year] ?? 1) * (1 + r.ret) - 1;
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto scrollbar-terminal">
        <table className="w-full text-[10px] font-mono tnum border-collapse">
          <thead>
            <tr>
              <th className="text-left px-1.5 py-1 text-muted-foreground font-semibold w-12">Year</th>
              {MONTHS.map((m) => (
                <th key={m} className="px-1 py-1 text-muted-foreground font-semibold text-center">{m}</th>
              ))}
              <th className="px-1.5 py-1 text-muted-foreground font-semibold text-right">YTD</th>
            </tr>
          </thead>
          <tbody>
            {data.years.map((year) => {
              const ytd = yearTotals[year] ?? 0;
              return (
                <tr key={year}>
                  <td className="px-1.5 py-1 text-muted-foreground font-semibold">{year}</td>
                  {MONTHS.map((_, mIdx) => {
                    const entry = data.returns.find((r) => r.year === year && r.month === mIdx);
                    const ret = entry?.ret;
                    return (
                      <td key={mIdx} className="p-0.5 text-center">
                        <div
                          className="h-6 rounded-sm flex items-center justify-center text-[9px] font-semibold transition-transform hover:scale-110 cursor-default"
                          style={{ backgroundColor: colorFor(ret) }}
                          title={ret !== null && ret !== undefined ? `${year} ${MONTHS[mIdx]}: ${(ret * 100).toFixed(2)}%` : ""}
                        >
                          {ret !== null && ret !== undefined ? `${ret >= 0 ? "+" : ""}${(ret * 100).toFixed(1)}` : "—"}
                        </div>
                      </td>
                    );
                  })}
                  <td className={cn("px-1.5 py-1 text-right font-bold", ytd >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {ytd >= 0 ? "+" : ""}{(ytd * 100).toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1">
        <div className="flex items-center gap-1.5">
          <span>Worst</span>
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: "oklch(0.65 0.22 25 / 0.85)" }} />
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: "oklch(0.65 0.22 25 / 0.4)" }} />
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: "var(--muted)" }} />
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: "oklch(0.72 0.17 155 / 0.4)" }} />
          <div className="h-3 w-8 rounded-sm" style={{ backgroundColor: "oklch(0.72 0.17 155 / 0.85)" }} />
          <span>Best</span>
        </div>
        <span>Click a cell for details</span>
      </div>
    </div>
  );
}

// Return distribution histogram
function ReturnDistribution({ equity }: { equity: BacktestResult["equity"] }) {
  const data = React.useMemo(() => {
    if (equity.length < 2) return { bins: [], stats: null };
    const returns: number[] = [];
    for (let i = 1; i < equity.length; i++) {
      returns.push(equity[i].equity / equity[i - 1].equity - 1);
    }
    const min = Math.min(...returns);
    const max = Math.max(...returns);
    const numBins = 21;
    const width = (max - min) / numBins || 0.001;
    const bins = Array.from({ length: numBins }, (_, i) => ({
      bin: i,
      lower: min + i * width,
      upper: min + (i + 1) * width,
      count: 0,
    }));
    for (const r of returns) {
      let idx = Math.floor((r - min) / width);
      if (idx >= numBins) idx = numBins - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length);
    return { bins, stats: { mean, std, min, max, n: returns.length } };
  }, [equity]);

  if (!data.stats) return <div className="text-xs text-muted-foreground">No return data</div>;

  const maxCount = Math.max(...data.bins.map((b) => b.count));

  return (
    <div className="space-y-2">
      <ChartContainer config={{ count: { label: "Freq", color: "var(--primary)" } }} className="aspect-[2/1] w-full">
        <BarChart data={data.bins} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="lower"
            tick={{ fontSize: 9 }}
            tickFormatter={(v) => `${(v * 100).toFixed(1)}%`}
            stroke="var(--muted-foreground)"
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" width={28} />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(_v: any, _n: any, item: any) => {
              const p = item?.payload;
              return [`${p.count} days (${((p.lower * 100)).toFixed(2)}% to ${(p.upper * 100).toFixed(2)}%)`, "Bucket"];
            }}
            labelFormatter={() => ""}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.bins.map((b, i) => {
              const mid = (b.lower + b.upper) / 2;
              const isPos = mid >= 0;
              return <Cell key={i} fill={isPos ? "oklch(0.72 0.17 155 / 0.7)" : "oklch(0.65 0.22 25 / 0.7)"} />;
            })}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="grid grid-cols-4 gap-2 pt-1">
        <Stat label="Mean" value={`${(data.stats.mean * 100).toFixed(3)}%`} tone="neutral" />
        <Stat label="Std Dev" value={`${(data.stats.std * 100).toFixed(3)}%`} tone="neutral" />
        <Stat label="Min" value={`${(data.stats.min * 100).toFixed(2)}%`} tone="bear" />
        <Stat label="Max" value={`${(data.stats.max * 100).toFixed(2)}%`} tone="bull" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "bull" | "bear" | "neutral" }) {
  const color = tone === "bull" ? "text-emerald-400" : tone === "bear" ? "text-rose-400" : "text-amber-400";
  return (
    <div className="rounded-md bg-muted/30 px-2 py-1">
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("text-xs font-mono font-bold tnum", color)}>{value}</div>
    </div>
  );
}

// Export helpers
function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(result: BacktestResult) {
  const header = "date,equity,benchmark,position\n";
  const rows = result.equity.map((e) =>
    `${e.date},${e.equity.toFixed(2)},${e.benchmark.toFixed(2)},${e.position}`
  ).join("\n");
  const metrics = `\n\n# Metrics\n# totalReturn,${(result.metrics.totalReturn * 100).toFixed(4)}%\n# sharpe,${result.metrics.sharpe.toFixed(4)}\n# sortino,${result.metrics.sortino.toFixed(4)}\n# maxDrawdown,${(result.metrics.maxDrawdown * 100).toFixed(4)}%\n# volatility,${(result.metrics.volatility * 100).toFixed(4)}%\n# winRate,${(result.metrics.winRate * 100).toFixed(2)}%\n# numTrades,${result.metrics.numTrades}\n# calmar,${result.metrics.calmar.toFixed(4)}\n`;
  downloadBlob(header + rows + metrics, `backtest-${result.strategyId}-${Date.now()}.csv`, "text/csv");
  toast.success("CSV exported");
}

function exportJSON(result: BacktestResult) {
  const out = {
    strategyId: result.strategyId,
    strategyName: result.strategyName,
    params: result.params,
    metrics: result.metrics,
    equity: result.equity,
    trades: result.trades,
    exportedAt: new Date().toISOString(),
  };
  downloadBlob(JSON.stringify(out, null, 2), `backtest-${result.strategyId}-${Date.now()}.json`, "application/json");
  toast.success("JSON exported");
}

// Autocorrelation function (ACF) chart
function ACFChart({ equity }: { equity: BacktestResult["equity"] }) {
  const data = React.useMemo(() => {
    if (equity.length < 30) return { acf: [], ci: 0 };
    const returns: number[] = [];
    for (let i = 1; i < equity.length; i++) {
      returns.push(equity[i].equity / equity[i - 1].equity - 1);
    }
    const n = returns.length;
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    if (variance === 0) return { acf: [], ci: 0 };
    const maxLag = Math.min(30, Math.floor(n / 4));
    const acf: { lag: number; acf: number }[] = [];
    for (let lag = 1; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) {
        sum += (returns[i] - mean) * (returns[i + lag] - mean);
      }
      acf.push({ lag, acf: sum / (variance * n) });
    }
    // 95% confidence interval ≈ ±1.96 / sqrt(n)
    const ci = 1.96 / Math.sqrt(n);
    return { acf, ci };
  }, [equity]);

  if (data.acf.length === 0) return <div className="text-xs text-muted-foreground">Insufficient data for ACF</div>;

  return (
    <div className="space-y-2">
      <ChartContainer config={{ acf: { label: "ACF", color: "var(--primary)" } }} className="aspect-[3/1] w-full">
        <BarChart data={data.acf} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="lag" tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `${v}`} />
          <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" width={36} domain={[-0.3, 0.3]} tickFormatter={(v) => v.toFixed(2)} />
          <ChartTooltip content={<ChartTooltipContent />} formatter={(v: any) => [Number(v).toFixed(4), "ACF"]} labelFormatter={(l: any) => `Lag ${l}`} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ReferenceLine y={data.ci} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={-data.ci} stroke="var(--muted-foreground)" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Bar dataKey="acf" radius={[2, 2, 0, 0]}>
            {data.acf.map((d, i) => (
              <Cell key={i} fill={Math.abs(d.acf) > data.ci ? (d.acf > 0 ? "oklch(0.72 0.17 155 / 0.8)" : "oklch(0.65 0.22 25 / 0.8)") : "var(--muted)"} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-2 w-3 bg-emerald-500/80 rounded-sm" /> Positive (momentum)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 bg-rose-500/80 rounded-sm" /> Negative (reversion)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 bg-muted rounded-sm" /> Within noise</span>
        </div>
        <span className="font-mono">95% CI: ±{data.ci.toFixed(3)}</span>
      </div>
    </div>
  );
}
