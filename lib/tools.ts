import { addMemory, getCachedMemories, loadMemories } from "./memory";
import { recordTool } from "./store";
import { createAgriCase, escalateAgriCase } from "./agri-cases";

export const TOOL_NAMES = [
  "capture_field",
  "get_weather",
  "get_advisory",
  "create_case",
  "escalate_expert",
  "remember",
  "get_memory",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

type FieldState = {
  crop: string;
  village: string;
  district: string;
  symptoms: string;
  started: string;
  watering: string;
  asked: string[];
  caseId: string | null;
  escalated: boolean;
};

const channels = new Map<string, FieldState>();

function field(channel: string): FieldState {
  let s = channels.get(channel);
  if (!s) {
    s = {
      crop: "",
      village: "",
      district: "",
      symptoms: "",
      started: "",
      watering: "",
      asked: [],
      caseId: null,
      escalated: false,
    };
    channels.set(channel, s);
  }
  return s;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function card(
  verb: string,
  kind: string,
  title: string,
  detail?: string,
  extra?: { demo?: boolean; link?: string; ask?: boolean },
) {
  return {
    verb,
    kind,
    title,
    detail: detail ?? "",
    demo: Boolean(extra?.demo),
    link: extra?.link,
    ask: Boolean(extra?.ask),
  };
}

const PLACES: Record<string, { lat: number; lon: number; district: string }> = {
  nashik: { lat: 19.9975, lon: 73.7898, district: "Nashik" },
  pune: { lat: 18.5204, lon: 73.8567, district: "Pune" },
  nagpur: { lat: 21.1458, lon: 79.0882, district: "Nagpur" },
  lucknow: { lat: 26.8467, lon: 80.9462, district: "Lucknow" },
  patna: { lat: 25.5941, lon: 85.1376, district: "Patna" },
  merath: { lat: 28.9845, lon: 77.7064, district: "Meerut" },
  meerut: { lat: 28.9845, lon: 77.7064, district: "Meerut" },
  ncr: { lat: 28.6139, lon: 77.209, district: "Delhi NCR" },
  delhi: { lat: 28.6139, lon: 77.209, district: "Delhi NCR" },
};

function placeOf(text: string) {
  const k = text.toLowerCase();
  for (const [name, loc] of Object.entries(PLACES)) {
    if (k.includes(name)) return { name, ...loc };
  }
  return { name: "nashik", ...PLACES.nashik };
}

export const TOOL_DEFS = [
  {
    name: "capture_field",
    description:
      "Save what the farmer said this turn. Do not diagnose. Ask the next missing question.",
    inputSchema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        village: { type: "string" },
        district: { type: "string" },
        symptoms: { type: "string" },
        started: { type: "string" },
        watering: { type: "string" },
      },
    },
  },
  {
    name: "get_weather",
    description:
      "Live Open-Meteo weather for the farmer village/district. Required before advice.",
    inputSchema: {
      type: "object",
      properties: { place: { type: "string" } },
    },
  },
  {
    name: "get_advisory",
    description:
      "Retrieve scheme or pest notes. Use only after crop+symptoms captured. If unsure, say so.",
    inputSchema: {
      type: "object",
      properties: {
        crop: { type: "string" },
        symptoms: { type: "string" },
        topic: { type: "string", description: "pest | scheme | market" },
      },
    },
  },
  {
    name: "create_case",
    description: "Create a structured field case on the CRM screen. Farmer should not repeat later.",
    inputSchema: {
      type: "object",
      properties: {
        farmer_name: { type: "string" },
        phone: { type: "string" },
        summary: { type: "string" },
      },
    },
  },
  {
    name: "escalate_expert",
    description: "Hand the case to a human agri expert. Call after create_case if uncertain or severe.",
    inputSchema: {
      type: "object",
      properties: {
        case_id: { type: "string" },
        reason: { type: "string" },
      },
      required: ["reason"],
    },
  },
  {
    name: "remember",
    description: "Store one durable fact (farmer name, village, crop).",
    inputSchema: {
      type: "object",
      properties: { fact: { type: "string" } },
      required: ["fact"],
    },
  },
  {
    name: "get_memory",
    description: "Read remembered farmer facts.",
    inputSchema: { type: "object", properties: {} },
  },
];

async function liveWeather(place: string) {
  const loc = placeOf(place);
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather unavailable");
  const data = (await res.json()) as {
    current?: {
      temperature_2m?: number;
      precipitation?: number;
      relative_humidity_2m?: number;
    };
  };
  const c = data.current ?? {};
  return {
    place: loc.district,
    tempC: c.temperature_2m,
    rainMm: c.precipitation,
    humidity: c.relative_humidity_2m,
    source: "Open-Meteo",
  };
}

function advisory(crop: string, symptoms: string, topic: string) {
  const blob = `${crop} ${symptoms} ${topic}`.toLowerCase();
  if (blob.includes("scheme") || blob.includes("pm-kisan") || blob.includes("yojana")) {
    return {
      title: "PM-KISAN / state schemes",
      note: "Identity + land record needed. Do not promise payment. Expert can help apply.",
      certain: false,
    };
  }
  if (blob.includes("yellow") || blob.includes("peele") || blob.includes("leaf") || blob.includes("patte")) {
    return {
      title: "Leaf yellowing — do not spray yet",
      note: "Could be water, nutrient, or pest. Need photos + expert. Avoid random pesticide.",
      certain: false,
    };
  }
  if (blob.includes("keeda") || blob.includes("pest") || blob.includes("sundi")) {
    return {
      title: "Pest suspected",
      note: "Identify insect before spray. Escalate with crop, days since start, watering.",
      certain: false,
    };
  }
  return {
    title: "Incomplete — no diagnosis",
    note: "Ask crop, village, when it started, watering. If still unclear, escalate.",
    certain: false,
  };
}

