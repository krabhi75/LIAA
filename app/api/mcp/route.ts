import { NextRequest, NextResponse } from "next/server";
import { mcpKey } from "@/lib/agora";
import { handleMcp } from "@/lib/mcp";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-aether-key");
  if (key !== mcpKey()) return unauthorized();

  const channel = req.headers.get("x-aether-channel");
  if (!channel) {
    return NextResponse.json({ error: "missing channel" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const result = handleMcp(body, channel);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-aether-key");
  if (key !== mcpKey()) return unauthorized();
  return NextResponse.json({ ok: true, server: "aetherclose" });
}
