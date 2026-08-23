import { after } from "next/server";
import {
  hangupXml,
  speakGatherXml,
  voiceBase,
  xmlResponse,
} from "@/lib/vobiz-xml";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * Gather must return XML in ~1s. All CRM / weather / tools run in after().
 * Awaiting Open-Meteo or Prisma here drops the PSTN leg.
 */
export async function POST(req: Request) {
  const action = `${voiceBase(req)}/api/vobiz/gather`;
  let params: Record<string, string> = {};
  try {
    const { parseVobizBody, speechFromVobizParams } = await import("@/lib/vobiz");
    params = await parseVobizBody(req);
    const uuid = params.CallUUID || params.RequestUUID || "phone";
    const speech = speechFromVobizParams(params);

    const { handlePhoneSpeechFast } = await import("@/lib/phone-agent");
    const turn = handlePhoneSpeechFast(uuid, speech);

    const response = turn.hangup
      ? xmlResponse(hangupXml(turn.speak))
      : xmlResponse(speakGatherXml(turn.speak, action));

    after(() => {
      void (async () => {
        try {
          const { persistPhoneTurn } = await import("@/lib/phone-agent");
          await persistPhoneTurn(uuid, speech, turn);
        } catch (err) {
          console.error("[vobiz/gather] persist failed", err);
        }
      })();
    });

    return response;
  } catch (err) {
    console.error("[vobiz/gather]", err);
    return xmlResponse(
      speakGatherXml(
        "Awaaz clear nahi aayi. Hindi ya Hinglish mein ek baar phir boliye.",
        action,
      ),
    );
  }
}
