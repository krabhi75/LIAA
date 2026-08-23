import { listAgriCases, type AgriCaseRow } from "./agri-cases";
import {
  findContact,
  findContactByPhone,
  listCalls,
  type StoredCall,
  type StoredContact,
} from "./crm-store";
import { normalizePhone } from "./vobiz";

export type TimelineItem = {
  id: string;
  at: string;
  kind: "call" | "case" | "note";
  direction?: string;
  title: string;
  detail: string;
  transcript?: string;
  status?: string;
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
  const allCalls = await listCalls();
  const calls = allCalls.filter(
    (k) => k.contactId === farmer.id || samePhone(k.phone, farmer.phone),
  );
  const cases = (await listAgriCases()).filter((cs) =>
    samePhone(cs.phone, farmer.phone),
  );
  const timeline: TimelineItem[] = [
    ...calls.map((k) => ({
      id: k.id,
      at: k.startedAt,
      kind: "call" as const,
      direction: k.direction,
      title: `${k.direction === "inbound" ? "Inbound" : "Outbound"} call`,
      detail: `${k.status} · ${k.disposition}${k.hangupCause ? ` · ${k.hangupCause}` : ""}`,
      transcript: k.transcript || k.lastSpeech,
      status: k.status,
    })),
    ...cases.map((cs) => ({
      id: cs.id,
      at: cs.createdAt,
      kind: "case" as const,
      direction: cs.direction,
      title: `Case · ${cs.crop || "crop"} · ${cs.status}`,
      detail: [cs.village, cs.symptoms || cs.summary].filter(Boolean).join(" · "),
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
