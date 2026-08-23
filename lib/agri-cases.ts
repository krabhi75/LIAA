import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { prisma, prismaConfigured } from "./db";

export type AgriCaseRow = {
  id: string;
  farmerName: string;
  phone: string;
  crop: string;
  village: string;
  district: string;
  symptoms: string;
  started: string;
  watering: string;
  summary: string;
  status: string;
  escalateReason: string;
  channel: string;
  transcript: string;
  direction: string;
  source: string;
  createdAt: string;
};

type G = typeof globalThis & { __liaaCases?: AgriCaseRow[] };

function mem(): AgriCaseRow[] {
  const g = globalThis as G;
  if (!g.__liaaCases) g.__liaaCases = readDisk();
  return g.__liaaCases;
}

const FILE = process.env.VERCEL
  ? join("/tmp", "liaa-agri-cases.json")
  : join(process.cwd(), ".agri-cases.json");

function readDisk(): AgriCaseRow[] {
  try {
    if (!existsSync(FILE)) return [];
    return JSON.parse(readFileSync(FILE, "utf8")) as AgriCaseRow[];
  } catch {
    return [];
  }
}

function persist(rows: AgriCaseRow[]) {
  (globalThis as G).__liaaCases = rows;
  try {
    writeFileSync(FILE, JSON.stringify(rows, null, 2), "utf8");
  } catch {
    /* Vercel / read-only */
  }
}

function blank(partial: Partial<AgriCaseRow>): AgriCaseRow {
  return {
    id: partial.id ?? `case-${Date.now()}`,
    farmerName: partial.farmerName ?? "Farmer",
    phone: partial.phone ?? "",
    crop: partial.crop ?? "",
    village: partial.village ?? "",
    district: partial.district ?? "",
    symptoms: partial.symptoms ?? "",
    started: partial.started ?? "",
    watering: partial.watering ?? "",
    summary: partial.summary ?? "",
    status: partial.status ?? "open",
    escalateReason: partial.escalateReason ?? "",
    channel: partial.channel ?? "",
    transcript: partial.transcript ?? "",
    direction: partial.direction ?? "",
    source: partial.source ?? "webhook",
    createdAt: partial.createdAt ?? new Date().toISOString(),
  };
}

