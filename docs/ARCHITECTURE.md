# Architecture

EchoSphere requires an architecture diagram. Use these together:

- System: [AetherClose architecture](https://whimsical.com/aetherclose-architecture-echosphere-ps21-Sp4yxNN5P85iFaowhtygnj)
- Call flow: [PS21 live call sequence](https://whimsical.com/aetherclose-ps21-live-call-flow-GJmAnfXzaDjsPyvPWAfoxQ)
- Requirement map: [EchoSphere coverage](https://whimsical.com/aetherclose-echosphere-requirement-map-LbwERus1kZJQMHqmwMf2Mu)

## Why Agora is central

The browser never runs an LLM. The server never sees PCM. The buyer and Maya meet in an Agora RTC channel. The Conversational AI Engine owns turn-taking, barge-in, STT, LLM, and TTS. Our server only mints tokens, starts/stops the agent, and serves MCP tools.

```mermaid
flowchart LR
  Buyer -->|mic| RTC[Agora RTC]
  RTC -->|voice| Buyer
  Desk[AetherClose desk] -->|token invite stop| API[Next.js API]
  Desk -->|uid 1002| RTC
  Desk -->|transcripts| RTM[Agora RTM]
  Human[Human AE] -->|uid 2002| RTC
  API -->|session.start| CAI[Conversational AI Engine]
  CAI -->|uid 123456| RTC
  CAI --> STT[Deepgram nova-3]
  STT --> LLM[GPT-4o-mini]
  LLM --> MCP[/api/mcp]
  MCP --> CRM[CRM + calendar]
  LLM --> TTS[MiniMax]
  TTS --> CAI
  CAI --> RTM
```

## UIDs

| Role | UID | Notes |
|---|---|---|
| Buyer | 1002 | Matches Agora sample remote uid |
| Maya (agent) | 123456 | Started by `session.start()` |
| Human specialist | 2002 | Same channel, no second agent |

## Tools

| Tool | Meaningful action |
|---|---|
| `get_pricing` | Retrieve list price for a seat count |
| `compare_competitor` | Slack / Teams / Asana / Notion |
| `get_availability` | IST demo slots |
| `upsert_crm_lead` | Write qualification to CRM |
| `book_demo` | Calendar meeting + status `demo_booked` |
| `escalate_to_human` | Summary + waiting flag for `/human` |
