import { NextRequest, NextResponse } from "next/server";
import { OPTION_PRESETS, strategyGreeks, OptionsStrategy } from "@/lib/options-pricing";

export const dynamic = "force-dynamic";

// POST /api/options-greeks
// Body: { preset?, strategy?, vol, T, r, steps? }
// Returns: { spots: number[], greeks: { delta: number[], gamma: number[], vega: number[], theta: number[] } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { preset, strategy: customStrategy, vol, T, r = 0.03, steps = 41, spot: spotIn } = body as {
      preset?: string;
      strategy?: OptionsStrategy;
      vol: number;
      T: number;
      r?: number;
      steps?: number;
      spot?: number;
    };

    let strategy: OptionsStrategy | undefined;
    if (customStrategy) {
      strategy = customStrategy;
    } else if (preset) {
      const p = OPTION_PRESETS.find((x) => x.id === preset);
      if (!p) return NextResponse.json({ error: `Unknown preset: ${preset}` }, { status: 404 });
      const spotVal = Number(spotIn) || 100;
      strategy = p.build({ spot: spotVal, atmVol: vol, T, r });
    }

    if (!strategy) {
      return NextResponse.json({ error: "Either preset or strategy must be provided" }, { status: 400 });
    }

    const spotVal = Number(spotIn) || 100;
    const volVal = Number(vol) || 0.2;
    const tVal = Number(T) || 0.25;
    const rVal = Number(r) || 0.03;
    const nSteps = Math.min(Math.max(Number(steps) || 41, 11), 81);

    // Sweep spot from 0.6× to 1.4× the center spot
    const min = spotVal * 0.6;
    const max = spotVal * 1.4;
    const spots: number[] = [];
    const delta: number[] = [];
    const gamma: number[] = [];
    const vega: number[] = [];
    const theta: number[] = [];
    for (let i = 0; i < nSteps; i++) {
      const s = min + (max - min) * (i / (nSteps - 1));
      spots.push(s);
      const g = strategyGreeks(strategy, s, tVal, rVal, volVal);
      delta.push(g.delta);
      gamma.push(g.gamma);
      vega.push(g.vega);
      theta.push(g.theta);
    }

    return NextResponse.json({ spots, greeks: { delta, gamma, vega, theta }, spot: spotVal });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Greeks sweep failed" }, { status: 500 });
  }
}
