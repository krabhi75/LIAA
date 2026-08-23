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
  createdAt: string;
};

const FILE = join(process.cwd(), ".agri-cases.json");

function readAll(): AgriCaseRow[] {
  if (!existsSync(FILE)) return [];
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as AgriCaseRow[];
  } catch {
    return [];
  }
}

function writeAll(rows: AgriCaseRow[]) {
  writeFileSync(FILE, JSON.stringify(rows, null, 2), "utf8");
}

export function listAgriCases(): AgriCaseRow[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createAgriCase(
  row: Omit<AgriCaseRow, "id" | "createdAt" | "status" | "escalateReason"> & {
    status?: string;
  },
): AgriCaseRow {
  const created: AgriCaseRow = {
    ...row,
    id: `case-${Date.now()}`,
    status: row.status ?? "open",
    escalateReason: "",
    createdAt: new Date().toISOString(),
  };
  writeAll([created, ...readAll()]);
  return created;
}

export function escalateAgriCase(id: string, reason: string): AgriCaseRow | null {
  const rows = readAll();
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return null;
  rows[i] = { ...rows[i], status: "escalated", escalateReason: reason };
  writeAll(rows);
  return rows[i];
}
