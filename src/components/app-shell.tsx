"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { useAppStore, ViewId } from "@/lib/store";
import { TOTAL_STRATEGIES, ASSET_CLASSES } from "@/lib/strategies-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TickerTape } from "@/components/ticker-tape";
import { StrategyDetailDrawer } from "@/components/strategy-detail-drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  id: ViewId;
  label: string;
  icon: keyof typeof Icons;
  desc: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", desc: "Overview & featured" },
  { id: "library", label: "Strategy Library", icon: "Library", desc: "Browse all strategies" },
  { id: "backtest", label: "Backtest Lab", icon: "FlaskConical", desc: "Run quantitative backtests" },
  { id: "options", label: "Options Lab", icon: "LineChart", desc: "Payoff diagrams & greeks" },
  { id: "compare", label: "Compare", icon: "GitCompare", desc: "Side-by-side analysis" },
  { id: "glossary", label: "Glossary", icon: "BookMarked", desc: "Quant finance definitions" },
  { id: "about", label: "About the Paper", icon: "BookOpen", desc: "Source & methodology" },
];

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = Icons[item.icon] as React.ComponentType<{ className?: string }>;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150",
        active
          ? "bg-primary/10 text-primary border border-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium leading-tight">{item.label}</div>
        <div className="text-[10px] text-muted-foreground leading-tight truncate">{item.desc}</div>
      </div>
      {active && <Icons.ChevronRight className="h-3.5 w-3.5 text-primary" />}
    </button>
  );
}

