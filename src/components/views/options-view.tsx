"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { OPTION_PRESETS, PresetInput } from "@/lib/options-pricing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OptionsResponse {
  strategy: any;
  curve: { prices: number[]; payoffs: number[]; breakevens: number[]; maxProfit: number; maxLoss: number };
  greeks: { delta: number; gamma: number; vega: number; theta: number };
  netCost: number;
  spot: number;
  vol: number;
  T: number;
  r: number;
}

const chartConfig = {
  payoff: { label: "Payoff", color: "var(--bull)" },
};

export function OptionsView() {
  const [presetId, setPresetId] = React.useState(OPTION_PRESETS[0].id);
  const [spot, setSpot] = React.useState(100);
  const [vol, setVol] = React.useState(0.20);
  const [T, setT] = React.useState(0.25);
  const [r, setR] = React.useState(0.03);
  const [resp, setResp] = React.useState<OptionsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const preset = OPTION_PRESETS.find((p) => p.id === presetId)!;

  const run = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: presetId, spot, vol, T, r }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setResp(await res.json());
    } catch (e: any) {
      toast.error(e?.message || "Options calc failed");
    } finally {
      setLoading(false);
    }
  }, [presetId, spot, vol, T, r]);

  React.useEffect(() => {
    const t = setTimeout(() => run(), 50);
    return () => clearTimeout(t);
  }, [presetId, spot, vol, T, r]);

  // Build chart data
  const chartData = React.useMemo(() => {
    if (!resp) return [];
    return resp.curve.prices.map((p, i) => ({ price: p, payoff: resp.curve.payoffs[i] }));
  }, [resp]);

  const yDomain = React.useMemo(() => {
    if (!chartData.length) return ["auto", "auto"];
    const vals = chartData.map((d) => d.payoff);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max((max - min) * 0.15, 5);
    return [min - pad, max + pad];
  }, [chartData]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
          <Icons.LineChart className="h-3.5 w-3.5 text-primary" /> Options Strategy Lab
        </div>
        <h2 className="text-lg font-semibold">{preset.name}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">{preset.description}</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-[280px_1fr] min-h-0">
        {/* Left: preset list + market params */}
        <div className="border-r border-border bg-sidebar/30 overflow-y-auto scrollbar-terminal">
          <div className="p-3 space-y-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Preset Strategy</div>
              <div className="space-y-1">
                {OPTION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPresetId(p.id)}
                    className={cn(
                      "w-full text-left rounded-md px-2.5 py-2 text-xs transition-colors border",
                      presetId === p.id
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "border-transparent hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium leading-tight">{p.name}</span>
                      <span className={cn("text-[9px] uppercase tracking-wide", viewColor(p.marketView))}>{p.marketView}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-3 px-1">Market Inputs</div>
              <div className="space-y-4 px-1">
                <ParamSlider label="Spot Price" value={spot} min={50} max={300} step={1} prefix="$" onChange={setSpot} />
                <ParamSlider label="Implied Volatility" value={vol} min={0.05} max={0.8} step={0.01} suffix="" format={(v) => `${(v * 100).toFixed(0)}%`} onChange={setVol} />
                <ParamSlider label="Time to Expiry" value={T} min={0.02} max={2} step={0.01} suffix=" yr" format={(v) => `${v.toFixed(2)} (${(v * 365).toFixed(0)}d)`} onChange={setT} />
                <ParamSlider label="Risk-free Rate" value={r} min={0} max={0.1} step={0.005} suffix="" format={(v) => `${(v * 100).toFixed(1)}%`} onChange={setR} />
              </div>
            </div>

            <div className="pt-3 border-t border-border px-1">
              <Button onClick={run} disabled={loading} className="w-full gap-2">
                {loading ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : <Icons.RefreshCw className="h-4 w-4" />}
                Recompute
              </Button>
            </div>
          </div>
        </div>

        {/* Right: payoff + greeks */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollbar-terminal">
          {loading && !resp ? (
            <div className="p-4 sm:p-6 space-y-4">
              <Skeleton className="h-72 w-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            </div>
          ) : resp ? (
            <div className="p-4 sm:p-6 space-y-4">
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <SummaryCard
                  label="Net Cost"
                  value={resp.netCost >= 0 ? `-$${Math.abs(resp.netCost).toFixed(2)}` : `+$${Math.abs(resp.netCost).toFixed(2)}`}
                  sub={resp.netCost >= 0 ? "Debit" : "Credit"}
                  tone={resp.netCost >= 0 ? "bear" : "bull"}
                />
                <SummaryCard
                  label="Max Profit"
                  value={fmtInfinity(resp.curve.maxProfit)}
                  sub={resp.curve.maxProfit === Infinity ? "Unlimited" : "Defined"}
                  tone="bull"
                />
                <SummaryCard
                  label="Max Loss"
                  value={fmtInfinity(resp.curve.maxLoss)}
                  sub={resp.curve.maxLoss === -Infinity ? "Undefined" : "Defined"}
                  tone="bear"
                />
                <SummaryCard
                  label="Breakevens"
                  value={resp.curve.breakevens.length ? resp.curve.breakevens.map((b) => `$${b.toFixed(2)}`).join(", ") : "—"}
                  sub={resp.curve.breakevens.length ? `${resp.curve.breakevens.length} point(s)` : "None"}
                  tone="neutral"
                />
              </div>

              {/* Payoff diagram */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.AreaChart className="h-3.5 w-3.5 text-primary" /> Payoff at Expiry
                    </h3>
                    <p className="text-[11px] text-muted-foreground">P&amp;L as a function of underlying price at expiry</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <Badge variant="outline" className="gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Profit
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Loss
                    </Badge>
                  </div>
                </div>
                <ChartContainer config={chartConfig} className="aspect-[2/1] w-full">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--bull)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--bull)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="lossFill" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="var(--bear)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--bear)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="price"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tick={{ fontSize: 9 }}
                      tickFormatter={(v) => `$${v.toFixed(0)}`}
                      stroke="var(--muted-foreground)"
                    />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `$${v}`} stroke="var(--muted-foreground)" width={44} domain={yDomain} />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                      formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Payoff"]}
                      labelFormatter={(l: any) => `Price: $${Number(l).toFixed(2)}`}
                    />
                    <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />
                    <ReferenceLine x={resp.spot} stroke="var(--accent-gold)" strokeDasharray="4 4" label={{ value: "Spot", position: "top", fill: "var(--accent-gold)", fontSize: 10 }} />
                    {resp.curve.breakevens.map((be, i) => (
                      <ReferenceDot key={i} x={be} y={0} r={3} fill="var(--accent-gold)" stroke="var(--background)" strokeWidth={1} label={{ value: "BE", position: "bottom", fill: "var(--accent-gold)", fontSize: 9 }} />
                    ))}
                    <Area dataKey="payoff" type="monotone" stroke="var(--bull)" strokeWidth={2} fill="url(#profitFill)" />
                  </AreaChart>
                </ChartContainer>
              </Card>

              {/* Greeks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <GreekCard name="Delta" value={resp.greeks.delta.toFixed(2)} desc="Directional exposure" tone={Math.abs(resp.greeks.delta) > 30 ? "bull" : "neutral"} />
                <GreekCard name="Gamma" value={resp.greeks.gamma.toFixed(4)} desc="Convexity" tone="neutral" />
                <GreekCard name="Vega" value={resp.greeks.vega.toFixed(2)} desc="Per 1% vol move" tone={resp.greeks.vega > 0 ? "bull" : "bear"} />
                <GreekCard name="Theta" value={resp.greeks.theta.toFixed(2)} desc="Per day" tone={resp.greeks.theta < 0 ? "bear" : "bull"} />
              </div>

              {/* Legs table */}
              <Card className="p-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                  <Icons.Layers className="h-3.5 w-3.5 text-primary" /> Strategy Legs
                </h3>
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="text-left px-2 py-1.5 font-semibold">Leg</th>
                        <th className="text-left px-2 py-1.5 font-semibold">Type</th>
                        <th className="text-left px-2 py-1.5 font-semibold">Action</th>
                        <th className="text-right px-2 py-1.5 font-semibold">Strike</th>
                        <th className="text-right px-2 py-1.5 font-semibold">Premium</th>
                        <th className="text-right px-2 py-1.5 font-semibold">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resp.strategy.legs.map((leg: any, i: number) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-2 py-1.5 font-mono text-muted-foreground">#{i + 1}</td>
                          <td className="px-2 py-1.5">
                            <Badge variant="outline" className="text-[9px] capitalize">{leg.type}</Badge>
                          </td>
                          <td className="px-2 py-1.5">
                            <Badge variant="outline" className={cn("text-[9px] capitalize", leg.action === "buy" ? "text-emerald-400 border-emerald-500/30" : "text-rose-400 border-rose-500/30")}>
                              {leg.action}
                            </Badge>
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono tnum">${leg.strike.toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-right font-mono tnum">${leg.premium.toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-right font-mono tnum">{leg.quantity}</td>
                        </tr>
                      ))}
                      {resp.strategy.stock && (
                        <tr className="border-t border-border">
                          <td className="px-2 py-1.5 font-mono text-muted-foreground">stock</td>
                          <td className="px-2 py-1.5">
                            <Badge variant="outline" className="text-[9px]">STOCK</Badge>
                          </td>
                          <td className="px-2 py-1.5">
                            <Badge variant="outline" className={cn("text-[9px] capitalize", resp.strategy.stock.action === "buy" ? "text-emerald-400 border-emerald-500/30" : "text-rose-400 border-rose-500/30")}>
                              {resp.strategy.stock.action}
                            </Badge>
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono tnum">${resp.strategy.stock.price.toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-right text-muted-foreground">—</td>
                          <td className="px-2 py-1.5 text-right font-mono tnum">{resp.strategy.stock.shares}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function viewColor(view: string): string {
  if (view.includes("Bullish")) return "text-emerald-400";
  if (view.includes("Bearish")) return "text-rose-400";
  if (view.includes("Volatility")) return view.includes("Long") ? "text-violet-400" : "text-cyan-400";
  return "text-amber-400";
}

function fmtInfinity(v: number): string {
  if (v === Infinity) return "∞";
  if (v === -Infinity) return "-∞";
  return `$${v.toFixed(2)}`;
}

function ParamSlider({ label, value, min, max, step, prefix = "", suffix = "", format, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-[11px] text-foreground/80">{label}</Label>
        <span className="text-[11px] font-mono font-semibold tnum bg-muted/60 px-1.5 py-0.5 rounded">
          {format ? format(value) : `${prefix}${value}${suffix}`}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} className="h-1.5" />
    </div>
  );
}

function SummaryCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "bull" | "bear" | "neutral" }) {
  const color = tone === "bull" ? "text-emerald-400" : tone === "bear" ? "text-rose-400" : "text-amber-400";
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-base font-bold font-mono tnum truncate", color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </Card>
  );
}

function GreekCard({ name, value, desc, tone }: { name: string; value: string; desc: string; tone: "bull" | "bear" | "neutral" }) {
  const color = tone === "bull" ? "text-emerald-400" : tone === "bear" ? "text-rose-400" : "text-amber-400";
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{name}</span>
        <span className="text-[10px] font-mono text-muted-foreground">γ</span>
      </div>
      <div className={cn("text-base font-bold font-mono tnum", color)}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{desc}</div>
    </Card>
  );
}
