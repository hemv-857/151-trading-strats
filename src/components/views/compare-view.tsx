"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getStrategyById, CATEGORY_COLORS, MARKET_VIEW_META, STRATEGY_TYPE_META, ASSET_CLASS_MAP, AssetClassId } from "@/lib/strategies-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function RiskMeter({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-3 rounded-sm",
            i <= level
              ? level >= 4 ? "bg-rose-500" : level >= 3 ? "bg-amber-500" : "bg-emerald-500"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

function MiniBars({ level }: { level: number }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={cn("w-1 rounded-sm", i <= level ? "bg-primary" : "bg-muted")} style={{ height: `${30 + i * 14}%` }} />
      ))}
    </div>
  );
}

export function CompareView() {
  const { compareList, removeFromCompare, setView, openStrategy, clearCompare } = useAppStore();
  const strategies = compareList.map(getStrategyById).filter(Boolean) as NonNullable<ReturnType<typeof getStrategyById>>[];

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
          <Icons.GitCompare className="relative h-16 w-16 text-primary/60" />
        </div>
        <h2 className="text-xl font-bold mb-2">No strategies to compare yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Add up to 4 strategies to the compare tray from the Strategy Library or any strategy card. Compare their
          risk, complexity, market view, and key concepts side-by-side.
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={() => setView("library")} className="gap-2">
            <Icons.Library className="h-4 w-4" /> Browse Library
          </Button>
          <Button variant="outline" onClick={() => setView("dashboard")} className="gap-2">
            <Icons.Home className="h-4 w-4" /> Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const rows: { label: string; render: (s: any) => React.ReactNode; icon: string }[] = [
    {
      label: "Asset Class",
      icon: "Boxes",
      render: (s) => {
        const ac = ASSET_CLASS_MAP[s.category as AssetClassId];
        const colors = CATEGORY_COLORS[s.category as AssetClassId];
        const Icon = (Icons as any)[ac.icon] || Icons.Circle;
        return (
          <div className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs", colors.bg, colors.text)}>
            <Icon className="h-3 w-3" /> {ac.name}
          </div>
        );
      },
    },
    {
      label: "Section",
      icon: "Hash",
      render: (s) => <span className="font-mono text-sm tnum">§{s.number}</span>,
    },
    {
      label: "Market View",
      icon: "Eye",
      render: (s) => {
        const v = MARKET_VIEW_META[s.marketView];
        const Icon = Icons[v.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
        return (
          <span className={cn("inline-flex items-center gap-1.5 text-xs", v.color)}>
            <Icon className="h-3 w-3" /> {v.label}
          </span>
        );
      },
    },
    {
      label: "Type",
      icon: "Tag",
      render: (s) => {
        const t = STRATEGY_TYPE_META[s.type];
        return <Badge variant="outline" className="text-[10px]"><span className={t.color}>●</span> {t.label}</Badge>;
      },
    },
    {
      label: "Risk Level",
      icon: "ShieldAlert",
      render: (s) => <RiskMeter level={s.riskLevel} />,
    },
    {
      label: "Complexity",
      icon: "Cpu",
      render: (s) => <MiniBars level={s.complexity} />,
    },
    {
      label: "Max Profit",
      icon: "TrendingUp",
      render: (s) => <span className="text-sm font-mono tnum text-emerald-400">{s.maxProfit || "—"}</span>,
    },
    {
      label: "Max Loss",
      icon: "TrendingDown",
      render: (s) => <span className="text-sm font-mono tnum text-rose-400">{s.maxLoss || "—"}</span>,
    },
    {
      label: "Instruments",
      icon: "Package",
      render: (s) => (
        <div className="flex flex-wrap gap-1 justify-center">
          {s.instruments.map((ins: string) => (
            <Badge key={ins} variant="secondary" className="text-[9px] bg-muted/60">{ins}</Badge>
          ))}
        </div>
      ),
    },
    {
      label: "Key Concepts",
      icon: "Lightbulb",
      render: (s) => (
        <div className="flex flex-wrap gap-1 justify-center">
          {s.keyConcepts.map((c: string) => (
            <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>
          ))}
        </div>
      ),
    },
    {
      label: "Description",
      icon: "FileText",
      render: (s) => <p className="text-[11px] text-muted-foreground leading-relaxed text-left">{s.description}</p>,
    },
  ];

  return (
    <div className="px-4 sm:px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icons.GitCompare className="h-4 w-4 text-primary" /> Strategy Comparison
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{strategies.length} strateg{strategies.length === 1 ? "y" : "ies"} · max 4</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearCompare} className="gap-1.5">
            <Icons.Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
          <Button variant="outline" size="sm" onClick={() => setView("library")} className="gap-1.5">
            <Icons.Plus className="h-3.5 w-3.5" /> Add More
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {/* Header row with strategy names + remove buttons */}
        <div className="grid border-b border-border bg-muted/40" style={{ gridTemplateColumns: `180px repeat(${strategies.length}, 1fr)` }}>
          <div className="p-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <Icons.List className="h-3 w-3" /> Attribute
          </div>
          {strategies.map((s) => {
            const colors = CATEGORY_COLORS[s.category as AssetClassId];
            return (
              <div key={s.id} className="p-3 border-l border-border">
                <div className="flex items-start justify-between gap-1">
                  <button onClick={() => openStrategy(s.id)} className="flex-1 text-left min-w-0">
                    <div className={cn("text-[10px] uppercase tracking-wide font-medium", colors.text)}>{s.category.replace("-", " ")}</div>
                    <div className="text-sm font-semibold leading-tight truncate">{s.name}</div>
                  </button>
                  <button onClick={() => removeFromCompare(s.id)} className="text-muted-foreground hover:text-rose-400 shrink-0">
                    <Icons.X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Attribute rows */}
        {rows.map((row, ri) => {
          const Icon = Icons[row.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
          return (
            <div
              key={row.label}
              className={cn("grid border-b border-border last:border-b-0", ri % 2 === 1 && "bg-muted/10")}
              style={{ gridTemplateColumns: `180px repeat(${strategies.length}, 1fr)` }}
            >
              <div className="p-3 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Icon className="h-3 w-3" /> {row.label}
              </div>
              {strategies.map((s) => (
                <div key={s.id} className="p-3 border-l border-border flex items-center justify-center text-center">
                  {row.render(s)}
                </div>
              ))}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
