import { runTool } from "./tools";
import { fetchLiveWeather } from "./weather";
import { findCallByUuid, upsertFarmerFacts } from "./crm-store";

export type PhoneTurn = {
  speak: string;
  hangup: boolean;
  /** When inline weather timed out, fetch after XML is sent. */
  backgroundWeatherPlace?: string;
};

type Stage = "name" | "place" | "help";

type Conv = {
  stage: Stage;
  name: string;
  place: string;
  weather: string;
};

const convos = new Map<string, Conv>();

const WEATHER_WAIT_MS = 2500;

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

async function weatherWithTimeout(place: string) {
  try {
    return await Promise.race([
      fetchLiveWeather(place),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), WEATHER_WAIT_MS)),
    ]);
  } catch {
    return null;
  }
}

export async function handlePhoneSpeech(
  channel: string,
  speech: string,
): Promise<PhoneTurn> {
  const t = speech.trim();
  const c = conv(channel);
  if (!t) {
    if (c.stage === "name") {
      return { speak: "आवाज़ साफ़ नहीं आई। अपना नाम बोलिए।", hangup: false };
    }
    if (c.stage === "place") {
      return {
        speak: "आवाज़ साफ़ नहीं आई। आप किस शहर या ज़िले में हैं?",
        hangup: false,
      };
    }
    return { speak: "आवाज़ साफ़ नहीं आई। एक बार फिर बोलिए।", hangup: false };
  }
  if (/\b(bye|goodbye|alvida|band karo|bas itna hi)\b/i.test(t)) {
    return {
      speak: c.name
        ? `ठीक है ${c.name} जी। ज़रूरत हो तो दोबारा कॉल कीजिए।`
        : "ठीक है। ज़रूरत हो तो दोबारा कॉल कीजिए।",
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
      speak: `नमस्ते ${c.name} जी। आप किस शहर या ज़िले में हैं?`,
      hangup: false,
    };
  }

  if (c.stage === "place") {
    c.place = t;
    c.stage = "help";
    await runTool(channel, "capture_field", { village: t, city: t, district: t });
    const call = await findCallByUuid(channel);
    const wx = await weatherWithTimeout(t);
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
      void runTool(channel, "get_weather", { place: t });
      return {
        speak: `ठीक है ${c.name} जी। ${wx.spokenHi} बताइए, खेती में किस बात में मदद चाहिए?`,
        hangup: false,
      };
    }
    if (call?.phone) {
      await upsertFarmerFacts(call.phone, { name: c.name, village: t, city: t });
    }
    return {
      speak: `ठीक है ${c.name} जी। लोकेशन नोट कर ली। बताइए, खेती में क्या मदद चाहिए?`,
      hangup: false,
      backgroundWeatherPlace: t,
    };
  }

  const weatherAsk = /\b(mausam|weather|baarish|garmi|sardi)\b/i.test(t);
  await runTool(channel, "capture_field", { symptoms: t });
  if (weatherAsk && c.weather) {
    return {
      speak: `${c.name} जी, ${c.weather} और कोई खेती की समस्या है क्या?`,
      hangup: false,
    };
  }
  if (weatherAsk && c.place) {
    const wx = await weatherWithTimeout(c.place);
    if (wx) {
      c.weather = wx.spokenHi;
      return { speak: `${c.name} जी, ${wx.spokenHi}`, hangup: false };
    }
    return {
      speak: "अभी लाइव मौसम नहीं मिल पाया। ज़िले का नाम थोड़ा साफ़ बोलिए।",
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
      speak: `${c.name} जी, आपकी बात एक्सपर्ट को भेज दी। पूरी कहानी दोबारा नहीं बतानी पड़ेगी।`,
      hangup: false,
    };
  }

  return {
    speak: c.weather
      ? `समझ गया। ${c.weather.replace(/\.$/, "")}। ये समस्या कब से है?`
      : "समझ गया। ये समस्या कब से है, और कितने खेत में है?",
    hangup: false,
  };
}

/** Persist weather + CRM after the XML response is already on the wire. */
export async function persistPlaceWeather(channel: string, place: string): Promise<void> {
  const c = convos.get(channel);
  if (!c || c.weather || !place.trim()) return;
  const wx = await fetchLiveWeather(place);
  if (!wx) return;
  c.weather = wx.spokenHi;
  const call = await findCallByUuid(channel);
  if (call?.phone) {
    await upsertFarmerFacts(call.phone, {
      name: c.name,
      village: place,
      city: wx.city,
      district: wx.district || place,
      state: wx.state,
      weatherSummary: wx.spokenHi,
      weatherAt: new Date().toISOString(),
    });
  }
  await runTool(channel, "get_weather", { place });
}
