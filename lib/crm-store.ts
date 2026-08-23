import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { prisma, prismaConfigured } from "./db";
import { normalizePhone } from "./vobiz";

export type StoredContact = {
  id: string;
  name: string;
  phone: string;
  company: string;
  village: string;
  district: string;
  crop: string;
  city: string;
  state: string;
  weatherSummary: string;
  weatherAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredCall = {
  id: string;
  contactId: string | null;
  phone: string;
  direction: string;
  vobizUuid: string | null;
  vobizRequestUuid: string | null;
  status: string;
  disposition: string;
  hangupCause: string;
  transcript: string;
  lastSpeech: string;
  recordingUrl: string;
  recordingId: string;
  recordingSecs: number;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
};

type Bag = { contacts: StoredContact[]; calls: StoredCall[] };

type G = typeof globalThis & { __liaaCrm?: Bag };

function prismaOk(): boolean {
  return prismaConfigured();
}

function logPrisma(op: string, e: unknown) {
  console.error(`[crm-store] ${op}`, e);
}

function dir(): string {
  return process.env.VERCEL ? "/tmp/liaa-crm" : join(process.cwd(), ".liaa-crm");
}

function filePath(): string {
  return join(dir(), "store.json");
}

function empty(): Bag {
  return { contacts: [], calls: [] };
}

function readDisk(): Bag {
  try {
    const p = filePath();
    if (!existsSync(p)) return empty();
    const parsed = JSON.parse(readFileSync(p, "utf8")) as Bag;
    return {
      contacts: (parsed.contacts ?? []).map((c) =>
        serializeContact({
          ...c,
          company: c.company ?? "",
          notes: c.notes ?? "",
        }),
      ),
      calls: parsed.calls ?? [],
    };
  } catch {
    return empty();
  }
}

function mem(): Bag {
  const g = globalThis as G;
  if (!g.__liaaCrm) g.__liaaCrm = readDisk();
  return g.__liaaCrm;
}

function persist(bag: Bag) {
  (globalThis as G).__liaaCrm = bag;
  try {
    mkdirSync(dir(), { recursive: true });
    writeFileSync(filePath(), JSON.stringify(bag), "utf8");
  } catch {
    /* read-only or ephemeral */
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function nid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeContact(c: {
  id: string;
  name: string;
  phone: string;
  company: string;
  village?: string;
  district?: string;
  crop?: string;
  city?: string;
  state?: string;
  weatherSummary?: string;
  weatherAt?: Date | string | null;
  notes: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}): StoredContact {
  const village = c.village || c.company || "";
  const weatherAt = c.weatherAt
    ? typeof c.weatherAt === "string"
      ? c.weatherAt
      : c.weatherAt.toISOString()
    : null;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    company: c.company,
    village,
    district: c.district || "",
    crop: c.crop || "",
    city: c.city || "",
    state: c.state || "",
    weatherSummary: c.weatherSummary || "",
    weatherAt,
    notes: c.notes,
    createdAt: typeof c.createdAt === "string" ? c.createdAt : c.createdAt.toISOString(),
    updatedAt: typeof c.updatedAt === "string" ? c.updatedAt : c.updatedAt.toISOString(),
  };
}

export async function listContacts(): Promise<
  (StoredContact & { calls: StoredCall[] })[]
> {
  if (prismaOk()) {
    try {
      const rows = await prisma.crmContact.findMany({
        orderBy: { updatedAt: "desc" },
        include: { calls: { orderBy: { startedAt: "desc" }, take: 3 } },
      });
      return rows.map((c) => ({
        ...serializeContact(c),
        calls: c.calls.map(serializePrismaCall),
      }));
    } catch (e) {
      logPrisma("listContacts", e);
    }
  }
  const bag = mem();
  return [...bag.contacts]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((c) => ({
      ...c,
      calls: bag.calls
        .filter((k) => k.contactId === c.id)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, 3),
    }));
}

export async function createContact(input: {
  name: string;
  phone: string;
  company?: string;
}): Promise<StoredContact> {
  const phone = normalizePhone(input.phone);
  if (prismaOk()) {
    try {
      const c = await prisma.crmContact.create({
        data: {
          name: input.name,
          phone,
          company: input.company ?? "",
          village: input.company ?? "",
        },
      });
      return serializeContact(c);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  const row: StoredContact = {
    id: nid("ct"),
    name: input.name,
    phone,
    company: input.company ?? "",
    village: input.company ?? "",
    district: "",
    crop: "",
    city: "",
    state: "",
    weatherSummary: "",
    weatherAt: null,
    notes: "",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const bag = mem();
  persist({ ...bag, contacts: [row, ...bag.contacts] });
  return row;
}

export async function upsertContactByPhone(input: {
  name: string;
  phone: string;
}): Promise<StoredContact | null> {
  const phone = normalizePhone(input.phone);
  if (!phone) return null;
  if (prismaOk()) {
    try {
      const existing = await prisma.crmContact.findFirst({ where: { phone } });
      if (existing) {
        const name =
          input.name && input.name !== "Farmer" ? input.name : existing.name;
        const c = await prisma.crmContact.update({
          where: { id: existing.id },
          data: { name },
        });
        return serializeContact(c);
      }
      return createContact({ name: input.name || "Farmer", phone });
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  const bag = mem();
  const existing = bag.contacts.find((c) => c.phone === phone);
  if (existing) {
    if (input.name && input.name !== "Farmer") existing.name = input.name;
    existing.updatedAt = nowIso();
    persist(bag);
    return existing;
  }
  return createContact({ name: input.name || "Farmer", phone });
}

export async function findContact(id: string): Promise<StoredContact | null> {
  if (prismaOk()) {
    try {
      const c = await prisma.crmContact.findUnique({ where: { id } });
      if (c) return serializeContact(c);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  return mem().contacts.find((c) => c.id === id) ?? null;
}

export async function findContactByPhone(phoneRaw: string): Promise<StoredContact | null> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return null;
  if (prismaOk()) {
    try {
      const c = await prisma.crmContact.findFirst({ where: { phone } });
      if (c) return serializeContact(c);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  return mem().contacts.find((c) => c.phone === phone) ?? null;
}

export async function appendContactNote(
  id: string,
  note: string,
): Promise<StoredContact | null> {
  const line = `${nowIso()} · ${note.trim()}`;
  if (!note.trim()) return findContact(id);
  if (prismaOk()) {
    try {
      const existing = await prisma.crmContact.findUnique({ where: { id } });
      if (!existing) return null;
      const c = await prisma.crmContact.update({
        where: { id },
        data: {
          notes: existing.notes ? `${existing.notes}\n${line}` : line,
        },
      });
      return serializeContact(c);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  const bag = mem();
  const row = bag.contacts.find((c) => c.id === id);
  if (!row) return null;
  row.notes = row.notes ? `${row.notes}\n${line}` : line;
  row.updatedAt = nowIso();
  persist(bag);
  return row;
}

export async function updateContact(
  id: string,
  data: {
    name?: string;
    phone?: string;
    village?: string;
    district?: string;
    crop?: string;
    city?: string;
    state?: string;
    weatherSummary?: string;
    weatherAt?: string | null;
    company?: string;
  },
): Promise<StoredContact | null> {
  const phone = data.phone ? normalizePhone(data.phone) : undefined;
  const village = data.village?.trim();
  const district = data.district?.trim();
  const crop = data.crop?.trim();
  const city = data.city?.trim();
  const state = data.state?.trim();
  const company = data.company?.trim() ?? village ?? city;
  if (prismaOk()) {
    try {
      const existing = await prisma.crmContact.findUnique({ where: { id } });
      if (!existing) return null;
      const c = await prisma.crmContact.update({
        where: { id },
        data: {
          name: data.name?.trim() || existing.name,
          phone: phone || existing.phone,
          village: village ?? existing.village,
          district: district ?? existing.district,
          crop: crop ?? existing.crop,
          city: city ?? existing.city,
          state: state ?? existing.state,
          weatherSummary: data.weatherSummary ?? existing.weatherSummary,
          weatherAt: data.weatherAt
            ? new Date(data.weatherAt)
            : data.weatherAt === null
              ? null
              : existing.weatherAt,
          company: company || existing.company,
        },
      });
      return serializeContact(c);
    } catch (e) {
      logPrisma("updateContact", e);
    }
  }
  const bag = mem();
  const row = bag.contacts.find((c) => c.id === id);
  if (!row) return null;
  if (data.name?.trim()) row.name = data.name.trim();
  if (phone) row.phone = phone;
  if (village != null) row.village = village;
  if (district != null) row.district = district;
  if (crop != null) row.crop = crop;
  if (city != null) row.city = city;
  if (state != null) row.state = state;
  if (data.weatherSummary != null) row.weatherSummary = data.weatherSummary;
  if (data.weatherAt !== undefined) row.weatherAt = data.weatherAt;
  if (company) row.company = company;
  row.updatedAt = nowIso();
  persist(bag);
  return row;
}

export async function upsertFarmerFacts(
  phoneRaw: string,
  facts: {
    name?: string;
    village?: string;
    district?: string;
    city?: string;
    state?: string;
    crop?: string;
    weatherSummary?: string;
    weatherAt?: string;
  },
): Promise<StoredContact | null> {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return null;
  const existing = await findContactByPhone(phone);
  const name = facts.name && facts.name !== "Farmer" ? facts.name : existing?.name || "Farmer";
  if (!existing) {
    const created = await createContact({
      name,
      phone,
      company: facts.village || facts.city || "",
    });
    return updateContact(created.id, facts);
  }
  return updateContact(existing.id, {
    ...facts,
    name: facts.name && facts.name !== "Farmer" ? facts.name : undefined,
  });
}

export async function listCalls(): Promise<
  (StoredCall & { contact: { name: string; id: string } | null })[]
> {
  if (prismaOk()) {
    try {
      const rows = await prisma.crmCall.findMany({
        orderBy: { startedAt: "desc" },
        take: 40,
        include: { contact: true },
      });
      return rows.map((k) => ({
        ...serializePrismaCall(k),
        contact: k.contact ? { name: k.contact.name, id: k.contact.id } : null,
      }));
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  const bag = mem();
  return [...bag.calls]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 40)
    .map((k) => {
      const c = bag.contacts.find((x) => x.id === k.contactId);
      return { ...k, contact: c ? { name: c.name, id: c.id } : null };
    });
}

export async function listCallsForFarmer(
  farmerId: string,
  phone: string,
): Promise<StoredCall[]> {
  const digits = normalizePhone(phone);
  if (prismaOk()) {
    try {
      const rows = await prisma.crmCall.findMany({
        where: {
          OR: [
            { contactId: farmerId },
            ...(digits ? [{ phone: digits }] : []),
          ],
        },
        orderBy: { startedAt: "desc" },
      });
      return rows.map(serializePrismaCall);
    } catch (e) {
      logPrisma("listCallsForFarmer", e);
    }
  }
  return mem()
    .calls.filter((k) => k.contactId === farmerId || (digits && k.phone === digits))
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function createCall(input: {
  contactId?: string | null;
  phone: string;
  direction?: string;
  status?: string;
  disposition?: string;
  vobizUuid?: string | null;
  vobizRequestUuid?: string | null;
  transcript?: string;
}): Promise<StoredCall> {
  if (prismaOk()) {
    try {
      const k = await prisma.crmCall.create({
        data: {
          contactId: input.contactId ?? null,
          phone: input.phone,
          direction: input.direction ?? "outbound",
          status: input.status ?? "queued",
          disposition: input.disposition ?? "pending",
          vobizUuid: input.vobizUuid ?? undefined,
          vobizRequestUuid: input.vobizRequestUuid ?? undefined,
          transcript: input.transcript ?? "",
        },
      });
      return serializePrismaCall(k);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  const row: StoredCall = {
    id: nid("cl"),
    contactId: input.contactId ?? null,
    phone: input.phone,
    direction: input.direction ?? "outbound",
    vobizUuid: input.vobizUuid ?? null,
    vobizRequestUuid: input.vobizRequestUuid ?? null,
    status: input.status ?? "queued",
    disposition: input.disposition ?? "pending",
    hangupCause: "",
    transcript: input.transcript ?? "",
    lastSpeech: "",
    recordingUrl: "",
    recordingId: "",
    recordingSecs: 0,
    startedAt: nowIso(),
    answeredAt: null,
    endedAt: null,
  };
  const bag = mem();
  persist({ ...bag, calls: [row, ...bag.calls] });
  return row;
}

export async function findCallByUuid(uuid: string): Promise<StoredCall | null> {
  if (!uuid) return null;
  if (prismaOk()) {
    try {
      const k = await prisma.crmCall.findFirst({
        where: {
          OR: [{ vobizUuid: uuid }, { vobizRequestUuid: uuid }],
        },
      });
      if (k) return serializePrismaCall(k);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  return (
    mem().calls.find(
      (k) => k.vobizUuid === uuid || k.vobizRequestUuid === uuid,
    ) ?? null
  );
}

/** Vobiz answer sends CallUUID; REST dial stores request_uuid — match both + recent ringing leg. */
export async function findCallForVobizWebhook(opts: {
  callUuid?: string;
  requestUuid?: string;
  calleePhone?: string;
}): Promise<StoredCall | null> {
  for (const id of [opts.callUuid, opts.requestUuid]) {
    if (id) {
      const hit = await findCallByUuid(id);
      if (hit) return hit;
    }
  }
  const phone = opts.calleePhone?.trim();
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const matchPhone = (p: string) => {
    const d = p.replace(/\D/g, "");
    return d === digits || d.endsWith(digits.slice(-10)) || digits.endsWith(d.slice(-10));
  };
  if (prismaOk()) {
    try {
      const k = await prisma.crmCall.findFirst({
        where: {
          direction: "outbound",
          status: { in: ["queued", "ringing", "in-progress"] },
        },
        orderBy: { startedAt: "desc" },
      });
      if (k && matchPhone(k.phone)) return serializePrismaCall(k);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  return (
    mem().calls.find(
      (k) =>
        k.direction === "outbound" &&
        ["queued", "ringing", "in-progress"].includes(k.status) &&
        matchPhone(k.phone),
    ) ?? null
  );
}

export async function updateCall(
  id: string,
  data: Partial<Omit<StoredCall, "id" | "startedAt">>,
): Promise<StoredCall | null> {
  if (prismaOk()) {
    try {
      const k = await prisma.crmCall.update({
        where: { id },
        data: {
          contactId: data.contactId,
          phone: data.phone,
          direction: data.direction,
          vobizUuid: data.vobizUuid === null ? undefined : data.vobizUuid,
          vobizRequestUuid:
            data.vobizRequestUuid === null ? undefined : data.vobizRequestUuid,
          status: data.status,
          disposition: data.disposition,
          hangupCause: data.hangupCause,
          transcript: data.transcript,
          lastSpeech: data.lastSpeech,
          recordingUrl: data.recordingUrl,
          recordingId: data.recordingId,
          recordingSecs: data.recordingSecs,
          answeredAt: data.answeredAt ? new Date(data.answeredAt) : undefined,
          endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
        },
      });
      return serializePrismaCall(k);
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  const bag = mem();
  const i = bag.calls.findIndex((k) => k.id === id);
  if (i < 0) return null;
  const next = { ...bag.calls[i], ...data };
  bag.calls[i] = next;
  persist(bag);
  return next;
}

export async function upsertCallByUuid(input: {
  uuid: string;
  phone: string;
  direction: string;
  status: string;
  disposition: string;
  hangupCause: string;
  transcript: string;
  ended: boolean;
  contactId?: string | null;
}): Promise<StoredCall> {
  if (prismaOk()) {
    try {
      const existing = await prisma.crmCall.findFirst({
        where: {
          OR: [{ vobizUuid: input.uuid }, { phone: input.phone }],
        },
        orderBy: { startedAt: "desc" },
      });
      if (existing) {
        const k = await prisma.crmCall.update({
          where: { id: existing.id },
          data: {
            vobizUuid: input.uuid,
            phone: input.phone || existing.phone,
            direction: input.direction || existing.direction,
            contactId: input.contactId ?? existing.contactId,
            status: input.status,
            disposition: input.disposition,
            hangupCause: input.hangupCause,
            lastSpeech: input.transcript.slice(0, 500),
            transcript: [existing.transcript, input.transcript].filter(Boolean).join("\n"),
            endedAt: input.ended ? new Date() : existing.endedAt,
          },
        });
        return serializePrismaCall(k);
      }
      return createCall({
        phone: input.phone,
        direction: input.direction,
        status: input.status,
        disposition: input.disposition,
        vobizUuid: input.uuid,
        transcript: input.transcript,
        contactId: input.contactId,
      });
    } catch (e) {
      logPrisma("prisma", e);
    }
  }
  const bag = mem();
  const i = bag.calls.findIndex(
    (k) => k.vobizUuid === input.uuid || (input.phone && k.phone === input.phone),
  );
  if (i >= 0) {
    const prev = bag.calls[i];
    const next: StoredCall = {
      ...prev,
      vobizUuid: input.uuid,
      phone: input.phone || prev.phone,
      contactId: input.contactId ?? prev.contactId,
      status: input.status,
      disposition: input.disposition,
      hangupCause: input.hangupCause,
      lastSpeech: input.transcript.slice(0, 500),
      transcript: [prev.transcript, input.transcript].filter(Boolean).join("\n"),
      endedAt: input.ended ? nowIso() : prev.endedAt,
    };
    bag.calls[i] = next;
    persist(bag);
    return next;
  }
  return createCall({
    phone: input.phone,
    direction: input.direction,
    status: input.status,
    disposition: input.ended ? input.disposition : "dialing",
    vobizUuid: input.uuid,
    transcript: input.transcript,
    contactId: input.contactId,
  });
}

function serializePrismaCall(k: {
  id: string;
  contactId: string | null;
  phone: string;
  direction: string;
  vobizUuid: string | null;
  vobizRequestUuid?: string | null;
  status: string;
  disposition: string;
  hangupCause: string;
  transcript: string;
  lastSpeech: string;
  recordingUrl?: string;
  recordingId?: string;
  recordingSecs?: number;
  startedAt: Date;
  answeredAt: Date | null;
  endedAt: Date | null;
}): StoredCall {
  return {
    id: k.id,
    contactId: k.contactId,
    phone: k.phone,
    direction: k.direction,
    vobizUuid: k.vobizUuid,
    vobizRequestUuid: k.vobizRequestUuid ?? null,
    status: k.status,
    disposition: k.disposition,
    hangupCause: k.hangupCause,
    transcript: k.transcript,
    lastSpeech: k.lastSpeech,
    recordingUrl: k.recordingUrl ?? "",
    recordingId: k.recordingId ?? "",
    recordingSecs: k.recordingSecs ?? 0,
    startedAt: k.startedAt.toISOString(),
    answeredAt: k.answeredAt?.toISOString() ?? null,
    endedAt: k.endedAt?.toISOString() ?? null,
  };
}
