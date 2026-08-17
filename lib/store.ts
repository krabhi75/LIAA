import { upcomingSlots, type PlanId } from "./catalog";
import { prisma } from "./db";

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
  orgId?: string;
  agentConfigId?: string;
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

function emptyLead(channel: string): Lead {
  return {
    channel,
    objections: [],
    notes: "",
    status: "new",
    updatedAt: nowIso(),
  };
}

function persist(channel: string): void {
  const session = memory().sessions.get(channel);
  if (!session) return;
  void prisma.voiceSession
    .upsert({
      where: { channel },
      create: {
        channel,
        agoraAgentId: session.agentId ?? null,
        status: "active",
        orgId: session.orgId ?? null,
        agentConfigId: session.agentConfigId ?? null,
        leadJson: JSON.stringify(session.lead),
        meetingsJson: JSON.stringify(session.meetings),
        toolsJson: JSON.stringify(session.tools),
        escalationJson: session.escalation
          ? JSON.stringify(session.escalation)
          : null,
      },
      update: {
        agoraAgentId: session.agentId ?? null,
        orgId: session.orgId ?? null,
        agentConfigId: session.agentConfigId ?? null,
        leadJson: JSON.stringify(session.lead),
        meetingsJson: JSON.stringify(session.meetings),
        toolsJson: JSON.stringify(session.tools),
        escalationJson: session.escalation
          ? JSON.stringify(session.escalation)
          : null,
      },
    })
    .then(async () => {
      if (!session.orgId) return;
      await prisma.lead.upsert({
        where: {
          orgId_channel: { orgId: session.orgId, channel },
        },
        create: {
          orgId: session.orgId,
          channel,
          name: session.lead.name,
          company: session.lead.company,
          role: session.lead.role,
          email: session.lead.email,
          seats: session.lead.seats,
          planId: session.lead.planId,
          competitor: session.lead.competitor,
          objections: JSON.stringify(session.lead.objections),
          timeline: session.lead.timeline,
          notes: session.lead.notes,
          status: session.lead.status,
        },
        update: {
          name: session.lead.name,
          company: session.lead.company,
          role: session.lead.role,
          email: session.lead.email,
          seats: session.lead.seats,
          planId: session.lead.planId,
          competitor: session.lead.competitor,
          objections: JSON.stringify(session.lead.objections),
          timeline: session.lead.timeline,
          notes: session.lead.notes,
          status: session.lead.status,
        },
      });
    })
    .catch((err) => {
      console.error("[store] persist failed", channel, err);
    });
}

export function getOrCreateSession(channel: string): SessionRecord {
  const store = memory();
  const existing = store.sessions.get(channel);
  if (existing) return existing;
  const rec: SessionRecord = {
    channel,
    lead: emptyLead(channel),
    meetings: [],
    tools: [],
    createdAt: nowIso(),
  };
  store.sessions.set(channel, rec);
  persist(channel);
  return rec;
}

export async function hydrateSession(channel: string): Promise<SessionRecord> {
  const store = memory();
  const cached = store.sessions.get(channel);
  if (cached) return cached;

  const row = await prisma.voiceSession.findUnique({ where: { channel } });
  if (!row) return getOrCreateSession(channel);

  const rec: SessionRecord = {
    channel,
    agentId: row.agoraAgentId ?? undefined,
    orgId: row.orgId ?? undefined,
    agentConfigId: row.agentConfigId ?? undefined,
    lead: {
      ...emptyLead(channel),
      ...(JSON.parse(row.leadJson || "{}") as Partial<Lead>),
      channel,
      objections: Array.isArray(
        (JSON.parse(row.leadJson || "{}") as Lead).objections,
      )
        ? (JSON.parse(row.leadJson || "{}") as Lead).objections
        : [],
      notes: (JSON.parse(row.leadJson || "{}") as Lead).notes ?? "",
      status: ((JSON.parse(row.leadJson || "{}") as Lead).status ??
        "new") as Lead["status"],
      updatedAt:
        (JSON.parse(row.leadJson || "{}") as Lead).updatedAt ?? nowIso(),
    },
    meetings: JSON.parse(row.meetingsJson || "[]") as Meeting[],
    tools: JSON.parse(row.toolsJson || "[]") as ToolEvent[],
    escalation: row.escalationJson
      ? (JSON.parse(row.escalationJson) as Escalation)
      : undefined,
    createdAt: row.createdAt.toISOString(),
  };
  store.sessions.set(channel, rec);
  return rec;
}

export function bindSessionMeta(
  channel: string,
  meta: { orgId?: string; agentConfigId?: string },
): void {
  const session = getOrCreateSession(channel);
  if (meta.orgId) session.orgId = meta.orgId;
  if (meta.agentConfigId) session.agentConfigId = meta.agentConfigId;
  persist(channel);
}

export function setAgentId(channel: string, agentId: string): void {
  getOrCreateSession(channel).agentId = agentId;
  persist(channel);
}

export function findChannelByAgentId(agentId: string): string | null {
  for (const session of memory().sessions.values()) {
    if (session.agentId === agentId) return session.channel;
  }
  return null;
}

export async function findChannelByAgentIdAsync(
  agentId: string,
): Promise<string | null> {
  const local = findChannelByAgentId(agentId);
  if (local) return local;
  const row = await prisma.voiceSession.findFirst({
    where: { agoraAgentId: agentId },
    select: { channel: true },
  });
  return row?.channel ?? null;
}

export function clearAgentId(channel: string): void {
  const session = memory().sessions.get(channel);
  if (session) {
    session.agentId = undefined;
    persist(channel);
  }
}

export function endSession(channel: string): void {
  const session = memory().sessions.get(channel);
  if (!session) return;
  void prisma.voiceSession
    .updateMany({
      where: { channel },
      data: { status: "ended", endedAt: new Date(), agoraAgentId: null },
    })
    .catch(() => undefined);
  session.agentId = undefined;
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
  persist(channel);
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
  persist(channel);
  return lead;
}

export function bookMeeting(
  channel: string,
  slotId: string,
  attendee?: string,
): Meeting {
  const session = getOrCreateSession(channel);
  const slot =
    upcomingSlots(8).find((s) => s.id === slotId) ?? upcomingSlots(8)[0];
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
  persist(channel);
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
  persist(channel);
  return session.escalation;
}

export function snapshot(channel: string): SessionRecord {
  return getOrCreateSession(channel);
}
