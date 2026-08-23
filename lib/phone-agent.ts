import { runTool } from "./tools";
import { fetchLiveWeather } from "./weather";
import { findCallByUuid, upsertFarmerFacts } from "./crm-store";

export type PhoneTurn = {
  speak: string;
  hangup: boolean;
};

type Stage = "name" | "place" | "help";

type Conv = {
  stage: Stage;
  name: string;
  place: string;
  weather: string;
};

const convos = new Map<string, Conv>();

function conv(channel: string): Conv {
  let c = convos.get(channel);
  if (!c) {
    c = { stage: "name", name: "", place: "", weather: "" };
    convos.set(channel, c);
  }
  return c;
}

function cleanName(speech: string): string {
  return speech
    .replace(/^(mera naam|main|i am|my name is|naam)\s+/i, "")
    .replace(/\s+(hoon|hun|hai|ji)\.?$/i, "")
    .trim();
}

export async function handlePhoneSpeech(
  channel: string,
  speech: string,
): Promise<PhoneTurn> {
  const t = speech.trim();
  const c = conv(channel);
  if (!t) {
    if (c.stage === "name") {
      return { speak: "Sunai nahi diya. Aapka naam boliye.", hangup: false };
    }
    if (c.stage === "place") {
      return { speak: "Sunai nahi diya. Aap kis city ya district mein hain?", hangup: false };
    }
    return { speak: "Sunai nahi diya. Ek baar phir boliye.", hangup: false };
  }
  if (/\b(bye|goodbye|alvida|band karo|bas itna hi)\b/i.test(t)) {
    return {
      speak: c.name
        ? `Theek hai ${c.name} ji. Zarurat ho to dubara call kariye.`
        : "Theek hai. Zarurat ho to dubara call kariye.",
      hangup: true,
    };
  }

  if (c.stage === "name") {
    c.name = cleanName(t) || t;
    c.stage = "place";
    await runTool(channel, "capture_field", { farmer_name: c.name });
    const call = await findCallByUuid(channel);
    if (call?.phone) await upsertFarmerFacts(call.phone, { name: c.name });
    return {
      speak: `Namaste ${c.name} ji. Aap kis city ya district mein hain?`,
      hangup: false,
    };
  }

  if (c.stage === "place") {
    c.place = t;
    await runTool(channel, "capture_field", { village: t, city: t, district: t });
    const wx = await fetchLiveWeather(t);
    const call = await findCallByUuid(channel);
    if (wx) {
      c.weather = wx.spokenHi;
      if (call?.phone) {
        await upsertFarmerFacts(call.phone, {
          name: c.name,
          village: t,
          city: wx.city,
          district: wx.district || t,
          state: wx.state,
          weatherSummary: wx.spokenHi,
          weatherAt: new Date().toISOString(),
        });
      }
      await runTool(channel, "get_weather", { place: t });
    } else if (call?.phone) {
      await upsertFarmerFacts(call.phone, { name: c.name, village: t, city: t });
    }
    c.stage = "help";
    if (wx) {
      return {
        speak: `Theek hai ${c.name} ji. ${wx.spokenHi} Bataiye, main aapki kheti ke baare mein kis cheez mein madad kar sakta hoon?`,
        hangup: false,
      };
    }
    return {
      speak: `Theek hai ${c.name} ji. Location note kar li. Bataiye, kheti mein kya madad chahiye?`,
      hangup: false,
    };
  }

  const weatherAsk = /\b(mausam|weather|baarish|garmi|sardi)\b/i.test(t);
  await runTool(channel, "capture_field", { symptoms: t });
  if (weatherAsk && c.weather) {
    return {
      speak: `${c.name} ji, ${c.weather} Aur koi kheti ki problem hai kya?`,
      hangup: false,
    };
  }
  if (weatherAsk && c.place) {
    const wx = await fetchLiveWeather(c.place);
    if (wx) {
      c.weather = wx.spokenHi;
      return { speak: `${c.name} ji, ${wx.spokenHi}`, hangup: false };
    }
    return {
      speak: "Abhi live mausam nahi mil paya. District ka naam thoda clear boliye.",
      hangup: false,
    };
  }

  if (/\b(expert|doctor|kisan|officer|insaan)\b/i.test(t)) {
    const created = (await runTool(channel, "create_case", {
      farmer_name: c.name,
      summary: t,
    })) as { caseId?: string };
    await runTool(channel, "escalate_expert", {
      case_id: created.caseId,
      reason: t,
    });
    return {
      speak: `${c.name} ji, aapki baat expert ko bhej di. Poori kahani dobara nahi batani padegi.`,
      hangup: false,
    };
  }

  return {
    speak: c.weather
      ? `Samajh gaya. ${c.weather.replace(/\.$/, "")}. Ye problem kab se hai?`
      : "Samajh gaya. Ye problem kab se hai, aur kitne khet mein hai?",
    hangup: false,
  };
}
