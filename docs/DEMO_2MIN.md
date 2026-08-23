# 2-minute pitch — production guide

## Fastest path

1. Generate voiceover once: `npm run pitch:audio` (needs `ELEVENLABS_API_KEY`).
2. Open **https://liaa-ebon.vercel.app/pitch** fullscreen (`F11`).
3. Click **Play pitch** (or **Space**).
4. Screen-record ~2 minutes — Windows `Win+G`, OBS, or Loom.
5. Export MP4 1080p → upload.

Controls: **Space** pause · **R** restart · **N** captions

---

## Optional B-roll (cut into `/pitch`)

| Clip | URL | When |
|------|-----|------|
| Dashboard | `/` | Field intelligence · Call mix · issues · crops |
| Voice desk | `/demo` | Live conversation |
| Farmers | `/crm` | New Farmer · registry |
| Farmer record | `/crm/farmers/[id]` | Disposition |
| Live calls | `/crm/calls` | Monitor |

---

## Voice (credit-efficient)

- **Voice:** Nikhil — young conversational Indian male (`gX28yZeQHE9L4d5iYqPy`)
- **Model:** `eleven_flash_v2_5` (~0.5 credit/character)
- **Script:** ~1,100 characters → roughly **550–1,100 credits** per full generate
- Regenerate only when narration changes: `npm run pitch:audio`

Do not commit API keys. Set `ELEVENLABS_API_KEY` in `.env.local` only.

---

## Narration (synced to current UI — no sample phones)

See `scripts/generate-pitch-audio.mjs` `SEGMENTS` and `app/pitch/page.tsx` `BEATS`.

---

## Upload checklist

- Length ≤ 2:00
- Shows Agora stack + CRM (not voice-only)
- Mentions Hindi / farmers / Bharat