function nextQuestion(s: FieldState): string {
  if (!s.crop) return "Kaun si fasal hai?";
  if (!s.village && !s.district) return "Kaun sa gaon ya zila hai?";
  if (!s.symptoms) return "Patte, jhad, keeda — kya dikh raha hai?";
  if (!s.started) return "Kab se shuru hua?";
  if (!s.watering) return "Paani kab diya tha?";
  return "";
}

export async function buildLiaaSystemPrompt(channel: string): Promise<string> {
  const now = new Date();
  const s = field(channel);
  const known = await loadMemories();
  const missing = nextQuestion(s);
  return [
    "You are Liaa, a field voice assistant for Indian farmers and rural workers — not a sales bot, not a crop encyclopedia.",
    "Speak short Hindi or Hinglish. One or two spoken sentences. No markdown, lists, or emoji.",
    'Never read URLs or ids aloud — say "case screen par hai".',
    `Now: ${now.toISOString()}.`,
    "Do NOT diagnose on the first symptom. Ask follow-ups with capture_field.",
    "Order: crop → village/district → what they see → since when → watering. Then get_weather, then get_advisory.",
    "If unsure, say so in Hindi. Then create_case and escalate_expert so the farmer never repeats the story.",
    "Code-switch if they mix English. Keep language simple for low literacy.",
    "Never invent pesticide doses or government payout amounts.",
    missing ? `Still missing: ${missing}` : "Intake complete enough for weather + case.",
    `Session so far: ${JSON.stringify({
      crop: s.crop,
      village: s.village,
      symptoms: s.symptoms,
      started: s.started,
      caseId: s.caseId,
    })}`,
    known.length ? `Memory: ${known.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const buildNovaSystemPrompt = buildLiaaSystemPrompt;

export async function runTool(
  channel: string,
  name: string,
  rawArgs: unknown,
): Promise<unknown> {
  const args = asRecord(rawArgs);
  const s = field(channel);
  let output: unknown;

  switch (name) {
    case "capture_field": {
      if (typeof args.crop === "string") s.crop = args.crop;
      if (typeof args.village === "string") s.village = args.village;
      if (typeof args.district === "string") s.district = args.district;
      if (typeof args.symptoms === "string") s.symptoms = args.symptoms;
      if (typeof args.started === "string") s.started = args.started;
      if (typeof args.watering === "string") s.watering = args.watering;
      const ask = nextQuestion(s);
      output = {
        saved: {
          crop: s.crop,
          village: s.village,
          district: s.district,
          symptoms: s.symptoms,
          started: s.started,
          watering: s.watering,
        },
        next_question: ask || "Intake complete. Fetch weather then create_case.",
        card: card(
          "Captured",
          "field",
          ask ? `Need: ${ask}` : "Field notes complete",
          [s.crop, s.village || s.district, s.symptoms].filter(Boolean).join(" · "),
        ),
      };
      break;
    }
    case "get_weather": {
      const place = String(args.place || s.village || s.district || "nashik");
      try {
        const w = await liveWeather(place);
        output = {
          ...w,
          card: card(
            "Weather",
            "open-meteo",
            `${w.place}: ${w.tempC}°C`,
            `Rain ${w.rainMm ?? 0} mm · humidity ${w.humidity ?? "—"}% · live API`,
            { demo: false },
          ),
        };
      } catch {
        output = {
          error: "weather unavailable",
          card: card("Weather", "open-meteo", "Could not fetch", "Say so out loud. Do not guess.", {
            ask: true,
          }),
        };
      }
      break;
    }
    case "get_advisory": {
      const a = advisory(
        String(args.crop || s.crop),
        String(args.symptoms || s.symptoms),
        String(args.topic || "pest"),
      );
      output = {
        ...a,
        card: card("Advisory", "knowledge", a.title, a.note, { demo: true }),
      };
      break;
    }
    case "create_case": {
      const created = await createAgriCase({
        farmerName: String(args.farmer_name || "Farmer"),
        phone: String(args.phone || ""),
        crop: s.crop,
        village: s.village,
        district: s.district,
        symptoms: s.symptoms,
        started: s.started,
        watering: s.watering,
        summary: String(args.summary || s.symptoms),
        channel,
        transcript: "",
        direction: "desk",
        source: "agora-desk",
      });
      s.caseId = created.id;
      output = {
        caseId: created.id,
        card: card(
          "Case opened",
          "crm",
          `${created.crop || "Crop"} · ${created.village || created.district || "field"}`,
          created.summary,
          { link: "/crm" },
        ),
      };
      break;
    }
    case "escalate_expert": {
      const id = String(args.case_id || s.caseId || "");
      const reason = String(args.reason);
      if (id) await escalateAgriCase(id, reason);
      s.escalated = true;
      output = {
        waiting: true,
        caseId: id,
        card: card(
          "Expert needed",
          "escalate",
          "Human agri expert queued",
          reason,
          { ask: true, link: "/crm" },
        ),
      };
      break;
    }
    case "remember": {
      const fact = String(args.fact);
      void addMemory(fact);
      output = { ok: true, card: card("Remembered", "memory", fact, "") };
      break;
    }
    case "get_memory": {
      void loadMemories();
      const facts = getCachedMemories();
      output = {
        facts,
        card: card(
          "Memory",
          "memory",
          facts.length ? `${facts.length} fact(s)` : "Nothing stored yet",
          facts.slice(0, 3).join("; "),
        ),
      };
      break;
    }
    default:
      output = { error: `Unknown tool ${name}` };
  }

  recordTool(channel, name, args, output);
  return output;
}
