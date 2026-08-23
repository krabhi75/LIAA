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

export async function POST(req: Request) {
  const res = answerXml(req);
  const clone = req.clone();
  after(() => {
    void (async () => {
      try {
        const { parseVobizBody } = await import("@/lib/vobiz");
        const { findCallByUuid, updateCall } = await import("@/lib/crm-store");
        const { ingestCallWebhook, flattenWebhook } = await import(
          "@/lib/crm-ingest"
        );
        const params = await parseVobizBody(clone);
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
    })();
  });
  return res;
}

export async function GET(req: Request) {
  return answerXml(req);
}
