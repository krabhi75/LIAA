export type Contact = {
  id: string;
  name: string;
  phone: string;
  company: string;
  village?: string;
  district?: string;
  crop?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  calls?: Call[];
};

export type Call = {
  id: string;
  contactId?: string | null;
  phone: string;
  direction?: string;
  status: string;
  disposition: string;
  transcript: string;
  lastSpeech: string;
  startedAt: string;
  answeredAt?: string | null;
  endedAt?: string | null;
  contact?: { name: string; id?: string } | null;
};

const LIVE_STATUSES = new Set(["queued", "ringing", "dialing", "in-progress"]);

/** Pre-answer legs rarely last more than a few minutes. */
const PRE_ANSWER_MAX_MS = 5 * 60 * 1000;
/** Connected PSTN calls — cap well below “stuck since hours ago”. */
const IN_PROGRESS_MAX_MS = 25 * 60 * 1000;

export type AgriCase = {
  id: string;
  farmerName: string;
  crop: string;
  village: string;
  district?: string;
  status: string;
  phone?: string;
  summary: string;
  symptoms?: string;
  transcript?: string;
};

export async function jsonSafe(
  res: Response,
): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "F";
}

export function isCallLive(
  call: Pick<Call, "status" | "startedAt" | "endedAt" | "answeredAt">,
): boolean {
  if (call.endedAt) return false;
  if (!LIVE_STATUSES.has(call.status)) return false;
  const anchor = call.answeredAt || call.startedAt;
  if (!anchor) return true;
  const ageMs = Date.now() - new Date(anchor).getTime();
  if (Number.isNaN(ageMs)) return true;
  if (["queued", "ringing", "dialing"].includes(call.status)) {
    return ageMs < PRE_ANSWER_MAX_MS;
  }
  if (call.status === "in-progress") {
    return ageMs < IN_PROGRESS_MAX_MS;
  }
  return true;
}

/** @deprecated prefer isCallLive(call) */
export function isLive(status: string) {
  return LIVE_STATUSES.has(status);
}

export function isInbound(direction?: string) {
  return (direction ?? "").toLowerCase().includes("in");
}

export function when(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { hour12: true });
}
