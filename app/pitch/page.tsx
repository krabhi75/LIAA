"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Beat = {
  id: string;
  seconds: number;
  kicker: string;
  title: string;
  line: string;
  bullets?: string[];
  narration: string;
  audio: string;
  visual: "hero" | "stack" | "desk" | "crm" | "profile" | "live" | "phone" | "tools" | "arch" | "close";
  broll?: string;
};

const BEATS: Beat[] = [
  {
    id: "01-intro",
    seconds: 11,
    kicker: "EchoSphere · Agora Conversational AI",
    title: "KrishiSaathi",
    line: "Hindi voice agricultural assistant — speaks, listens, captures, acts.",
    narration:
      "Welcome to KrishiSaathi — a Hindi voice agricultural assistant on Agora Conversational AI. It speaks, listens, captures farmer data, and acts.",
    audio: "/pitch-audio/01-intro.mp3",
    visual: "hero",
  },
  {
    id: "02-problem",
    seconds: 11,
    kicker: "The problem",
    title: "Voice, not forms",
    line: "Field workers need patient Hindi help on a phone call.",
    bullets: ["Crop problems", "Local weather", "Expert escalation"],
    narration:
      "Farmers cannot navigate English forms. They need patient voice help for crop problems, local weather, and expert escalation — without repeating their story.",
    audio: "/pitch-audio/02-problem.mp3",
    visual: "hero",
  },
  {
    id: "03-stack",
    seconds: 11,
    kicker: "Voice stack",
    title: "ASR · LLM · TTS on Agora",
    line: "Agora owns RTC, barge-in, and the conversational engine.",
    bullets: ["Deepgram nova-3 · Hindi", "OpenAI gpt-4o-mini", "ElevenLabs TTS"],
    narration:
      "Deepgram handles Hindi speech recognition. OpenAI GPT four-o-mini reasons. ElevenLabs speaks naturally. Agora owns the live channel and barge-in.",
    audio: "/pitch-audio/03-stack.mp3",
    visual: "stack",
  },
  {
    id: "04-desk",
    seconds: 12,
    kicker: "Live desk · /demo",
    title: "Browser conversation",
    line: "Hindi / Hinglish · interrupt mid-sentence · tools on screen.",
    bullets: ["Start conversation", "Barge-in", "MCP action cards"],
    narration:
      "On the live voice desk, start a conversation in Hindi or Hinglish. Interrupt mid-sentence — KrishiSaathi stops and listens. Tool cards update on screen in real time.",
    audio: "/pitch-audio/04-desk.mp3",
    visual: "desk",
    broll: "/demo",
  },
  {
    id: "05-crm",
    seconds: 10,
    kicker: "Field CRM · /crm",
    title: "Farmers registry",
    line: "Inbound DID + outbound dialer · structured from speech.",
    bullets: ["Farmer accounts", "Call logging", "Search & filter"],
    narration:
      "The field CRM registers every farmer — inbound on our Indian number, or outbound from the desk. Structured facts flow from natural speech.",
    audio: "/pitch-audio/05-crm.mp3",
    visual: "crm",
    broll: "/crm",
  },
  {
    id: "06-profile",
    seconds: 12,
    kicker: "Farmer record",
    title: "Cases & disposition",
    line: "Timeline, weather, transcripts — resolve cases on the record.",
    bullets: ["Call timeline", "Live weather", "Disposition: resolved · escalated"],
    narration:
      "Every farmer record shows call timeline, weather summary, transcripts, and open agri cases. Agents close cases with disposition — resolved, escalated, or follow-up.",
    audio: "/pitch-audio/06-profile.mp3",
    visual: "profile",
    broll: "/crm",
  },
  {
    id: "07-live",
    seconds: 10,
    kicker: "Operations",
    title: "Live metrics",
    line: "Dashboard + live calls monitor refresh every few seconds.",
    bullets: ["Live now count", "Escalation funnel", "Real CRM data"],
    narration:
      "The operations dashboard and live calls monitor refresh every few seconds — real metrics for field teams, not static placeholders.",
    audio: "/pitch-audio/07-live.mp3",
    visual: "live",
    broll: "/",
  },
  {
    id: "08-phone",
    seconds: 11,
    kicker: "PSTN",
    title: "Two outbound paths",
    line: "Vobiz CRM dial · Agora Campaign / SIP inbound.",
    bullets: ["+91 79714 43138", "Polly.Aditi Hindi CRM", "Agora Conversational AI"],
    narration:
      "CRM outbound uses Vobiz with Indian voice. Agora campaigns and the browser demo use Conversational AI — two phone paths, one architecture.",
    audio: "/pitch-audio/08-phone.mp3",
    visual: "phone",
  },
  {
    id: "09-tools",
    seconds: 11,
    kicker: "Intelligence",
    title: "Weather & expert cases",
    line: "Open-Meteo on profile · escalate with full context.",
    bullets: ["Never invent weather", "create_case", "Expert handoff"],
    narration:
      "After location, live weather from Open-Meteo is spoken and stored on the profile. When confidence is low, expert cases carry full context already captured.",
    audio: "/pitch-audio/09-tools.mp3",
    visual: "tools",
  },
  {
    id: "10-arch",
    seconds: 10,
    kicker: "Architecture",
    title: "Production stack",
    line: "Next.js · MCP tools · Neon Postgres CRM.",
    narration:
      "Agora-central voice, Next.js for tokens and MCP tools, Neon Postgres for CRM — production at liaa-ebon dot vercel dot app.",
    audio: "/pitch-audio/10-arch.mp3",
    visual: "arch",
  },
  {
    id: "11-close",
    seconds: 11,
    kicker: "Live now",
    title: "liaa-ebon.vercel.app",
    line: "Voice-first agri support for Bharat.",
    bullets: ["github.com/krabhi75/LIAA", "Deepgram · OpenAI · ElevenLabs · Agora"],
    narration:
      "KrishiSaathi — voice-first agricultural support for Bharat. Live demo and open source on GitHub: krabhi75 slash LIAA. Thank you.",
    audio: "/pitch-audio/11-close.mp3",
    visual: "close",
  },
];

