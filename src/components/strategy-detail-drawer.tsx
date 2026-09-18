"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";
import { getStrategyById, CATEGORY_COLORS, MARKET_VIEW_META, STRATEGY_TYPE_META, ASSET_CLASS_MAP, AssetClassId } from "@/lib/strategies-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

function RiskMeter({ level, label }: { level: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</span>
        <span className="text-xs font-mono font-semibold">{level}/5</span>
      </div>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-sm",
              i <= level
                ? label === "Risk"
                  ? level >= 4 ? "bg-rose-500" : level >= 3 ? "bg-amber-500" : "bg-emerald-500"
                  : "bg-primary"
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function StrategyDetailDrawer() {
  const { selectedStrategyId, detailOpen, closeDetail, toggleCompare, compareList, setView } = useAppStore();
  const router = useRouter();

  const strategy = selectedStrategyId ? getStrategyById(selectedStrategyId) : undefined;

  const handleBacktest = () => {
    if (!strategy) return;
    // Map strategy to a backtest id if supported
    const mapping: Record<string, string> = {
      "single-moving-average": "single-moving-average",
      "two-moving-averages": "two-moving-averages",
      "three-moving-averages": "three-moving-averages",
      channel: "channel",
      "etf-mean-reversion": "etf-mean-reversion",
      "price-momentum": "price-momentum",
      "pairs-trading": "pairs-trading",
    };
    const btId = mapping[strategy.id];
    if (btId) {
      localStorage.setItem("backtest:selectedId", btId);
      setView("backtest");
      closeDetail();
    }
  };

  if (!strategy) return null;
  const colors = CATEGORY_COLORS[strategy.category];
  const ac = ASSET_CLASS_MAP[strategy.category];
  const view = MARKET_VIEW_META[strategy.marketView];
  const typeMeta = STRATEGY_TYPE_META[strategy.type];
  const Icon = (Icons as any)[ac.icon] || Icons.Circle;
  const inCompare = compareList.includes(strategy.id);
  const compareFull = compareList.length >= 4 && !inCompare;

  const backtestable = ["single-moving-average", "two-moving-averages", "three-moving-averages", "channel", "etf-mean-reversion", "price-momentum", "pairs-trading"].includes(strategy.id);

  return (
    <Sheet open={detailOpen} onOpenChange={(o) => !o && closeDetail()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-card/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", colors.bg)}>
                <Icon className={cn("h-6 w-6", colors.text)} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[11px] text-muted-foreground tnum">§{strategy.number}</span>
                  <span className={cn("text-[11px] uppercase tracking-wide font-medium", colors.text)}>{ac.name}</span>
                  {strategy.featured && (
                    <Badge variant="outline" className="h-5 text-[10px] gap-1 border-amber-500/40 text-amber-400">
                      <Icons.Star className="h-2.5 w-2.5 fill-amber-400" /> Featured
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold leading-tight text-foreground pr-4">{strategy.name}</h2>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <Badge variant="outline" className={cn("h-5 gap-1", view.color)}>
              {(() => {
                const VIcon = Icons[view.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined;
                return VIcon ? <VIcon className="h-2.5 w-2.5" /> : null;
              })()}
              {view.label}
            </Badge>
            <Badge variant="outline" className="h-5">
              <span className={typeMeta.color}>●</span> {typeMeta.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6 overflow-y-auto">
          {/* Description */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Icons.FileText className="h-3 w-3" /> Overview
            </h3>
            <p className="text-sm leading-relaxed text-foreground/90">{strategy.description}</p>
          </section>

          {/* Formula */}
          {strategy.formula && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Icons.Sigma className="h-3 w-3" /> Formula
              </h3>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-sm text-foreground overflow-x-auto">
                {strategy.formula}
              </div>
            </section>
          )}

          {/* Risk & Complexity */}
          <section className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-3">
              <RiskMeter level={strategy.riskLevel} label="Risk" />
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <RiskMeter level={strategy.complexity} label="Complexity" />
            </div>
          </section>

          {/* Key concepts */}
          <section>
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Icons.Lightbulb className="h-3 w-3" /> Key Concepts
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {strategy.keyConcepts.map((c) => (
                <Badge key={c} variant="secondary" className="text-[11px] bg-muted/60">
                  {c}
                </Badge>
              ))}
            </div>
          </section>

          {/* Instruments & P&L */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-3">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Icons.Package className="h-3 w-3" /> Instruments
              </h3>
              <ul className="space-y-1">
                {strategy.instruments.map((ins) => (
                  <li key={ins} className="text-xs flex items-center gap-1.5 text-foreground/80">
                    <span className="h-1 w-1 rounded-full bg-primary" /> {ins}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Icons.TrendingUp className="h-3 w-3" /> Max Profit
                </h3>
                <p className="text-sm font-mono">{strategy.maxProfit || "—"}</p>
              </div>
              <div>
                <h3 className="text-[11px] uppercase tracking-wider text-rose-400 mb-1 flex items-center gap-1.5">
                  <Icons.TrendingDown className="h-3 w-3" /> Max Loss
                </h3>
                <p className="text-sm font-mono">{strategy.maxLoss || "—"}</p>
              </div>
            </div>
          </section>

          {/* Example */}
          {strategy.example && (
            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Icons.Terminal className="h-3 w-3" /> Example
              </h3>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-xs text-foreground/80 font-mono">
                {strategy.example}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleBacktest}
              disabled={!backtestable}
              title={backtestable ? "Open in Backtest Lab" : "This strategy isn't backtestable in the demo"}
            >
              <Icons.FlaskConical className="h-3.5 w-3.5" />
              {backtestable ? "Backtest This Strategy" : "Not Backtestable"}
            </Button>
            <Button
              size="sm"
              variant={inCompare ? "default" : "outline"}
              className="gap-1.5"
              onClick={() => toggleCompare(strategy.id)}
              disabled={compareFull && !inCompare}
            >
              <Icons.GitCompare className="h-3.5 w-3.5" />
              {inCompare ? "In Compare" : compareFull ? "Compare Full" : "Add to Compare"}
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
