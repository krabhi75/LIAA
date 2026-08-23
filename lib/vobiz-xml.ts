/**
 * Zero-dependency Vobiz Voice XML helpers.
 * Answer/Gather must never import Prisma or agora-agents — that cold-starts and drops PSTN legs.
 */

export const VOBIZ_PUBLIC_ORIGIN = "https://liaa-ebon.vercel.app";

/** Keep call alive: WOMAN+en-IN. Polly.Aditi is optional via env once Vobiz enables Polly. */
export const VOBIZ_TTS_VOICE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_VOICE?.trim()) ||
  "WOMAN";
export const VOBIZ_TTS_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_LANGUAGE?.trim()) ||
  "en-IN";

/** Gather ASR — Hindi. Allowed model: phone_call (not "telephony"). */
export const VOBIZ_STT_LANGUAGE = "hi-IN";
export const VOBIZ_SPEECH_MODEL = "phone_call";

export const VOBIZ_GATHER_HINTS =
  "namaste,naam,mera,main,gaon,shahar,district,zila,fasal,gehun,kapas,dhan,mausam,baarish,theek,haan,nahi,ji,madad,problem";

/** Roman Hindi — ASCII only. Devanagari has broken TTS on some Vobiz accounts and dropped calls. */
export const KRISHI_ANSWER_GREETING =
  "Namaste, main KrishiSaathi hoon. Main aapki kheti mein madad karta hoon. Sabse pehle aapka naam kya hai?";

export const KRISHI_NO_HEAR =
  "Awaaz clear nahi aayi. Ek baar phir boliye.";

function xmlEscape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function voiceBase(req?: Request): string {
  const env = process.env.PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) {
    return env;
  }
  if (req) {
    const host =
      req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    if (host && !host.includes("localhost")) return `${proto}://${host}`;
  }
  return VOBIZ_PUBLIC_ORIGIN;
}

export function speakXml(text: string): string {
  const voice = VOBIZ_TTS_VOICE;
  if (voice.startsWith("Polly.")) {
    return `<Speak voice="${xmlEscape(voice)}">${xmlEscape(text)}</Speak>`;
  }
  return `<Speak voice="${xmlEscape(voice)}" language="${xmlEscape(VOBIZ_TTS_LANGUAGE)}">${xmlEscape(text)}</Speak>`;
}

export function speakGatherXml(prompt: string, actionUrl: string): string {
  const answerUrl = actionUrl.replace(/\/gather(?:\?.*)?$/i, "/answer");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    `<Gather action="${xmlEscape(actionUrl)}" method="POST" inputType="speech" language="${VOBIZ_STT_LANGUAGE}" speechModel="${VOBIZ_SPEECH_MODEL}" speechEndTimeout="auto" executionTimeout="25" hints="${xmlEscape(VOBIZ_GATHER_HINTS)}">` +
    speakXml(prompt) +
    `</Gather>` +
    speakXml(KRISHI_NO_HEAR) +
    `<Redirect>${xmlEscape(answerUrl)}</Redirect>` +
    `</Response>`
  );
}

export function hangupXml(message: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>${speakXml(message)}<Hangup/></Response>`
  );
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
