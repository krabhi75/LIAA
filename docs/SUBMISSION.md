# Commudle / EchoSphere paste copy

Use this on **Project Details**. Track: Adaptive AI Sales and Negotiation Agent. Problem: **PS21**.

## Title

MolVaani — Voice that closes the sauda

## Description

MolVaani (मोलवाणी) is a live Agora Conversational AI sales agent built for how Indian buyers actually talk: interrupt, bargain, switch from pricing to competitor to seats, then ask for a demo.

Mol = the sauda — price, seats, objections. Vaani = spoken voice. Maya, the agent, qualifies on a real Agora RTC call, not a script and not a chatbot with speech bolted on. The buyer can barge in. MolVaani remembers what was said, retrieves pricing and catalog, compares Slack or Teams, writes a CRM lead, and either books an IST demo or warm-transfers a human specialist with full conversation context.

Agora is the real-time voice layer (turn-taking, interruption, STT/LLM/TTS). Our server only issues tokens, starts and stops the agent, and serves tools. Audio never leaves Agora.

Live path we show: pricing first → interrupt for competitor → change seat count → enterprise demo → CRM outcome or human handoff.

GitHub: https://github.com/krabhi75/aetherclose

## Image gallery

Upload these five files from `docs/gallery/` (order matters):

1. `01-title-molvaani.png` — title card
2. `02-live-desk.png` — live call + CRM
3. `03-human-handoff.png` — specialist warm transfer
4. `04-architecture.png` — Agora-central architecture
5. `05-call-flow.png` — PS21 mol-bhav call path

Also attach Whimsical links if the form allows extra URLs:

- Architecture: https://whimsical.com/aetherclose-architecture-echosphere-ps21-Sp4yxNN5P85iFaowhtygnj
- Call sequence: https://whimsical.com/aetherclose-ps21-live-call-flow-GJmAnfXzaDjsPyvPWAfoxQ

## Tags

MolVaani, मोलवाणी, Agora, Conversational AI, Voice AI, Sales Agent, Negotiation, Mol-bhav, Bharat, India, EchoSphere, PS21, Real-time, RTC, CRM, Human Handoff, Adaptive AI

## Track

Adaptive AI Sales and Negotiation Agent

## Problem statement

PS21

## One-liner

A live Agora voice sales agent that bargains like an Indian sauda — interrupt, change seats, compare competitors — then closes with a CRM lead, an IST demo, or a human handoff.

## What we demonstrate live

1. Buyer asks pricing first.
2. Buyer interrupts to compare with Slack or Teams.
3. Buyer changes expected number of users.
4. Buyer asks for an enterprise demonstration.
5. Desk shows CRM update + booked meeting or human escalation.

## Tech stack

- Agora Conversational AI Engine (`agora-agents`) — mandatory voice layer
- Agora RTC (`agora-rtc-sdk-ng`) + RTM (`agora-rtm-sdk`)
- Managed models: Deepgram nova-3, OpenAI gpt-4o-mini, MiniMax speech-2.6-turbo
- Next.js App Router, TypeScript
- MCP tool server for CRM, catalog, calendar, escalation

## Links to attach

- Architecture: https://whimsical.com/aetherclose-architecture-echosphere-ps21-Sp4yxNN5P85iFaowhtygnj
- Call sequence: https://whimsical.com/aetherclose-ps21-live-call-flow-GJmAnfXzaDjsPyvPWAfoxQ
- Repo: https://github.com/krabhi75/aetherclose
- Live demo: http://localhost:3000/demo during evaluation; SaaS console at /app; Cloudflare tunnel for MCP
- Demo video: (add 3–5 min recording URL)

## Team

2 members (EchoSphere allows 2–4).
