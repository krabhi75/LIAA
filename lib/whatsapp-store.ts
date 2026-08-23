import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type WaMessage = {
  id: string;
  waId: string;
  phone: string;
  name: string;
  direction: "inbound" | "outbound";
  text: string;
  status: string;
  createdAt: string;
};

type Bag = { messages: WaMessage[] };
type G = typeof globalThis & { __liaaWa?: Bag };

function dir(): string {
  return process.env.VERCEL ? "/tmp/liaa-crm" : join(process.cwd(), ".liaa-crm");
}

function filePath(): string {
  return join(dir(), "whatsapp.json");
}

function empty(): Bag {
  return { messages: [] };
}

function readDisk(): Bag {
  try {
    if (!existsSync(filePath())) return empty();
    const parsed = JSON.parse(readFileSync(filePath(), "utf8")) as Bag;
    return { messages: parsed.messages ?? [] };
  } catch {
    return empty();
  }
}

function mem(): Bag {
  const g = globalThis as G;
  if (!g.__liaaWa) g.__liaaWa = readDisk();
  return g.__liaaWa;
}

function persist(bag: Bag) {
  (globalThis as G).__liaaWa = bag;
  try {
    mkdirSync(dir(), { recursive: true });
    writeFileSync(filePath(), JSON.stringify(bag), "utf8");
  } catch {
    /* ephemeral */
  }
}

export function listWaMessages(): WaMessage[] {
  return [...mem().messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addWaMessage(row: Omit<WaMessage, "id" | "createdAt"> & { id?: string }): WaMessage {
  const msg: WaMessage = {
    ...row,
    id: row.id ?? `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  const bag = mem();
  persist({ messages: [msg, ...bag.messages].slice(0, 200) });
  return msg;
}

export function waKpis() {
  const rows = listWaMessages();
  const inbound = rows.filter((m) => m.direction === "inbound").length;
  const outbound = rows.filter((m) => m.direction === "outbound").length;
  return {
    sent: outbound,
    inbound,
    total: rows.length,
    contacts: new Set(rows.map((m) => m.phone)).size,
  };
}
