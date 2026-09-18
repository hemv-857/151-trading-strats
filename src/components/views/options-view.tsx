"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { OPTION_PRESETS, PresetInput, OptionLeg, OptionType, PositionAction, OptionsStrategy, bsPrice } from "@/lib/options-pricing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OptionsResponse {
  strategy: any;
  curve: { prices: number[]; payoffs: number[]; breakevens: number[]; maxProfit: number | string; maxLoss: number | string };
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

let legIdCounter = 100;
function newLegId() { return `custom-${++legIdCounter}`; }

function defaultCustomLegs(spot: number, vol: number, T: number, r: number): OptionLeg[] {
  const prem = bsPrice("call", spot, spot, T, r, vol);
  return [
    { id: newLegId(), type: "call", action: "buy", strike: spot, premium: Math.max(0.01, prem), quantity: 1 },
  ];
}

export function OptionsView() {
  const [mode, setMode] = React.useState<"preset" | "custom">("preset");
  const [presetId, setPresetId] = React.useState(OPTION_PRESETS[0].id);
  const [spot, setSpot] = React.useState(100);
  const [vol, setVol] = React.useState(0.20);
  const [T, setT] = React.useState(0.25);
  const [r, setR] = React.useState(0.03);
  const [customLegs, setCustomLegs] = React.useState<OptionLeg[]>(() => defaultCustomLegs(100, 0.20, 0.25, 0.03));
  const [resp, setResp] = React.useState<OptionsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);

  const preset = OPTION_PRESETS.find((p) => p.id === presetId)!;

  const run = React.useCallback(async () => {
    setLoading(true);
    try {
      const body =
        mode === "preset"
          ? { preset: presetId, spot, vol, T, r }
          : { strategy: { id: "custom", name: "Custom Strategy", category: "options", marketView: "Custom", description: "User-defined option legs", legs: customLegs }, spot, vol, T, r };
      const res = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setResp(await res.json());
    } catch (e: any) {
      toast.error(e?.message || "Options calc failed");
    } finally {
      setLoading(false);
    }
  }, [mode, presetId, customLegs, spot, vol, T, r]);

  React.useEffect(() => {
    const t = setTimeout(() => run(), 50);
    return () => clearTimeout(t);
  }, [mode, presetId, customLegs, spot, vol, T, r]);

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
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Icons.LineChart className="h-3.5 w-3.5 text-primary" /> Options Strategy Lab
          </div>
          {/* Mode toggle */}
          <div className="flex rounded-md border border-border bg-card overflow-hidden text-xs">
            <button
              onClick={() => setMode("preset")}
              className={cn("px-3 py-1.5 transition-colors", mode === "preset" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              Presets
            </button>
            <button
              onClick={() => setMode("custom")}
              className={cn("px-3 py-1.5 border-l border-border transition-colors", mode === "custom" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              Custom Builder
            </button>
          </div>
        </div>
        <h2 className="text-lg font-semibold">{mode === "preset" ? preset.name : "Custom Strategy Builder"}</h2>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
          {mode === "preset" ? preset.description : "Build your own options structure. Add, edit, or remove legs and watch the payoff diagram update live."}
        </p>
      </div>

      <div className="flex-1 grid lg:grid-cols-[300px_1fr] min-h-0">
        {/* Left: preset list + market params OR custom leg editor */}
        <div className="border-r border-border bg-sidebar/30 overflow-y-auto scrollbar-terminal">
          <div className="p-3 space-y-4">
            {mode === "preset" ? (
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
            ) : (
              <CustomLegEditor legs={customLegs} setLegs={setCustomLegs} spot={spot} vol={vol} T={T} r={r} />
            )}

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
                  sub={resp.curve.maxProfit === "unlimited" ? "Unlimited" : "Defined"}
                  tone="bull"
                />
                <SummaryCard
                  label="Max Loss"
                  value={fmtInfinity(resp.curve.maxLoss)}
                  sub={resp.curve.maxLoss === "unlimited" ? "Undefined" : "Defined"}
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
                <div className="flex items-center justify-between mb-3 gap-2">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <Icons.AreaChart className="h-3.5 w-3.5 text-primary" /> Payoff at Expiry
                    </h3>
                    <p className="text-[11px] text-muted-foreground">P&amp;L as a function of underlying price at expiry</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Profit
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Loss
                    </Badge>
                    <div className="flex items-center gap-1 ml-1">
                      <button
                        onClick={() => exportChartSVG("payoff-chart", `payoff-${resp.strategy.id}-${Date.now()}.svg`)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                        title="Export chart as SVG"
                      >
                        <Icons.FileImage className="h-3 w-3" /> SVG
                      </button>
                      <button
                        onClick={() => exportChartPNG("payoff-chart", `payoff-${resp.strategy.id}-${Date.now()}.png`)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                        title="Export chart as PNG"
                      >
                        <Icons.Image className="h-3 w-3" /> PNG
                      </button>
                    </div>
                  </div>
                </div>
                <div id="payoff-chart">
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
                </div>
              </Card>

              {/* Greeks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <GreekCard name="Delta" value={resp.greeks.delta.toFixed(2)} desc="Directional exposure" tone={Math.abs(resp.greeks.delta) > 30 ? "bull" : "neutral"} />
                <GreekCard name="Gamma" value={resp.greeks.gamma.toFixed(4)} desc="Convexity" tone="neutral" />
                <GreekCard name="Vega" value={resp.greeks.vega.toFixed(2)} desc="Per 1% vol move" tone={resp.greeks.vega > 0 ? "bull" : "bear"} />
                <GreekCard name="Theta" value={resp.greeks.theta.toFixed(2)} desc="Per day" tone={resp.greeks.theta < 0 ? "bear" : "bull"} />
              </div>

              {/* Greeks vs Spot chart */}
              <GreeksVsSpotChart preset={presetId} strategy={resp.strategy} spot={resp.spot} vol={resp.vol} T={resp.T} r={resp.r} mode={mode} customLegs={customLegs} />

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

function fmtInfinity(v: number | string): string {
  if (v === "unlimited" || v === Infinity) return "∞";
  if (v === -Infinity) return "-∞";
  if (typeof v === "number") return `$${v.toFixed(2)}`;
  return String(v);
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

function CustomLegEditor({ legs, setLegs, spot, vol, T, r }: {
  legs: OptionLeg[];
  setLegs: (l: OptionLeg[]) => void;
  spot: number;
  vol: number;
  T: number;
  r: number;
}) {
  const updateLeg = (id: string, patch: Partial<OptionLeg>) => {
    setLegs(legs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };
  const removeLeg = (id: string) => setLegs(legs.filter((l) => l.id !== id));
  const addLeg = (type: OptionType) => {
    const strike = Math.round(spot);
    const premium = Math.max(0.01, bsPrice(type, spot, strike, T, r, vol));
    setLegs([...legs, { id: newLegId(), type, action: "buy", strike, premium, quantity: 1 }]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Custom Legs</div>
        <Badge variant="outline" className="text-[9px] font-mono">{legs.length} leg{legs.length !== 1 ? "s" : ""}</Badge>
      </div>
      <div className="space-y-2">
        {legs.map((leg, i) => (
          <div key={leg.id} className="rounded-md border border-border bg-card p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground">Leg #{i + 1}</span>
              <button
                onClick={() => removeLeg(leg.id)}
                className="text-muted-foreground hover:text-rose-400 p-0.5 rounded hover:bg-muted/60"
                title="Remove leg"
              >
                <Icons.Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={leg.type} onValueChange={(v) => updateLeg(leg.id, { type: v as OptionType, premium: Math.max(0.01, bsPrice(v as OptionType, spot, leg.strike, T, r, vol)) })}>
                <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="put">Put</SelectItem>
                </SelectContent>
              </Select>
              <Select value={leg.action} onValueChange={(v) => updateLeg(leg.id, { action: v as PositionAction })}>
                <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] uppercase text-muted-foreground">Strike</label>
                <Input
                  type="number"
                  value={leg.strike}
                  onChange={(e) => {
                    const strike = Number(e.target.value);
                    const premium = Math.max(0.01, bsPrice(leg.type, spot, strike, T, r, vol));
                    updateLeg(leg.id, { strike, premium });
                  }}
                  className="h-7 text-[11px] font-mono tnum"
                  step={1}
                />
              </div>
              <div>
                <label className="text-[9px] uppercase text-muted-foreground">Premium</label>
                <Input
                  type="number"
                  value={leg.premium}
                  onChange={(e) => updateLeg(leg.id, { premium: Math.max(0.01, Number(e.target.value)) })}
                  className="h-7 text-[11px] font-mono tnum"
                  step={0.01}
                />
              </div>
              <div>
                <label className="text-[9px] uppercase text-muted-foreground">Qty</label>
                <Input
                  type="number"
                  value={leg.quantity}
                  onChange={(e) => updateLeg(leg.id, { quantity: Math.max(1, Math.round(Number(e.target.value))) })}
                  className="h-7 text-[11px] font-mono tnum"
                  step={1}
                  min={1}
                />
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => addLeg("call")}
          className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <Icons.Plus className="h-3 w-3" /> Add Call Leg
        </button>
        <button
          onClick={() => addLeg("put")}
          className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        >
          <Icons.Plus className="h-3 w-3" /> Add Put Leg
        </button>
      </div>
    </div>
  );
}

// Chart export helpers — serialize the Recharts SVG and download as SVG or PNG
function getChartSVGString(containerId: string): string | null {
  const container = document.getElementById(containerId);
  if (!container) return null;
  const svg = container.querySelector("svg");
  if (!svg) return null;
  // Clone and inline the background color
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("style", "background: #1a1a1f;");
  const serializer = new XMLSerializer();
  return serializer.serializeToString(clone);
}

function downloadString(content: string, filename: string, type: string) {
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

function exportChartSVG(containerId: string, filename: string) {
  const svg = getChartSVGString(containerId);
  if (!svg) { toast.error("Could not find chart to export"); return; }
  downloadString(svg, filename, "image/svg+xml");
  toast.success("SVG exported");
}

function exportChartPNG(containerId: string, filename: string) {
  const svgStr = getChartSVGString(containerId);
  if (!svgStr) { toast.error("Could not find chart to export"); return; }
  const svg = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svg);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const scale = 2; // retina-quality
    const w = img.width.baseVal.value || 800;
    const h = img.height.baseVal.value || 400;
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) { toast.error("Canvas not supported"); return; }
    ctx.fillStyle = "#1a1a1f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) { toast.error("PNG conversion failed"); return; }
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(pngUrl);
      toast.success("PNG exported");
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { toast.error("Could not render chart to image"); URL.revokeObjectURL(url); };
  img.src = url;
}

// Greeks vs Spot chart — shows how each Greek changes across a range of spot prices
function GreeksVsSpotChart({ preset, strategy, spot, vol, T, r, mode, customLegs }: {
  preset: string;
  strategy: any;
  spot: number;
  vol: number;
  T: number;
  r: number;
  mode: "preset" | "custom";
  customLegs: OptionLeg[];
}) {
  const [data, setData] = React.useState<{ spots: number[]; greeks: { delta: number[]; gamma: number[]; vega: number[]; theta: number[] } } | null>(null);
  const [activeGreek, setActiveGreek] = React.useState<"delta" | "gamma" | "vega" | "theta">("delta");

  React.useEffect(() => {
    let cancelled = false;
    const body =
      mode === "preset"
        ? { preset, spot, vol, T, r }
        : { strategy: { id: "custom", name: "Custom", category: "options", marketView: "Custom", description: "test", legs: customLegs }, spot, vol, T, r };
    fetch("/api/options-greeks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("failed")))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { /* ignore — chart just won't render */ });
    return () => { cancelled = true; };
  }, [preset, spot, vol, T, r, mode, customLegs]);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    return data.spots.map((s, i) => ({
      spot: s,
      delta: data.greeks.delta[i],
      gamma: data.greeks.gamma[i],
      vega: data.greeks.vega[i],
      theta: data.greeks.theta[i],
    }));
  }, [data]);

  const greekConfig = {
    delta: { label: "Delta", color: "var(--chart-1)" },
    gamma: { label: "Gamma", color: "var(--chart-4)" },
    vega: { label: "Vega", color: "var(--chart-3)" },
    theta: { label: "Theta", color: "var(--chart-5)" },
  } as const;

  const greekMeta = {
    delta: { desc: "Directional exposure (slope of price vs spot)", unit: "" },
    gamma: { desc: "Convexity (curvature — peaks ATM)", unit: "" },
    vega: { desc: "Volatility sensitivity (per 1% vol)", unit: "" },
    theta: { desc: "Time decay (per day)", unit: "" },
  } as const;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Icons.LineChart className="h-3.5 w-3.5 text-primary" /> Greeks vs Spot Price
          </h3>
          <p className="text-[11px] text-muted-foreground">{greekMeta[activeGreek].desc}</p>
        </div>
        <div className="flex rounded-md border border-border bg-card overflow-hidden text-[10px]">
          {(["delta", "gamma", "vega", "theta"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setActiveGreek(g)}
              className={cn(
                "px-2.5 py-1 transition-colors capitalize",
                activeGreek === g ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                g !== "delta" && "border-l border-border"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      {chartData.length === 0 ? (
        <Skeleton className="aspect-[2.5/1] w-full" />
      ) : (
        <ChartContainer config={{ [activeGreek]: greekConfig[activeGreek] } as any} className="aspect-[2.5/1] w-full">
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="spot"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fontSize: 9 }}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
              stroke="var(--muted-foreground)"
            />
            <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" width={44} tickFormatter={(v) => v.toFixed(2)} />
            <ChartTooltip
              content={<ChartTooltipContent />}
              formatter={(v: any) => [Number(v).toFixed(4), greekConfig[activeGreek].label]}
              labelFormatter={(l: any) => `Spot: $${Number(l).toFixed(2)}`}
            />
            <ReferenceLine x={spot} stroke="var(--accent-gold)" strokeDasharray="4 4" label={{ value: "Spot", position: "top", fill: "var(--accent-gold)", fontSize: 10 }} />
            <Line dataKey={activeGreek} type="monotone" stroke={greekConfig[activeGreek].color} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-border">
        {(["delta", "gamma", "vega", "theta"] as const).map((g) => {
          const val = chartData.length > 0 ? chartData[Math.floor(chartData.length / 2)][g] : 0;
          const isActive = activeGreek === g;
          return (
            <button
              key={g}
              onClick={() => setActiveGreek(g)}
              className={cn(
                "rounded-md border px-2 py-1.5 text-left transition-all",
                isActive ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-primary/20"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: greekConfig[g].color }} />
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{greekConfig[g].label}</span>
              </div>
              <div className="text-xs font-mono font-bold tnum mt-0.5">{val.toFixed(3)}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
