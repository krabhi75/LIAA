import { NextResponse } from "next/server";
import { appendContactNote } from "@/lib/crm-store";
import { loadFarmerProfile, resolveFarmerId } from "@/lib/farmer-profile";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const farmerId = (await resolveFarmerId(id)) ?? id;
  const profile = await loadFarmerProfile(farmerId);
  if (!profile) {
    return NextResponse.json({ error: "farmer not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const farmerId = (await resolveFarmerId(id)) ?? id;
  const body = (await req.json()) as { note?: string };
  if (!body.note?.trim()) {
    return NextResponse.json({ error: "note required" }, { status: 400 });
  }
  const farmer = await appendContactNote(farmerId, body.note);
  if (!farmer) {
    return NextResponse.json({ error: "farmer not found" }, { status: 404 });
  }
  const profile = await loadFarmerProfile(farmer.id);
  return NextResponse.json(profile);
}
