# KrishiSaathi (LIAA)

**Hindi voice agricultural assistant** for Indian farmers — built on **Agora Conversational AI**.

| | |
|---|---|
| **Live app** | https://liaa-ebon.vercel.app |
| **GitHub** | https://github.com/krabhi75/LIAA |
| **Demo desk** | https://liaa-ebon.vercel.app/demo |
| **Farmer CRM** | https://liaa-ebon.vercel.app/crm |

---

## Voice stack (Agora Conversational AI)

| Layer | Provider | Role |
|-------|----------|------|
| **ASR** | **Deepgram** (nova-3, `hi`) | Speech → text |
| **LLM** | **OpenAI** (gpt-4o-mini) | Dialog, tools, reasoning |
| **TTS** | **ElevenLabs** (multilingual) | Text → speech |

Agora owns the real-time channel, barge-in, and turn-taking. Our Next.js app only starts/stops the agent and runs tools (MCP + CRM).

---

## What you can demo

1. **Browser desk (`/demo`)** — Start conversation → speak Hindi/Hinglish → barge-in → tools update on screen.  
2. **Farmer CRM (`/crm`)** — Dial a farmer → KrishiSaathi asks name → location → live weather → crop help → expert case.  
3. **Agora Campaign outbound** — CSV dial via Vobiz SIP (Agora CAI on the phone). See [docs/OUTBOUND_PATHS.md](docs/OUTBOUND_PATHS.md).

> **Note:** Calls from the CRM **Call** button use Vobiz XML (Polly.Aditi Hindi) and update the **LIAA CRM dashboard**, not the Agora Campaign counter.

---

## Architecture (short)

```text
Farmer / operator mic
        │
        ▼
 Agora RTC + Conversational AI
   ASR: Deepgram  →  LLM: OpenAI  →  TTS: ElevenLabs
        │
        ├── MCP tools  →  calendar / mail / memory / tabs
        └── CRM APIs   →  farmers, calls, weather (Open-Meteo), cases
```

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Quick start

```bash
git clone https://github.com/krabhi75/LIAA.git
cd LIAA
npm install
cp .env.example .env.local
# fill Agora + ElevenLabs + DATABASE_URL (+ Vobiz for phone)
npm run db:push
npm run dev
```

Open http://localhost:3000/demo

---

## Environment

```bash
# Agora
NEXT_PUBLIC_AGORA_APP_ID=
NEXT_AGORA_APP_CERTIFICATE=
AGORA_AREA=US
PUBLIC_BASE_URL=https://liaa-ebon.vercel.app
AETHER_MCP_KEY=

# Voice stack
ELEVENLABS_API_KEY=           # required for /demo TTS
ELEVENLABS_VOICE_ID=          # optional (default: Rachel)
ELEVENLABS_MODEL_ID=eleven_multilingual_v2

# Database (Neon on production)
DATABASE_URL=
DIRECT_URL=

# Phone (CRM outbound / SIP)
VOBIZ_AUTH_ID=
VOBIZ_AUTH_TOKEN=
VOBIZ_FROM_NUMBER=+917971443138
```

Never commit `.env.local`.

---

## Docs

| Doc | Purpose |
|-----|---------|
| [docs/AGORA_CONSOLE.md](docs/AGORA_CONSOLE.md) | Agora agent prompt, models, VAD, MCP paste guide |
| [docs/SUBMISSION.md](docs/SUBMISSION.md) | Commudle 15-item checklist |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/DEMO_90S.md](docs/DEMO_90S.md) | 90-second submission reel + voiceover |
| [docs/DEMO.md](docs/DEMO.md) | Longer 3–5 minute video shot list |
| [docs/VOBIZ_AGORA.md](docs/VOBIZ_AGORA.md) | SIP / inbound / campaign setup |
| [docs/OUTBOUND_PATHS.md](docs/OUTBOUND_PATHS.md) | Agora Campaign vs CRM dial |

---

## License

MIT — EchoSphere / Commudle hackathon submission.
