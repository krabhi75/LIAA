import type { PhoneConv } from "./phone-session";

export type PhoneTurn = {
  speak: string;
  hangup: boolean;
  conv: PhoneConv;
  backgroundWeatherPlace?: string;
  capture?: {
    name?: string;
    place?: string;
    symptoms?: string;
    escalate?: boolean;
  };
};

function cleanName(speech: string): string {
  return speech
    .replace(/^(mera naam|main|i am|my name is|naam)\s+/i, "")
    .replace(/\s+(hoon|hun|hai|ji)\.?$/i, "")
    .trim();
}

/**
 * Sync-only turn with explicit conv state (survives Vercel cold starts via URL params).
 */
export function handlePhoneSpeechFast(
  conv: PhoneConv,
  speech: string,
): PhoneTurn {
  const t = speech.trim();
  const c = { ...conv };

  if (!t) {
    if (c.stage === "name") {
      return {
        speak:
          "Sunai nahi diya. Naam boliye, ya phone par 1 dabakar hash press kijiye.",
        hangup: false,
        conv: c,
      };
    }
    if (c.stage === "place") {
      return {
        speak: "Sunai nahi diya. Aap kis city ya district mein hain?",
        hangup: false,
        conv: c,
      };
    }
    return {
      speak: "Sunai nahi diya. Ek baar phir boliye.",
      hangup: false,
      conv: c,
    };
  }

  if (/\b(bye|goodbye|alvida|band karo|bas itna hi)\b/i.test(t)) {
    return {
      speak: c.name
        ? `Theek hai ${c.name} ji. Zarurat ho to dubara call kariye.`
        : "Theek hai. Zarurat ho to dubara call kariye.",
      hangup: true,
      conv: c,
    };
  }

  if (c.stage === "name") {
    c.name = cleanName(t) || t;
    c.stage = "place";
    return {
      speak: `Namaste ${c.name} ji. Aap kis city ya district mein hain? Bol ke hash dabaiye.`,
      hangup: false,
      conv: c,
      capture: { name: c.name },
    };
  }

  if (c.stage === "place") {
    c.place = t;
    c.stage = "help";
    return {
      speak: `Theek hai ${c.name} ji. Location note kar li. Kheti mein kis cheez mein madad chahiye? Bol ke hash dabaiye.`,
      hangup: false,
      conv: c,
      capture: { name: c.name, place: t },
      backgroundWeatherPlace: t,
    };
  }

  const weatherAsk = /\b(mausam|weather|baarish|garmi|sardi)\b/i.test(t);
  if (weatherAsk && c.weather) {
    return {
      speak: `${c.name} ji, ${c.weather} Aur koi kheti ki problem hai kya?`,
      hangup: false,
      conv: c,
      capture: { symptoms: t },
    };
  }
  if (weatherAsk && c.place) {
    return {
      speak: `${c.name} ji, abhi live mausam nikal raha hoon. Pehle fasal ki problem bataiye.`,
      hangup: false,
      conv: c,
      capture: { symptoms: t },
      backgroundWeatherPlace: c.place,
    };
  }

  if (/\b(expert|doctor|kisan|officer|insaan)\b/i.test(t)) {
    return {
      speak: `${c.name} ji, aapki baat expert ko bhej di. Poori kahani dobara nahi batani padegi.`,
      hangup: false,
      conv: c,
      capture: { symptoms: t, escalate: true },
    };
  }

  return {
    speak: "Samajh gaya. Ye problem kab se hai, aur kitne khet mein hai?",
    hangup: false,
    conv: c,
    capture: { symptoms: t },
  };
}

/** CRM + weather after XML is already on the wire. */
export async function persistPhoneTurn(
  channel: string,
  speech: string,
  turn: PhoneTurn,
): Promise<void> {
  const { runTool } = await import("./tools");
  const { findCallByUuid, upsertFarmerFacts, updateCall } = await import(
    "./crm-store"
  );
  const { upsertCaseFromCall } = await import("./agri-cases");
  const { fetchLiveWeather } = await import("./weather");

  const c = turn.conv;
  const call = await findCallByUuid(channel);

  if (turn.capture?.name) {
    await runTool(channel, "capture_field", { farmer_name: turn.capture.name });
    if (call?.phone) {
      await upsertFarmerFacts(call.phone, { name: turn.capture.name });
    }
  }

  if (turn.capture?.place) {
    await runTool(channel, "capture_field", {
      village: turn.capture.place,
      city: turn.capture.place,
      district: turn.capture.place,
    });
    if (call?.phone) {
      await upsertFarmerFacts(call.phone, {
        name: c.name,
        village: turn.capture.place,
        city: turn.capture.place,
      });
    }
  }

  if (turn.capture?.symptoms) {
    await runTool(channel, "capture_field", { symptoms: turn.capture.symptoms });
  }

  if (turn.backgroundWeatherPlace) {
    try {
      const wx = await fetchLiveWeather(turn.backgroundWeatherPlace);
      if (wx) {
        c.weather = wx.spokenHi;
        if (call?.phone) {
          await upsertFarmerFacts(call.phone, {
            name: c.name,
            village: turn.backgroundWeatherPlace,
            city: wx.city,
            district: wx.district || turn.backgroundWeatherPlace,
            state: wx.state,
            weatherSummary: wx.spokenHi,
            weatherAt: new Date().toISOString(),
          });
        }
        await runTool(channel, "get_weather", {
          place: turn.backgroundWeatherPlace,
        });
      }
    } catch (err) {
      console.error("[phone-agent] weather persist failed", err);
    }
  }

  if (turn.capture?.escalate) {
    const created = (await runTool(channel, "create_case", {
      farmer_name: c.name,
      summary: speech || turn.capture.symptoms || "expert request",
    })) as { caseId?: string };
    await runTool(channel, "escalate_expert", {
      case_id: created.caseId,
      reason: speech,
    });
  }

  if (call) {
    const line = speech
      ? `YOU: ${speech}\nKRISHI: ${turn.speak}`
      : `KRISHI: ${turn.speak}`;
    const transcript = call.transcript ? `${call.transcript}\n${line}` : line;
    await updateCall(call.id, {
      lastSpeech: speech,
      transcript,
      disposition: turn.hangup ? "completed" : call.disposition,
      ...(turn.hangup
        ? { status: "ended", endedAt: new Date().toISOString() }
        : {}),
    });
    await upsertCaseFromCall({
      phone: call.phone,
      farmerName: c.name || "Farmer",
      direction: call.direction,
      source: "vobiz",
      channel,
      summary: speech || turn.speak,
      transcript,
      status: turn.hangup ? "completed" : "open",
    });
  }
}

/** @deprecated use handlePhoneSpeechFast(conv, speech) */
export async function handlePhoneSpeech(
  channel: string,
  speech: string,
): Promise<PhoneTurn> {
  const { freshPhoneConv } = await import("./phone-session");
  return handlePhoneSpeechFast(freshPhoneConv(), speech);
}

export async function persistPlaceWeather(
  channel: string,
  place: string,
): Promise<void> {
  const { freshPhoneConv } = await import("./phone-session");
  await persistPhoneTurn(channel, place, {
    speak: "",
    hangup: false,
    conv: freshPhoneConv(),
    backgroundWeatherPlace: place,
  });
}
