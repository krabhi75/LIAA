# Project submission paste copy — Liaa

Use this on project details / gallery forms. Adjust track/problem fields if the organizer form differs from the original sales PS.

## Title

Liaa — Speaks, listens, acts

## Description

Liaa is a live **Agora Conversational AI** personal assistant: calendar, mail, tabs, and memory — with a judge-friendly instrument desk (live transcript · orb · linked action progress).

The browser joins an Agora RTC channel. The Conversational AI Engine owns turn-taking, barge-in, STT, LLM, and TTS. Our Next.js server only mints tokens, starts and stops the agent, and serves MCP tools. Audio never leaves Agora for a custom LLM voice loop.

Live path we show: **Start conversation** → English greeting → ask about the day → book a meeting → inbox or remember → **linked action cards** update in realtime → **Stop conversation**.

UI layout adapted from https://github.com/vaivikop/nova-agora — voice remains Agora Conversational AI. Agent name: **Liaa**.

GitHub: https://github.com/krabhi75/aetherclose  

Architecture details: `docs/ARCHITECTURE.md`

## One-liner

A live Agora voice assistant that does things on screen — calendar, mail, tabs, memory — with realtime transcript and multi-tool progress.

## What we demonstrate live

1. Start conversation; allow mic; Liaa greets in English.  
2. Ask what the day looks like → `get_calendar` card.  
3. Book a meeting → `create_event` (DEMO DATA) and show linked progress if chained.  
4. Inbox or remember → mail / memory tools.  
5. Interrupt mid-reply to show barge-in; then Stop conversation.

## Tech stack

- Agora Conversational AI Engine (`agora-agents`) — mandatory voice layer  
- Agora RTC (`agora-rtc-sdk-ng`) + RTM (`agora-rtm-sdk`)  
- Managed models: Deepgram nova-3, OpenAI gpt-4o-mini, MiniMax speech-2.6-turbo  
- Next.js App Router, TypeScript, Prisma/SQLite  
- MCP tool server for calendar, mail, tabs, memory  

## Links

- Repo: https://github.com/krabhi75/aetherclose  
- Architecture: `docs/ARCHITECTURE.md`  
- Demo runbook: `docs/DEMO.md`  
- Live demo: http://localhost:3000/demo (+ Cloudflare tunnel for MCP)  

## Tags

Liaa, Agora, Conversational AI, Voice AI, Personal Assistant, Real-time, RTC, MCP, Calendar, EchoSphere
