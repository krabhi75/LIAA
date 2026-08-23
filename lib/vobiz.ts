export {
  hangupXml,
  speakGatherXml,
  speakXml,
  xmlResponse,
  voiceBase as voicePublicBase,
} from "./vobiz-xml";

export function speechFromVobizParams(params: Record<string, string>): string {
  const raw =
    params.Speech ||
    params.speech ||
    params.StableSpeech ||
    params.stable_speech ||
    params.UnstableSpeech ||
    params.unstable_speech ||
    params.transcription ||
    params.Transcription ||
    "";
  if (raw.trim()) return raw.trim();
  const inputType = (params.InputType || params.inputType || "").toLowerCase();
  const digits = (params.Digits || params.digits || "").trim();
  if (inputType === "dtmf" || digits) {
    if (digits === "1") return "haan ji";
    if (digits === "2") return "nahi";
    return digits;
  }
  return "";
}

/** For CRM debug when Vobiz sends empty Speech. */
export function gatherDebugLine(params: Record<string, string>): string {
  const keys = [
    "InputType",
    "Speech",
    "Digits",
    "SpeechConfidenceScore",
    "UnstableSpeech",
    "StableSpeech",
  ];
  const bits = keys
    .map((k) => {
      const v = params[k] ?? params[k.toLowerCase()] ?? "";
      return v ? `${k}=${String(v).slice(0, 40)}` : "";
    })
    .filter(Boolean);
  return bits.length ? `DBG: ${bits.join(" | ")}` : "DBG: empty gather";
}

function envOr(key: string, fallback = ""): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export function vobizConfig() {
  const authId = envOr("VOBIZ_AUTH_ID");
  const token = envOr("VOBIZ_AUTH_TOKEN");
  const from = envOr("VOBIZ_FROM_NUMBER", "+917971443138");
  const sipDomain = envOr("VOBIZ_SIP_DOMAIN", "a4dc1a99.sip.vobiz.ai");
  const outboundTrunkId = envOr(
    "VOBIZ_OUTBOUND_TRUNK_ID",
    "a4dc1a99-2efa-4f52-b481-5dfd99aca03d",
  );
  const inboundTrunkId = envOr(
    "VOBIZ_INBOUND_TRUNK_ID",
    "c56b68cd-591f-4196-92df-e9e7a34aae9b",
  );
  return { authId, token, from, sipDomain, outboundTrunkId, inboundTrunkId };
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  return raw.trim();
}

export async function parseVobizBody(
  req: Request,
): Promise<Record<string, string>> {
  const ctype = req.headers.get("content-type") ?? "";
  if (ctype.includes("application/json")) {
    const json = (await req.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([k, v]) => [k, v == null ? "" : String(v)]),
    );
  }
  const text = await req.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export async function placeVobizCall(opts: {
  to: string;
  answerUrl: string;
  hangupUrl: string;
}): Promise<{ requestUuid: string; raw: unknown }> {
  const { authId, token, from } = vobizConfig();
  if (!authId || !token) {
    throw new Error("Vobiz credentials missing. Set VOBIZ_AUTH_ID and VOBIZ_AUTH_TOKEN.");
  }
  const res = await fetch(
    `https://api.vobiz.ai/api/v1/Account/${authId}/Call/`,
    {
      method: "POST",
      headers: {
        "X-Auth-ID": authId,
        "X-Auth-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        answer_url: opts.answerUrl,
        answer_method: "POST",
        hangup_url: opts.hangupUrl,
        hangup_method: "POST",
        caller_name: "KrishiSaathi",
        time_limit: 600,
      }),
    },
  );
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof raw.message === "string"
        ? raw.message
        : `Vobiz call failed (${res.status})`,
    );
  }
  const requestUuid = String(raw.request_uuid ?? raw.call_uuid ?? "");
  return { requestUuid, raw };
}

export function mapDisposition(params: Record<string, string>): string {
  const cause = (
    params.HangupCause ??
    params.hangup_cause ??
    params.EndReason ??
    ""
  ).toLowerCase();
  const status = (params.CallStatus ?? params.call_status ?? "").toLowerCase();
  const answered = Boolean(params.AnswerTime || params.answer_time);

  if (cause.includes("busy")) return "busy";
  if (
    cause.includes("no_answer") ||
    cause.includes("no-answer") ||
    cause.includes("noanswer")
  ) {
    return "no_answer";
  }
  if (cause.includes("cancel")) return "cancelled";
  if (cause.includes("fail") || status === "failed") return "failed";
  if (answered || status === "completed") return "completed";
  return status || "ended";
}
