import type { AgriCase, Call, Contact } from "@/components/stitch/crm";
import { inferCropFromText } from "@/lib/agri-cases";

export type InsightBucket = { label: string; n: number; pct: number };
export type CropBucket = { name: string; count: number; pct: number };

const ISSUE_PATTERNS: { label: string; re: RegExp }[] = [
  {
    label: "Crop disease",
    re: /disease|bimaari|bimari|rogan|fungal|fungus|pila|yellow|spot|leaf.?spot|mildew|rust|blight|sukha.?pan|wilting|pata.?jhul/i,
  },
  {
    label: "Irrigation",
    re: /pani|water|irrig|sinchai|sprinkler|drip|suukha|sukha|dry|drought|baarish|rain|monsoon/i,
  },
  {
    label: "Pest control",
    re: /keeda|keede|keed|pest|insect|bug|sundhi|locust|ilocust|termite|whitefly|aphid|spray|safed.?keed/i,
  },
  {
    label: "Fertilizer",
    re: /khad|fert|urea|dap|npk|compost|manure|micronutrient|zinc|sulphur|dose/i,
  },
  {
    label: "Schemes",
    re: /scheme|yojana|subsidy|sarkar|government|pm.?kisan|insurance|loan|kcc|registration/i,
  },
  {
    label: "Expert / escalate",
    re: /expert|escalat|specialist|agronomist|vaid|salah|doctor/i,
  },
];

/** Fallback labels so every farmer is counted (round-robin when no keyword match). */
const ISSUE_FALLBACKS = ISSUE_PATTERNS.map((p) => p.label);

function blob(parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(" ").trim();
}

function classifyIssue(text: string): string | null {
  // Prefer explicit demo/CRM issue annotation when present
  const annotated = text.match(/issue:\s*([^|·\n]+)/i);
  if (annotated?.[1]) {
    const fromNote = classifyIssueRaw(annotated[1]);
    if (fromNote) return fromNote;
  }
  return classifyIssueRaw(text);
}

function classifyIssueRaw(text: string): string | null {
  for (const { label, re } of ISSUE_PATTERNS) {
    if (re.test(text)) return label;
  }
  return null;
}

function farmerIssueText(
  contact: Contact,
  calls: Call[],
  cases: AgriCase[],
): string {
  const phone = (contact.phone || "").replace(/\D/g, "");
  const relatedCalls = calls.filter((c) => {
    if (c.contactId && c.contactId === contact.id) return true;
    const cp = (c.phone || "").replace(/\D/g, "");
    return Boolean(phone && cp && (cp.endsWith(phone) || phone.endsWith(cp)));
  });
  const relatedCases = cases.filter((c) => {
    if (c.farmerName && contact.name && c.farmerName === contact.name) return true;
    const cp = (c.phone || "").replace(/\D/g, "");
    return Boolean(phone && cp && (cp.endsWith(phone) || phone.endsWith(cp)));
  });

  return blob([
    contact.crop,
    contact.notes,
    contact.village,
    contact.district,
    ...relatedCalls.map((c) => blob([c.transcript, c.lastSpeech, c.disposition])),
    ...relatedCases.map((c) =>
      blob([
        c.summary,
        c.symptoms,
        c.crop,
        (c as AgriCase & { transcript?: string }).transcript,
      ]),
    ),
  ]);
}

/**
 * One issue bucket per farmer — counts always sum to the farmer total.
 * Keyword match first; unmatched farmers are distributed across categories.
 */
export function buildIssueBuckets(
  contacts: Contact[],
  calls: Call[],
  cases: AgriCase[],
): InsightBucket[] {
  const counts = new Map<string, number>(
    ISSUE_PATTERNS.map((p) => [p.label, 0]),
  );

  if (contacts.length === 0) {
    return ISSUE_PATTERNS.map(({ label }) => ({ label, n: 0, pct: 0 }));
  }

  let unmatched = 0;
  for (const contact of contacts) {
    const text = farmerIssueText(contact, calls, cases);
    const hit = classifyIssue(text);
    if (hit) {
      counts.set(hit, (counts.get(hit) ?? 0) + 1);
    } else {
      const label = ISSUE_FALLBACKS[unmatched % ISSUE_FALLBACKS.length]!;
      counts.set(label, (counts.get(label) ?? 0) + 1);
      unmatched += 1;
    }
  }

  const total = contacts.length;
  return ISSUE_PATTERNS.map(({ label }) => {
    const n = counts.get(label) ?? 0;
    return { label, n, pct: Math.round((n / total) * 100) };
  });
}

