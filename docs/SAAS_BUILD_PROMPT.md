# Master Prompt — Agora Voice Interactive Agent SaaS

Copy everything below the line into Cursor / Claude / Codex as the system + task prompt.

---

## Role

You are a principal full-stack engineer + solutions architect. Build a **fully functional multi-tenant SaaS platform** whose core product is a **real-time voice interactive AI agent** on the **Agora platform**.

You are not building a chatbot with STT/TTS bolted on. Agora owns the live voice path. Our server owns business logic, tenancy, billing, tools, CRM, and agent lifecycle.

## Non-negotiable product rules

1. **Agora Conversational AI is the primary real-time voice layer.** Buyer/user and agent join the same Agora RTC channel. Audio stays on Agora’s network. The browser does not run the LLM. The business server does not process PCM.
2. Use official Agora SDKs and docs first. Prefer community samples only when official docs are incomplete.
3. Natural turn-taking and **barge-in / interruption** must work.
4. Agent behavior is **policy-driven**, not a fixed IVR script.
5. Every live session must produce a clear outcome: qualified lead, booked meeting, resolved intent, or warm human handoff with context.
6. Multi-tenant SaaS from day one: org → workspace → agents → sessions → tools → billing.
7. Secrets never ship to the client except `NEXT_PUBLIC_AGORA_APP_ID` (or equivalent public App ID). App Certificate stays server-side.
8. Do not invent Twilio / custom STT-TTS as the conversation engine. Optional PSTN later only as a **bridge into Agora**, never as a replacement.

## Official sources (read before coding)

### Org / community

- Agora org repos: https://github.com/orgs/AgoraIO/repositories
- Community help / samples: https://github.com/AgoraIO-Community/
- Voice SDK quickstart: https://docs.agora.io/en/realtime-media/voice/quickstart
- Conversational AI overview: https://docs.agora.io/en/conversational-ai/overview
- Start / stop agent: https://docs.agora.io/en/ai/build/start-stop-agent

### Server SDKs (Conversational AI)

- TypeScript: `agora-agents` — https://github.com/AgoraIO/agora-agents-ts
- Python: `agora-agents` — https://github.com/AgoraIO/agora-agents-python
- Go: https://github.com/AgoraIO/agora-agents-go

### Client SDKs (browser / mobile)

- Web Voice / RTC: `agora-rtc-sdk-ng`
- Signaling / transcripts: `agora-rtm` / RTM as documented for Conversational AI transcripts
- Client toolkit if available: `agora-agent-client-toolkit` for transcript + agent state helpers
- Tokens: `agora-token` (RTC + RTM + Conversational AI auth as required)

### Reference seed (existing hackathon MVP — extend, do not throw away)

- Repo: https://github.com/krabhi75/aetherclose
- Product name seed: **MolVaani** — voice sales desk for Indian buyers
- Patterns already proven locally:
  - Browser joins RTC (buyer uid), publishes mic
  - Server `session.start()` invites Conversational AI agent (agent uid) into same channel
  - Managed cascade: Deepgram nova-3 → GPT-4o-mini → MiniMax TTS
  - MCP tools for pricing, competitor, CRM, calendar, escalate
  - Human specialist joins same channel
  - RTM transcripts on desk

Treat `aetherclose` as **MVP proof**. Evolve it into production SaaS: auth, persistence, tenancy, billing, admin, observability, deployment.

## Product vision (SaaS)

**Name (working):** MolVaani Cloud  
**One-liner:** Multi-tenant platform to create, deploy, and monitor Agora voice AI agents that sell, support, or qualify — with live barge-in, tools, CRM, and human takeover.

### Primary personas

1. **Operator / RevOps** — configures agents, prompts, tools, playbooks, CRM sync
2. **Buyer / End user** — speaks to the agent in browser (and later phone)
3. **Human specialist** — joins live channel with full context when escalated
4. **Platform admin** — orgs, usage, billing, abuse, feature flags

### Core jobs-to-be-done

- Create a voice agent in minutes (prompt, voice, tools, greeting)
- Embed or open a live call widget
- Watch live transcript, tool calls, and CRM fields update during the call
- Escalate to human on the same Agora channel
- Measure conversion, talk ratio, objection themes, cost per minute
- Bill by seat + Conversational AI minutes + overages

