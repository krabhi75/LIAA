/**
 * Zero-dependency Vobiz Voice XML helpers.
 * Answer/Gather must never import Prisma or agora-agents — that cold-starts and drops PSTN legs.
 */

import { gatherRetryUrl } from "./phone-session";

export const VOBIZ_PUBLIC_ORIGIN = "https://liaa-ebon.vercel.app";

/**
 * Indian farmer voice: Polly.Aditi (bilingual hi-IN / en-IN).
 * Do NOT use WOMAN+en-US (US accent). Do NOT use WOMAN+en-IN (invalid Speak lang → drop).
 * Override with VOBIZ_TTS_VOICE only if the account lacks Polly.
 */
export const VOBIZ_TTS_VOICE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_VOICE?.trim()) ||
  "Polly.Aditi";

/** Only for non-Polly WOMAN/MAN fallback — must be a documented Speak language. */
export const VOBIZ_TTS_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_LANGUAGE?.trim()) ||
  "en-US";

/** Gather ASR — Indian English / Hinglish. */
export const VOBIZ_STT_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_STT_LANGUAGE?.trim()) ||
  "en-IN";

export const VOBIZ_SPEECH_MODEL = "phone_call";
export const VOBIZ_GATHER_HINTS =
  "namaste,naam,mera,main,gaon,shahar,district,zila,fasal,gehun,kapas,dhan,mausam,baarish,theek,haan,nahi,ji,madad,problem,ramesh,abhishek";

/** Roman Hindi — Aditi reads Hinglish naturally. */
export const KRISHI_ANSWER_GREETING =
  "Namaste, main KrishiSaathi hoon. Main aapki kheti mein madad karta hoon. Sabse pehle aapka naam boliye. Bolne ke baad phone par hash dabaiye.";

export const KRISHI_NO_HEAR =
  "Awaaz clear nahi aayi. Naam boliye, phir hash dabaiye.";

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
  // Polly.* voices (Aditi) are bilingual Indian — no language attr.
  if (voice.startsWith("Polly.")) {
    return `<Speak voice="${xmlEscape(voice)}">${xmlEscape(text)}</Speak>`;
  }
  // Non-Polly fallback only: never emit en-IN/hi-IN on WOMAN/MAN Speak.
  let lang = VOBIZ_TTS_LANGUAGE;
  if (lang === "en-IN" || lang === "hi-IN") lang = "en-US";
  return `<Speak voice="${xmlEscape(voice)}" language="${xmlEscape(lang)}">${xmlEscape(text)}</Speak>`;
}

/**
 * Speak nested inside Gather. dtmf speech + # helps finalize PSTN utterances.
 */
export function speakGatherXml(prompt: string, actionUrl: string): string {
  const retryUrl = gatherRetryUrl(actionUrl);
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    `<Gather action="${xmlEscape(actionUrl)}" method="POST" inputType="dtmf speech" language="${xmlEscape(VOBIZ_STT_LANGUAGE)}" speechEndTimeout="auto" executionTimeout="30" finishOnKey="#" hints="${xmlEscape(VOBIZ_GATHER_HINTS)}">` +
    speakXml(prompt) +
    `</Gather>` +
    speakXml(KRISHI_NO_HEAR) +
    `<Redirect>${xmlEscape(retryUrl)}</Redirect>` +
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
