"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Total length matches investor-recording.m4a (~114.43s) */
const AUDIO_SRC = "/pitch-audio/investor-recording.m4a";
const TOTAL_SEC = 114.43;

type InvestorBeat = {
  id: string;
  start: number;
  end: number;
  kicker: string;
  title: string;
  line: string;
  bullets?: string[];
  caption: string;
  broll?: string;
  visual: "hero" | "stack" | "desk" | "dashboard" | "crm" | "profile" | "live";
};

const BEATS: InvestorBeat[] = [
  {
    id: "01-intro",
    start: 0,
    end: 16,
    kicker: "KrishiSaathi · EchoSphere",
    title: "Voice-first agri support for Bharat",
    line: "Hindi / Hinglish · speaks, listens, captures, acts.",
    bullets: ["Agora Conversational AI", "Field CRM", "Expert handoff"],
    caption:
      "Welcome to KrishiSaathi — voice-first agricultural support built for Bharat.",
    visual: "hero",
    broll: "/?embed=1",
  },
  {
    id: "02-problem",
    start: 16,
    end: 30,
    kicker: "The problem",
    title: "Voice, not forms",
    line: "Farmers need patient help — not English apps.",
    bullets: ["Crop issues", "Weather", "Schemes", "Expert escalation"],
    caption:
      "Most farmers cannot navigate digital apps. They need voice help without repeating their story.",
    visual: "hero",
    broll: "/?embed=1",
  },
  {
    id: "03-stack",
    start: 30,
    end: 43,
    kicker: "Production stack",
    title: "ASR · LLM · TTS on Agora",
    line: "Deepgram · OpenAI · ElevenLabs · barge-in.",
    bullets: ["Deepgram Hindi ASR", "OpenAI reasoning", "ElevenLabs TTS"],
    caption:
      "Deepgram understands Hindi. OpenAI reasons. ElevenLabs speaks. Agora owns the live channel.",
    visual: "stack",
    broll: "/?embed=1",
  },
  {
    id: "04-desk",
    start: 43,
    end: 54,
    kicker: "Live voice desk",
    title: "Conversation in Hindi",
    line: "Interrupt mid-sentence — KrishiSaathi listens.",
    bullets: ["Start conversation", "Barge-in", "Tool cards on screen"],
    caption:
      "On the voice desk, tool cards appear as KrishiSaathi works in real time.",
    visual: "desk",
    broll: "/demo?embed=1",
  },
  {
    id: "05-dashboard",
    start: 54,
    end: 76,
    kicker: "Operations dashboard",
    title: "Field intelligence",
    line: "Live tiles · Call mix · Issues · Crop focus.",
    bullets: [
      "Farmers · Calls · Live now",
      "Escalations · Open cases",
      "Donut call mix · Issue split",
    ],
    caption:
      "Operations dashboard — call mix donut, top farmer issues, and crop focus from live CRM.",
    visual: "dashboard",
    broll: "/?embed=1",
  },
  {
    id: "06-crm",
    start: 76,
    end: 86,
    kicker: "Field CRM",
    title: "New Farmer registry",
    line: "Search, dial, structured from speech.",
    bullets: ["New Farmer (+)", "Farmer accounts", "Outbound dial"],
    caption:
      "In the field CRM, click New Farmer, search the registry, and place outbound calls.",
    visual: "crm",
    broll: "/crm?embed=1",
  },
  {
    id: "07-profile",
    start: 86,
    end: 102,
    kicker: "Farmer record",
    title: "Cases & disposition",
    line: "Timeline · weather · transcripts · cases.",
    bullets: ["Call timeline", "Weather summary", "Disposition on record"],
    caption:
      "Each farmer profile shows timeline, weather, transcripts, and agri cases with disposition.",
    visual: "profile",
    broll: "/crm?embed=1",
  },
  {
    id: "08-live",
    start: 102,
    end: TOTAL_SEC,
    kicker: "Live operations",
    title: "Monitor & telephony",
    line: "Live calls · Vobiz CRM · Agora desk.",
    bullets: ["Live calls monitor", "Vobiz Indian voice", "Two paths · one product"],
    caption:
      "Live calls refresh every few seconds. CRM dials run on Vobiz with an Indian voice.",
    visual: "live",
    broll: "/crm/calls?embed=1",
  },
];

