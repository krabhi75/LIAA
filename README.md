# KrishiSaathi (LIAA)

Hindi voice agricultural assistant — **speaks, listens, captures, and acts** — on **Agora Conversational AI**, with PSTN field ops via Vobiz.

**GitHub:** https://github.com/krabhi75/LIAA  
**Live:** https://liaa-ebon.vercel.app  

---

## What it does

| Surface | User | Capability |
|---------|------|------------|
| **`/demo`** | Operator with mic | Agora Conversational AI desk — Hindi/Hinglish, barge-in, MCP tools |
| **`/crm`** | Field team | Farmer CRM, outbound dial, call timeline, weather on profile |
| **Agora Campaign** | Campaign outbound | Agora CAI → Vobiz SIP → farmer phone (see telephony setup) |
| **Inbound DID** | Farmer calls +917971443138 | Vobiz → Agora SIP → Liaa agent |

KrishiSaathi phone flow (CRM dial): name → district → live weather → crop help → expert case.

---

## Important: two outbound paths

**CRM “Call” does not update Agora Campaign stats.** Agora Campaigns only count CSV/campaign-initiated dials. CRM uses Vobiz XML + Polly.Aditi Hindi bot.

Full explanation: **[docs/OUTBOUND_PATHS.md](docs/OUTBOUND_PATHS.md)**

---

## Quick start

```bash
git clone https://github.com/krabhi75/LIAA.git
cd LIAA
npm install
cp .env.example .env.local   # fill Agora + Vobiz + DATABASE_URL
npm run db:push
npm run dev
```

Open http://localhost:3000/demo (Agora desk) or http://localhost:3000/crm (farmers).

Production uses **Neon Postgres** (`DATABASE_URL` + `DIRECT_URL` on Vercel).

---

## Architecture

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — Agora RTC desk, MCP tools, UIDs, env  
- **[docs/VOBIZ_AGORA.md](docs/VOBIZ_AGORA.md)** — SIP trunks, inbound SBC, campaign setup  
- **[docs/SUBMISSION.md](docs/SUBMISSION.md)** — Hackathon Commudle checklist (15 items)  
- **[docs/DEMO.md](docs/DEMO.md)** — Video shot list  

```text
Browser /demo → Agora RTC → Conversational AI (Deepgram · GPT-4o-mini · MiniMax)
                                    ↓ MCP
                              /api/mcp → tools + CRM

CRM Call → Vobiz REST → /api/vobiz/answer (XML KrishiSaathi, Polly.Aditi hi-IN STT)
                              ↓
                         Neon CRM + Open-Meteo weather
```

---

## Env (`.env.local`)

```bash
NEXT_PUBLIC_AGORA_APP_ID=
NEXT_AGORA_APP_CERTIFICATE=
AGORA_AREA=US
PUBLIC_BASE_URL=https://liaa-ebon.vercel.app
AETHER_MCP_KEY=
DATABASE_URL=          # Neon pooled URL on Vercel
DIRECT_URL=            # Neon direct URL for migrations
VOBIZ_AUTH_ID=
VOBIZ_AUTH_TOKEN=
VOBIZ_FROM_NUMBER=+917971443138
```

Never commit `.env.local`.

---

## Hackathon submission

All 15 Commudle assets are mapped in **[docs/SUBMISSION.md](docs/SUBMISSION.md)**.

---

## License

MIT — see repository for hackathon/EchoSphere context.
