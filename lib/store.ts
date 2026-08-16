import { upcomingSlots, type PlanId } from "./catalog";

export type ObjectionType = "pricing" | "trust" | "product";

export type Lead = {
  channel: string;
  name?: string;
  company?: string;
  role?: string;
  email?: string;
  seats?: number;
  planId?: PlanId;
  competitor?: string;
  objections: ObjectionType[];
  timeline?: string;
  notes: string;
  status: "new" | "qualifying" | "qualified" | "demo_booked" | "escalated" | "follow_up";
  updatedAt: string;
};

export type Meeting = {
  id: string;
  channel: string;
  slotId: string;
  label: string;
  iso: string;
  attendee?: string;
  createdAt: string;
};

export type Escalation = {
  channel: string;
  reason: string;
  summary: string;
  waiting: boolean;
  createdAt: string;
};

export type ToolEvent = {
  at: string;
  tool: string;
  input: unknown;
  output: unknown;
};

export type SessionRecord = {
  channel: string;
  agentId?: string;
  lead: Lead;
  meetings: Meeting[];
  escalation?: Escalation;
  tools: ToolEvent[];
  createdAt: string;
};

type Store = {
  sessions: Map<string, SessionRecord>;
};

function memory(): Store {
  const g = globalThis as typeof globalThis & { __aetherStore?: Store };
  if (!g.__aetherStore) {
    g.__aetherStore = { sessions: new Map() };
  }
  return g.__aetherStore;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function getOrCreateSession(channel: string): SessionRecord {
  const store = memory();
  const existing = store.sessions.get(channel);
  if (existing) return existing;
  const rec: SessionRecord = {
    channel,
    lead: {
      channel,
      objections: [],
      notes: "",
      status: "new",
      updatedAt: nowIso(),
    },
    meetings: [],
    tools: [],
    createdAt: nowIso(),
  };
  store.sessions.set(channel, rec);
  return rec;
}

export function setAgentId(channel: string, agentId: string): void {
  getOrCreateSession(channel).agentId = agentId;
}

export function recordTool(
  channel: string,
  tool: string,
  input: unknown,
  output: unknown,
): void {
  const session = getOrCreateSession(channel);
  session.tools.unshift({ at: nowIso(), tool, input, output });
  session.tools = session.tools.slice(0, 40);
}

export function upsertLead(
  channel: string,
  patch: Partial<Omit<Lead, "channel" | "objections" | "updatedAt">> & {
    objection?: ObjectionType;
    notesAppend?: string;
  },
): Lead {
  const session = getOrCreateSession(channel);
  const lead = session.lead;
  if (patch.name) lead.name = patch.name;
  if (patch.company) lead.company = patch.company;
  if (patch.role) lead.role = patch.role;
  if (patch.email) lead.email = patch.email;
  if (typeof patch.seats === "number") lead.seats = patch.seats;
  if (patch.planId) lead.planId = patch.planId;
  if (patch.competitor) lead.competitor = patch.competitor;
  if (patch.timeline) lead.timeline = patch.timeline;
  if (patch.status) lead.status = patch.status;
  if (patch.objection && !lead.objections.includes(patch.objection)) {
    lead.objections.push(patch.objection);
  }
  if (patch.notesAppend) {
    lead.notes = [lead.notes, patch.notesAppend].filter(Boolean).join(" | ");
  }
  lead.updatedAt = nowIso();
  return lead;
}

export function bookMeeting(
  channel: string,
  slotId: string,
  attendee?: string,
): Meeting {
  const session = getOrCreateSession(channel);
  const slot = upcomingSlots(8).find((s) => s.id === slotId) ?? upcomingSlots(8)[0];
  const meeting: Meeting = {
    id: `mtg-${Date.now()}`,
    channel,
    slotId: slot.id,
    label: slot.label,
    iso: slot.iso,
    attendee,
    createdAt: nowIso(),
  };
  session.meetings.push(meeting);
  session.lead.status = "demo_booked";
  session.lead.updatedAt = nowIso();
  return meeting;
}

export function escalate(
  channel: string,
  reason: string,
  summary: string,
): Escalation {
  const session = getOrCreateSession(channel);
  session.escalation = {
    channel,
    reason,
    summary,
    waiting: true,
    createdAt: nowIso(),
  };
  session.lead.status = "escalated";
  session.lead.updatedAt = nowIso();
  return session.escalation;
}

export function snapshot(channel: string): SessionRecord {
  return getOrCreateSession(channel);
}
