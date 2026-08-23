# Two outbound phone paths (important for demos)

KrishiSaathi / LIAA has **two separate outbound systems**. They do **not** share the same dashboard.

## Path A — Agora Outbound Campaign (Agora Console)

```text
Agora Campaign CSV → Agora Conversational AI agent → SIP → Vobiz trunk → farmer phone
```

| What updates | Agora Console → **Campaigns** → your campaign stats |
| Voice engine | **Agora Conversational AI** (Deepgram + GPT-4o-mini + MiniMax) |
| Language | Hindi / Hinglish via Agora agent prompt |
| When to use | Hackathon judges, barge-in demo, “Conversational AI outbound” proof |

**Why your campaign shows only 1 call:** Agora only counts calls **started from that campaign** (CSV upload / campaign runner). CRM dial buttons do **not** increment this counter.

**“Answered” but Outcome “Failed”:** Agora marks success when the **AI agent completes the campaign goal** (conversation flow, duration, silence rules). A 16s answered leg that drops or never reaches the agent still shows **Failed**.

**Fix Agora campaign failures:**

1. Agora → Phone number → **Inbound agent** must **not** be Unassigned (same number is used for SIP legs).
2. Vobiz number must **not** stay on XML Voice App **test** (SIP and XML fight).
3. Run campaign from Agora with your mobile in the CSV — not from `/crm` dial.

---

## Path B — CRM dialer (Liaa dashboard + Vobiz XML)

```text
/crm “Call” → POST /api/crm/call → Vobiz REST Call API → /api/vobiz/answer (XML) → KrishiSaathi bot
```

| What updates | **https://liaa-ebon.vercel.app** dashboard + `/crm/calls` + farmer profile timeline |
| Voice engine | **Vobiz XML** — Polly.Aditi TTS + hi-IN Gather STT (not Agora CAI on this leg) |
| Language | Devanagari Hindi greeting; KrishiSaathi name → location → weather flow |
| When to use | Live farmer CRM, weather capture, expert case creation, outbound from farmer list |

**This path will never appear in Agora Campaign analytics.**

---

## Which dashboard for your demo?

| You dialed from… | Look at… |
|------------------|----------|
| Agora → Campaigns → Outbound Liaa | Agora campaign screen |
| LIAA `/crm` or farmer profile **Call** | LIAA home dashboard + `/crm/calls` |
| Browser `/demo` Start conversation | Agora RTC session (not phone PSTN) |

---

## Recommended hackathon story

1. **Agora Conversational AI (mandatory):** `/demo` desk **or** Agora Campaign outbound with SIP trunk configured per [VOBIZ_AGORA.md](./VOBIZ_AGORA.md).
2. **External action:** CRM dial shows weather API + farmer record update + optional expert case (Path B).
3. Say clearly in the video: *“Campaign stats are Agora-native outbound; our CRM dialer is a separate Vobiz XML leg for field ops.”*
