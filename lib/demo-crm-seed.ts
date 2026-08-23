import { prisma, prismaConfigured } from "./db";
import { createAgriCase } from "./agri-cases";
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
  "kapas mein safed keede lag rahe hain",
  "pani ki kami hai sinchai ke liye",
  "gehun par pila pan dikh raha hai",
  "yojana registration kaise karein",
  "khad ka dose puchna hai",
  "tamatar mein keeda problem",
];

export type DemoSeedResult = {
  ok: boolean;
  skipped?: boolean;
  farmers: number;
  calls: number;
  cases: number;
};

export async function seedDemoCrmData(): Promise<DemoSeedResult> {
  if (!prismaConfigured()) {
    throw new Error("DATABASE_URL required to seed demo CRM data");
  }

  const marker = await prisma.crmContact.findFirst({
    where: { notes: { contains: DEMO_TAG } },
  });
  if (marker) {
    return { ok: true, skipped: true, farmers: 0, calls: 0, cases: 0 };
  }

  const now = Date.now();
  let callCount = 0;
  let caseCount = 0;

  for (let i = 0; i < DEMO_FARMERS.length; i++) {
    const f = DEMO_FARMERS[i]!;
    const phone = demoPhone(i);
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
        notes: `${DEMO_TAG} · demo phone ${formatDemoPhone(i)}`,
      },
    });

    const directions = i % 3 === 0 ? "inbound" : "outbound";
    const ended = i !== 2;
    const startedAt = new Date(now - (i + 1) * 45 * 60 * 1000);
    const snippet = ISSUE_SNIPPETS[i % ISSUE_SNIPPETS.length]!;
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
