import { prisma, prismaConfigured } from "./db";
import { createAgriCase, inferCropFromText } from "./agri-cases";
import { normalizePhone } from "./vobiz";

const DEMO_TAG = "demo-seed-v1";

/** 20 demo farmers: 9999-9999-99 down to 9999-9999-80 */
export const DEMO_FARMERS = [
  { name: "Ramesh Kumar", village: "Barabanki", district: "Barabanki", state: "Uttar Pradesh", crop: "wheat" },
  { name: "Sunita Devi", village: "Karnal", district: "Karnal", state: "Haryana", crop: "rice" },
  { name: "Vijay Singh", village: "Indore", district: "Indore", state: "Madhya Pradesh", crop: "soybean" },
  { name: "Lakshmi Bai", village: "Nashik", district: "Nashik", state: "Maharashtra", crop: "onion" },
  { name: "Mohammed Irfan", village: "Moradabad", district: "Moradabad", state: "Uttar Pradesh", crop: "rice" },
  { name: "Geeta Sharma", village: "Jaipur", district: "Jaipur", state: "Rajasthan", crop: "mustard" },
  { name: "Harpreet Kaur", village: "Ludhiana", district: "Ludhiana", state: "Punjab", crop: "wheat" },
  { name: "Anil Yadav", village: "Patna", district: "Patna", state: "Bihar", crop: "maize" },
  { name: "Pooja Patel", village: "Ahmedabad", district: "Ahmedabad", state: "Gujarat", crop: "cotton" },
  { name: "Suresh Reddy", village: "Warangal", district: "Warangal", state: "Telangana", crop: "cotton" },
  { name: "Kavita Joshi", village: "Udaipur", district: "Udaipur", state: "Rajasthan", crop: "maize" },
  { name: "Rajesh Verma", village: "Lucknow", district: "Lucknow", state: "Uttar Pradesh", crop: "potato" },
  { name: "Meena Kumari", village: "Raipur", district: "Raipur", state: "Chhattisgarh", crop: "pulses" },
  { name: "Firoz Khan", village: "Bhopal", district: "Bhopal", state: "Madhya Pradesh", crop: "wheat" },
  { name: "Asha Devi", village: "Varanasi", district: "Varanasi", state: "Uttar Pradesh", crop: "rice" },
  { name: "Manoj Tiwari", village: "Gorakhpur", district: "Gorakhpur", state: "Uttar Pradesh", crop: "sugarcane" },
  { name: "Rekha Singh", village: "Kanpur", district: "Kanpur", state: "Uttar Pradesh", crop: "tomato" },
  { name: "Balbir Singh", village: "Amritsar", district: "Amritsar", state: "Punjab", crop: "wheat" },
  { name: "Nirmala Devi", village: "Muzaffarpur", district: "Muzaffarpur", state: "Bihar", crop: "rice" },
  { name: "Sanjay Meena", village: "Kota", district: "Kota", state: "Rajasthan", crop: "soybean" },
] as const;

export function demoPhoneSuffix(index: number): string {
  return String(99 - index).padStart(2, "0");
}

export function demoPhone(index: number): string {
  return normalizePhone(`99999999${demoPhoneSuffix(index)}`);
}

export function formatDemoPhone(index: number): string {
  const tail = demoPhoneSuffix(index);
  return `9999-9999-${tail}`;
}

/** Show demo seed phones as 9999-9999-XX in the CRM UI. */
export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (/^99999999\d{2}$/.test(digits)) {
    return `9999-9999-${digits.slice(-2)}`;
  }
  return phone;
}

const ISSUE_SNIPPETS = [
  "gehun par pila pan dikh raha hai disease",
  "pani ki kami hai sinchai ke liye",
  "kapas mein safed keede lag rahe hain",
  "khad ka dose puchna hai urea",
  "yojana registration kaise karein",
  "expert se salah chahiye escalate",
  "tamatar mein keeda problem",
  "dhan mein pani ki kami irrigation",
  "makka par fungal spot disease",
  "scheme subsidy ke baare mein puchna",
  "fertilizer npk dose batao",
  "pest spray ke liye keede",
];

