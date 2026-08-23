# 3–5 minute demo video shot list

Prefer **production**: https://liaa-ebon.vercel.app/demo (system audio + mic).  
Local only if tunnel is up and the bar shows **tools live**.

| Time | What to show | What to say |
|---|---|---|
| 0:00–0:20 | Title: **KrishiSaathi / Liaa** · Agora Conversational AI | Hindi voice agri assistant + field CRM — not a sales bot |
| 0:20–0:45 | Architecture (see `docs/ARCHITECTURE.md`) | Agora owns RTC, barge-in, STT/LLM/TTS; our server starts the agent and runs MCP |
| 0:45–1:05 | **Start conversation**, allow mic, Liaa greets in Hindi | English chrome; Hindi voice |
| 1:05–1:40 | Name → city → crop problem in Hinglish | Turn-taking + transcript |
| 1:40–2:20 | Weather / CRM tool if MCP fires | Action card on the right |
| 2:20–2:50 | Interrupt mid-sentence | Barge-in — Liaa stops and listens |
| 2:50–3:20 | Optional: `/crm` Call (PSTN) | Separate Vobiz XML path — farmer timeline |
| 3:20–3:50 | Recap | Agora-central voice · CRM for field ops · honest DEMO DATA |
| 3:50–4:10 | Known limit | CRM Gather ASR may need `#`; `/demo` is the listening proof |

Backup reel: https://liaa-ebon.vercel.app/reel — see [DEMO_90S.md](./DEMO_90S.md).  
Judge script: [EVAL_RUNBOOK.md](./EVAL_RUNBOOK.md).
