import { runTool } from "./tools";

export type PhoneTurn = {
  speak: string;
  hangup: boolean;
};

export async function handlePhoneSpeech(
  channel: string,
  speech: string,
): Promise<PhoneTurn> {
  const t = speech.trim().toLowerCase();
  if (!t) {
    return {
      speak: "Sunai nahi diya. Fasal ka naam boliye.",
      hangup: false,
    };
  }
  if (/\b(bye|goodbye|alvida|band karo)\b/.test(t)) {
    return { speak: "Theek hai. Case screen par hai. Expert dekh lenge.", hangup: true };
  }

  await runTool(channel, "capture_field", {
    crop: /\b(wheat|gehun|cotton|kapas|onion|pyaz|rice|dhan|tomato|tamatar)\b/.exec(t)?.[1],
    village: t,
    symptoms: t,
  });

  if (/\b(expert|doctor|kisan|officer|insaan)\b/.test(t)) {
    const created = (await runTool(channel, "create_case", {
      summary: speech,
    })) as { caseId?: string };
    await runTool(channel, "escalate_expert", {
      case_id: created.caseId,
      reason: speech,
    });
    return {
      speak: "Expert ko case bhej diya. Aapko dobara poori kahani nahi batani.",
      hangup: false,
    };
  }

  await runTool(channel, "get_weather", { place: t });
  await runTool(channel, "get_advisory", { symptoms: t, topic: "pest" });
  await runTool(channel, "create_case", { summary: speech });

  return {
    speak:
      "Samajh gayi. Weather check kiya. Abhi dawai nahi. Case bana diya — expert dekhenge. Aur bataiye kab se hai.",
    hangup: false,
  };
}