function SidebarContent() {
  const { view, setView, compareList, clearCompare, removeFromCompare, setLibraryCategory, favorites, setLibraryFavoritesOnly } = useAppStore();
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/30">
          <Icons.Layers className="h-5 w-5 text-primary" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 pulse-dot text-emerald-500" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight leading-tight">151 Strategies</div>
          <div className="text-[10px] text-muted-foreground font-mono">Quant Research Terminal</div>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={view === item.id}
              onClick={() => {
                setView(item.id);
                if (item.id === "library") setLibraryCategory("all");
              }}
            />
          ))}
        </nav>

        {/* Asset class quick-jump */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="px-1 mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Asset Classes</span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-mono">{ASSET_CLASSES.length}</Badge>
          </div>
          <div className="space-y-0.5 max-h-72 overflow-y-auto scrollbar-terminal pr-1">
            {ASSET_CLASSES.map((ac) => {
              const Icon = (Icons as any)[ac.icon] || Icons.Circle;
              return (
                <button
                  key={ac.id}
                  onClick={() => {
                    setLibraryCategory(ac.id);
                    setView("library");
                  }}
                  className="group w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Icon className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                  <span className="flex-1 text-left truncate">{ac.name}</span>
                  <span className="font-mono text-[10px] opacity-60">{ac.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* Compare tray */}
      {compareList.length > 0 && (
        <div className="border-t border-border p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Icons.GitCompare className="h-3 w-3" /> Compare Tray
            </span>
            <button onClick={clearCompare} className="text-[10px] text-muted-foreground hover:text-rose-400">Clear</button>
          </div>
          <div className="space-y-1">
            {compareList.map((id) => (
              <div key={id} className="flex items-center gap-2 text-xs bg-card rounded-md px-2 py-1.5 border border-border">
                <span className="flex-1 truncate text-foreground/80">{id}</span>
                <button onClick={() => removeFromCompare(id)} className="text-muted-foreground hover:text-rose-400">
                  <Icons.X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={() => setView("compare")}
          >
            View Comparison <Icons.ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Footer stats */}
      <div className="border-t border-border px-4 py-3 grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <div className="text-muted-foreground uppercase tracking-wide">Strategies</div>
          <div className="font-mono font-semibold text-foreground tnum">{TOTAL_STRATEGIES}</div>
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wide">Asset Classes</div>
          <div className="font-mono font-semibold text-foreground tnum">{ASSET_CLASSES.length}</div>
        </div>
      </div>
      {favorites.length > 0 && (
        <button
          onClick={() => { setLibraryFavoritesOnly(true); setView("library"); }}
          className="mx-3 mb-3 mt-1 flex items-center justify-between rounded-md border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <span className="flex items-center gap-1.5"><Icons.Heart className="h-3 w-3 fill-rose-400" /> Favorites</span>
          <span className="font-mono tnum">{favorites.length}</span>
        </button>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, setView, closeDetail, detailOpen, setLibrarySearch } = useAppStore();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  const currentNav = NAV_ITEMS.find((n) => n.id === view);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      // Esc closes detail drawer or shortcuts modal
      if (e.key === "Escape") {
        if (detailOpen) { closeDetail(); return; }
        if (shortcutsOpen) { setShortcutsOpen(false); return; }
      }
      // '?' toggles shortcuts modal (even when typing? no — only when not typing)
      if (!typing && e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((o) => !o);
        return;
      }
      if (typing) return;
      // Number keys 1-7 switch views
      if (e.key >= "1" && e.key <= "7") {
        const idx = Number(e.key) - 1;
        if (idx < NAV_ITEMS.length) {
          setView(NAV_ITEMS[idx].id);
        }
        return;
      }
      // '/' focuses the library search (switches to library first)
      if (e.key === "/") {
        e.preventDefault();
        setView("library");
        setTimeout(() => {
          const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement | null;
          input?.focus();
          input?.select();
        }, 60);
        return;
      }
      // 'g' then 'd'/'l'/'b'/'o'/'c'/'g'/'a' = goto view (vim-style)
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setView, closeDetail, detailOpen, shortcutsOpen, setLibrarySearch]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <TickerTape />
        <div className="flex h-14 items-center gap-3 px-4">
          {/* Mobile nav trigger */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Icons.Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 min-w-0">
            {currentNav && (() => {
              const Icon = Icons[currentNav.icon] as React.ComponentType<{ className?: string }>;
              return <Icon className="h-4 w-4 text-primary shrink-0" />;
            })()}
            <h1 className="text-sm font-semibold truncate">{currentNav?.label ?? "Dashboard"}</h1>
            <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">/ {view}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShortcutsOpen(true)}
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-card text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <Icons.Keyboard className="h-3 w-3" />
              <kbd className="font-mono">?</kbd>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot text-emerald-500" />
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wide">Sim Active</span>
            </div>
            <Badge variant="outline" className="hidden md:flex text-[10px] font-mono gap-1">
              <Icons.Cpu className="h-3 w-3" /> Engine v1.0
            </Badge>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:block w-60 lg:w-64 shrink-0 border-r border-border bg-sidebar/50">
          <SidebarContent />
        </aside>

        <main className="flex-1 min-w-0 min-h-0 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t border-border bg-card/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icons.BookMarked className="h-3 w-3" />
            <span>
              Based on <span className="text-foreground font-medium">"151 Trading Strategies"</span> by Kakushadze &amp; Serur (2018)
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span className="flex items-center gap-1"><Icons.ShieldCheck className="h-3 w-3" /> Educational use only</span>
            <span className="flex items-center gap-1"><Icons.Cpu className="h-3 w-3" /> Not investment advice</span>
          </div>
        </div>
      </footer>

      <ShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <StrategyDetailDrawer />
    </div>
  );
}

function ShortcutsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { setView } = useAppStore();
  const shortcuts: { keys: string; desc: string; action?: () => void }[] = [
    { keys: "1–7", desc: "Switch to view 1–7 (Dashboard → About)" },
    { keys: "/", desc: "Focus library search" },
    { keys: "?", desc: "Toggle this shortcuts dialog" },
    { keys: "Esc", desc: "Close drawer / dialog" },
  ];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-sm p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <Icons.Keyboard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Keyboard</div>
              <div className="text-sm font-semibold">Shortcuts</div>
            </div>
          </div>
        </SheetHeader>
        <div className="px-5 py-4 space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2">
              <span className="text-xs text-foreground/80">{s.desc}</span>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted/60 border border-border text-foreground">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border">
          <div className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Quick nav</div>
          <div className="grid grid-cols-2 gap-1.5">
            {NAV_ITEMS.map((n, i) => {
              const Icon = Icons[n.icon] as React.ComponentType<{ className?: string }>;
              return (
                <button
                  key={n.id}
                  onClick={() => { setView(n.id); onOpenChange(false); }}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                >
                  <Icon className="h-3 w-3" />
                  <span className="flex-1 text-left truncate">{n.label}</span>
                  <kbd className="font-mono text-[9px] text-muted-foreground/60">{i + 1}</kbd>
                </button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
