import { writeFile, readFile } from "fs/promises";
import { readFileSync, existsSync } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), ".nova-memory.json");

let cache: string[] | null = null;

function readDiskSync(): string[] {
  try {
    if (!existsSync(FILE)) return [];
    return JSON.parse(readFileSync(FILE, "utf8") || "[]") as string[];
  } catch {
    return [];
  }
}

export function getCachedMemories(): string[] {
  if (cache) return cache;
  cache = readDiskSync();
  return cache;
}

export async function loadMemories(): Promise<string[]> {
  if (cache) return cache;
  try {
    const raw = await readFile(FILE, "utf8");
    cache = JSON.parse(raw || "[]") as string[];
  } catch {
    cache = [];
  }
  return cache;
}

export async function addMemory(fact: string): Promise<string[]> {
  const all = await loadMemories();
  if (!all.includes(fact)) all.push(fact);
  cache = all.slice(-30);
  await writeFile(FILE, JSON.stringify(cache, null, 2));
  return cache;
}

export async function userNameFromMemory(): Promise<string | null> {
  for (const fact of await loadMemories()) {
    const m = fact.match(/name is ([A-Za-z][\w'-]*)/i);
    if (m) return m[1];
  }
  return null;
}
