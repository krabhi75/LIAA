import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { prisma } from "./db";
import { normalizePhone } from "./vobiz";

export type StoredContact = {
  id: string;
  name: string;
  phone: string;
  company: string;
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
  status: string;
  disposition: string;
  hangupCause: string;
  transcript: string;
  lastSpeech: string;
  startedAt: string;
  answeredAt: string | null;
  endedAt: string | null;
};

type Bag = { contacts: StoredContact[]; calls: StoredCall[] };

type G = typeof globalThis & { __liaaCrm?: Bag };

function prismaOk(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  if (!url) return false;
  if (process.env.VERCEL && (url.startsWith("file:") || url.includes("dev.db"))) {
    return false;
  }
  return true;
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
      contacts: parsed.contacts ?? [],
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
        id: c.id,
        name: c.name,
        phone: c.phone,
        company: c.company,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        calls: c.calls.map(serializePrismaCall),
      }));
    } catch {
      /* SQLite missing on Vercel */
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
        data: { name: input.name, phone, company: input.company ?? "" },
      });
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        company: c.company,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    } catch {
      /* fall through */
    }
  }
  const row: StoredContact = {
    id: nid("ct"),
    name: input.name,
    phone,
    company: input.company ?? "",
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
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          company: c.company,
          notes: c.notes,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        };
      }
      return createContact({ name: input.name || "Farmer", phone });
    } catch {
      /* fall through */
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
      if (c) {
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          company: c.company,
          notes: c.notes,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        };
      }
    } catch {
      /* fall through */
    }
  }
  return mem().contacts.find((c) => c.id === id) ?? null;
}

export async function listCalls(): Promise<(StoredCall & { contact: { name: string } | null })[]> {
  if (prismaOk()) {
    try {
      const rows = await prisma.crmCall.findMany({
        orderBy: { startedAt: "desc" },
        take: 40,
        include: { contact: true },
      });
      return rows.map((k) => ({
        ...serializePrismaCall(k),
        contact: k.contact ? { name: k.contact.name } : null,
      }));
    } catch {
      /* fall through */
    }
  }
  const bag = mem();
  return [...bag.calls]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 40)
    .map((k) => {
      const c = bag.contacts.find((x) => x.id === k.contactId);
      return { ...k, contact: c ? { name: c.name } : null };
    });
}

export async function createCall(input: {
  contactId?: string | null;
  phone: string;
  direction?: string;
  status?: string;
  disposition?: string;
  vobizUuid?: string | null;
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
          transcript: input.transcript ?? "",
        },
      });
      return serializePrismaCall(k);
    } catch {
      /* fall through */
    }
  }
  const row: StoredCall = {
    id: nid("cl"),
    contactId: input.contactId ?? null,
    phone: input.phone,
    direction: input.direction ?? "outbound",
    vobizUuid: input.vobizUuid ?? null,
    status: input.status ?? "queued",
    disposition: input.disposition ?? "pending",
    hangupCause: "",
    transcript: input.transcript ?? "",
    lastSpeech: "",
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
      const k = await prisma.crmCall.findFirst({ where: { vobizUuid: uuid } });
      if (k) return serializePrismaCall(k);
    } catch {
      /* fall through */
    }
  }
  return mem().calls.find((k) => k.vobizUuid === uuid) ?? null;
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
          status: data.status,
          disposition: data.disposition,
          hangupCause: data.hangupCause,
          transcript: data.transcript,
          lastSpeech: data.lastSpeech,
          answeredAt: data.answeredAt ? new Date(data.answeredAt) : undefined,
          endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
        },
      });
      return serializePrismaCall(k);
    } catch {
      /* fall through */
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
    } catch {
      /* fall through */
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
  status: string;
  disposition: string;
  hangupCause: string;
  transcript: string;
  lastSpeech: string;
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
    status: k.status,
    disposition: k.disposition,
    hangupCause: k.hangupCause,
    transcript: k.transcript,
    lastSpeech: k.lastSpeech,
    startedAt: k.startedAt.toISOString(),
    answeredAt: k.answeredAt?.toISOString() ?? null,
    endedAt: k.endedAt?.toISOString() ?? null,
  };
}
