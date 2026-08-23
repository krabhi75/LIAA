import { NextResponse } from "next/server";
import { listCalls, updateCall } from "@/lib/crm-store";

export async function GET() {
  const calls = await listCalls();
  return NextResponse.json({ calls });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as { id?: string; disposition?: string };
  if (!body.id || !body.disposition) {
    return NextResponse.json({ error: "id and disposition required" }, { status: 400 });
  }
  const call = await updateCall(body.id, { disposition: body.disposition });
  if (!call) {
    return NextResponse.json({ error: "call not found" }, { status: 404 });
  }
  return NextResponse.json({ call });
}
