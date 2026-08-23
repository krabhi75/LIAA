# Commudle submission — KrishiSaathi (LIAA)

**Public repo:** https://github.com/krabhi75/LIAA  
**Live app:** https://liaa-ebon.vercel.app  
**Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) · **Outbound paths:** [OUTBOUND_PATHS.md](./OUTBOUND_PATHS.md)

---

## 1. Working application or prototype

Live Next.js app: dashboard, Agora voice desk (`/demo`), farmer CRM (`/crm`), PSTN outbound/inbound via Vobiz + Agora SIP. Production on Vercel with Neon Postgres.

---

## 2. Public GitHub repository

https://github.com/krabhi75/LIAA (branch `main`)

---

## 3. README documentation

[../README.md](../README.md) — setup, architecture summary, demo URLs, env vars.

---

## 4. System architecture diagram

See [ARCHITECTURE.md](./ARCHITECTURE.md) §2 (RTC desk + mermaid) and [OUTBOUND_PATHS.md](./OUTBOUND_PATHS.md) (PSTN dual-path).

---

## 5. Three-to-five-minute demonstration video

Shot list: [DEMO.md](./DEMO.md). Suggested arc:

- 0:00 — Problem: farmers need Hindi voice help, not forms  
- 0:30 — `/demo` Agora desk OR Agora campaign outbound (SIP)  
- 1:30 — CRM dial → name → location → live weather on farmer profile  
- 2:30 — Expert case / timeline on farmer record  
- 3:30 — Architecture recap + honest limits  

---

## 6. Plan for a live demonstration

1. Open https://liaa-ebon.vercel.app — show dashboard call counts (CRM path).  
2. **Agora path:** Agora Console → Campaign “Outbound Liaa” with judge’s number in CSV **or** `/demo` → Start conversation (mic).  
3. **CRM path:** `/crm` → add farmer → Call → speak name, district, crop problem in Hindi.  
4. Open farmer profile — weather summary, transcript, timeline.  
5. Optional: inbound call to +917971443138 (Agora agent on SIP).

---

## 7. How Agora Conversational AI is used

- Browser `/demo`: user joins Agora RTC; server `POST /api/invite-agent` starts `agora-agents` session with Deepgram STT (`hi`), GPT-4o-mini, MiniMax TTS, MCP tools, barge-in.  
- PSTN outbound (campaign): Agora dials via Vobiz SIP trunk; same Conversational AI engine handles the call (see [VOBIZ_AGORA.md](./VOBIZ_AGORA.md)).  
- Audio and turn-taking stay on Agora — our server only tokens, start/stop, and tools.

---

## 8. External APIs, LLMs, speech providers, services

| Service | Role |
|---------|------|
| **Agora Conversational AI** | RTC, STT, LLM routing, TTS, barge-in |
| **Deepgram** (via Agora) | Speech-to-text Hindi |
| **OpenAI GPT-4o-mini** (via Agora) | Dialog + tool planning |
| **MiniMax** (via Agora) | Text-to-speech |
| **Vobiz** | PSTN SIP trunk, XML IVR leg for CRM dialer |
| **Open-Meteo** | Geocode + live weather (no key) |
| **Neon Postgres** | CRM, calls, farmers, cases |
| **Vercel** | Hosting |

CRM XML leg uses Vobiz Polly.Aditi + Gather hi-IN (not Agora on that leg).

---

## 9. Demonstrated Conversational AI capabilities

- Real-time voice conversation (Hindi / Hinglish)  
- Barge-in / interruption  
- Multi-turn memory within session  
- Tool use (MCP): calendar, mail, tab, memory on desk; CRM capture on phone  
- Human-readable transcript (RTM on desk; CRM on PSTN)  
- Outbound campaign via Agora SIP (when using Campaigns, not CRM dial)

---

## 10. Known technical limitations

- MCP tools require public `PUBLIC_BASE_URL` (HTTPS).  
- CRM outbound uses Vobiz XML bot — **does not** appear in Agora Campaign stats ([OUTBOUND_PATHS.md](./OUTBOUND_PATHS.md)).  
- Weather fetch capped at ~2.5s on phone; may skip spoken weather on slow networks.  
- Google Calendar/Gmail are demo data unless OAuth is wired.  
- Vobiz Speak standard voices do not include Hindi; CRM uses Polly.Aditi SSML.

---

## 11. AI limitations and safety considerations

- KrishiSaathi does not diagnose with certainty; asks follow-ups and escalates to human experts.  
- No invented pesticide doses, scheme eligibility, or weather without API data.  
- Farmer speech is transcribed; PII stored in CRM for demo — production needs consent and retention policy.  
- Agent identifies as AI when asked.

---

## 12. Target user

Indian farmers, field workers, cooperatives, and rural agri support teams who need **voice-first** help in Hindi/Hinglish for crop problems, weather context, and expert escalation.

---

## 13. Problem being solved

Smallholders cannot navigate app forms or English call centres. They need a patient Hindi voice assistant that **listens**, **remembers**, **pulls local weather**, **captures structured CRM data from speech**, and **connects to an expert** without repeating their story.

---

## 14. External action performed by the agent

At least one live external action:

- **`get_weather`** — Open-Meteo live forecast stored on farmer profile (`weatherSummary`, `weatherAt`).  
- **`create_case` / `escalate_expert`** — agri case linked to farmer timeline.  
- **MCP tools on desk** — calendar/inbox/tab/memory updates visible on screen.

---

## 15. Future evolution

- Route CRM dialer through Agora SIP + same KrishiSaathi agent (single analytics pipeline).  
- WhatsApp/SMS follow-ups after expert cases.  
- Regional crop disease models + govt scheme APIs.  
- Embeddable widget for cooperatives; multi-tenant SaaS billing already scaffolded under `/app`.

---

## Title (form)

**KrishiSaathi (LIAA)** — Hindi voice agricultural assistant on Agora Conversational AI

## One-liner

Voice-first KrishiSaathi for Indian farmers: Agora handles live conversation; tools capture CRM data, live weather, and expert cases.

## Tags

KrishiSaathi, LIAA, Agora, Conversational AI, Agriculture, Hindi, Vobiz, CRM, Voice AI, India
