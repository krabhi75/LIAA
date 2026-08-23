import { NextResponse } from "next/server";
import { seedDemoCrmData } from "@/lib/demo-crm-seed";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await seedDemoCrmData();
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST to seed 20 demo farmers (9999-9999-99 … 80) with calls and cases",
  });
}
