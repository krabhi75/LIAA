# Commudle / EchoSphere paste copy

Use this on Project Details and later on the 4 Sep submission.

## Project name

AetherClose

## Track

Adaptive AI Sales and Negotiation Agent

## Problem statement

PS21

## One-liner

A live Agora voice sales agent that qualifies a buyer, adapts when they interrupt or change requirements, and closes the call with a CRM lead plus a booked demo or a human handoff.

## Project description

AetherClose is a real-time voice AI sales agent built on Agora Conversational AI. It runs a live qualification and negotiation call, not a scripted pitch. The buyer can interrupt, change seat count, compare competitors, or return to pricing, and the agent adapts using session memory.

During the call the agent retrieves product, pricing, and availability, handles pricing/trust/product objections, writes a CRM lead, and either books a demo or escalates to a human with full conversation context. Agora is the real-time voice layer for turn-taking and interruption handling. LLMs and tools sit behind it for reasoning and actions.

This is not a chatbot with speech-to-text and text-to-speech wrapped around a form. The customer and the agent share an Agora RTC channel. The business server only issues tokens, starts and stops the agent, and serves MCP tools.

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
- Repo: (add GitHub URL after you push)
- Live demo: http://localhost:3000 during evaluation; Cloudflare tunnel for MCP
- Demo video: (add 3–5 min recording URL)

## Team

2 members (EchoSphere allows 2–4).