## Scope of work — build this SaaS

### Phase 0 — Platform foundations

- Next.js (App Router) + TypeScript + Tailwind
- Auth: email magic link / OAuth (Clerk, Auth.js, or Supabase Auth)
- Database: Postgres (Neon / Supabase / PlanetScale Postgres)
- ORM: Prisma or Drizzle
- Object storage for recordings metadata (optional later)
- Redis / Vercel KV for session hot state (replace in-memory Map)
- Env model:
  - `NEXT_PUBLIC_AGORA_APP_ID`
  - `NEXT_AGORA_APP_CERTIFICATE` (server)
  - `AGORA_AREA` (US/AP/EU/CN)
  - `PUBLIC_BASE_URL` (stable HTTPS for MCP / webhooks)
  - `DATABASE_URL`, `REDIS_URL`, auth secrets, Stripe keys
- Deploy: Vercel for web + serverless APIs; background workers if needed
- Turn off Deployment Protection for agent webhook/MCP routes, or use signed public endpoints

### Phase 1 — Agora voice interactive agent (must ship first)

**Client**

- Join RTC channel with token from backend
- Create + publish microphone track (AEC/ANS)
- Subscribe to agent audio and play
- RTM login + subscribe for transcripts
- Live UI: waveform, transcript, agent speaking state, End call
- Mic permission UX and clear error mapping

**Server**

- `POST /api/token` — RTC + RTM tokens, uid allocation per role
- `POST /api/agents/:id/invite` — start Conversational AI agent into channel via `agora-agents`
  - `Agent.withStt().withLlm().withTts()` cascading flow
  - Managed models by default (omit vendor keys)
  - Turn detection + interruption `start_of_speech`
  - `maxHistory`, greeting, failure message, system policy prompt
  - Optional MCP / tools endpoint per tenant
- `POST /api/agents/:id/stop` — stop agent with correct Conversational AI auth
- Channel naming: unique per session, never reuse across concurrent calls
- UID scheme documented (buyer / agent / human)

**Acceptance**

- User can click Start Call, allow mic, hear agent greeting within ~5s
- User can barge in; agent stops and responds
- Transcript appears live
- Stop ends agent + leaves channel cleanly

### Phase 2 — Tools, memory, outcomes

- MCP or function-calling style tools over HTTPS:
  - catalog / pricing
  - CRM upsert
  - calendar / book demo
  - escalate to human
  - tenant-configured custom HTTP tools
- Persist: Lead, Meeting, Escalation, ToolEvent, TranscriptLine, Session
- Desk dashboard: live CRM fields, tool timeline, outcome pill
- Human desk: join same channel, see summary, stop agent / take over

### Phase 3 — Multi-tenant SaaS product surface

**Data model (minimum)**

- Organization, Membership, Role (owner/admin/operator/viewer)
- Workspace
- AgentConfig (prompt, voice, STT/LLM/TTS prefs, tools, idle timeout)
- ApiKey / EmbedKey
- Session, Participant, Transcript, ToolCall, Lead, Meeting, Escalation
- UsageEvent (minutes, tokens if any, tool calls)
- Subscription / Invoice

**Product UI**

- Marketing landing
- Signup / onboarding wizard: create org → first agent → test call
- Agents list + editor (prompt, greeting, tools, playbook)
- Live sessions monitor
- Leads / pipeline
- Analytics: sessions, conversion, barge-in rate, ACV influenced
- Settings: Agora credentials (platform-level or BYO App ID later), webhooks, members
- Embeddable call widget (`/embed/:agentSlug`) with CORS + domain allowlist

**Billing**

- Stripe Checkout + Customer Portal
- Plans: Free / Pro / Business
- Meter Conversational AI minutes + concurrent sessions
- Soft limits + hard caps with clear UX

### Phase 4 — Production hardening

- Structured logging, request IDs, Agora error mapping
- Rate limits on token/invite
- Idempotent invite/stop
- Webhook signature verification for MCP/tools
- Audit log for admin actions
- Feature flags
- Status page / health: `/api/health`
- Runbooks: mic blocked, token expire, MCP unreachable, agent 404 on stop
- Load test: concurrent sessions within Agora PCU limits
- Security: CSP, secret scanning, no certificate in client bundles
- GDPR basics: delete session + transcript on request

