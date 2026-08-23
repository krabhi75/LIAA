import { NextResponse } from "next/server";
import { appendContactNote, updateContact } from "@/lib/crm-store";
import { loadFarmerProfile, resolveFarmerId } from "@/lib/farmer-profile";

async function farmerId(id: string): Promise<string> {
  return (await resolveFarmerId(id)) ?? id;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const profile = await loadFarmerProfile(await farmerId(id));
  if (!profile) {
    return NextResponse.json({ error: "farmer not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const resolved = await farmerId(id);
  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    village?: string;
    district?: string;
    crop?: string;
    city?: string;
    state?: string;
  };
  const farmer = await updateContact(resolved, body);
  if (!farmer) {
    return NextResponse.json({ error: "farmer not found" }, { status: 404 });
  }
  await appendContactNote(
    farmer.id,
    `Profile updated: ${[farmer.name, farmer.phone, farmer.village, farmer.district, farmer.crop]
      .filter(Boolean)
      .join(", ")}`,
  );
  const profile = await loadFarmerProfile(farmer.id);
  return NextResponse.json(profile);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const resolved = await farmerId(id);
  const body = (await req.json()) as {
    note?: string;
    name?: string;
    phone?: string;
    village?: string;
    district?: string;
    crop?: string;
    city?: string;
    state?: string;
  };
  if (
    body.name ||
    body.phone ||
    body.village ||
    body.district ||
    body.crop ||
    body.city ||
    body.state
  ) {
    const farmer = await updateContact(resolved, body);
    if (!farmer) {
      return NextResponse.json({ error: "farmer not found" }, { status: 404 });
    }
  }
  if (body.note?.trim()) {
    const farmer = await appendContactNote(resolved, body.note);
    if (!farmer) {
      return NextResponse.json({ error: "farmer not found" }, { status: 404 });
    }
  }
  const profile = await loadFarmerProfile(resolved);
  if (!profile) {
    return NextResponse.json({ error: "farmer not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
