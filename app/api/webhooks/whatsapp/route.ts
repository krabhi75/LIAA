import { NextResponse } from "next/server";
import { extractMetaMessages, ingestWhatsappInbound, whatsappEnv } from "@/lib/whatsapp";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const { verifyToken } = whatsappEnv();
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    hint: "Meta Cloud API webhook. GET is verification. POST inbound farmer messages here.",
    verifyTokenHint: "Set WHATSAPP_VERIFY_TOKEN on Vercel to the same string as Meta Verify token.",
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as unknown;
  const items = extractMetaMessages(body);
  const results = [];
  for (const item of items) {
    results.push(await ingestWhatsappInbound(item));
  }
  return NextResponse.json({ ok: true, count: results.length, results });
}