export type DemoSeedResult = {
  ok: boolean;
  skipped?: boolean;
  refreshed?: boolean;
  farmers: number;
  calls: number;
  cases: number;
};

/** Refresh issue keywords + wipe "unknown" crops on existing rows. */
export async function refreshDemoInsights(): Promise<{
  contacts: number;
  calls: number;
  clearedUnknownCrops: number;
}> {
  if (!prismaConfigured()) {
    throw new Error("DATABASE_URL required");
  }

  let contactsTouched = 0;
  let callsTouched = 0;
  let clearedUnknownCrops = 0;

  // Never keep "unknown" or status junk as a crop label
  const allContacts = await prisma.crmContact.findMany();
  for (const row of allContacts) {
    const crop = (row.crop || "").trim();
    const normalized = crop.toLowerCase().replace(/[^a-z]/g, "");
    const known = new Set([
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
    const bad =
      !crop ||
      /^unknown$/i.test(crop) ||
      crop.length > 24 ||
      /\b(outbound|inbound|vobiz|ended|dialing|ringing|queued|insect)\b/i.test(crop) ||
      (normalized.length > 0 && !known.has(normalized) && !inferCropFromText(crop));
    if (crop && bad) {
      await prisma.crmContact.update({
        where: { id: row.id },
        data: { crop: "" },
      });
      clearedUnknownCrops += 1;
    }
  }

  const allCases = await prisma.agriCase.findMany();
  for (const row of allCases) {
    const crop = (row.crop || "").trim();
    const bad =
      /^unknown$/i.test(crop) ||
      crop.length > 24 ||
      /\b(outbound|inbound|vobiz|ended|dialing)\b/i.test(crop);
    if (crop && bad) {
      await prisma.agriCase.update({
        where: { id: row.id },
        data: { crop: "" },
      });
      clearedUnknownCrops += 1;
    }
  }

  const demoContacts = await prisma.crmContact.findMany({
    where: { notes: { contains: DEMO_TAG } },
    orderBy: { createdAt: "asc" },
  });

  for (let i = 0; i < demoContacts.length; i++) {
    const contact = demoContacts[i]!;
    const f = DEMO_FARMERS[i % DEMO_FARMERS.length]!;
    const snippet = ISSUE_SNIPPETS[i % ISSUE_SNIPPETS.length]!;
    const crop = contact.crop?.trim() && contact.crop.toLowerCase() !== "unknown"
      ? contact.crop
      : f.crop;

    await prisma.crmContact.update({
      where: { id: contact.id },
      data: {
        crop,
        notes: `${DEMO_TAG} · demo phone ${formatDemoPhone(i)} · issue: ${snippet}`,
      },
    });
    contactsTouched += 1;

    const call = await prisma.crmCall.findFirst({
      where: {
        OR: [
          { contactId: contact.id },
          { vobizUuid: `demo-call-${i}-${DEMO_TAG}` },
        ],
      },
      orderBy: { startedAt: "desc" },
    });
    if (call) {
      const firstName = contact.name.split(" ")[0] ?? "ji";
      await prisma.crmCall.update({
        where: { id: call.id },
        data: {
          transcript: `KRISHI: Namaste ${firstName} ji.\nYOU: ${snippet}`,
          lastSpeech: snippet,
        },
      });
      callsTouched += 1;
    }

    const agriCases = await prisma.agriCase.findMany({
      where: {
        OR: [
          { phone: contact.phone },
          { farmerName: contact.name },
          { channel: { contains: `demo-case-${i}-${DEMO_TAG}` } },
        ],
      },
    });
    for (const cs of agriCases) {
      await prisma.agriCase.update({
        where: { id: cs.id },
        data: {
          crop: crop || cs.crop,
          symptoms: snippet,
          summary: snippet,
          transcript: snippet,
        },
      });
    }
  }

  // Non-demo farmers with empty crop: leave empty (crop chart skips Unknown).
  // Give them a stable issue note so Top issues still counts them once each.
  const otherContacts = await prisma.crmContact.findMany({
    where: { NOT: { notes: { contains: DEMO_TAG } } },
  });
  for (let i = 0; i < otherContacts.length; i++) {
    const contact = otherContacts[i]!;
    if (/issue:/i.test(contact.notes || "")) continue;
    const snippet = ISSUE_SNIPPETS[i % ISSUE_SNIPPETS.length]!;
    const crop =
      contact.crop?.trim() && contact.crop.toLowerCase() !== "unknown"
        ? contact.crop
        : "";
    await prisma.crmContact.update({
      where: { id: contact.id },
      data: {
        crop,
        notes: [contact.notes?.trim(), `issue: ${snippet}`].filter(Boolean).join(" · "),
      },
    });
    contactsTouched += 1;
  }

  return {
    contacts: contactsTouched,
    calls: callsTouched,
    clearedUnknownCrops,
  };
}

export async function seedDemoCrmData(): Promise<DemoSeedResult> {
  if (!prismaConfigured()) {
    throw new Error("DATABASE_URL required to seed demo CRM data");
  }

  const marker = await prisma.crmContact.findFirst({
    where: { notes: { contains: DEMO_TAG } },
  });
  if (marker) {
    const refreshed = await refreshDemoInsights();
    return {
      ok: true,
      skipped: true,
      refreshed: true,
      farmers: refreshed.contacts,
      calls: refreshed.calls,
      cases: 0,
    };
  }

  const now = Date.now();
  let callCount = 0;
  let caseCount = 0;

  for (let i = 0; i < DEMO_FARMERS.length; i++) {
    const f = DEMO_FARMERS[i]!;
    const phone = demoPhone(i);
    const snippet = ISSUE_SNIPPETS[i % ISSUE_SNIPPETS.length]!;
    const contact = await prisma.crmContact.create({
      data: {
        name: f.name,
        phone,
        village: f.village,
        district: f.district,
        city: f.district,
        state: f.state,
        crop: f.crop,
        company: f.village,
        weatherSummary:
          i % 3 === 0
            ? `${f.district} — 32°C, partly cloudy, light breeze`
            : "",
        weatherAt: i % 3 === 0 ? new Date(now - i * 3600000) : undefined,
        notes: `${DEMO_TAG} · demo phone ${formatDemoPhone(i)} · issue: ${snippet}`,
      },
    });

    const directions = i % 3 === 0 ? "inbound" : "outbound";
    const ended = i !== 2;
    const startedAt = new Date(now - (i + 1) * 45 * 60 * 1000);
    await prisma.crmCall.create({
      data: {
        contactId: contact.id,
        phone,
        direction: directions,
        status: i === 2 ? "in-progress" : "ended",
        disposition: i === 2 ? "dialing" : "completed",
        transcript: `KRISHI: Namaste ${f.name.split(" ")[0]} ji.\nYOU: ${snippet}`,
        lastSpeech: snippet,
        startedAt,
        answeredAt: new Date(startedAt.getTime() + 8000),
        endedAt: ended ? new Date(startedAt.getTime() + 120000) : null,
        vobizUuid: `demo-call-${i}-${DEMO_TAG}`,
      },
    });
    callCount += 1;

    if (i % 2 === 0) {
      await createAgriCase({
        farmerName: f.name,
        phone,
        crop: f.crop,
        village: f.village,
        district: f.district,
        symptoms: snippet,
        started: "",
        watering: "",
        summary: snippet,
        channel: `demo-case-${i}-${DEMO_TAG}`,
        transcript: snippet,
        direction: directions,
        source: "demo-seed",
        status: i % 5 === 0 ? "escalated" : i % 4 === 0 ? "resolved" : "open",
      });
      caseCount += 1;
    }
  }

  return {
    ok: true,
    farmers: DEMO_FARMERS.length,
    calls: callCount,
    cases: caseCount,
  };
}

