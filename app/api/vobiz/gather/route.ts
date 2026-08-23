import { after } from "next/server";
import { voicePublicBase } from "@/lib/agora";
import { handlePhoneSpeech, persistPlaceWeather } from "@/lib/phone-agent";
import {
  hangupXml,
  parseVobizBody,
  speakGatherXml,
  speechFromVobizParams,
  xmlResponse,
} from "@/lib/vobiz";
import { findCallByUuid, updateCall } from "@/lib/crm-store";
import { upsertCaseFromCall } from "@/lib/agri-cases";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(req: Request) {
  const action = `${voicePublicBase(req)}/api/vobiz/gather`;
  const params = await parseVobizBody(req);
  const uuid = params.CallUUID || params.RequestUUID || "phone";
  const speech = speechFromVobizParams(params);

  let turn: Awaited<ReturnType<typeof handlePhoneSpeech>>;
  try {
    turn = await handlePhoneSpeech(uuid, speech);
  } catch (err) {
    console.error("[vobiz/gather] turn failed", err);
    return xmlResponse(
      speakGatherXml("आवाज़ साफ़ नहीं आई। हिंदी या हिंग्लिश में दोबारा बोलिए।", action),
    );
  }

  const response = turn.hangup
    ? xmlResponse(hangupXml(turn.speak))
    : xmlResponse(speakGatherXml(turn.speak, action));

  after(async () => {
    try {
      const existing = await findCallByUuid(uuid);
      if (existing) {
        const line = speech
          ? `YOU: ${speech}\nKRISHI: ${turn.speak}`
          : `KRISHI: ${turn.speak}`;
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
      }
      if (turn.backgroundWeatherPlace) {
        await persistPlaceWeather(uuid, turn.backgroundWeatherPlace);
      }
    } catch (err) {
      console.error("[vobiz/gather] persist failed", err);
    }
  });

  return response;
}
