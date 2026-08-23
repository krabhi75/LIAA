/**
 * Zero-dependency Vobiz Voice XML helpers.
 * Answer/Gather must never import Prisma or agora-agents — that cold-starts and drops PSTN legs.
 *
 * Proven shape (eb23980): Speak nested INSIDE Gather, en-US TTS, en-IN ASR, Redirect on miss.
 */

export const VOBIZ_PUBLIC_ORIGIN = "https://liaa-ebon.vercel.app";

export const VOBIZ_TTS_VOICE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_VOICE?.trim()) ||
  "WOMAN";
export const VOBIZ_TTS_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_LANGUAGE?.trim()) ||
  "en-US";

/** Gather ASR — en-IN worked on this Vobiz account; hi-IN has dropped legs. */
export const VOBIZ_STT_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_STT_LANGUAGE?.trim()) ||
  "en-IN";

export const VOBIZ_SPEECH_MODEL = "phone_call";
export const VOBIZ_GATHER_HINTS =
  "namaste,naam,mera,main,gaon,shahar,district,zila,fasal,gehun,kapas,dhan,mausam,baarish,theek,haan,nahi,ji,madad,problem";

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
  let lang = VOBIZ_TTS_LANGUAGE;
  if (lang === "en-IN" || lang === "hi-IN") lang = "en-US";
  return `<Speak voice="${xmlEscape(voice)}" language="${xmlEscape(lang)}">${xmlEscape(text)}</Speak>`;
}

/**
 * Single Speak inside Gather — do NOT put Speak before Gather (Vobiz drops the leg).
 * No Record until outbound stays connected reliably.
 */
export function speakGatherXml(prompt: string, actionUrl: string): string {
  const answerUrl = actionUrl.replace(/\/gather(?:\?.*)?$/i, "/answer");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    `<Gather action="${xmlEscape(actionUrl)}" method="POST" inputType="speech" language="${xmlEscape(VOBIZ_STT_LANGUAGE)}" speechModel="${VOBIZ_SPEECH_MODEL}" speechEndTimeout="auto" executionTimeout="15">` +
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
