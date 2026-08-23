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
  contact?: { name: string; id?: string } | null;
};

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

export function isLive(status: string) {
  return ["queued", "ringing", "dialing", "in-progress"].includes(status);
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
