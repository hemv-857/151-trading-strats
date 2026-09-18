import { NextRequest, NextResponse } from "next/server";
import { OPTION_PRESETS, buildPayoffCurve, strategyGreeks, strategyNetCost, OptionsStrategy } from "@/lib/options-pricing";

export const dynamic = "force-dynamic";

// POST /api/options
// Body: { preset?: string, strategy?: OptionsStrategy, spot, vol, T, r }
// Returns: payoff curve, greeks, net cost
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { preset, strategy: customStrategy, spot, vol, T, r = 0.03 } = body as {
      preset?: string;
      strategy?: OptionsStrategy;
      spot: number;
      vol: number;
      T: number;
      r?: number;
    };

    let strategy: OptionsStrategy | undefined;
    if (customStrategy) {
      strategy = customStrategy;
    } else if (preset) {
      const p = OPTION_PRESETS.find((x) => x.id === preset);
      if (!p) return NextResponse.json({ error: `Unknown preset: ${preset}` }, { status: 404 });
      strategy = p.build({ spot, atmVol: vol, T, r });
    }

    if (!strategy) {
      return NextResponse.json({ error: "Either preset or strategy must be provided" }, { status: 400 });
    }

    const spotVal = Number(spot) || 100;
    const volVal = Number(vol) || 0.2;
    const tVal = Number(T) || 0.25;
    const rVal = Number(r) || 0.03;

    const curve = buildPayoffCurve(strategy, spotVal, { rangePct: 0.4, steps: 81 });
    const greeks = strategyGreeks(strategy, spotVal, tVal, rVal, volVal);
    const netCost = strategyNetCost(strategy);

    return NextResponse.json({
      strategy,
      curve,
      greeks,
      netCost,
      spot: spotVal,
      vol: volVal,
      T: tVal,
      r: rVal,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Options calc failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    presets: OPTION_PRESETS.map((p) => ({ id: p.id, name: p.name, marketView: p.marketView, description: p.description })),
  });
}
