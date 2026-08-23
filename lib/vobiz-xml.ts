/**
 * Zero-dependency Vobiz Voice XML helpers.
 * Answer/Gather must never import Prisma or agora-agents — that cold-starts and drops PSTN legs.
 *
 * Keep XML minimal. Invalid Speak language, unsupported Gather ASR, or Record on answer
 * has caused NORMAL_CLEARING hangup within ~1s of answer webhook (see CRM answeredAt=null).
 */

export const VOBIZ_PUBLIC_ORIGIN = "https://liaa-ebon.vercel.app";

/**
 * Speak: only documented WOMAN/MAN + Speak languages.
 * en-IN / hi-IN are NOT in the Speak language table — they can drop the call.
 * (Gather ASR can use other codes; Speak cannot.)
 */
export const VOBIZ_TTS_VOICE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_VOICE?.trim()) ||
  "WOMAN";
export const VOBIZ_TTS_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_TTS_LANGUAGE?.trim()) ||
  "en-US";

/**
 * Gather ASR — start with en-US (always listed). hi-IN can be set via env once the
 * account’s ASR pack is confirmed; unsupported Gather language also drops the leg.
 */
export const VOBIZ_STT_LANGUAGE =
  (typeof process !== "undefined" && process.env.VOBIZ_STT_LANGUAGE?.trim()) ||
  "en-US";

/** Roman Hindi / English — ASCII only. */
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

function gatherInner(prompt: string, actionUrl: string): string {
  const answerUrl = actionUrl.replace(/\/gather(?:\?.*)?$/i, "/answer");
  // Minimal Gather — no hints, no speechModel, no Record (those have dropped India outbound).
  return (
    speakXml(prompt) +
    `<Gather action="${xmlEscape(actionUrl)}" method="POST" inputType="speech" language="${xmlEscape(VOBIZ_STT_LANGUAGE)}" executionTimeout="30">` +
    speakXml("Boliye.") +
    `</Gather>` +
    speakXml(KRISHI_NO_HEAR) +
    `<Redirect>${xmlEscape(answerUrl)}</Redirect>`
  );
}

/**
 * Answer URL XML — Speak first (so audio starts), then Gather.
 * No session Record here; recording can be re-added after the leg stays up.
 */
export function answerSpeakGatherXml(
  prompt: string,
  actionUrl: string,
): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<Response>` +
    gatherInner(prompt, actionUrl) +
    `</Response>`
  );
}

/** Gather / turn replies — same minimal pattern. */
export function speakGatherXml(prompt: string, actionUrl: string): string {
  return answerSpeakGatherXml(prompt, actionUrl);
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
      // Plivo/Vobiz parsers accept both; application/xml is the safer default.
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