function serialize(row: {
  id: string;
  farmerName: string;
  phone: string;
  crop: string;
  village: string;
  district: string;
  symptoms: string;
  started: string;
  watering: string;
  summary: string;
  status: string;
  escalateReason: string;
  channel: string;
  transcript: string;
  direction: string;
  source: string;
  createdAt: Date;
}): AgriCaseRow {
  return {
    id: row.id,
    farmerName: row.farmerName,
    phone: row.phone,
    crop: row.crop,
    village: row.village,
    district: row.district,
    symptoms: row.symptoms,
    started: row.started,
    watering: row.watering,
    summary: row.summary,
    status: row.status,
    escalateReason: row.escalateReason,
    channel: row.channel,
    transcript: row.transcript,
    direction: row.direction,
    source: row.source,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listAgriCases(): Promise<AgriCaseRow[]> {
  if (prismaConfigured()) {
    try {
      const rows = await prisma.agriCase.findMany({
        orderBy: { createdAt: "desc" },
      });
      return rows.map(serialize);
    } catch (e) {
      console.error("[agri-cases] list", e);
    }
  }
  return [...mem()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createAgriCase(
  row: Omit<AgriCaseRow, "id" | "createdAt" | "status" | "escalateReason"> & {
    status?: string;
    escalateReason?: string;
    transcript?: string;
    direction?: string;
    source?: string;
  },
): Promise<AgriCaseRow> {
  const created = blank(row);
  if (prismaConfigured()) {
    try {
      const saved = await prisma.agriCase.create({
        data: {
          farmerName: created.farmerName,
          phone: created.phone,
          crop: created.crop,
          village: created.village,
          district: created.district,
          symptoms: created.symptoms,
          started: created.started,
          watering: created.watering,
          summary: created.summary,
          status: created.status,
          escalateReason: created.escalateReason,
          channel: created.channel,
          transcript: created.transcript,
          direction: created.direction,
          source: created.source,
        },
      });
      return serialize(saved);
    } catch (e) {
      console.error("[agri-cases] create", e);
    }
  }
  persist([created, ...mem()]);
  return created;
}

export async function upsertCaseFromCall(opts: {
  phone: string;
  farmerName?: string;
  direction: string;
  source: string;
  channel: string;
  summary: string;
  transcript?: string;
  status?: string;
}): Promise<AgriCaseRow> {
  const phone = opts.phone.replace(/\s/g, "");
  const crop = guessCrop(`${opts.summary} ${opts.transcript ?? ""}`);
  if (prismaConfigured()) {
    try {
      const existing = await prisma.agriCase.findFirst({
        where: {
          OR: [
            { channel: opts.channel },
            ...(phone ? [{ phone }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        const saved = await prisma.agriCase.update({
          where: { id: existing.id },
          data: {
            phone: phone || existing.phone,
            farmerName: opts.farmerName || existing.farmerName,
            direction: opts.direction || existing.direction,
            source: opts.source,
            summary: opts.summary || existing.summary,
            crop: crop || existing.crop,
            symptoms: opts.summary || existing.symptoms,
            transcript: [existing.transcript, opts.transcript]
              .filter(Boolean)
              .join("\n"),
            status: opts.status || existing.status,
          },
        });
        return serialize(saved);
      }
        return await createAgriCase({
          farmerName: opts.farmerName || "Farmer",
          phone,
          crop,
          village: "",
          district: "",
          symptoms: opts.summary,
          started: "",
          watering: "",
          summary: opts.summary,
          channel: opts.channel,
          transcript: opts.transcript ?? "",
          direction: opts.direction,
          source: opts.source,
          status: opts.status ?? "open",
        });
    } catch (e) {
      console.error("[agri-cases] upsert", e);
    }
  }
  const rows = mem();
  const i = rows.findIndex(
    (r) => r.channel === opts.channel || (phone && r.phone === phone),
  );
  if (i >= 0) {
    const next = {
      ...rows[i],
      phone: phone || rows[i].phone,
      farmerName: opts.farmerName || rows[i].farmerName,
      direction: opts.direction || rows[i].direction,
      source: opts.source,
      summary: opts.summary || rows[i].summary,
      crop: crop || rows[i].crop,
      symptoms: opts.summary || rows[i].symptoms,
      transcript: [rows[i].transcript, opts.transcript].filter(Boolean).join("\n"),
      status: opts.status || rows[i].status,
    };
    rows[i] = next;
    persist(rows);
    return next;
  }
  return await createAgriCase({
    farmerName: opts.farmerName || "Farmer",
    phone,
    crop,
    village: "",
    district: "",
    symptoms: opts.summary,
    started: "",
    watering: "",
    summary: opts.summary,
    channel: opts.channel,
    transcript: opts.transcript ?? "",
    direction: opts.direction,
    source: opts.source,
    status: opts.status ?? "open",
  });
}

export async function escalateAgriCase(
  id: string,
  reason: string,
): Promise<AgriCaseRow | null> {
  if (prismaConfigured()) {
    try {
      const saved = await prisma.agriCase.update({
        where: { id },
        data: { status: "escalated", escalateReason: reason },
      });
      return serialize(saved);
    } catch (e) {
      console.error("[agri-cases] escalate", e);
    }
  }
  const rows = mem();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = { ...rows[i], status: "escalated", escalateReason: reason };
  persist(rows);
  return rows[i];
}

export async function setAgriCaseStatus(
  id: string,
  status: string,
  escalateReason?: string,
): Promise<AgriCaseRow | null> {
  if (prismaConfigured()) {
    try {
      const saved = await prisma.agriCase.update({
        where: { id },
        data: {
          status,
          ...(escalateReason !== undefined
            ? { escalateReason }
            : {}),
        },
      });
      return serialize(saved);
    } catch (e) {
      console.error("[agri-cases] status", e);
    }
  }
  const rows = mem();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = {
    ...rows[i],
    status,
    ...(escalateReason !== undefined ? { escalateReason } : {}),
  };
  persist(rows);
  return rows[i];
}

export async function resolveAgriCase(
  id: string,
  disposition: string,
  note?: string,
): Promise<AgriCaseRow | null> {
  const status =
    disposition === "follow_up"
      ? "open"
      : disposition === "duplicate"
        ? "closed"
        : disposition === "escalated"
          ? "escalated"
          : ["resolved", "completed", "closed"].includes(disposition)
            ? disposition
            : "closed";
  const reason = note?.trim()
    ? `${disposition}: ${note.trim()}`
    : disposition;
  return setAgriCaseStatus(id, status, reason);
}

function guessCrop(text: string): string {
  const t = text.toLowerCase();
  if (/\b(cotton|kapas)\b/.test(t)) return "cotton";
  if (/\b(wheat|gehun)\b/.test(t)) return "wheat";
  if (/\b(rice|dhan|paddy)\b/.test(t)) return "rice";
  if (/\b(onion|pyaz)\b/.test(t)) return "onion";
  if (/\b(tomato|tamatar)\b/.test(t)) return "tomato";
  return "";
}
