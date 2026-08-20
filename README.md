# MolVaani Cloud

EchoSphere (Knotic × Agora) · **PS21** · Adaptive AI Sales and Negotiation Agent

A voice sales agent that **speaks, listens, and acts** on **Agora Conversational AI**.  
Live desk UI is modeled on [nova-agora](https://github.com/vaivikop/nova-agora) (instrument layout: transcript · orb · action cards), while voice stays on Agora’s managed STT → LLM → TTS path — not a custom chatbot with speech bolted on.

**GitHub:** https://github.com/krabhi75/aetherclose  
**UI reference:** https://github.com/vaivikop/nova-agora

---

## Live desk (Nova-style layout)

```
┌─────────────────────────────────────────────────────────────┐
│ MOLVAANI · agent · mcp                              End     │
├──────────────┬──────────────────────────┬───────────────────┤
│ Transcript   │         ORB              │ Actions           │
│ YOU / MAYA   │   listening / speaking   │ CRM · tools       │
│              │ AGORA · channel · rtt    │ pricing · book    │
└──────────────┴──────────────────────────┴───────────────────┘
```

- Auto-wake when mic permission is already granted (`?manual` forces the Wake button)
- Real mic / agent levels drive the orb (not a fake spinner)
- Agora readout shows **channel · RTT · uid** from the live RTC connection
- MCP tool results land as action cards on the right

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing (no account) |
| `/demo` | Live desk — primary entry |
| `/human?channel=` | Human specialist same-channel handoff |
| `/embed/:org/:agent` | Embeddable widget |

No sign-in. `/login`, `/signup`, and `/app/*` redirect to `/demo`.

## Architecture

```text
Browser mic
  agora-rtc-sdk-ng  →  Agora RTC channel  ←  Conversational AI agent
  agora-rtm / toolkit → live transcripts
        │
        ▼
Next.js
  POST /api/token · /api/invite-agent · /api/stop-conversation
  POST /api/mcp  (pricing, competitor, CRM, calendar, escalate)
```

Managed models: Deepgram nova-3 · GPT-4o-mini · MiniMax speech-2.6-turbo.

What we keep from Nova’s UX ideas; what we do **not** copy:

| Nova (reference) | MolVaani |
|---|---|
| Paper instrument UI, orb, action cards | Replicated |
| Custom OpenAI-compatible LLM endpoint + Groq | **Not used** — Agora Conversational AI is mandatory for PS21 |
| Google Calendar / Gmail tools | Sales MCP tools + CRM instead |

## Setup

```bash
cd "C:\Users\krabh\Downloads\Ecosphere Hackathons\aetherclose"
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000/demo — allow the microphone.

`.env.local` essentials:

```bash
NEXT_PUBLIC_AGORA_APP_ID=...
NEXT_AGORA_APP_CERTIFICATE=...
AGORA_AREA=US
PUBLIC_BASE_URL=https://your-cloudflare-tunnel
AETHER_MCP_KEY=...
DATABASE_URL="file:./dev.db"
AUTH_SECRET=long-random-string
```

Tunnel (Agora must reach MCP):

```bash
cloudflared tunnel --url http://localhost:3000
```

Paste the HTTPS URL into `PUBLIC_BASE_URL` and restart `npm run dev`.

## Demo path (you speak)

1. Ask pricing first  
2. Interrupt with Slack / Teams  
3. Change seat count (e.g. 50)  
4. Ask for an enterprise demo Thursday IST  

Watch the orb, transcript, and action cards update live.

## Tech

- Agora Conversational AI (`agora-agents`) + RTC + RTM
- Next.js 16 · React 19 · TypeScript · Tailwind
- Prisma + SQLite (Postgres-ready)
- JWT cookie auth · MCP tools · Stripe billing stub

## Known limitations

- MCP needs a public HTTPS `PUBLIC_BASE_URL` (not localhost)
- Hot session cache is in-process with DB write-through
- Stripe Checkout is stubbed until keys are set
- Conversational AI PCU cap and managed-model region (`US`) apply

## Credits

Live-desk visual language adapted from [vaivikop/nova-agora](https://github.com/vaivikop/nova-agora) (Nova).  
Voice and agent lifecycle remain Agora Conversational AI for EchoSphere compliance.
