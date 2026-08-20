# 3–5 minute demo video shot list

Record the screen at **http://localhost:3000/demo** with system audio + mic. Ensure Cloudflare tunnel is up and the bar shows **tools live**.

| Time | What to show | What to say |
|---|---|---|
| 0:00–0:20 | Title: **Liaa** · Agora Conversational AI | Personal voice assistant that speaks, listens, and acts — not a sales bot |
| 0:20–0:45 | Architecture (see `docs/ARCHITECTURE.md` diagram) | Agora owns RTC, barge-in, STT/LLM/TTS; our server starts the agent and runs MCP tools |
| 0:45–1:05 | **Start conversation**, allow mic, Liaa greets | Point at Start/Stop and live transcript |
| 1:05–1:40 | “What does my day look like?” | Calendar tool + action card (DEMO DATA badge) |
| 1:40–2:20 | “Book a sync with Rahul tomorrow at four” | Linked actions / progress if tools chain |
| 2:20–2:50 | “What’s in my inbox?” or “Remember my name is …” | Mail or memory tool lands on the right |
| 2:50–3:20 | Interrupt mid-sentence | Barge-in — Liaa stops and listens |
| 3:20–3:50 | Recap | Agora-central voice · tools on screen · honest DEMO DATA |
| 3:50–4:10 | Known limit | Real Google Calendar/Gmail optional later; tunnel needed for tools |

If a live call fails on recording day, keep this video as backup **and** still attempt a live run in evaluation.
