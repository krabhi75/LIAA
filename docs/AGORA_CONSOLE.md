# Agora Console — KrishiSaathi agent setup

Your Agora agent (**Sales / Lead qualification Agent** in project **LiaaTesting**) drives **Campaign outbound** and **SIP inbound**.  
CRM dial from `/crm` uses a separate Vobiz XML path — see [OUTBOUND_PATHS.md](./OUTBOUND_PATHS.md).

After every change below: click **Re-Publish Agent**.

---

## 1. Prompt tab

### Greeting (replace current)

```
Namaste, main KrishiSaathi hoon. Main aapki kheti se judi problems mein madad kar sakta hoon. Sabse pehle aapka naam kya hai?
```

Do **not** ask about crop problem in the greeting. Name first → then city/district.

### Failure message (replace current)

```
Maaf kijiye, abhi main aapki baat theek se process nahi kar paaya. Ek baar phir boliye, ya thodi der baad try kijiye.
```

### System Prompt

Paste the full text from `lib/prompt.ts` → export `LIAA_INSTRUCTIONS`  
(or copy from the live file on GitHub: [lib/prompt.ts](https://github.com/krabhi75/LIAA/blob/main/lib/prompt.ts)).

Key behaviours encoded there:

- One question at a time; Hindi / Hinglish / English matching  
- Opening: name → location → help  
- Weather only via tool; never invent  
- CRM capture; expert escalation without inventing case IDs  

---

## 2. Models tab (keep)

| Layer | Setting |
|-------|---------|
| Architecture | **ASR-LLM-TTS** |
| ASR | Deepgram · **nova-3** · language **hi** (Hindi) |
| LLM | OpenAI · **gpt-4o-mini** |
| TTS | ElevenLabs · **eleven_multilingual_v2** · BYOK |

### Voice ID warning

`pNInz6obpgDQGcFmaJgB` is **Adam** (US English). Multilingual can speak Hindi words, but accent stays American.

For Indian Hindi sound: in ElevenLabs pick a **multilingual / Hindi** voice, paste that Voice ID here, then Re-Publish.

Also set the same ID on Vercel: `ELEVENLABS_VOICE_ID=...`

---

## 3. Advanced tab (fix “can’t hear farmer”)

Your current **480 ms** end-silence cuts farmers off while they think.

Recommended Custom VAD:

| Setting | Suggested |
|---------|-----------|
| Threshold | **0.45** (was 0.6 — too high for soft field speech) |
| End silence | **900–1200 ms** (was 480) |
| Interrupt duration | **400 ms** |
| Speaking interrupt | **160–300 ms** |
| Prefix padding | **400 ms** (was 800 — less lag) |
| Max history | **32** (ok) |

Optional: enable **Selective Attention Locking** if background farm noise is high.

---

## 4. Actions tab (required for weather + CRM on Agora path)

Today: **No MCP / No Custom Tools** → agent cannot `get_weather` or `capture_field` on Campaign/SIP calls.

Add MCP server:

| Field | Value |
|-------|--------|
| Name | `krishisaathi` |
| Transport | Streamable HTTP / MCP HTTP |
| URL | `https://liaa-ebon.vercel.app/api/mcp` |
| Header | `X-Aether-Key: <same as AETHER_MCP_KEY on Vercel>` |
| Header | `X-Aether-Channel: agora-campaign` (or dynamic if UI supports) |

Allowed tools: `capture_field`, `get_weather`, `get_advisory`, `create_case`, `escalate_expert`, plus desk tools if desired.

Without MCP, the agent can still converse but **must not claim** it checked weather or updated CRM.

---

## 5. Phone numbers / Campaigns

- Inbound agent on +917971443138 must be this KrishiSaathi agent (not Unassigned).  
- Outbound Campaigns use this agent + SIP trunk.  
- CRM **Call** button does **not** use this agent — it uses Vobiz XML KrishiSaathi (Polly/WOMAN).

---

## 6. Live Preview test script

1. Start Call  
2. Hear name ask → say “Ramesh”  
3. Hear city ask → say “Pakur Jharkhand”  
4. Hear help ask → say “Gehun ke leaves yellow ho rahe hain”  
5. Bot asks **one** follow-up (kab se / kitna area) — not a diagnosis dump  

---

## Code sync

| Surface | Prompt source |
|---------|----------------|
| `/demo` invite-agent | `LIAA_INSTRUCTIONS` + `GREETING` + `FAILURE_MESSAGE` |
| Agora Console | Paste same strings (this doc) |
| CRM Vobiz XML | `lib/vobiz-xml.ts` Roman Hindi prompts |
