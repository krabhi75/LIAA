/**
 * Generate 2-minute pitch voiceover (Indian female — ElevenLabs Tara).
 * Usage: node scripts/generate-pitch-audio.mjs
 * Requires ELEVENLABS_API_KEY in .env.local
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const outDir = join(root, "public", "pitch-audio");

/** Tara — Hindi reels explainer; professional Indian female */
const VOICE_ID = process.env.ELEVENLABS_PITCH_VOICE_ID || "tA6LGZpsqStKtSaGiXND";
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";

const SEGMENTS = [
  {
    id: "01-intro",
    text: "Welcome to KrishiSaathi — a Hindi voice agricultural assistant on Agora Conversational AI. It speaks, listens, captures farmer data, and acts.",
  },
  {
    id: "02-problem",
    text: "Farmers cannot navigate English forms. They need patient voice help for crop problems, local weather, and expert escalation — without repeating their story.",
  },
  {
    id: "03-stack",
    text: "Deepgram handles Hindi speech recognition. OpenAI GPT four-o-mini reasons. ElevenLabs speaks naturally. Agora owns the live channel and barge-in.",
  },
  {
    id: "04-desk",
    text: "On the live voice desk, start a conversation in Hindi or Hinglish. Interrupt mid-sentence — KrishiSaathi stops and listens. Tool cards update on screen in real time.",
  },
  {
    id: "05-crm",
    text: "The field CRM registers every farmer — inbound on our Indian number, or outbound from the desk. Structured facts flow from natural speech.",
  },
  {
    id: "06-profile",
    text: "Every farmer record shows call timeline, weather summary, transcripts, and open agri cases. Agents close cases with disposition — resolved, escalated, or follow-up.",
  },
  {
    id: "07-live",
    text: "The operations dashboard and live calls monitor refresh every few seconds — real metrics for field teams, not static placeholders.",
  },
  {
    id: "08-phone",
    text: "CRM outbound uses Vobiz with Indian voice. Agora campaigns and the browser demo use Conversational AI — two phone paths, one architecture.",
  },
  {
    id: "09-tools",
    text: "After location, live weather from Open-Meteo is spoken and stored on the profile. When confidence is low, expert cases carry full context already captured.",
  },
  {
    id: "10-arch",
    text: "Agora-central voice, Next.js for tokens and MCP tools, Neon Postgres for CRM — production at liaa-ebon dot vercel dot app.",
  },
  {
    id: "11-close",
    text: "KrishiSaathi — voice-first agricultural support for Bharat. Live demo and open source on GitHub: krabhi75 slash LIAA. Thank you.",
  },
];

function loadEnv() {
  for (const f of [".env.local", ".env"]) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

async function tts(text) {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) throw new Error("ELEVENLABS_API_KEY missing in .env.local");

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.78,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err.slice(0, 200)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  loadEnv();
  mkdirSync(outDir, { recursive: true });

  const manifest = [];
  for (const seg of SEGMENTS) {
    const out = join(outDir, `${seg.id}.mp3`);
    process.stdout.write(`Generating ${seg.id}… `);
    const buf = await tts(seg.text);
    writeFileSync(out, buf);
    manifest.push({ id: seg.id, file: `/pitch-audio/${seg.id}.mp3`, text: seg.text });
    console.log(`OK (${buf.length} bytes)`);
  }

  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify({ voiceId: VOICE_ID, modelId: MODEL_ID, segments: manifest }, null, 2),
  );
  console.log(`\nDone — ${manifest.length} files in public/pitch-audio/`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
