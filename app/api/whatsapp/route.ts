import { NextResponse } from "next/server";
import { publicBaseUrl } from "@/lib/agora";
import { ingestWhatsappInbound, sendWhatsappText, whatsappEnv } from "@/lib/whatsapp";
import { listWaMessages, waKpis } from "@/lib/whatsapp-store";

export async function GET(req: Request) {
  const { live, from, phoneNumberId, verifyToken } = whatsappEnv();
  const base = publicBaseUrl(req) ?? "https://liaa-ebon.vercel.app";
  return NextResponse.json({
    live,
    from,
    phoneNumberId: phoneNumberId ? "set" : "",
    verifyTokenSet: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    webhook: `${base}/api/webhooks/whatsapp`,
    kpis: waKpis(),
    messages: listWaMessages(),
    verifyTokenDefault: process.env.WHATSAPP_VERIFY_TOKEN ? undefined : verifyToken,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    action?: "send" | "simulate";
    phone?: string;
    name?: string;
    text?: string;
  };
  const action = body.action ?? "simulate";
  if (!body.phone || !body.text) {
    return NextResponse.json({ error: "phone and text required" }, { status: 400 });
  }
  switch (action) {
    case "simulate": {
      const result = await ingestWhatsappInbound({
        phone: body.phone,
        name: body.name,
        text: body.text,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    case "send": {
      const sent = await sendWhatsappText(body.phone, body.text);
      if (!sent.ok) {
        return NextResponse.json({ error: sent.error }, { status: 502 });
      }
      return NextResponse.json({ ok: true, demo: sent.error ?? null });
    }
    default: {
      const _exhaustive: never = action;
      return NextResponse.json({ error: String(_exhaustive) }, { status: 400 });
    }
  }
}
