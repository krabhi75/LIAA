import { publicBaseUrl } from "@/lib/agora";
import { handlePhoneSpeech } from "@/lib/phone-agent";
import {
  hangupXml,
  parseVobizBody,
  speakGatherXml,
  xmlResponse,
} from "@/lib/vobiz";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const params = await parseVobizBody(req);
  const uuid = params.CallUUID || params.RequestUUID || "phone";
  const speech = (params.Speech || params.Digits || "").trim();
  const turn = await handlePhoneSpeech(uuid, speech);
  const existing = await prisma.crmCall.findFirst({ where: { vobizUuid: uuid } });
  if (existing) {
    const line = speech ? `YOU: ${speech}\nLIAA: ${turn.speak}` : `LIAA: ${turn.speak}`;
    await prisma.crmCall.update({
      where: { id: existing.id },
      data: {
        lastSpeech: speech,
        transcript: existing.transcript
          ? `${existing.transcript}\n${line}`
          : line,
        disposition: turn.hangup ? "completed" : existing.disposition,
      },
    });
  }
  if (turn.hangup) return xmlResponse(hangupXml(turn.speak));
  const action = `${publicBaseUrl(req)}/api/vobiz/gather`;
  return xmlResponse(speakGatherXml(turn.speak, action));
}
