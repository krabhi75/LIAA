import { NextResponse } from "next/server";
import { flattenWebhook, ingestCallWebhook, readWebhookPayload } from "@/lib/crm-ingest";

export async function POST(req: Request) {
  const params = await readWebhookPayload(req);
  const result = await ingestCallWebhook("agora", flattenWebhook(params));
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST Agora post-call / conversation webhooks here. Cases appear on /crm.",
  });
}