const TOTAL = BEATS.reduce((s, b) => s + b.seconds, 0);

export default function PitchPage() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [audioReady, setAudioReady] = useState<boolean | null>(null);
  const [useSpeechFallback, setUseSpeechFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beatIndexRef = useRef(0);
  const playingRef = useRef(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { beat, beatIndex, beatLocal } = useMemo(() => {
    let t = elapsed;
    for (let i = 0; i < BEATS.length; i++) {
      if (t < BEATS[i].seconds) {
        return { beat: BEATS[i], beatIndex: i, beatLocal: t };
      }
      t -= BEATS[i].seconds;
    }
    const last = BEATS[BEATS.length - 1]!;
    return { beat: last, beatIndex: BEATS.length - 1, beatLocal: last.seconds };
  }, [elapsed]);

  const progress = Math.min(1, elapsed / TOTAL);

  const playBeatAudio = useCallback(async (index: number) => {
    const b = BEATS[index];
    if (!b) return;

    if (useSpeechFallback && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(b.narration);
      u.rate = 0.95;
      u.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const indian =
        voices.find((v) => /en-IN|India|Neerja|Heera/i.test(`${v.lang} ${v.name}`)) ??
        voices.find((v) => /en-GB.*Female|Google UK English Female/i.test(v.name)) ??
        voices.find((v) => v.lang.startsWith("en") && /female|zira|samantha/i.test(v.name));
      if (indian) u.voice = indian;
      speechRef.current = u;
      window.speechSynthesis.speak(u);
      return;
    }

    if (!audioRef.current) return;
    audioRef.current.src = b.audio;
    try {
      await audioRef.current.play();
    } catch {
      /* autoplay blocked */
    }
  }, [useSpeechFallback]);

  const start = useCallback(() => {
    setElapsed(0);
    beatIndexRef.current = 0;
    playingRef.current = true;
    setPlaying(true);
    void playBeatAudio(0);
  }, [playBeatAudio]);

  const restart = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    start();
  }, [start]);

  useEffect(() => {
    fetch("/pitch-audio/01-intro.mp3", { method: "HEAD" })
      .then((r) => {
        const ok = r.ok;
        setAudioReady(ok);
        setUseSpeechFallback(!ok);
      })
      .catch(() => {
        setAudioReady(false);
        setUseSpeechFallback(true);
      });
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 0.1 >= TOTAL) {
          playingRef.current = false;
          setPlaying(false);
          return TOTAL;
        }
        return e + 0.1;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    if (!playing || beatIndex === beatIndexRef.current) return;
    beatIndexRef.current = beatIndex;
    void playBeatAudio(beatIndex);
  }, [beatIndex, playing, playBeatAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      const next = beatIndexRef.current + 1;
      if (next < BEATS.length && playingRef.current) {
        beatIndexRef.current = next;
        void playBeatAudio(next);
      }
    };
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [playBeatAudio]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        if (playing) {
          playingRef.current = false;
          setPlaying(false);
          audioRef.current?.pause();
          window.speechSynthesis?.cancel();
        } else if (elapsed >= TOTAL) {
          restart();
        } else {
          playingRef.current = true;
          setPlaying(true);
          void audioRef.current?.play();
        }
      }
      if (ev.key === "r" || ev.key === "R") restart();
      if (ev.key === "n" || ev.key === "N") setCaptions((c) => !c);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, elapsed, restart]);

  return (
    <div className="pitch">
      <audio ref={audioRef} preload="auto" />
      <div className="pitch__stage" data-visual={beat.visual}>
        <div className="pitch__glow" aria-hidden />
        <header className="pitch__top">
          <span className="pitch__brand">KrishiSaathi · 2-min pitch</span>
          <span className="pitch__clock">
            {fmt(elapsed)} / {fmt(TOTAL)}
            {playing ? " · PLAYING" : elapsed >= TOTAL ? " · END" : " · READY"}
          </span>
        </header>

        <main className="pitch__main" key={beat.id}>
          <p className="pitch__kicker">{beat.kicker}</p>
          <h1 className="pitch__title">{beat.title}</h1>
          <p className="pitch__line">{beat.line}</p>
          {beat.bullets ? (
            <ul className="pitch__bullets">
              {beat.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
          {beat.broll ? (
            <p className="pitch__broll">
              B-roll:{" "}
              <a href={beat.broll} target="_blank" rel="noreferrer">
                liaa-ebon.vercel.app{beat.broll}
              </a>
            </p>
          ) : null}
          <PitchVisual beat={beat} />
        </main>

        {captions ? (
          <div className="pitch__caption" aria-live="polite">
            {beat.narration}
          </div>
        ) : null}

        <footer className="pitch__bar">
          <div className="pitch__controls">
            {!playing && elapsed < TOTAL ? (
              <button type="button" className="pitch__play" onClick={start}>
                ▶ Play pitch
                {useSpeechFallback ? " (browser voice)" : ""}
              </button>
            ) : playing ? (
              <button
                type="button"
                className="pitch__play pitch__play--ghost"
                onClick={() => {
                  playingRef.current = false;
                  setPlaying(false);
                  audioRef.current?.pause();
                  window.speechSynthesis?.cancel();
                }}
              >
                ⏸ Pause
              </button>
            ) : (
              <button type="button" className="pitch__play" onClick={restart}>
                ↻ Replay
              </button>
            )}
            <span className="pitch__hint">
              F11 fullscreen · Win+G record · Space pause · R restart · N captions
            </span>
            {useSpeechFallback ? (
              <span className="pitch__hint">
                Pro voice: ELEVENLABS_API_KEY → npm run pitch:audio → redeploy
              </span>
            ) : null}
          </div>
          <div className="pitch__bar-fill" style={{ width: `${progress * 100}%` }} />
        </footer>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap");

        .pitch {
          min-height: 100vh;
          background: #071018;
          color: #f0f6fc;
          font-family: Outfit, system-ui, sans-serif;
        }
        .pitch__stage {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 28px 40px 20px;
          background:
            radial-gradient(900px 500px at 8% -8%, rgba(1, 118, 211, 0.35), transparent 55%),
            radial-gradient(600px 400px at 100% 0%, rgba(46, 132, 74, 0.2), transparent 50%),
            linear-gradient(165deg, #071018 0%, #0c1f33 50%, #071018 100%);
        }
        .pitch__glow {
          pointer-events: none;
          position: absolute;
          inset: auto -10% -20% 10%;
          height: 50%;
          background: radial-gradient(circle, rgba(1, 118, 211, 0.15), transparent 70%);
          filter: blur(48px);
        }
        .pitch__top {
          display: flex;
          justify-content: space-between;
          z-index: 2;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .pitch__brand {
          font-weight: 700;
          color: #e2e8f0;
        }
        .pitch__clock {
          font-variant-numeric: tabular-nums;
        }
        .pitch__main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          z-index: 2;
          max-width: 920px;
          animation: pitchIn 0.45s ease;
        }
        @keyframes pitchIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .pitch__kicker {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #38bdf8;
        }
        .pitch__title {
          margin: 12px 0 8px;
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          font-weight: 700;
          line-height: 1.05;
        }
        .pitch__line {
          font-size: clamp(1.05rem, 2.2vw, 1.35rem);
          color: #cbd5e1;
          max-width: 42rem;
          line-height: 1.45;
        }
        .pitch__bullets {
          margin: 20px 0 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pitch__bullets li {
          border: 1px solid rgba(56, 189, 248, 0.35);
          background: rgba(1, 118, 211, 0.12);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
        }
        .pitch__broll {
          margin-top: 16px;
          font-size: 12px;
          color: #64748b;
        }
        .pitch__broll a {
          color: #7dd3fc;
        }
        .pitch__visual {
          margin-top: 28px;
        }
        .pitch__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pitch__chip {
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          background: rgba(15, 23, 42, 0.6);
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
        }
        .pitch__chip.gold {
          border-color: rgba(251, 191, 36, 0.45);
          color: #fde68a;
        }
        .pitch__flow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          max-width: 640px;
        }
        .pitch__flow span {
          text-align: center;
          border-radius: 8px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          padding: 12px 8px;
          font-size: 12px;
          font-weight: 600;
        }
        .pitch__caption {
          z-index: 2;
          margin: 0 0 12px;
          border-left: 3px solid #0176d3;
          padding: 10px 16px;
          background: rgba(0, 0, 0, 0.35);
          font-size: 15px;
          line-height: 1.5;
          color: #e2e8f0;
          max-width: 920px;
        }
        .pitch__bar {
          z-index: 2;
          position: relative;
          padding-top: 12px;
        }
        .pitch__bar-fill {
          height: 3px;
          background: linear-gradient(90deg, #0176d3, #2e844a);
          border-radius: 2px;
          transition: width 0.1s linear;
        }
        .pitch__controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .pitch__play {
          border: none;
          border-radius: 8px;
          background: #0176d3;
          color: #fff;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .pitch__play--ghost {
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.4);
        }
        .pitch__hint {
          font-size: 11px;
          color: #64748b;
        }
        @media (max-width: 720px) {
          .pitch__stage {
            padding: 20px 18px 16px;
          }
          .pitch__flow {
            grid-template-columns: repeat(2, minmax(0, 1fr));
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

function PitchVisual({ beat }: { beat: Beat }) {
  if (beat.visual === "stack") {
    return (
      <div className="pitch__visual">
        <div className="pitch__chips">
          <span className="pitch__chip">Deepgram ASR</span>
          <span className="pitch__chip">OpenAI LLM</span>
          <span className="pitch__chip">ElevenLabs TTS</span>
          <span className="pitch__chip gold">Agora CAI</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "phone" || beat.visual === "arch") {
    return (
      <div className="pitch__visual">
        <div className="pitch__flow">
          <span>Farmer</span>
          <span>Agora / Vobiz</span>
          <span>KrishiSaathi</span>
          <span>CRM + MCP</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "close") {
    return (
      <div className="pitch__visual">
        <div className="pitch__chips">
          <span className="pitch__chip gold">liaa-ebon.vercel.app</span>
          <span className="pitch__chip">github.com/krabhi75/LIAA</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "tools") {
    return (
      <div className="pitch__visual">
        <div className="pitch__chips">
          <span className="pitch__chip">Open-Meteo</span>
          <span className="pitch__chip">create_case</span>
          <span className="pitch__chip gold">Expert escalation</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "profile") {
    return (
      <div className="pitch__visual">
        <div className="pitch__chips">
          <span className="pitch__chip">Timeline</span>
          <span className="pitch__chip">Weather</span>
          <span className="pitch__chip gold">Case disposition</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "live") {
    return (
      <div className="pitch__visual">
        <div className="pitch__chips">
          <span className="pitch__chip">Live now</span>
          <span className="pitch__chip">Escalation funnel</span>
          <span className="pitch__chip gold">3s refresh</span>
        </div>
      </div>
    );
  }
  return (
    <div className="pitch__visual">
      <div className="pitch__chips">
        {beat.visual === "desk" ? (
          <>
            <span className="pitch__chip gold">/demo</span>
            <span className="pitch__chip">Hindi barge-in</span>
          </>
        ) : beat.visual === "crm" ? (
          <>
            <span className="pitch__chip gold">/crm</span>
            <span className="pitch__chip">Farmers + dialer</span>
          </>
        ) : (
          <span className="pitch__chip gold">Voice-first · Bharat</span>
        )}
      </div>
    </div>
  );
}