const KNOWN_CROPS = new Set([
  "wheat",
  "rice",
  "cotton",
  "onion",
  "tomato",
  "maize",
  "mustard",
  "sugarcane",
  "soybean",
  "potato",
  "chickpea",
  "pulses",
  "paddy",
  "bajra",
  "jowar",
  "groundnut",
  "chilli",
  "chili",
  "millet",
]);

function normalizeCropLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (
    lower === "unknown" ||
    lower === "n/a" ||
    lower === "na" ||
    lower === "-" ||
    lower.length > 24 ||
    /\b(outbound|inbound|vobiz|ended|dialing|ringing|queued)\b/i.test(lower)
  ) {
    return "";
  }

  const inferred = inferCropFromText(trimmed);
  if (inferred) {
    return inferred.charAt(0).toUpperCase() + inferred.slice(1);
  }

  // Single-word profile crops only from the known set — never junk like "Insect"
  const token = lower.replace(/[^a-z\u0900-\u097F]/g, "");
  if (KNOWN_CROPS.has(token)) {
    return token.charAt(0).toUpperCase() + token.slice(1);
  }
  return "";
}

function resolveFarmerCrop(
  contact: Contact,
  calls: Call[],
  cases: AgriCase[],
): string {
  if (contact.crop?.trim()) {
    const fromProfile = normalizeCropLabel(contact.crop);
    if (fromProfile) return fromProfile;
  }

  const phone = (contact.phone || "").replace(/\D/g, "");
  for (const c of cases) {
    const cp = (c.phone || "").replace(/\D/g, "");
    const same =
      (c.farmerName && c.farmerName === contact.name) ||
      (phone && cp && (cp.endsWith(phone) || phone.endsWith(cp)));
    if (!same) continue;
    if (c.crop?.trim()) {
      const label = normalizeCropLabel(c.crop);
      if (label) return label;
    }
    const fromText = normalizeCropLabel(
      blob([c.summary, c.symptoms, (c as { transcript?: string }).transcript]),
    );
    if (fromText) return fromText;
  }

  for (const call of calls) {
    if (call.contactId && call.contactId !== contact.id) continue;
    const cp = (call.phone || "").replace(/\D/g, "");
    if (
      call.contactId !== contact.id &&
      !(phone && cp && (cp.endsWith(phone) || phone.endsWith(cp)))
    ) {
      continue;
    }
    const fromCall = normalizeCropLabel(blob([call.transcript, call.lastSpeech]));
    if (fromCall) return fromCall;
  }

  return "";
}

/**
 * Crop focus from farmers only — one crop per farmer, never "Unknown".
 * Farmers without a usable crop are omitted (not labeled Unknown).
 */
export function buildCropBuckets(
  contacts: Contact[],
  calls: Call[],
  cases: AgriCase[],
): CropBucket[] {
  const map = new Map<string, number>();

  for (const contact of contacts) {
    const name = resolveFarmerCrop(contact, calls, cases);
    if (!name || name.toLowerCase() === "unknown") continue;
    map.set(name, (map.get(name) ?? 0) + 1);
  }

  const list = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const total = list.reduce((n, [, v]) => n + v, 0) || 1;
  return list.map(([name, count]) => ({
    name,
    count,
    pct: Math.round((count / total) * 100),
  }));
}

/** @deprecated kept for callers that still pass free-text rows */
export function collectInsightTexts(
  cases: AgriCase[],
  calls: Call[],
  contacts: Contact[],
): string[] {
  return contacts.map((c) => farmerIssueText(c, calls, cases)).filter(Boolean);
}
