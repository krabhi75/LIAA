import { NextResponse } from "next/server";
import {
  KRISHI_ANSWER_GREETING,
  answerSpeakGatherXml,
  voiceBase,
} from "@/lib/vobiz-xml";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Hit this from the CRM dashboard to warm the Answer lambda so the next
 * outbound pickup does not cold-start.
 */
export async function GET(req: Request) {
  const action = `${voiceBase(req)}/api/vobiz/gather`;
  const xml = answerSpeakGatherXml(KRISHI_ANSWER_GREETING, action);
  return NextResponse.json({
    ok: true,
    warmed: true,
    answerBytes: xml.length,
    base: voiceBase(req),
  });
}

export async function POST(req: Request) {
  return GET(req);
}

/** Also allow a tiny XML ping if Vobiz hits this by mistake. */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
