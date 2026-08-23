# 2-minute demo video — production guide

## Fastest path (audio + visuals included)

1. Deploy or run locally with pitch audio generated (`npm run pitch:audio`).
2. Open **https://liaa-ebon.vercel.app/pitch** fullscreen (`F11`).
3. Click **Play pitch** (or press **Space**).
4. Screen-record **2 minutes** — Windows `Win+G`, OBS, or Loom.
5. Export MP4 1080p → upload to hackathon portal.

Controls: **Space** pause · **R** restart · **N** toggle captions

---

## Optional: mix live app B-roll

Record `/pitch` for voiceover + slides, then cut in 5–10s clips from:

| Clip | URL | When in pitch |
|------|-----|----------------|
| Dashboard | `/` | Beat “live metrics” |
| Voice desk | `/demo` | Beat “live desk” |
| Farmers | `/crm` | Beat “field CRM” |
| Farmer record | `/crm/farmers/[id]` | Beat “disposition” |
| Live calls | `/crm/calls` | Beat “monitor” |

---

## Voice

Generated with **ElevenLabs Tara** (`tA6LGZpsqStKtSaGiXND`) — professional Indian female explainer.

Regenerate: `npm run pitch:audio` (needs `ELEVENLABS_API_KEY` in `.env.local`).

---

## Click-by-click live demo (if recording app instead of `/pitch`)

| Time | Action |
|------|--------|
| 0:00 | Open `/` — point at Live now + funnel |
| 0:15 | `/demo` → Start conversation → allow mic |
| 0:30 | Speak Hindi: name, city, crop problem |
| 0:45 | Show tool card / transcript on desk |
| 0:55 | `/crm` — farmers table |
| 1:05 | Open farmer profile — timeline + case panel |
| 1:15 | Select disposition → Update case |
| 1:25 | `/crm/calls` — live monitor |
| 1:35 | Back to `/demo` — interrupt mid-sentence (barge-in) |
| 1:50 | Title: liaa-ebon.vercel.app · GitHub krabhi75/LIAA |

---

## Upload checklist

- Length ≤ 2:00 (or ≤ 5:00 if portal allows longer)
- Shows **Agora** stack (Deepgram · OpenAI · ElevenLabs)
- Shows **CRM** (not voice-only)
- Mentions **Hindi / farmers / Bharat**
