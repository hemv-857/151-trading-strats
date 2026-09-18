"use client";

import { AppShell } from "@/components/app-shell";
import { useAppStore } from "@/lib/store";
import { DashboardView } from "@/components/views/dashboard-view";
import { LibraryView } from "@/components/views/library-view";
import { BacktestView } from "@/components/views/backtest-view";
import { OptionsView } from "@/components/views/options-view";
import { CompareView } from "@/components/views/compare-view";
import { AboutView } from "@/components/views/about-view";
import { StrategyDetailDrawer } from "@/components/strategy-detail-drawer";

export default function Home() {
  const view = useAppStore((s) => s.view);

  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "library" && <LibraryView />}
      {view === "backtest" && <BacktestView />}
      {view === "options" && <OptionsView />}
      {view === "compare" && <CompareView />}
      {view === "about" && <AboutView />}
      <StrategyDetailDrawer />
    </AppShell>
  );
}
