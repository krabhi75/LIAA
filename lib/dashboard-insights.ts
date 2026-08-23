import type { AgriCase, Call, Contact } from "@/components/stitch/crm";
import { inferCropFromText } from "@/lib/agri-cases";

export type InsightBucket = { label: string; n: number; pct: number };
export type CropBucket = { name: string; count: number; pct: number };

const ISSUE_PATTERNS: { label: string; re: RegExp }[] = [
  {
    label: "Crop disease",
    re: /disease|bimaari|bimari|rogan|fungal|fungus|pila|yellow|spot|leaf.?spot|mildew|rust|blight|sukha.?pan/i,
  },
  {
    label: "Irrigation",
    re: /pani|water|irrig|sinchai|sinchai|sprinkler|drip|suukha|sukha|dry|drought|baarish|rain|monsoon/i,
  },
  {
    label: "Pest control",
    re: /keeda|keede|pest|insect|bug|sundhi|ilocust|termite|whitefly|aphid|spray/i,
  },
  {
    label: "Fertilizer",
    re: /khad|fert|urea|dap|npk|compost|manure|micronutrient|zinc|sulphur/i,
  },
  {
    label: "Schemes",
    re: /scheme|yojana|subsidy|sarkar|government|pm.?kisan|insurance|loan|kcc/i,
  },
  {
    label: "Expert / escalate",
    re: /expert|escalat|specialist|agronomist|vaid|salah|doctor/i,
  },
];

function blob(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ").trim();
}

/** One searchable text row per call, case, or contact note. */
export function collectInsightTexts(
  cases: AgriCase[],
  calls: Call[],
  contacts: Contact[],
): string[] {
  const rows: string[] = [];

  for (const c of cases) {
    const row = blob([
      c.summary,
      c.symptoms,
      c.crop,
      c.village,
      c.district,
      (c as AgriCase & { transcript?: string }).transcript,
    ]);
    if (row) rows.push(row);
  }

  for (const call of calls) {
    const row = blob([call.transcript, call.lastSpeech, call.disposition]);
    if (row) rows.push(row);
  }

  for (const contact of contacts) {
    const row = blob([contact.crop, contact.notes, contact.village, contact.district]);
    if (row) rows.push(row);
  }

  return rows;
}

export function buildIssueBuckets(texts: string[]): InsightBucket[] {
  const buckets = ISSUE_PATTERNS.map(({ label, re }) => ({
    label,
    n: texts.filter((t) => re.test(t)).length,
  }));
  const total = buckets.reduce((s, b) => s + b.n, 0) || 1;
  return buckets.map((b) => ({
    ...b,
    pct: Math.round((b.n / total) * 100),
  }));
}

function addCrop(map: Map<string, number>, raw: string) {
  const label =
    inferCropFromText(raw) ||
    (raw.trim().length <= 24 && /^[a-zA-Z\u0900-\u097F\s-]+$/.test(raw.trim())
      ? raw.trim().toLowerCase()
      : "");
  if (!label || label === "unknown") return;
  const name = label.charAt(0).toUpperCase() + label.slice(1);
  map.set(name, (map.get(name) ?? 0) + 1);
}

export function buildCropBuckets(
  cases: AgriCase[],
  calls: Call[],
  contacts: Contact[],
): CropBucket[] {
  const map = new Map<string, number>();

  for (const row of cases) {
    if (row.crop?.trim()) addCrop(map, row.crop);
    addCrop(map, blob([row.summary, row.symptoms, (row as { transcript?: string }).transcript]));
  }

  for (const call of calls) {
    addCrop(map, blob([call.transcript, call.lastSpeech]));
  }

  for (const contact of contacts) {
    if (contact.crop?.trim()) addCrop(map, contact.crop);
  }

  const list = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = list.reduce((n, [, v]) => n + v, 0) || 1;
  return list.map(([name, count]) => ({
    name,
    count,
    pct: Math.round((count / total) * 100),
  }));
}