export default function InvestorPitchPage() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [farmerBroll, setFarmerBroll] = useState<string | null>(null);
  const [recordMode, setRecordMode] = useState(false);
  const [origin, setOrigin] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const autoplayRef = useRef(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    const params = new URLSearchParams(window.location.search);
    setRecordMode(params.get("record") === "1");
    autoplayRef.current = params.get("autoplay") === "1";
  }, []);

  useEffect(() => {
    fetch("/api/crm/contacts")
      .then((r) => r.json())
      .then((data: { contacts?: { id: string }[] }) => {
        const id = data.contacts?.[0]?.id;
        if (id) setFarmerBroll(`/crm/farmers/${id}?embed=1`);
      })
      .catch(() => undefined);
  }, []);

  const beat = useMemo(() => {
    for (const b of BEATS) {
      if (elapsed >= b.start && elapsed < b.end) return b;
    }
    return BEATS[BEATS.length - 1]!;
  }, [elapsed]);

  const brollSrc = useMemo(() => {
    if (beat.visual === "profile" && farmerBroll) return farmerBroll;
    return beat.broll ?? null;
  }, [beat, farmerBroll]);

  /** Keep product screens warm so dashboard is ready when its beat hits */
  const preloadScreens = useMemo(() => {
    const paths = [
      "/?embed=1",
      "/demo?embed=1",
      "/crm?embed=1",
      "/crm/calls?embed=1",
    ];
    if (farmerBroll) paths.push(farmerBroll);
    return [...new Set(paths)];
  }, [farmerBroll]);

  const progress = Math.min(1, elapsed / TOTAL_SEC);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    setElapsed(Math.min(audio.currentTime, TOTAL_SEC));
    if (audio.currentTime >= TOTAL_SEC - 0.05) {
      setPlaying(false);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setElapsed(0);
    try {
      await audio.play();
      setPlaying(true);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn("pitch play failed", err);
    }
  }, [tick]);

  useEffect(() => {
    (window as Window & {
      __pitchStart?: () => Promise<void> | void;
      __pitchSeek?: (t: number) => void;
    }).__pitchStart = () => startPlayback();
    (
      window as Window & {
        __pitchSeek?: (t: number) => void;
      }
    ).__pitchSeek = (t: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = t;
        audio.pause();
      }
      setElapsed(t);
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
    };
    return () => {
      delete (window as Window & { __pitchStart?: () => Promise<void> | void })
        .__pitchStart;
      delete (window as Window & { __pitchSeek?: (t: number) => void }).__pitchSeek;
    };
  }, [startPlayback]);

  useEffect(() => {
    if (!autoplayRef.current) return;
    /* Wait for CRM iframes (esp. dashboard) to hydrate before audio starts */
    const t = window.setTimeout(() => void startPlayback(), 6500);
    return () => window.clearTimeout(t);
  }, [startPlayback]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className={`inv ${recordMode ? "inv--record" : ""}`}>
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />

      <div className="inv__frame">
        <header className="inv__head">
          <div className="inv__brand">
            <span className="inv__logo">🌾</span>
            <div>
              <strong>KrishiSaathi</strong>
              <span>Investor pitch · Agora CAI</span>
            </div>
          </div>
          {!recordMode ? (
            <span className="inv__clock">
              {fmt(elapsed)} / {fmt(TOTAL_SEC)}
            </span>
          ) : (
            <span className="inv__clock inv__clock--live">● REC</span>
          )}
        </header>

        <div className="inv__grid">
          <section className="inv__slide" key={beat.id}>
            <p className="inv__kicker">{beat.kicker}</p>
            <h1 className="inv__title">{beat.title}</h1>
            <p className="inv__line">{beat.line}</p>
            {beat.bullets ? (
              <ul className="inv__bullets">
                {beat.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            <InvestorVisual visual={beat.visual} />
          </section>

          <aside className="inv__screen">
            <div className="inv__screen-bar">
              <span className="inv__dot" />
              <span className="inv__dot" />
              <span className="inv__dot" />
              <span className="inv__url">
                liaa-ebon.vercel.app
                {(brollSrc ?? "").replace(/\?embed=1$/, "") || ""}
              </span>
            </div>
            <div className="inv__iframe-stack">
              {origin
                ? preloadScreens.map((path) => {
                    const active = brollSrc === path;
                    return (
                      <iframe
                        key={path}
                        title={path}
                        className={`inv__iframe ${active ? "inv__iframe--active" : ""}`}
                        src={`${origin}${path}`}
                        loading="eager"
                        aria-hidden={!active}
                      />
                    );
                  })
                : null}
              {!brollSrc ? (
                <div className="inv__placeholder">
                  <p className="inv__ph-title">{beat.title}</p>
                  <p className="inv__ph-sub">{beat.caption}</p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>

        {!recordMode ? (
          <p className="inv__caption">{beat.caption}</p>
        ) : null}

        <footer className="inv__foot">
          {!recordMode ? (
            <div className="inv__controls">
              {!playing ? (
                <button type="button" className="inv__btn" onClick={() => void startPlayback()}>
                  ▶ Play investor pitch
                </button>
              ) : (
                <button
                  type="button"
                  className="inv__btn inv__btn--ghost"
                  onClick={() => {
                    audioRef.current?.pause();
                    setPlaying(false);
                    cancelAnimationFrame(rafRef.current);
                  }}
                >
                  ⏸ Pause
                </button>
              )}
              <span className="inv__hint">F11 fullscreen · Win+G to record · ?record=1&autoplay=1</span>
            </div>
          ) : null}
          <div className="inv__progress">
            <div className="inv__progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap");

        .inv {
          min-height: 100vh;
          background: #030712;
          color: #f8fafc;
          font-family: Outfit, system-ui, sans-serif;
        }
        .inv--record .inv__controls,
        .inv--record .inv__caption {
          display: none !important;
        }
        .inv__frame {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 20px 28px 16px;
          background:
            radial-gradient(900px 480px at 0% 0%, rgba(1, 118, 211, 0.28), transparent 55%),
            radial-gradient(700px 420px at 100% 0%, rgba(46, 132, 74, 0.18), transparent 50%),
            linear-gradient(160deg, #030712, #0f172a 45%, #030712);
        }
        .inv__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .inv__brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .inv__brand strong {
          display: block;
          font-size: 15px;
          letter-spacing: 0.02em;
        }
        .inv__brand span {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .inv__logo {
          font-size: 28px;
        }
        .inv__clock {
          font-size: 12px;
          font-variant-numeric: tabular-nums;
          color: #94a3b8;
          letter-spacing: 0.06em;
        }
        .inv__clock--live {
          color: #f87171;
          font-weight: 700;
        }
        .inv__grid {
          flex: 1;
          display: grid;
          grid-template-columns: minmax(280px, 42%) 1fr;
          gap: 20px;
          min-height: 0;
        }
        .inv__slide {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8px 4px;
          animation: invIn 0.35s ease;
        }
        @keyframes invIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .inv__kicker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #38bdf8;
        }
        .inv__title {
          margin: 10px 0 8px;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(1.75rem, 3.2vw, 2.6rem);
          line-height: 1.08;
          font-weight: 700;
        }
        .inv__line {
          font-size: clamp(0.95rem, 1.6vw, 1.15rem);
          color: #cbd5e1;
          line-height: 1.45;
          max-width: 28rem;
        }
        .inv__bullets {
          margin: 18px 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .inv__bullets li {
          border: 1px solid rgba(56, 189, 248, 0.35);
          background: rgba(1, 118, 211, 0.1);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .inv__screen {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: #0b1220;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
          display: flex;
          flex-direction: column;
          min-height: 420px;
        }
        .inv__screen-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #1e293b;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }
        .inv__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #475569;
        }
        .inv__dot:first-child {
          background: #ef4444;
        }
        .inv__dot:nth-child(2) {
          background: #eab308;
        }
        .inv__dot:nth-child(3) {
          background: #22c55e;
        }
        .inv__url {
          margin-left: 8px;
          font-size: 11px;
          color: #94a3b8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .inv__iframe {
          flex: 1;
          width: 100%;
          border: none;
          background: #fff;
          min-height: 360px;
        }
        .inv__iframe-stack {
          position: relative;
          flex: 1;
          min-height: 420px;
          background: #f4f6f9;
        }
        .inv__iframe-stack .inv__iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          min-height: 0;
          opacity: 0;
          pointer-events: none;
          z-index: 0;
        }
        .inv__iframe-stack .inv__iframe--active {
          opacity: 1;
          pointer-events: auto;
          z-index: 2;
        }
        .inv__iframe-stack .inv__placeholder {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .inv__placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          text-align: center;
          background: linear-gradient(145deg, #0f172a, #1e293b);
        }
        .inv__ph-title {
          font-family: Fraunces, Georgia, serif;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .inv__ph-sub {
          margin-top: 8px;
          max-width: 320px;
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.5;
        }
        .inv__caption {
          margin: 14px 0 0;
          padding: 10px 14px;
          border-left: 3px solid #0176d3;
          background: rgba(0, 0, 0, 0.35);
          font-size: 14px;
          line-height: 1.45;
          color: #e2e8f0;
        }
        .inv__foot {
          margin-top: 12px;
        }
        .inv__controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .inv__btn {
          border: none;
          border-radius: 8px;
          background: #0176d3;
          color: #fff;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .inv__btn--ghost {
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.35);
        }
        .inv__hint {
          font-size: 11px;
          color: #64748b;
        }
        .inv__progress {
          height: 4px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.2);
          overflow: hidden;
        }
        .inv__progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0176d3, #2e844a);
          transition: width 0.08s linear;
        }
        .inv__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }
        .inv__chip {
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: rgba(15, 23, 42, 0.55);
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .inv__chip--gold {
          border-color: rgba(251, 191, 36, 0.45);
          color: #fde68a;
        }
        @media (max-width: 960px) {
          .inv__grid {
            grid-template-columns: 1fr;
          }
          .inv__screen {
            min-height: 280px;
          }
        }
      `}</style>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function InvestorVisual({ visual }: { visual: InvestorBeat["visual"] }) {
  if (visual === "stack") {
    return (
      <div className="inv__chips">
        <span className="inv__chip">Deepgram ASR</span>
        <span className="inv__chip">OpenAI LLM</span>
        <span className="inv__chip">ElevenLabs TTS</span>
        <span className="inv__chip inv__chip--gold">Agora CAI</span>
      </div>
    );
  }
  if (visual === "dashboard") {
    return (
      <div className="inv__chips">
        <span className="inv__chip inv__chip--gold">Call mix donut</span>
        <span className="inv__chip">Top issues</span>
        <span className="inv__chip">Crop focus</span>
      </div>
    );
  }
  if (visual === "crm") {
    return (
      <div className="inv__chips">
        <span className="inv__chip inv__chip--gold">New Farmer</span>
        <span className="inv__chip">Registry</span>
        <span className="inv__chip">Outbound dial</span>
      </div>
    );
  }
  if (visual === "profile") {
    return (
      <div className="inv__chips">
        <span className="inv__chip">Timeline</span>
        <span className="inv__chip">Weather</span>
        <span className="inv__chip inv__chip--gold">Disposition</span>
      </div>
    );
  }
  if (visual === "live") {
    return (
      <div className="inv__chips">
        <span className="inv__chip inv__chip--gold">Live calls</span>
        <span className="inv__chip">Vobiz CRM</span>
        <span className="inv__chip">Agora desk</span>
      </div>
    );
  }
  if (visual === "desk") {
    return (
      <div className="inv__chips">
        <span className="inv__chip inv__chip--gold">Voice desk</span>
        <span className="inv__chip">Barge-in</span>
        <span className="inv__chip">Tool cards</span>
      </div>
    );
  }
  return (
    <div className="inv__chips">
      <span className="inv__chip inv__chip--gold">Voice-first · Bharat</span>
    </div>
  );
}
