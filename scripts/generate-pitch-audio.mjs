/**
 * Generate 2-minute pitch voiceover — Indian male (~28), credit-efficient Flash model.
 * Usage: node scripts/generate-pitch-audio.mjs
 * Requires ELEVENLABS_API_KEY (do not commit keys).
 *
 * Credit tips: eleven_flash_v2_5 (~0.5 credit/char), short script, one generate only.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const outDir = join(root, "public", "pitch-audio");

/**
 * Professional young Indian male (~28) — Nikhil (conversational).
 * Override with ELEVENLABS_PITCH_VOICE_ID. Alt: Aashish RpiHVNPKGBg7UmgmrKrN
 */
const VOICE_ID =
  process.env.ELEVENLABS_PITCH_VOICE_ID || "gX28yZeQHE9L4d5iYqPy";
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";

/**
 * Synced to current CRM UI — no "demo", no sample phone numbers.
 * Kept short to minimize ElevenLabs credits (~1.1k chars).
 */
const SEGMENTS = [
  {
    id: "01-intro",
    text: "Welcome to KrishiSaathi — Hindi voice agricultural support on Agora Conversational AI. It speaks, listens, captures farmer facts, and acts.",
  },
  {
    id: "02-problem",
    text: "Farmers need patient voice help for crop issues, weather, and expert handoff — not English forms, and without telling their story twice.",
  },
  {
    id: "03-stack",
    text: "Deepgram understands Hindi. OpenAI reasons. ElevenLabs speaks. Agora owns the live channel and barge-in.",
  },
  {
    id: "04-desk",
    text: "On the voice desk, start a Hindi conversation. Interrupt mid-sentence — KrishiSaathi stops and listens. Tool cards appear as it works.",
  },
  {
    id: "05-dashboard",
    text: "The operations dashboard shows farmers, calls, live now, escalations, and open cases. Call mix is an inbound versus outbound donut. Top farmer issues and crop focus update from live CRM — real wheat, rice, cotton — never unknown.",
  },
  {
    id: "06-crm",
    text: "In the farmers registry, tap New Farmer, search accounts, and place outbound calls. Structured facts flow from natural speech.",
  },
  {
    id: "07-profile",
    text: "Each farmer record shows timeline, weather, transcripts, and agri cases. Set disposition — resolved, escalated, or follow-up — on the record.",
  },
  {
    id: "08-live",
    text: "Live calls refresh every few seconds. CRM dials run on Vobiz with Indian voice. The browser desk uses Agora Conversational AI — two paths, one product.",
  },
  {
    id: "09-close",
    text: "KrishiSaathi for Bharat — live at liaa-ebon dot vercel dot app. Open source: krabhi seventy-five slash L-I-A-A. Thank you.",
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
  if (!key) throw new Error("ELEVENLABS_API_KEY missing");

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
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.1,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${err.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  loadEnv();
  mkdirSync(outDir, { recursive: true });

  const totalChars = SEGMENTS.reduce((n, s) => n + s.text.length, 0);
  console.log(
    `Model ${MODEL_ID} · voice ${VOICE_ID} · ${totalChars} chars (~${Math.round(totalChars * 0.5)}–${totalChars} credits)`,
  );

  const manifest = [];
  for (const seg of SEGMENTS) {
    const out = join(outDir, `${seg.id}.mp3`);
    process.stdout.write(`Generating ${seg.id}… `);
    const buf = await tts(seg.text);
    writeFileSync(out, buf);
    manifest.push({
      id: seg.id,
      file: `/pitch-audio/${seg.id}.mp3`,
      text: seg.text,
    });
    console.log(`OK (${buf.length} bytes)`);
  }

  // Remove obsolete longer-script clips so /pitch doesn't play stale audio
  for (const stale of ["10-arch", "11-close"]) {
    const p = join(outDir, `${stale}.mp3`);
    if (existsSync(p)) {
      const { unlinkSync } = await import("fs");
      unlinkSync(p);
    }
  }

  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify(
      {
        voiceId: VOICE_ID,
        modelId: MODEL_ID,
        chars: totalChars,
        segments: manifest,
      },
      null,
      2,
    ),
  );
  console.log(`\nDone — ${manifest.length} files · ~${totalChars} chars billed`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
