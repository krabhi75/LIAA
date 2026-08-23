import { publicBaseUrl } from "@/lib/agora";
import { handlePhoneSpeech } from "@/lib/phone-agent";
import {
  hangupXml,
  parseVobizBody,
  speakGatherXml,
  xmlResponse,
} from "@/lib/vobiz";
import { findCallByUuid, updateCall } from "@/lib/crm-store";
import { upsertCaseFromCall } from "@/lib/agri-cases";

export async function POST(req: Request) {
  const params = await parseVobizBody(req);
  const uuid = params.CallUUID || params.RequestUUID || "phone";
  const speech = (params.Speech || params.Digits || "").trim();
  const turn = await handlePhoneSpeech(uuid, speech);
  const existing = await findCallByUuid(uuid);
  if (existing) {
    const line = speech ? `YOU: ${speech}\nLIAA: ${turn.speak}` : `LIAA: ${turn.speak}`;
    const transcript = existing.transcript ? `${existing.transcript}\n${line}` : line;
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
  }
  if (turn.hangup) return xmlResponse(hangupXml(turn.speak));
  const action = `${publicBaseUrl(req)}/api/vobiz/gather`;
  return xmlResponse(speakGatherXml(turn.speak, action));
}
