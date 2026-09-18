"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { Strategy, CATEGORY_COLORS, MARKET_VIEW_META, STRATEGY_TYPE_META, ASSET_CLASS_MAP } from "@/lib/strategies-data";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// IDs of strategies that have a live backtest implementation
const BACKTESTABLE_IDS = new Set([
  "single-moving-average",
  "two-moving-averages",
  "three-moving-averages",
  "channel",
  "etf-mean-reversion",
  "price-momentum",
  "pairs-trading",
  "bollinger-bands",
  "rsi-mean-reversion",
  "macd-crossover",
]);

function RiskMeter({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1 w-3 rounded-sm",
            i <= level
              ? level >= 4
                ? "bg-rose-500"
                : level >= 3
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

function MiniBars({ level }: { level: number }) {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn("w-1 rounded-sm", i <= level ? "bg-primary" : "bg-muted")}
          style={{ height: `${30 + i * 14}%` }}
        />
      ))}
    </div>
  );
}

interface StrategyCardProps {
  strategy: Strategy;
  variant?: "default" | "compact";
  index?: number;
}

export function StrategyCard({ strategy, variant = "default", index = 0 }: StrategyCardProps) {
  const openStrategy = useAppStore((s) => s.openStrategy);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const compareList = useAppStore((s) => s.compareList);
  const favorites = useAppStore((s) => s.favorites);

  const colors = CATEGORY_COLORS[strategy.category];
  const view = MARKET_VIEW_META[strategy.marketView];
  const typeMeta = STRATEGY_TYPE_META[strategy.type];
  const ac = ASSET_CLASS_MAP[strategy.category];
  const inCompare = compareList.includes(strategy.id);
  const compareFull = compareList.length >= 4 && !inCompare;
  const isFavorite = favorites.includes(strategy.id);

  const Icon = (Icons as any)[ac.icon] || Icons.Circle;

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card transition-all duration-200 cursor-pointer",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        isFavorite ? cn(colors.border, "ring-1", colors.ring) : colors.border,
        variant === "compact" ? "p-3" : "p-4"
      )}
      onClick={() => openStrategy(strategy.id)}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", colors.bg)}>
            <Icon className={cn("h-4 w-4", colors.text)} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-muted-foreground tnum">{strategy.number}</span>
              <span className={cn("text-[10px] uppercase tracking-wide font-medium", colors.text)}>{ac.name}</span>
            </div>
            <h3 className="text-sm font-semibold leading-tight truncate text-foreground">{strategy.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {strategy.featured && (
            <span className="text-amber-400" title="Featured">
              <Icons.Star className="h-3.5 w-3.5 fill-amber-400" />
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(strategy.id); }}
            className={cn(
              "rounded-md p-0.5 transition-all hover:bg-muted/60",
              isFavorite ? "text-rose-400" : "text-muted-foreground/40 hover:text-rose-400"
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Icons.Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-rose-400")} />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3 min-h-[2.5rem]">
        {strategy.shortDesc}
      </p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <Badge variant="outline" className={cn("text-[10px] py-0 h-5 gap-1", colors.text, colors.border)}>
          {(() => {
            const VIcon = Icons[view.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined;
            return VIcon ? <VIcon className="h-2.5 w-2.5" /> : null;
          })()}
          {view.label}
        </Badge>
        <Badge variant="outline" className="text-[10px] py-0 h-5">
          {typeMeta.label}
        </Badge>
        {BACKTESTABLE_IDS.has(strategy.id) && (
          <Badge variant="outline" className="text-[9px] py-0 h-5 gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30" title="Available in Backtest Lab">
            <Icons.FlaskConical className="h-2.5 w-2.5" />
            BT
          </Badge>
        )}
      </div>

      {/* Footer: risk / complexity */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase text-muted-foreground tracking-wide">Risk</span>
            <RiskMeter level={strategy.riskLevel} />
          </div>
          {variant !== "compact" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase text-muted-foreground tracking-wide">Cx</span>
              <MiniBars level={strategy.complexity} />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 shrink-0 transition-colors",
            inCompare ? "text-primary" : compareFull ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-primary"
          )}
          disabled={compareFull}
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(strategy.id);
          }}
          title={inCompare ? "Remove from compare" : "Add to compare"}
        >
          <Icons.GitCompare className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