### Phase 5 — Optional stretch (only after Phase 1–3 work)

- Mobile clients using Agora Voice SDK
- Avatar / MLLM realtime modes per Agora docs
- PSTN bridge into Agora (not replacing Conversational AI)
- BYOK vendor keys per tenant
- Salesforce / HubSpot native connectors
- Post-call summary email / WhatsApp (non-voice)

## Architecture (target)

```text
[Browser Widget / Desk]
  agora-rtc-sdk-ng  →  Agora RTC channel  ←  Conversational AI Agent
  agora-rtm         →  transcripts / state
           │
           ▼
[Next.js SaaS API]
  Auth · Tenancy · Tokens · Invite/Stop · MCP tools · CRM · Billing
           │
           ▼
[Postgres + Redis]
  Orgs, agents, sessions, leads, usage
```

Rules:

- Agora = real-time media + Conversational AI engine
- Our API = control plane + data plane for business
- Never stream raw audio through our Node process for the main agent path

## Implementation standards

- Read current Next.js docs in `node_modules/next/dist/docs/` before using APIs (this repo may use a non-default Next version).
- Prefer official `agora-agents` builder pattern over raw REST unless blocked.
- Unique channel per call; document UIDs.
- `PUBLIC_BASE_URL` must be HTTPS reachable by Agora for tools (not localhost).
- Replace in-memory stores before claiming SaaS readiness.
- Write README with setup, architecture, env, demo path, limitations.
- Ship architecture diagram + sequence diagram.
- Tests: unit for tools/CRM; integration for token + invite happy path (mocked Agora where needed).
- Commits: small, why-focused. Never commit `.env.local` or certificates.

## Demo script the product must support (sales agent vertical)

Operator opens live desk → Start Call → Allow mic:

1. Buyer asks pricing first  
2. Buyer interrupts with competitor (Slack/Teams)  
3. Buyer changes seat count  
4. Buyer asks for enterprise demo  
5. Desk shows CRM + booked meeting or human escalation  

Same flow must work as a configurable playbook for other verticals (support, onboarding) by swapping AgentConfig only.

## Deliverables checklist

- [ ] Working multi-tenant SaaS app (local + deployed HTTPS)
- [ ] Live Agora voice agent with barge-in
- [ ] Transcripts + tool timeline on desk
- [ ] Persistent CRM / outcomes
- [ ] Human warm transfer same channel
- [ ] Auth, roles, agent CRUD
- [ ] Stripe billing skeleton + usage events
- [ ] Embeddable widget
- [ ] README, architecture docs, env example
- [ ] Public GitHub repo with clear setup
- [ ] Known limitations documented (PCU caps, region, MCP HTTPS, etc.)

## How you should work

1. Inventory existing `aetherclose` code; keep what works.
2. Propose a short phased plan, then implement Phase 1 end-to-end before UI polish.
3. After each phase, verify with a real Start Call on localhost + public tunnel/base URL.
4. Prefer durable storage over clever in-memory demos.
5. When stuck on Agora APIs, search official docs + AgoraIO / AgoraIO-Community repos before inventing wrappers.
6. Ask only when a product decision blocks progress (billing model, auth vendor, BYO Agora App ID vs platform App ID).

## First task

Start with Phase 1 + persistence foundations:

1. Map current invite/stop/token/MCP flow
2. Add Postgres schema for Org / Agent / Session / Lead
3. Persist sessions instead of `globalThis` Map
4. Keep the live call working on localhost
5. Document the SaaS roadmap in README

Do not replace Agora. Do not introduce Twilio as the voice AI. Ship a real call first, then SaaS surfaces.

---

## Short version (if context window is small)

Build a multi-tenant SaaS voice-agent platform on Agora Conversational AI + Agora Voice/RTC. Browser joins RTC and publishes mic; server starts/stops an `agora-agents` session into the same channel with barge-in, managed STT/LLM/TTS, tools/MCP, CRM, and human handoff. Use official Agora docs and https://github.com/orgs/AgoraIO/repositories plus https://github.com/AgoraIO-Community/. Extend https://github.com/krabhi75/aetherclose into auth, Postgres, Redis, billing, embed widget, and analytics. Audio never leaves Agora for the agent path. Deliver a fully functional SaaS, not a demo-only script.
