# AetherClose

EchoSphere (Knotic × Agora) · Track **Adaptive AI Sales and Negotiation Agent** · **PS21**

Live voice sales agent on **Agora Conversational AI**. Not a chatbot with STT/TTS bolted on.

**GitHub:** https://github.com/krabhi75/aetherclose

## Submission checklist

EchoSphere asks for: working prototype, source repo, README, architecture diagram, 3–5 min demo video, live demo, tech list, known limitations.

| Artifact | Location |
|---|---|
| Working prototype | `npm run dev` → http://localhost:3000 |
| Architecture diagram | [Whimsical system](https://whimsical.com/aetherclose-architecture-echosphere-ps21-Sp4yxNN5P85iFaowhtygnj) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Call sequence | [Whimsical sequence](https://whimsical.com/aetherclose-ps21-live-call-flow-GJmAnfXzaDjsPyvPWAfoxQ) |
| Requirement map | [Whimsical mind map](https://whimsical.com/aetherclose-echosphere-requirement-map-LbwERus1kZJQMHqmwMf2Mu) |
| Commudle paste copy | [docs/SUBMISSION.md](docs/SUBMISSION.md) |
| Demo video shot list | [docs/DEMO.md](docs/DEMO.md) |
| Tech list + limitations | This README |

## Terms mapping

| EchoSphere / PS21 requirement | How AetherClose satisfies it |
|---|---|
| Agora Conversational AI is mandatory and central | Customer joins an Agora RTC channel; the **business server** starts an Agora Conversational AI agent into the same channel via `agora-agents` `session.start()` / `agents.stop()` |
| Not a voice-enabled chatbot | Audio never leaves Agora’s SDRTN. Browser has no LLM. Server never touches PCM |
| Natural turn-taking and interruption | `turnDetection` + `interruption.enable` (`start_of_speech`). Customer can barge in |
| Contextual memory | `maxHistory: 50` plus CRM upserts for seats, competitor, objections |
| Not a fixed script | System prompt is a sales policy. Demo path is what **you** say, not what Maya recites |
| Qualification through spoken conversation | Maya asks for company, seats, timeline, decision process only as the talk unfolds |
| Pricing / trust / product objections | Distinct tactics in the prompt; competitor and price retrieved by tools |
| Retrieve product, pricing, availability | MCP tools `get_pricing`, `compare_competitor`, `get_availability` |
| CRM / calendar / lead system | In-process CRM + calendar; `upsert_crm_lead`, `book_demo` |
| Human escalation with context | `escalate_to_human` writes a summary; `/human` joins the **same RTC channel** |
| Clear outcome | Demo booked, qualified follow-up, or human handoff — shown live on the desk |
| Live demo (not a prerecord) | Browser mic → Agora RTC. Backup video allowed; judging demo must be live |

FAQ disqualification checks: Agora is central. Not STT/TTS around a chatbot. Demo is live. Product is collaboration software (no medical/legal/emergency advice).

## Architecture

```text
Browser (customer uid 1002)
  agora-rtc-sdk-ng  →  Agora RTC channel  ←  Conversational AI agent (uid 123456)
  agora-rtm-sdk     →  live transcripts
        │
        ▼
Next.js business server (certificate stays here)
  POST /api/token              RTC + RTM tokens
  POST /api/invite-agent       Agent.withStt().withLlm().withTts().start()
  POST /api/stop-conversation  agents.stop()
  POST /api/mcp                pricing, competitor, CRM, calendar, escalate
  GET  /api/session/:channel   live CRM snapshot for the desk
        │
        ▼
Human specialist (uid 2002) joins the same channel with conversation context
```

Managed models (no extra vendor keys): Deepgram nova-3, OpenAI gpt-4o-mini, MiniMax speech-2.6-turbo.

## Setup

1. Agora project with **RTC** and **Conversational AI** enabled.

2. `.env.local`:

```bash
NEXT_PUBLIC_AGORA_APP_ID=...
NEXT_AGORA_APP_CERTIFICATE=...
AGORA_AREA=US
PUBLIC_BASE_URL=https://your-cloudflare-or-ngrok-host
AETHER_MCP_KEY=a-long-random-string
```

`PUBLIC_BASE_URL` must be HTTPS reachable from Agora’s cloud. Localhost is not.

```bash
cloudflared tunnel --url http://localhost:3000
```

Without that URL the voice call still works; CRM writes from the agent will not.

3. Run:

```bash
npm install
npm run dev
```

Open http://localhost:3000, allow the microphone, start the call.

## Demo path (what the customer says)

Maya must not follow a script. You should:

1. Ask about pricing first.
2. Interrupt and compare with Slack or Teams.
3. Change the expected number of users.
4. Ask for an enterprise demonstration.

Expected outcome: Maya re-prices, compares, updates CRM, and books a demo or escalates.

## Technologies used

- Agora Conversational AI Engine (`agora-agents`)
- Agora RTC (`agora-rtc-sdk-ng`)
- Agora RTM (`agora-rtm-sdk`)
- Agora token builder (`agora-token`)
- Deepgram nova-3, OpenAI gpt-4o-mini, MiniMax speech-2.6-turbo (Agora-managed)
- Next.js 16, React 19, TypeScript, Tailwind CSS
- MCP (streamable HTTP) for tools
- Cloudflare Tunnel for a public HTTPS tool endpoint

## Known limitations

- Conversational AI PCU API cap is 20 concurrent sessions per App ID.
- MCP tools require a public base URL; quick tunnels expire if `cloudflared` stops.
- CRM is in-memory (survives Next.js HMR, not a process restart).
- Region defaults to `Area.US` for managed models.
- Human join does not auto-stop Maya; use **Stop Maya (handover)** on `/human`.
- First 300 Conversational AI minutes are free, then $0.10/min.
