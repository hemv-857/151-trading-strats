"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { BACKTEST_STRATEGIES, BacktestResult } from "@/lib/backtest-engine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STRATEGY_COLORS = ["var(--chart-1)", "var(--chart-4)", "var(--chart-5)"];
const STRATEGY_COLORS_LIGHT = ["oklch(0.72 0.17 155)", "oklch(0.62 0.18 250)", "oklch(0.70 0.20 305)"];

interface CompareResult {
  strategyId: string;
  strategyName: string;
  metrics: BacktestResult["metrics"];
  equity: BacktestResult["equity"];
  params: Record<string, number | string>;
  error?: string;
}

interface StrategySlot {
  strategyId: string;
  bars: number;
  seed: number;
  drift: number;
  volatility: number;
}

export function BacktestCompareView() {
  const [slots, setSlots] = React.useState<StrategySlot[]>([
    { strategyId: "single-moving-average", bars: 500, seed: 42, drift: 0.08, volatility: 0.2 },
    { strategyId: "two-moving-averages", bars: 500, seed: 42, drift: 0.08, volatility: 0.2 },
  ]);
  const [results, setResults] = React.useState<CompareResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  const run = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backtest-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategies: slots.map((s) => ({
            strategyId: s.strategyId,
            params: { bars: s.bars, seed: s.seed, drift: s.drift, volatility: s.volatility },
          })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = (await res.json()) as { results: CompareResult[] };
      setResults(data.results);
      toast.success(`Compared ${data.results.length} strategies`);
    } catch (e: any) {
      toast.error(e?.message || "Compare failed");
    } finally {
      setLoading(false);
    }
  }, [slots]);

  React.useEffect(() => {
    const t = setTimeout(() => run(), 50);
    return () => clearTimeout(t);
  }, []);

  const addSlot = () => {
    if (slots.length >= 3) return;
    setSlots([...slots, { strategyId: "bollinger-bands", bars: slots[0].bars, seed: slots[0].seed, drift: slots[0].drift, volatility: slots[0].volatility }]);
  };
  const removeSlot = (i: number) => setSlots(slots.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, patch: Partial<StrategySlot>) => setSlots(slots.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  // Build overlaid chart data — use the first result's dates as the x-axis
  const chartData = React.useMemo(() => {
    if (results.length === 0) return [];
    const n = Math.min(...results.map((r) => r.equity?.length || 0));
    if (n === 0) return [];
    const data: any[] = [];
    for (let i = 0; i < n; i++) {
      const row: any = { t: i, date: results[0].equity[i]?.date ?? "" };
      results.forEach((r, idx) => {
        row[`s${idx}`] = r.equity[i]?.equity;
      });
      data.push(row);
    }
    return data;
  }, [results]);

  const chartConfig = React.useMemo(() => {
    const cfg: any = {};
    results.forEach((r, idx) => {
      cfg[`s${idx}`] = { label: r.strategyName, color: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] };
    });
    return cfg;
  }, [results]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Icons.BarChart3 className="h-3.5 w-3.5 text-primary" /> Compare Backtests
          </div>
          <Button onClick={run} disabled={loading} size="sm" className="gap-2">
            {loading ? <Icons.Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icons.RefreshCw className="h-3.5 w-3.5" />}
            {loading ? "Running…" : "Run Comparison"}
          </Button>
        </div>
        <h2 className="text-lg font-semibold">Side-by-side equity curves</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Run up to 3 strategies on the same price series (same bars, seed) and overlay their equity curves.</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-[320px_1fr] min-h-0">
        {/* Left: strategy slots */}
        <div className="border-r border-border bg-sidebar/30 overflow-y-auto scrollbar-terminal">
          <div className="p-3 space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1 flex items-center justify-between">
              <span>Strategies ({slots.length}/3)</span>
              {slots.length < 3 && (
                <button onClick={addSlot} className="text-primary hover:underline flex items-center gap-1 normal-case tracking-normal text-[11px]">
                  <Icons.Plus className="h-3 w-3" /> Add
                </button>
              )}
            </div>
            {slots.map((slot, i) => (
              <SlotEditor
                key={i}
                slot={slot}
                index={i}
                onUpdate={(patch) => updateSlot(i, patch)}
                onRemove={slots.length > 1 ? () => removeSlot(i) : undefined}
              />
            ))}

            <div className="pt-3 border-t border-border px-1 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Common Settings</div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Bars</label>
                <input
                  type="range"
                  min={100} max={1000} step={50}
                  value={slots[0].bars}
                  onChange={(e) => setSlots(slots.map((s) => ({ ...s, bars: Number(e.target.value) })))}
                  className="w-full h-1.5"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono"><span>100</span><span>{slots[0].bars}</span><span>1000</span></div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Random Seed</label>
                <input
                  type="range"
                  min={1} max={999} step={1}
                  value={slots[0].seed}
                  onChange={(e) => setSlots(slots.map((s) => ({ ...s, seed: Number(e.target.value) })))}
                  className="w-full h-1.5"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono"><span>1</span><span>{slots[0].seed}</span><span>999</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: overlaid chart + metrics table */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-terminal">
          {loading && results.length === 0 ? (
            <div className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Overlaid equity curve */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.LineChart className="h-3.5 w-3.5 text-primary" /> Overlaid Equity Curves
                    </h3>
                    <p className="text-[11px] text-muted-foreground">All strategies run on the same price series</p>
                  </div>
                </div>
                <ChartContainer config={chartConfig} className="aspect-[2.4/1] w-full">
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(v) => String(v).slice(0, 7)} interval="preserveStartEnd" minTickGap={40} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="var(--muted-foreground)" width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ReferenceLine y={100000} stroke="var(--border)" strokeDasharray="3 3" />
                    {results.map((_, idx) => (
                      <Line key={idx} dataKey={`s${idx}`} type="monotone" stroke={STRATEGY_COLORS[idx % STRATEGY_COLORS.length]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ChartContainer>
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border">
                  {results.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                      <span className="h-2 w-3 rounded-sm" style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }} />
                      <span className="font-medium truncate max-w-[140px]">{r.strategyName}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Metrics comparison table */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <Icons.Table className="h-3.5 w-3.5 text-primary" /> Metrics Comparison
                </h3>
                <div className="overflow-x-auto scrollbar-terminal">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left px-2.5 py-2 font-semibold">Metric</th>
                        {results.map((r, idx) => (
                          <th key={idx} className="text-right px-2.5 py-2 font-semibold">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STRATEGY_COLORS[idx % STRATEGY_COLORS.length] }} />
                              <span className="truncate max-w-[120px]">{r.strategyName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Total Return", fmt: (m: any) => `${m.totalReturn >= 0 ? "+" : ""}${(m.totalReturn * 100).toFixed(2)}%`, tone: (m: any) => m.totalReturn >= 0 ? "text-emerald-400" : "text-rose-400" },
                        { label: "CAGR", fmt: (m: any) => `${(m.cagr * 100).toFixed(2)}%`, tone: (m: any) => m.cagr >= 0 ? "text-emerald-400" : "text-rose-400" },
                        { label: "Sharpe", fmt: (m: any) => m.sharpe.toFixed(2), tone: (m: any) => m.sharpe >= 1 ? "text-emerald-400" : m.sharpe >= 0 ? "text-amber-400" : "text-rose-400" },
                        { label: "Sortino", fmt: (m: any) => m.sortino.toFixed(2), tone: () => "text-foreground" },
                        { label: "Max Drawdown", fmt: (m: any) => `${(m.maxDrawdown * 100).toFixed(2)}%`, tone: () => "text-rose-400" },
                        { label: "Volatility", fmt: (m: any) => `${(m.volatility * 100).toFixed(2)}%`, tone: () => "text-amber-400" },
                        { label: "Win Rate", fmt: (m: any) => `${(m.winRate * 100).toFixed(1)}%`, tone: (m: any) => m.winRate >= 0.5 ? "text-emerald-400" : "text-foreground" },
                        { label: "Calmar", fmt: (m: any) => m.calmar.toFixed(2), tone: (m: any) => m.calmar >= 1 ? "text-emerald-400" : "text-foreground" },
                        { label: "Alpha", fmt: (m: any) => `${m.alpha >= 0 ? "+" : ""}${(m.alpha * 100).toFixed(2)}%`, tone: (m: any) => m.alpha >= 0 ? "text-emerald-400" : "text-rose-400" },
                        { label: "Trades", fmt: (m: any) => String(m.numTrades), tone: () => "text-foreground" },
                      ].map((row) => (
                        <tr key={row.label} className="border-t border-border">
                          <td className="px-2.5 py-1.5 text-muted-foreground font-medium">{row.label}</td>
                          {results.map((r, idx) => (
                            <td key={idx} className={cn("px-2.5 py-1.5 text-right font-mono tnum", row.tone(r.metrics))}>
                              {r.error ? "—" : row.fmt(r.metrics)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Icons.BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No comparison yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Run Comparison" to overlay strategies</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotEditor({ slot, index, onUpdate, onRemove }: { slot: StrategySlot; index: number; onUpdate: (patch: Partial<StrategySlot>) => void; onRemove?: () => void }) {
  const def = BACKTEST_STRATEGIES.find((b) => b.id === slot.strategyId);
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2.5" style={{ borderTopColor: STRATEGY_COLORS_LIGHT[index % 3], borderTopWidth: 2 }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STRATEGY_COLORS_LIGHT[index % 3] }} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Slot {index + 1}</span>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-rose-400 p-0.5">
            <Icons.X className="h-3 w-3" />
          </button>
        )}
      </div>
      <select
        value={slot.strategyId}
        onChange={(e) => onUpdate({ strategyId: e.target.value })}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      >
        {BACKTEST_STRATEGIES.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      <p className="text-[10px] text-muted-foreground leading-tight">{def?.description}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] uppercase text-muted-foreground">Drift</label>
          <input
            type="number" step={0.01} min={-0.2} max={0.3}
            value={slot.drift}
            onChange={(e) => onUpdate({ drift: Number(e.target.value) })}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] font-mono tnum"
          />
        </div>
        <div>
          <label className="text-[9px] uppercase text-muted-foreground">Vol</label>
          <input
            type="number" step={0.01} min={0.05} max={0.6}
            value={slot.volatility}
            onChange={(e) => onUpdate({ volatility: Number(e.target.value) })}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] font-mono tnum"
          />
        </div>
      </div>
    </div>
  );
}
