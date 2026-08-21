# Chat / session handoff (safe for GitHub)

Cursor **does not move chat history** when you sign in with a different account.
Use this file + the local backup folders below so nothing important is lost.

## Where the full chat is saved (this machine)

| Location | Contents |
|---|---|
| `C:\Users\krabh\Downloads\Ecosphere Hackathons\liaa-chat-backup\` | Full copy of agent transcripts (JSONL) |
| `aetherclose\.chat-backup\` | Same copy next to the repo (**gitignored** — may contain secrets) |

Primary transcript id: `9496b921-ccbf-457c-9326-50bf4b119107`  
Title in Cursor: **Replicate nova-agora layout**

**Do not commit** `.chat-backup/` or paste raw transcripts into a public repo — they include Agora credentials and other secrets shared in chat.

## After you switch Cursor accounts

1. Keep using the same project folder:  
   `C:\Users\krabh\Downloads\Ecosphere Hackathons\aetherclose`
2. Open this handoff + `docs/ARCHITECTURE.md` for context.
3. Optional: open the JSONL in the backup folder if you need exact past wording.
4. Clone/pull GitHub if needed: https://github.com/krabhi75/aetherclose  
   - Production / default: `main`  
   - Vercel preview branch: `deploy/liaa-demo`

## Product state (current)

- **Agent name:** Liaa  
- **Desk UI chrome:** English (Start / Stop, labels, action cards)  
- **Spoken conversation:** Hindi / Hinglish (STT `hi`, turn detection `hi-IN`)  
- **Voice stack:** Agora Conversational AI (Deepgram → GPT-4o-mini → MiniMax)  
- **Tools:** calendar, mail, tabs, memory via MCP (`PUBLIC_BASE_URL` must be public HTTPS)  
- **Demo URL:** http://localhost:3000/demo  
- **Not required for multi-tool demo:** ElevenLabs, Google Calendar/Gmail (optional later)

## Key docs in repo

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design  
- [DEMO.md](./DEMO.md) — live / video shot list  
- [SUBMISSION.md](./SUBMISSION.md) — contest paste copy  
- [README.md](../README.md) — quick start  

## Env (recreate on new machine / account — do not store secrets here)

Copy from your existing `.env.local` (never from chat history into git):

```env
NEXT_PUBLIC_AGORA_APP_ID=
NEXT_AGORA_APP_CERTIFICATE=
AGORA_AREA=US
PUBLIC_BASE_URL=https://your-tunnel-or-vercel-url
AETHER_MCP_KEY=
DATABASE_URL="file:./dev.db"
AUTH_SECRET=
```

## Branches on GitHub

| Branch | Purpose |
|---|---|
| `main` | Canonical code |
| `deploy/liaa-demo` | Branch pushed for Vercel preview deploy |

## What this chat covered (timeline)

1. Agora Conversational AI sales desk (MolVaani / Maya) for EchoSphere  
2. Tunnel / MCP / demo readiness  
3. Pivot away from sales → personal assistant (Nova)  
4. Instrument UI, action chains, Start/Stop, vibrant desk  
5. Rebrand to **Liaa**; English UI + Hindi/Hinglish voice  
6. Architecture docs + `deploy/liaa-demo` for Vercel  

---

*Updated for account handoff. Full verbatim history lives only in the local backup folders above.*
