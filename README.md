# Nova

A voice assistant that **speaks, listens, and acts** — on **Agora Conversational AI**.

Inspired by [vaivikop/nova-agora](https://github.com/vaivikop/nova-agora): same instrument UI (transcript · orb · actions) and assistant tools (calendar, mail, tabs, memory). **Not a sales representative.**

**GitHub:** https://github.com/krabhi75/aetherclose  
**Reference:** https://github.com/vaivikop/nova-agora

---

## What Nova does

| You say | What happens |
|---|---|
| "What does my day look like?" | `get_calendar` → action card |
| "Book a sync with Rahul tomorrow at four" | `create_event` (DEMO DATA until Google is wired) |
| "Move it an hour later" | `update_event` using the remembered event id |
| "What's in my inbox?" | `read_email` |
| "Open YouTube" | `open_tab` (trusted hosts auto-open; others ask) |
| "Remember my name is Abhishek" | `remember` → durable `.nova-memory.json` |

Seeded calendar/mail results carry a visible **DEMO DATA** badge — Nova will not pretend a Meet link is real Google.

## Live desk

```
┌─────────────────────────────────────────────────────────────┐
│ NOVA · agent · tools                                 End    │
├──────────────┬──────────────────────────┬───────────────────┤
│ Transcript   │         ORB              │ Actions           │
│ YOU / NOVA   │   listening / speaking   │ calendar · mail   │
│              │ AGORA · channel · rtt    │ DEMO DATA badges  │
└──────────────┴──────────────────────────┴───────────────────┘
```

Open **http://localhost:3000/demo** — no sign-in. Auto-wakes when mic is already allowed (`?manual` forces the button).

## Setup

```bash
cd "C:\Users\krabh\Downloads\Ecosphere Hackathons\aetherclose"
npm install
npm run db:push
npm run db:seed
npm run dev
```

`.env.local`:

```bash
NEXT_PUBLIC_AGORA_APP_ID=...
NEXT_AGORA_APP_CERTIFICATE=...
AGORA_AREA=US
PUBLIC_BASE_URL=https://your-cloudflare-tunnel
AETHER_MCP_KEY=...
DATABASE_URL="file:./dev.db"
AUTH_SECRET=any-long-string
```

Tunnel so Agora can reach MCP tools:

```bash
cloudflared tunnel --url http://localhost:3000
```

## Architecture

```text
mic → Agora RTC → Conversational AI (ASR → LLM → TTS)
                      │  MCP tools
                      ▼
              /api/mcp  → calendar / mail / tab / memory
                      │
         public desk ◄── polls session + action cards
```

Voice stays on Agora managed models (Deepgram · GPT-4o-mini · MiniMax).  
Unlike upstream nova-agora, this build does **not** use a custom Groq OpenAI-compat callback — that keeps Conversational AI as the voice engine.

## vs nova-agora

| Feature | Status |
|---|---|
| Instrument UI + orb + RTT | Yes |
| Assistant persona (not sales) | Yes |
| Calendar / mail / remember / open_tab tools | Yes (demo store + honest badges) |
| Live Google OAuth | Not wired yet — use DEMO DATA path |
| Desktop `open_app` | Not ported |
| Groq custom LLM endpoint | Intentionally not used |

## Known limits

- MCP needs public HTTPS `PUBLIC_BASE_URL`
- Calendar/mail writes are in-process demo data unless you add Google
- Quick Cloudflare tunnels expire on restart
