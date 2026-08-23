import { after } from "next/server";
import {
  KRISHI_ANSWER_GREETING,
  speakGatherXml,
  voiceBase,
  xmlResponse,
} from "@/lib/vobiz-xml";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

/** Instant Voice XML — no Prisma / agora-agents imports on this path. */
function answerXml(req: Request): Response {
  const action = `${voiceBase(req)}/api/vobiz/gather`;
  return xmlResponse(speakGatherXml(KRISHI_ANSWER_GREETING, action));
}

async function markAnswered(params: Record<string, string>) {
  const { normalizePhone } = await import("@/lib/vobiz");
  const { findCallForVobizWebhook, updateCall } = await import("@/lib/crm-store");

  const callUuid = params.CallUUID || params.call_uuid || "";
  const requestUuid = params.RequestUUID || params.request_uuid || "";
  const to = normalizePhone(params.To || params.to || "");

  const existing = await findCallForVobizWebhook({
    callUuid,
    requestUuid,
    calleePhone: to,
  });
  if (!existing) return;

  await updateCall(existing.id, {
    status: "in-progress",
    answeredAt: new Date().toISOString(),
    vobizUuid: callUuid || requestUuid || existing.vobizUuid,
  });
}

export async function POST(req: Request) {
  const res = answerXml(req);
  const clone = req.clone();
  after(() => {
    void (async () => {
      try {
        const { parseVobizBody } = await import("@/lib/vobiz");
        const params = await parseVobizBody(clone);
        await markAnswered(params);
      } catch (err) {
        console.error("[vobiz/answer] persist failed", err);
      }
    })();
  });
  return res;
}

export async function GET(req: Request) {
  return answerXml(req);
}
