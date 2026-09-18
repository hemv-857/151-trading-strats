"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/lib/store";
import { ASSET_CLASSES, STRATEGIES, CATEGORY_COLORS, AssetClassId, StrategyType, Strategy, MARKET_VIEW_META } from "@/lib/strategies-data";
import { StrategyCard } from "@/components/strategy-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type SortKey = "number" | "risk-asc" | "risk-desc" | "complexity" | "name";

export function LibraryView() {
  const { libraryCategory, setLibraryCategory, librarySearch, setLibrarySearch, compareList } = useAppStore();
  const [sort, setSort] = React.useState<SortKey>("number");
  const [typeFilter, setTypeFilter] = React.useState<StrategyType | "all">("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filtered = React.useMemo(() => {
    let list = STRATEGIES.slice();
    if (libraryCategory !== "all") list = list.filter((s) => s.category === libraryCategory);
    if (typeFilter !== "all") list = list.filter((s) => s.type === typeFilter);
    if (librarySearch.trim()) {
      const q = librarySearch.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.shortDesc.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.keyConcepts.some((c) => c.toLowerCase().includes(q)) ||
          s.number.includes(q)
      );
    }
    switch (sort) {
      case "risk-asc": list.sort((a, b) => a.riskLevel - b.riskLevel); break;
      case "risk-desc": list.sort((a, b) => b.riskLevel - a.riskLevel); break;
      case "complexity": list.sort((a, b) => a.complexity - b.complexity); break;
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: list.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
    }
    return list;
  }, [libraryCategory, librarySearch, typeFilter, sort]);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky controls */}
      <div className="sticky top-[6.25rem] z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 py-3 space-y-3">
          {/* Search + sort row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search by name, concept, formula, or § number…"
                className="pl-9 bg-card h-10"
              />
              {librarySearch && (
                <button onClick={() => setLibrarySearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Icons.X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-44 h-10 bg-card">
                <Icons.ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Sort: Section #</SelectItem>
                <SelectItem value="name">Sort: Name A-Z</SelectItem>
                <SelectItem value="risk-asc">Risk: Low → High</SelectItem>
                <SelectItem value="risk-desc">Risk: High → Low</SelectItem>
                <SelectItem value="complexity">Complexity: Low → High</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-md border border-border bg-card overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("px-3 h-10 flex items-center", viewMode === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <Icons.LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("px-3 h-10 flex items-center border-l border-border", viewMode === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <Icons.List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Category chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-terminal pb-1 -mx-1 px-1">
            <CategoryChip active={libraryCategory === "all"} onClick={() => setLibraryCategory("all")}>
              All <span className="ml-1 opacity-60 font-mono">{STRATEGIES.length}</span>
            </CategoryChip>
            {ASSET_CLASSES.map((ac) => {
              const colors = CATEGORY_COLORS[ac.id as AssetClassId];
              const active = libraryCategory === ac.id;
              return (
                <button
                  key={ac.id}
                  onClick={() => setLibraryCategory(ac.id)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all",
                    active
                      ? cn(colors.bg, colors.text, colors.border)
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {ac.name}
                  <span className="font-mono opacity-60">{ac.count}</span>
                </button>
              );
            })}
          </div>

          {/* Type filter + count */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Type:</span>
              {(["all", "directional", "relative-value", "arbitrage", "hedging", "income", "event-driven", "machine-learning"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t as any)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wide transition-colors border",
                    typeFilter === t
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "all" ? "All" : t.replace("-", " ")}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} {compareList.length > 0 && `· ${compareList.length} in compare`}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 sm:px-6 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icons.SearchX className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No strategies found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => { setLibrarySearch(""); setLibraryCategory("all"); setTypeFilter("all"); }}
            >
              Reset filters
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((s, i) => (
              <StrategyCard key={s.id} strategy={s} index={i} />
            ))}
          </div>
        ) : (
          <StrategyListView strategies={filtered} />
        )}
      </div>
    </div>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all",
        active
          ? "bg-primary/15 text-primary border-primary/30"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function StrategyListView({ strategies }: { strategies: Strategy[] }) {
  const { openStrategy, toggleCompare, compareList } = useAppStore();
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left px-3 py-2 font-semibold">§</th>
            <th className="text-left px-3 py-2 font-semibold">Name</th>
            <th className="text-left px-3 py-2 font-semibold hidden md:table-cell">Asset Class</th>
            <th className="text-left px-3 py-2 font-semibold hidden lg:table-cell">View</th>
            <th className="text-left px-3 py-2 font-semibold">Risk</th>
            <th className="text-left px-3 py-2 font-semibold hidden sm:table-cell">Cx</th>
            <th className="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {strategies.map((s, i) => {
            const colors = CATEGORY_COLORS[s.category as AssetClassId];
            const view = MARKET_VIEW_META[s.marketView];
            const inCompare = compareList.includes(s.id);
            return (
              <tr
                key={s.id}
                onClick={() => openStrategy(s.id)}
                className={cn("border-t border-border cursor-pointer hover:bg-muted/30 transition-colors", i % 2 === 1 && "bg-muted/10")}
              >
                <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground tnum">{s.number}</td>
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">{s.shortDesc}</div>
                </td>
                <td className="px-3 py-2 hidden md:table-cell">
                  <Badge variant="outline" className={cn("text-[10px]", colors.text, colors.border)}>{s.category}</Badge>
                </td>
                <td className="px-3 py-2 hidden lg:table-cell">
                  <span className={cn("text-[11px]", view.color)}>{view.label}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={cn("h-1 w-2 rounded-sm", n <= s.riskLevel ? (s.riskLevel >= 4 ? "bg-rose-500" : s.riskLevel >= 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-muted")} />
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 hidden sm:table-cell font-mono text-xs text-muted-foreground">{s.complexity}/5</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCompare(s.id); }}
                    className={cn("p-1 rounded hover:bg-primary/10", inCompare ? "text-primary" : "text-muted-foreground")}
                  >
                    <Icons.GitCompare className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
