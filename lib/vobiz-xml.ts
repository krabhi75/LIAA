/**
 * Zero-dependency Vobiz Voice XML helpers.
 * Answer/Gather must never import Prisma or agora-agents — that cold-starts and drops PSTN legs.
 */

export const VOBIZ_PUBLIC_ORIGIN = "https://liaa-ebon.vercel.app";

/**
 * TTS — Vobiz basic Speak only allows WOMAN/MAN + listed langs (no en-IN, no hi-IN).
 * Invalid language (e.g. WOMAN+en-IN) drops the call on answer.
 * Default WOMAN+en-US keeps the leg up. Set VOBIZ_TTS_VOICE=Polly.Aditi for Indian accent
 * when the Vobiz account has Polly enabled (no language attr needed for Polly.*).
 */
export const VOBIZ_TTS_VOICE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_VOICE?.trim()) ||
  "WOMAN";
/** Only used for non-Polly voices. Must be a documented Speak language (en-US, en-GB, …). */
export const VOBIZ_TTS_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_LANGUAGE?.trim()) ||
  "en-US";

/** Gather ASR — Hindi. Allowed model: phone_call (not "telephony"). */
export const VOBIZ_STT_LANGUAGE = "hi-IN";
export const VOBIZ_SPEECH_MODEL = "phone_call";

export const VOBIZ_GATHER_HINTS =
  "namaste,naam,mera,main,gaon,shahar,district,zila,fasal,gehun,kapas,dhan,mausam,baarish,theek,haan,nahi,ji,madad,problem";

/** Roman Hindi — ASCII. Works with Polly.Aditi and with WOMAN+en-US. */
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
  // Non-Polly: never emit en-IN / hi-IN — those are not valid Speak languages.
  const lang =
    VOBIZ_TTS_LANGUAGE === "en-IN" || VOBIZ_TTS_LANGUAGE === "hi-IN"
      ? "en-US"
      : VOBIZ_TTS_LANGUAGE;
  return `<Speak voice="${xmlEscape(voice)}" language="${xmlEscape(lang)}">${xmlEscape(text)}</Speak>`;
}

function sessionRecordXml(callbackUrl: string): string {
  return (
    `<Record fileFormat="mp3" recordSession="true" maxLength="3600" playBeep="false" redirect="false" ` +
    `callbackUrl="${xmlEscape(callbackUrl)}" callbackMethod="POST"/>`
  );
}

function gatherInner(prompt: string, actionUrl: string): string {
  return (
    `<Gather action="${xmlEscape(actionUrl)}" method="POST" inputType="speech" language="${VOBIZ_STT_LANGUAGE}" speechModel="${VOBIZ_SPEECH_MODEL}" speechEndTimeout="4" executionTimeout="30" hints="${xmlEscape(VOBIZ_GATHER_HINTS)}">` +
    speakXml(prompt) +
    `</Gather>` +
    speakXml(KRISHI_NO_HEAR) +
    `<Redirect>${xmlEscape(actionUrl.replace(/\/gather(?:\?.*)?$/i, "/answer"))}</Redirect>`
  );
}

/**
 * Answer URL only — start session recording once, then Speak+Gather.
 * Do NOT put Record on every Gather turn (re-Record drops the PSTN leg).
 */
export function answerSpeakGatherXml(
  prompt: string,
  actionUrl: string,
): string {
  const recordCb = actionUrl.replace(/\/gather(?:\?.*)?$/i, "/recording");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    sessionRecordXml(recordCb) +
    gatherInner(prompt, actionUrl) +
    `</Response>`
  );
}

/** Gather / turn replies — Speak+Gather only (no Record). */
export function speakGatherXml(prompt: string, actionUrl: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    gatherInner(prompt, actionUrl) +
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
