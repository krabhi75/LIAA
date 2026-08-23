import { after } from "next/server";
import { handlePhoneSpeechFast } from "@/lib/phone-agent";
import { parseVobizBody, speechFromVobizParams } from "@/lib/vobiz";
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
 */
export async function POST(req: Request) {
  const action = `${voiceBase(req)}/api/vobiz/gather`;
  try {
    const params = await parseVobizBody(req);
    const uuid = params.CallUUID || params.RequestUUID || "phone";
    const speech = speechFromVobizParams(params);
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
