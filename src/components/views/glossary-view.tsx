"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useAppStore } from "@/lib/store";
import { GLOSSARY, GLOSSARY_CATEGORIES, GlossaryTerm, GlossaryCategory, searchGlossary } from "@/lib/glossary-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_STYLES: Record<GlossaryCategory, { bg: string; text: string; border: string }> = {
  options: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  volatility: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  "fixed-income": { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
  stocks: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  risk: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  macro: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  trading: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
};

export function GlossaryView() {
  const { openStrategy, setView } = useAppStore();
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<GlossaryCategory | "all">("all");
  const [expandedTerm, setExpandedTerm] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    let list = searchGlossary(search);
    if (activeCategory !== "all") list = list.filter((t) => t.category === activeCategory);
    return list;
  }, [search, activeCategory]);

  // Group by first letter for alphabetical browsing
  const grouped = React.useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    [...filtered].sort((a, b) => a.term.localeCompare(b.term)).forEach((t) => {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const categoryCount = React.useMemo(() => {
    const map = new Map<GlossaryCategory, number>();
    GLOSSARY.forEach((t) => map.set(t.category, (map.get(t.category) || 0) + 1));
    return map;
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
          <Icons.BookMarked className="h-3.5 w-3.5 text-primary" /> Quant Finance Glossary
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Key Terms &amp; Definitions</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {GLOSSARY.length} curated definitions across {GLOSSARY_CATEGORIES.length} categories — from options Greeks to yield-curve trades.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms or definitions…"
              className="pl-9 bg-card h-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <Icons.X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-all",
              activeCategory === "all"
                ? "bg-primary/15 text-primary border-primary/30"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            All <span className="ml-1 opacity-60 font-mono">{GLOSSARY.length}</span>
          </button>
          {GLOSSARY_CATEGORIES.map((c) => {
            const style = CATEGORY_STYLES[c.id];
            const count = categoryCount.get(c.id) || 0;
            const active = activeCategory === c.id;
            const Icon = Icons[c.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(active ? "all" : c.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all",
                  active ? cn(style.bg, style.text, style.border) : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {c.label}
                <span className="opacity-60 font-mono">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-terminal">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Icons.SearchX className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No terms found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setActiveCategory("all"); }}>
              Reset
            </Button>
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-5">
            <div className="text-[11px] text-muted-foreground mb-4 font-mono">
              {filtered.length} term{filtered.length !== 1 ? "s" : ""}
              {activeCategory !== "all" && ` in ${GLOSSARY_CATEGORIES.find((c) => c.id === activeCategory)?.label}`}
            </div>

            {/* Alphabetical groups */}
            <div className="space-y-6">
              {grouped.map(([letter, terms]) => (
                <div key={letter}>
                  <div className="flex items-center gap-3 mb-3 sticky top-0 z-10 bg-background/90 backdrop-blur py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-sm font-bold text-primary font-mono">{letter}</span>
                    </div>
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-muted-foreground font-mono">{terms.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1">
                    {terms.map((term) => (
                      <GlossaryTermCard
                        key={term.term}
                        term={term}
                        expanded={expandedTerm === term.term}
                        onToggle={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
                        onOpenStrategy={(id) => { openStrategy(id); }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GlossaryTermCard({ term, expanded, onToggle, onOpenStrategy }: {
  term: GlossaryTerm;
  expanded: boolean;
  onToggle: () => void;
  onOpenStrategy: (id: string) => void;
}) {
  const style = CATEGORY_STYLES[term.category];
  const catMeta = GLOSSARY_CATEGORIES.find((c) => c.id === term.category);
  const Icon = Icons[catMeta?.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;

  return (
    <Card
      className={cn("p-0 overflow-hidden transition-all cursor-pointer hover:border-primary/30", expanded && "border-primary/30")}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2.5 p-3">
        <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md mt-0.5", style.bg)}>
          {Icon && <Icon className={cn("h-3.5 w-3.5", style.text)} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight">{term.term}</h3>
            <Icons.ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1 transition-transform", expanded && "rotate-180")} />
          </div>
          <AnimatePresence initial={false}>
            {expanded ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">{term.definition}</p>
                {term.relatedStrategy && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenStrategy(term.relatedStrategy!); }}
                    className={cn("mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors", style.bg, style.text, style.border, "hover:opacity-80")}
                  >
                    <Icons.ArrowRight className="h-2.5 w-2.5" /> View related strategy
                  </button>
                )}
                {term.seeAlso && term.seeAlso.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <span className="text-[9px] uppercase text-muted-foreground tracking-wide">See also:</span>
                    {term.seeAlso.map((s) => (
                      <Badge key={s} variant="outline" className="text-[9px] py-0 h-4">{s}</Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">{term.definition}</p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
