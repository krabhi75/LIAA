import { NextResponse } from "next/server";
import { listCalls, updateCall } from "@/lib/crm-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function liveJson(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function GET() {
  const calls = await listCalls();
  return liveJson({ calls, at: new Date().toISOString() });
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
  return liveJson({ call });
}
