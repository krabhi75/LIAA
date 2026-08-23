import { listAgriCases, type AgriCaseRow } from "./agri-cases";
import {
  findContact,
  findContactByPhone,
  listCallsForFarmer,
  type StoredCall,
  type StoredContact,
} from "./crm-store";
import { normalizePhone } from "./vobiz";

export type TimelineItem = {
  id: string;
  at: string;
  kind: "call" | "case" | "note" | "profile";
  direction?: string;
  title: string;
  detail: string;
  transcript?: string;
  status?: string;
  recordingUrl?: string;
  recordingSecs?: number;
};

export type FarmerProfile = {
  farmer: StoredContact;
  calls: StoredCall[];
  cases: AgriCaseRow[];
  timeline: TimelineItem[];
  lastInbound?: string;
  lastOutbound?: string;
};

function samePhone(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}

function noteEvents(notes: string): TimelineItem[] {
  if (!notes.trim()) return [];
  return notes
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      const cut = line.indexOf(" · ");
      const at = cut > 0 ? line.slice(0, cut) : "";
      const detail = cut > 0 ? line.slice(cut + 3) : line;
      return {
        id: `note-${i}-${at || i}`,
        at: at || new Date(0).toISOString(),
        kind: "note" as const,
        title: "Desk note",
        detail,
      };
    });
}

export async function loadFarmerProfile(id: string): Promise<FarmerProfile | null> {
  const farmer = await findContact(id);
  if (!farmer) return null;
  const calls = await listCallsForFarmer(farmer.id, farmer.phone);
  const cases = (await listAgriCases()).filter((cs) =>
    samePhone(cs.phone, farmer.phone),
  );
  const timeline: TimelineItem[] = [
    {
      id: `profile-${farmer.id}`,
      at: farmer.createdAt,
      kind: "profile" as const,
      title: "Farmer added to CRM",
      detail: [farmer.phone, farmer.village, farmer.crop].filter(Boolean).join(" · "),
    },
    ...calls.map((k) => ({
      id: k.id,
      at: k.startedAt,
      kind: "call" as const,
      direction: k.direction,
      title: `${k.direction === "inbound" ? "Inbound" : "Outbound"} call`,
      detail: [k.status, k.disposition, k.hangupCause].filter(Boolean).join(" · "),
      transcript: [k.transcript, k.lastSpeech].filter(Boolean).join("\n"),
      status: k.status,
      recordingUrl: k.recordingUrl || undefined,
      recordingSecs: k.recordingSecs || undefined,
    })),
    ...cases.map((cs) => ({
      id: cs.id,
      at: cs.createdAt,
      kind: "case" as const,
      direction: cs.direction,
      title: `Case · ${cs.crop || "crop"} · ${cs.status}`,
      detail: [cs.village, cs.district, cs.symptoms || cs.summary]
        .filter(Boolean)
        .join(" · "),
      transcript: cs.transcript,
      status: cs.status,
    })),
    ...noteEvents(farmer.notes),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return {
    farmer,
    calls,
    cases,
    timeline,
    lastInbound: calls.find((c) => c.direction.includes("in"))?.startedAt,
    lastOutbound: calls.find((c) => !c.direction.includes("in"))?.startedAt,
  };
}

export async function resolveFarmerId(idOrPhone: string): Promise<string | null> {
  const byId = await findContact(idOrPhone);
  if (byId) return byId.id;
  const byPhone = await findContactByPhone(idOrPhone);
  return byPhone?.id ?? null;
}
