import { NextResponse } from "next/server";
import { flattenWebhook, ingestCallWebhook, readWebhookPayload } from "@/lib/crm-ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

function isAgoraHealthProbe(raw: Record<string, unknown>): boolean {
  const flat = flattenWebhook(raw);
  const channel =
    flat.channelName ??
    flat.channel_name ??
    flat["payload.channelName"] ??
    "";
  if (channel === "test_webhook") return true;
  const uid = String(flat.uid ?? flat.user_id ?? flat["payload.uid"] ?? "");
  if (uid === "12121212") return true;
  const noticeId = String(flat.noticeId ?? flat.notice_id ?? "");
  if (noticeId.startsWith("test_")) return true;
  return false;
}

/** Agora NCS health check must get JSON 200 within 10s — no DB on the hot path. */
export async function POST(req: Request) {
  const params = await readWebhookPayload(req);
  if (isAgoraHealthProbe(params)) {
    return NextResponse.json({ ok: true, probe: true });
  }
  const result = await ingestCallWebhook("agora", flattenWebhook(params));
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "liaa-agora-webhook",
    hint: "Agora Console → Webhooks → Receiving URL (RTC). POST NCS events here.",
  });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
