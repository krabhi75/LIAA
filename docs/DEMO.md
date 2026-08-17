# 3–5 minute demo video shot list

EchoSphere requires a 3–5 minute demo video **and** a live demo. Do not submit a prerecord-only walkthrough as the judging demo.

Record the screen at http://localhost:3000/demo with system audio + mic.

| Time | What to show | What to say |
|---|---|---|
| 0:00–0:20 | Title card: MolVaani (मोलवाणी), PS21, Agora Conversational AI | One sentence: the voice that closes the sauda — live agent, not a chatbot |
| 0:20–0:40 | Architecture diagram (Whimsical) | Agora owns the channel, barge-in, STT/LLM/TTS. Our server starts the agent and runs tools |
| 0:40–1:00 | Click Start live call, allow mic, Maya greets | Point at “interrupt anytime” |
| 1:00–1:30 | Ask pricing, then interrupt with Slack/Teams | Show barge-in; Maya stops and compares |
| 1:30–2:10 | Change seat count | Maya re-prices; CRM seats field updates |
| 2:10–2:50 | Ask for an enterprise demonstration | Tool call `book_demo` or `upsert_crm_lead`; outcome pill changes |
| 2:50–3:20 | Open human specialist | Context summary visible; join same channel; Stop Maya |
| 3:20–3:50 | Recap | Interruptions, memory, tools, CRM, escalation, Agora-central |
| 3:50–4:10 | Known limitation | In-memory CRM; MCP needs public HTTPS URL |

If a live call fails on recording day, keep this video as backup **and** still do a live attempt in evaluation.
