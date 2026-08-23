# Evaluation runbook — KrishiSaathi / LIAA

**Live:** https://liaa-ebon.vercel.app  
**Repo:** https://github.com/krabhi75/LIAA  
**Architecture review canvas:** Cursor canvases → `liaa-architecture-eval`

Use this script for judges. Do **not** improvise on CRM phone listening.

---

## Hero path (mandatory) — `/demo`

1. Open https://liaa-ebon.vercel.app/demo  
2. Headphones on (stops echo into mic)  
3. Click **Start conversation** → allow mic  
4. Hear Hindi greeting → say name → city → crop problem  
5. Show live transcript (YOU / LIAA) and any action cards  

**Engine:** Agora RTC + Conversational AI (Deepgram · GPT-4o-mini · ElevenLabs)

---

## One sentence for judges

> Intelligence runs on **Agora Conversational AI**; India PSTN is **Vobiz**; farmer CRM and weather live on our **Next.js + Neon** plane.

---

## Optional — CRM dial (`/crm`)

Only if time remains. This is **field IVR**, not the Deepgram path.

1. https://liaa-ebon.vercel.app/crm → **Call** a farmer  
2. After greeting **fully stops**, say name clearly, then press **`#`**  
3. If voice STT is silent, press **`1`** then **`#`** (DTMF fallback)  
4. Show farmer timeline / weather fields — do not linger if speech stays empty  

**Known limit:** Vobiz Gather may return empty `Speech` on this account. Empty speech is a **vendor ASR** issue, not cold start. Localhost will not fix PSTN webhooks.

---

## Do not use for the hero demo

| Wrong | Why |
|-------|-----|
| Localhost without tunnel | Vobiz cannot reach Answer/Gather |
| Agora Campaign stats after CRM dial | Different outbound path |
| Dead `trycloudflare.com` webhook | Use `https://liaa-ebon.vercel.app/api/webhooks/agora` |

---

## Console checklist (before eval)

| Item | Value |
|------|--------|
| Agora webhook (RTC) | `https://liaa-ebon.vercel.app/api/webhooks/agora` |
| Agent MCP (Actions) | `https://liaa-ebon.vercel.app/api/mcp` + `X-Aether-Key` |
| VAD end silence | 900–1200 ms |
| CRM Answer URL | `https://liaa-ebon.vercel.app/api/vobiz/answer` |
| Warm (optional) | Open `/crm` once before dialing |

---

## Backup if live desk fails

1. Screen-record from https://liaa-ebon.vercel.app/reel (90s)  
2. Or follow [DEMO.md](./DEMO.md) / [DEMO_90S.md](./DEMO_90S.md)  
3. Still attempt one short live `/demo` turn if mic works  

---

## Outbound path map

See [OUTBOUND_PATHS.md](./OUTBOUND_PATHS.md).
