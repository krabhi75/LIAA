import { after } from "next/server";
import { handlePhoneSpeechFast } from "@/lib/phone-agent";
import {
  freshPhoneConv,
  gatherActionWithState,
  phoneConvFromParams,
  retryPromptForStage,
} from "@/lib/phone-session";
import { parseVobizBody, speechFromVobizParams, gatherDebugLine } from "@/lib/vobiz";
import {
  hangupXml,
  speakGatherXml,
  voiceBase,
  xmlResponse,
} from "@/lib/vobiz-xml";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

function baseGather(req: Request): string {
  return `${voiceBase(req)}/api/vobiz/gather`;
}

function paramsFromRequest(req: Request, body: Record<string, string>): Record<string, string> {
  const url = new URL(req.url);
  const merged = { ...body };
  for (const [k, v] of url.searchParams.entries()) {
    if (!merged[k]) merged[k] = v;
  }
  return merged;
}

/** Vobiz Redirect after missed Gather hits GET — short retry, same dialog stage. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const conv = phoneConvFromParams(Object.fromEntries(url.searchParams.entries()));
  const gatherBase = baseGather(req);
  const action = gatherActionWithState(gatherBase, conv);
  const prompt =
    url.searchParams.get("retry") === "1"
      ? retryPromptForStage(conv.stage, conv.name)
      : retryPromptForStage(conv.stage, conv.name);
  return xmlResponse(speakGatherXml(prompt, action));
}

export async function POST(req: Request) {
  const gatherBase = baseGather(req);
  try {
    const body = await parseVobizBody(req);
    const params = paramsFromRequest(req, body);
    const uuid = params.CallUUID || params.RequestUUID || "phone";
    const speech = speechFromVobizParams(params);
    const conv = phoneConvFromParams(params);
    const turn = handlePhoneSpeechFast(conv, speech);

    const action = gatherActionWithState(gatherBase, turn.conv);
    const response = turn.hangup
      ? xmlResponse(hangupXml(turn.speak))
      : xmlResponse(speakGatherXml(turn.speak, action));

    after(() => {
      void (async () => {
        try {
          const { persistPhoneTurn } = await import("@/lib/phone-agent");
          const { findCallForVobizWebhook, updateCall } = await import(
            "@/lib/crm-store"
          );
          await persistPhoneTurn(uuid, speech, turn);
          if (!speech) {
            const call =
              (await findCallForVobizWebhook({
                callUuid: params.CallUUID || params.call_uuid,
                requestUuid: params.RequestUUID || params.request_uuid,
                calleePhone: params.To || params.to || params.From || params.from,
              })) ?? null;
            if (call) {
              const dbg = gatherDebugLine(params);
              await updateCall(call.id, {
                transcript: call.transcript
                  ? `${call.transcript}\n${dbg}`
                  : dbg,
                vobizUuid: params.CallUUID || call.vobizUuid,
              });
            }
          } else {
            console.info("[vobiz/gather]", {
              uuid,
              stage: turn.conv.stage,
              speech: speech.slice(0, 80),
            });
          }
        } catch (err) {
          console.error("[vobiz/gather] persist failed", err);
        }
      })();
    });

    return response;
  } catch (err) {
    console.error("[vobiz/gather]", err);
    const action = gatherActionWithState(gatherBase, freshPhoneConv());
    return xmlResponse(
      speakGatherXml(
        "Awaaz clear nahi aayi. Hindi ya Hinglish mein apna naam boliye.",
        action,
      ),
    );
  }
}
