import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    name: "151 Trading Strategies API",
    version: "0.2.1",
    timestamp: new Date().toISOString(),
  });
}
