import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

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

export function listAgriCases(): AgriCaseRow[] {
  return [...mem()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createAgriCase(
  row: Omit<AgriCaseRow, "id" | "createdAt" | "status" | "escalateReason"> & {
    status?: string;
    escalateReason?: string;
    transcript?: string;
    direction?: string;
    source?: string;
  },
): AgriCaseRow {
  const created = blank(row);
  persist([created, ...mem()]);
  return created;
}

export function upsertCaseFromCall(opts: {
  phone: string;
  farmerName?: string;
  direction: string;
  source: string;
  channel: string;
  summary: string;
  transcript?: string;
  status?: string;
}): AgriCaseRow {
  const phone = opts.phone.replace(/\s/g, "");
  const rows = mem();
  const i = rows.findIndex(
    (r) => r.channel === opts.channel || (phone && r.phone === phone),
  );
  const crop = guessCrop(`${opts.summary} ${opts.transcript ?? ""}`);
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
  return createAgriCase({
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

export function escalateAgriCase(id: string, reason: string): AgriCaseRow | null {
  const rows = mem();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = { ...rows[i], status: "escalated", escalateReason: reason };
  persist(rows);
  return rows[i];
}

export function setAgriCaseStatus(id: string, status: string): AgriCaseRow | null {
  const rows = mem();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = { ...rows[i], status };
  persist(rows);
  return rows[i];
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
