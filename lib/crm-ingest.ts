import { upsertCaseFromCall } from "./agri-cases";
import { upsertCallByUuid } from "./crm-store";
import { mapDisposition, normalizePhone } from "./vobiz";

function pick(map: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = map[k] ?? map[k.toLowerCase()] ?? map[k.toUpperCase()];
    if (v) return v;
  }
  return "";
}

function flatten(value: unknown, into: Record<string, string>, prefix = ""): void {
  if (value == null) return;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    if (prefix) into[prefix] = String(value);
    return;
  }
  if (Array.isArray(value)) {
    const texts = value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          return String(o.text ?? o.content ?? o.transcript ?? "");
        }
        return "";
      })
      .filter(Boolean);
    if (texts.length && prefix) into[prefix] = texts.join("\n");
    value.forEach((item, i) => flatten(item, into, prefix ? `${prefix}.${i}` : String(i)));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      flatten(v, into, prefix ? `${prefix}.${k}` : k);
    }
  }
}

export function flattenWebhook(body: Record<string, string> | Record<string, unknown>): Record<string, string> {
  const into: Record<string, string> = {};
  flatten(body, into);
  if (typeof body === "object") {
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string") into[k] = v;
    }
  }
  return into;
}

export async function ingestCallWebhook(
  source: "vobiz" | "agora",
  raw: Record<string, string>,
): Promise<{ callId: string; caseId: string; disposition: string }> {
  const event = pick(raw, [
    "event",
    "Event",
    "type",
    "call_event",
  ]).toLowerCase();
  const uuid =
    pick(raw, [
      "CallUUID",
      "call_uuid",
      "RequestUUID",
      "request_uuid",
      "callId",
      "call_id",
      "session_id",
      "channel",
    ]) || `wh-${Date.now()}`;
  const from = normalizePhone(pick(raw, ["From", "from", "caller", "caller_number"]));
  const to = normalizePhone(pick(raw, ["To", "to", "called", "callee"]));
  const direction = (
    pick(raw, ["Direction", "direction"]) ||
    (event.includes("incoming") ? "inbound" : "outbound")
  ).toLowerCase();
  const farmerPhone = direction.includes("in") ? from || to : to || from;
  const transcript = pick(raw, [
    "transcript",
    "Transcript",
    "Speech",
    "conversation",
    "summary",
    "text",
  ]);
  const hangup = pick(raw, ["HangupCause", "hangup_cause", "cause"]);
  const statusRaw = pick(raw, ["CallStatus", "call_status", "status"]);
  const ended =
    event.includes("end") ||
    event.includes("hangup") ||
    ["completed", "busy", "failed", "no-answer", "no_answer"].includes(
      statusRaw.toLowerCase(),
    );
  const disposition = mapDisposition({
    ...raw,
    HangupCause: hangup,
    CallStatus: statusRaw || (ended ? "completed" : "in-progress"),
  });
  const summary =
    transcript.slice(0, 280) ||
    `${direction} ${source} ${ended ? "ended" : statusRaw || event || "update"}`;

  const call = await upsertCallByUuid({
    uuid,
    phone: farmerPhone || to || from || "unknown",
    direction: direction || "inbound",
    status: ended ? "ended" : statusRaw || "in-progress",
    disposition: ended ? disposition : "dialing",
    hangupCause: hangup,
    transcript,
    ended,
  });
  const callId = call.id;

  const agri = upsertCaseFromCall({
    phone: farmerPhone || to || from,
    farmerName: pick(raw, ["CallerName", "caller_name", "name"]) || "Farmer",
    direction,
    source,
    channel: uuid,
    summary,
    transcript,
    status: ended ? disposition : "open",
  });

  return { callId, caseId: agri.id, disposition };
}

export async function readWebhookPayload(
  req: Request,
): Promise<Record<string, unknown>> {
  const ctype = req.headers.get("content-type") ?? "";
  const text = await req.text();
  if (!text) return {};
  if (ctype.includes("application/json") || text.trim().startsWith("{")) {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      return { raw: text };
    }
  }
  const params = new URLSearchParams(text);
  const out: Record<string, unknown> = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}
