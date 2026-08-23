import { after } from "next/server";
import { voicePublicBase } from "@/lib/agora";
import { KRISHI_ANSWER_GREETING } from "@/lib/phone-voice";
import { xmlResponse, parseVobizBody, speakGatherXml } from "@/lib/vobiz";
import { findCallByUuid, updateCall } from "@/lib/crm-store";
import { ingestCallWebhook, flattenWebhook } from "@/lib/crm-ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

function answerXml(req: Request): Response {
  const action = `${voicePublicBase(req)}/api/vobiz/gather`;
  return xmlResponse(speakGatherXml(KRISHI_ANSWER_GREETING, action));
}

async function markAnswered(req: Request) {
  try {
    const params = await parseVobizBody(req);
    const uuid = params.CallUUID || params.RequestUUID || "";
    if (!uuid) return;
    const existing = await findCallByUuid(uuid);
    if (existing) {
      await updateCall(existing.id, {
        status: "in-progress",
        answeredAt: new Date().toISOString(),
      });
      return;
    }
    await ingestCallWebhook("vobiz", flattenWebhook(params));
  } catch (err) {
    console.error("[vobiz/answer] persist failed", err);
  }
}

export async function POST(req: Request) {
  const xml = answerXml(req);
  after(() => markAnswered(req.clone()));
  return xml;
}

export async function GET(req: Request) {
  return answerXml(req);
}
