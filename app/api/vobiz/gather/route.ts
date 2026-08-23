import { after } from "next/server";
import { voicePublicBase } from "@/lib/agora";
import { handlePhoneSpeech } from "@/lib/phone-agent";
import {
  hangupXml,
  parseVobizBody,
  speakGatherXml,
  xmlResponse,
} from "@/lib/vobiz";
import { findCallByUuid, updateCall } from "@/lib/crm-store";
import { upsertCaseFromCall } from "@/lib/agri-cases";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: Request) {
  const action = `${voicePublicBase(req)}/api/vobiz/gather`;
  try {
    const params = await parseVobizBody(req);
    const uuid = params.CallUUID || params.RequestUUID || "phone";
    const speech = (
      params.Speech ||
      params.Speech ||
      params.Digits ||
      ""
    ).trim();
    const turn = await handlePhoneSpeech(uuid, speech);
    after(async () => {
      try {
        const existing = await findCallByUuid(uuid);
        if (!existing) return;
        const line = speech
          ? `YOU: ${speech}\nLIAA: ${turn.speak}`
          : `LIAA: ${turn.speak}`;
        const transcript = existing.transcript
          ? `${existing.transcript}\n${line}`
          : line;
        await updateCall(existing.id, {
          lastSpeech: speech,
          transcript,
          disposition: turn.hangup ? "completed" : existing.disposition,
        });
        await upsertCaseFromCall({
          phone: existing.phone,
          farmerName: "Farmer",
          direction: existing.direction,
          source: "vobiz",
          channel: uuid,
          summary: speech || turn.speak,
          transcript,
          status: turn.hangup ? "completed" : "open",
        });
      } catch (err) {
        console.error("[vobiz/gather] persist failed", err);
      }
    });
    if (turn.hangup) return xmlResponse(hangupXml(turn.speak));
    return xmlResponse(speakGatherXml(turn.speak, action));
  } catch (err) {
    console.error("[vobiz/gather]", err);
    return xmlResponse(
      speakGatherXml(
        "Sunai nahi diya. Fasal ka naam Hindi, Hinglish, ya English mein boliye.",
        action,
      ),
    );
  }
}
