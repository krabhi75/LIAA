"use client";

import { useEffect, useMemo, useState } from "react";

type Beat = {
  id: string;
  seconds: number;
  kicker: string;
  title: string;
  line: string;
  bullets?: string[];
  visual: "hero" | "stack" | "desk" | "crm" | "phone" | "weather" | "expert" | "arch" | "close";
};

const BEATS: Beat[] = [
  {
    id: "open",
    seconds: 8,
    kicker: "EchoSphere · Agora Conversational AI",
    title: "KrishiSaathi",
    line: "Hindi voice agricultural assistant that speaks, listens, captures, and acts.",
    visual: "hero",
  },
  {
    id: "problem",
    seconds: 8,
    kicker: "The problem",
    title: "Farmers need voice, not forms",
    line: "Field workers cannot navigate English apps. They need patient Hindi help on a phone call.",
    bullets: ["Crop problems", "Local weather context", "Expert escalation without repeating the story"],
    visual: "hero",
  },
  {
    id: "stack",
    seconds: 10,
    kicker: "Voice stack on Agora",
    title: "ASR · LLM · TTS",
    line: "Agora owns the live channel. Our app starts the agent and runs tools.",
    bullets: ["ASR — Deepgram nova-3 (Hindi)", "LLM — OpenAI gpt-4o-mini", "TTS — ElevenLabs multilingual"],
    visual: "stack",
  },
  {
    id: "desk",
    seconds: 10,
    kicker: "Live desk · /demo",
    title: "Browser conversation",
    line: "Start conversation → barge-in → transcript → MCP tools on screen.",
    bullets: ["Hindi / Hinglish dialog", "Interrupt mid-sentence", "Calendar · mail · memory tools"],
    visual: "desk",
  },
  {
    id: "crm",
    seconds: 10,
    kicker: "Field CRM · /crm",
    title: "Farmer profiles that update live",
    line: "Every call writes structured facts — name, village, crop, symptoms, weather.",
    bullets: ["Farmers registry", "Call timeline", "Playable call recordings"],
    visual: "crm",
  },
  {
    id: "phone",
    seconds: 10,
    kicker: "PSTN inbound & outbound",
    title: "Real phone calls",
    line: "CRM dial via Vobiz · Campaign / inbound via Agora SIP on +91 79714 43138.",
    bullets: ["Name → district → help flow", "Call stays up on answer", "Inbound DID for farmers"],
    visual: "phone",
  },
  {
    id: "weather",
    seconds: 9,
    kicker: "External action",
    title: "Live weather → CRM",
    line: "Open-Meteo for the farmer’s district. Spoken naturally. Stored on the profile.",
    bullets: ["Never invent weather", "Context, not a fake diagnosis", "Visible on farmer card"],
    visual: "weather",
  },
  {
    id: "expert",
    seconds: 9,
    kicker: "Workflow",
    title: "Expert cases without re-telling",
    line: "When confidence is low, KrishiSaathi escalates with full context already captured.",
    bullets: ["create_case + escalate", "Transcript attached", "Human expert continues"],
    visual: "expert",
  },
  {
    id: "arch",
    seconds: 8,
    kicker: "Architecture",
    title: "Agora-central · tools on the edge",
    line: "RTC + Conversational AI in the middle. Next.js for tokens, MCP, Neon CRM.",
    visual: "arch",
  },
  {
    id: "close",
    seconds: 8,
    kicker: "Live now",
    title: "liaa-ebon.vercel.app",
    line: "KrishiSaathi — voice-first agri support for Bharat.",
    bullets: ["GitHub: krabhi75/LIAA", "Deepgram · OpenAI · ElevenLabs · Agora"],
    visual: "close",
  },
];

const TOTAL = BEATS.reduce((s, b) => s + b.seconds, 0);

export default function DemoReelPage() {
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  const { beat, beatIndex, beatLocal } = useMemo(() => {
    let t = elapsed;
    for (let i = 0; i < BEATS.length; i++) {
      if (t < BEATS[i].seconds) {
        return { beat: BEATS[i], beatIndex: i, beatLocal: t };
      }
      t -= BEATS[i].seconds;
    }
    const last = BEATS[BEATS.length - 1];
    return { beat: last, beatIndex: BEATS.length - 1, beatLocal: last.seconds };
  }, [elapsed]);

  useEffect(() => {
    if (paused || done) return;
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 0.1 >= TOTAL) {
          setDone(true);
          return TOTAL;
        }
        return e + 0.1;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [paused, done]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.code === "Space") {
        ev.preventDefault();
        setPaused((p) => !p);
      }
      if (ev.key === "r" || ev.key === "R") {
        setElapsed(0);
        setDone(false);
        setPaused(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const progress = Math.min(1, elapsed / TOTAL);
  const beatProgress = Math.min(1, beatLocal / beat.seconds);

  return (
    <div className="reel">
      <div className="reel__stage" data-visual={beat.visual}>
        <div className="reel__glow" aria-hidden />
        <header className="reel__top">
          <span className="reel__brand">KrishiSaathi</span>
          <span className="reel__clock">
            {fmt(elapsed)} / {fmt(TOTAL)}
            {paused ? " · PAUSED" : done ? " · END" : " · REC"}
          </span>
        </header>

        <main className="reel__main" key={beat.id}>
          <p className="reel__kicker">{beat.kicker}</p>
          <h1 className="reel__title">{beat.title}</h1>
          <p className="reel__line">{beat.line}</p>
          {beat.bullets ? (
            <ul className="reel__bullets">
              {beat.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
          <Visual beat={beat} progress={beatProgress} />
        </main>

        <footer className="reel__bar">
          <div className="reel__bar-fill" style={{ width: `${progress * 100}%` }} />
          <div className="reel__beats">
            {BEATS.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={i === beatIndex ? "on" : i < beatIndex ? "done" : ""}
                onClick={() => {
                  setDone(false);
                  setElapsed(BEATS.slice(0, i).reduce((s, x) => s + x.seconds, 0));
                }}
                title={b.title}
              />
            ))}
          </div>
          <div className="reel__hint">
            Space pause · R restart · Screen-record this page for a 90s submission clip
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap");

        .reel {
          min-height: 100vh;
          background: #0b120e;
          color: #f3f7f1;
          font-family: Outfit, system-ui, sans-serif;
        }
        .reel__stage {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          padding: 28px 40px 24px;
          background:
            radial-gradient(900px 500px at 12% -10%, rgba(74, 140, 72, 0.28), transparent 55%),
            radial-gradient(700px 420px at 100% 0%, rgba(201, 162, 39, 0.16), transparent 50%),
            linear-gradient(160deg, #0b120e 0%, #132018 45%, #0d1511 100%);
        }
        .reel__glow {
          pointer-events: none;
          position: absolute;
          inset: auto -20% -30% 20%;
          height: 55%;
          background: radial-gradient(circle, rgba(90, 160, 90, 0.12), transparent 70%);
          filter: blur(40px);
        }
        .reel__top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 12px;
          color: #a8b9a6;
        }
        .reel__brand {
          font-weight: 700;
          color: #e8f0e4;
        }
        .reel__clock {
          font-variant-numeric: tabular-nums;
          color: #c9a227;
        }
        .reel__main {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 920px;
          animation: reelIn 0.55s ease both;
        }
        @keyframes reelIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        .reel__kicker {
          font-size: 13px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #c9a227;
          margin-bottom: 14px;
          font-weight: 600;
        }
        .reel__title {
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(2.4rem, 6vw, 4.4rem);
          line-height: 1.05;
          font-weight: 700;
          margin: 0 0 16px;
          color: #f7fbf4;
        }
        .reel__line {
          font-size: clamp(1.05rem, 2vw, 1.35rem);
          line-height: 1.45;
          color: #c5d4c2;
          max-width: 38rem;
          margin: 0 0 22px;
        }
        .reel__bullets {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
          display: grid;
          gap: 10px;
        }
        .reel__bullets li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1rem;
          color: #e4efe1;
        }
        .reel__bullets li::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 99px;
          background: #5eab5a;
          box-shadow: 0 0 12px rgba(94, 171, 90, 0.7);
        }
        .reel__visual {
          margin-top: 8px;
          border: 1px solid rgba(232, 240, 228, 0.12);
          background: rgba(8, 14, 10, 0.45);
          border-radius: 18px;
          padding: 18px;
          backdrop-filter: blur(10px);
          max-width: 640px;
        }
        .reel__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .reel__chip {
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 600;
          background: rgba(94, 171, 90, 0.15);
          border: 1px solid rgba(94, 171, 90, 0.35);
          color: #d9f0d6;
        }
        .reel__chip.gold {
          background: rgba(201, 162, 39, 0.14);
          border-color: rgba(201, 162, 39, 0.4);
          color: #f0e2a8;
        }
        .reel__flow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          font-size: 12px;
          text-align: center;
        }
        .reel__flow span {
          padding: 12px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .reel__meter {
          height: 6px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          margin-top: 14px;
        }
        .reel__meter > i {
          display: block;
          height: 100%;
          background: linear-gradient(90deg, #4a8c48, #c9a227);
          border-radius: 99px;
        }
        .reel__bar {
          z-index: 2;
          margin-top: auto;
          padding-top: 18px;
        }
        .reel__bar-fill {
          height: 3px;
          background: linear-gradient(90deg, #5eab5a, #c9a227);
          border-radius: 99px;
          transition: width 0.1s linear;
        }
        .reel__beats {
          display: flex;
          gap: 6px;
          margin-top: 12px;
        }
        .reel__beats button {
          flex: 1;
          height: 4px;
          border: 0;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.12);
          padding: 0;
        }
        .reel__beats button.on {
          background: #c9a227;
        }
        .reel__beats button.done {
          background: #5eab5a;
        }
        .reel__hint {
          margin-top: 10px;
          font-size: 11px;
          color: #7f917c;
          letter-spacing: 0.04em;
        }
        @media (max-width: 720px) {
          .reel__stage {
            padding: 20px 18px 16px;
          }
          .reel__flow {
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

function Visual({ beat, progress }: { beat: Beat; progress: number }) {
  if (beat.visual === "stack") {
    return (
      <div className="reel__visual">
        <div className="reel__chips">
          <span className="reel__chip">Deepgram ASR</span>
          <span className="reel__chip">OpenAI LLM</span>
          <span className="reel__chip">ElevenLabs TTS</span>
          <span className="reel__chip gold">Agora CAI</span>
        </div>
        <div className="reel__meter">
          <i style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    );
  }
  if (beat.visual === "arch" || beat.visual === "phone") {
    return (
      <div className="reel__visual">
        <div className="reel__flow">
          <span>Farmer voice</span>
          <span>Agora / Vobiz</span>
          <span>KrishiSaathi</span>
          <span>CRM + tools</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "weather") {
    return (
      <div className="reel__visual">
        <div className="reel__chips">
          <span className="reel__chip">Open-Meteo</span>
          <span className="reel__chip gold">weatherSummary on profile</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "close") {
    return (
      <div className="reel__visual">
        <div className="reel__chips">
          <span className="reel__chip gold">liaa-ebon.vercel.app</span>
          <span className="reel__chip">github.com/krabhi75/LIAA</span>
        </div>
      </div>
    );
  }
  if (beat.visual === "desk" || beat.visual === "crm" || beat.visual === "expert") {
    return (
      <div className="reel__visual">
        <div className="reel__chips">
          {beat.visual === "desk" ? (
            <>
              <span className="reel__chip">/demo</span>
              <span className="reel__chip">Barge-in</span>
              <span className="reel__chip gold">MCP tools</span>
            </>
          ) : null}
          {beat.visual === "crm" ? (
            <>
              <span className="reel__chip">/crm</span>
              <span className="reel__chip">Timeline</span>
              <span className="reel__chip gold">Audio playback</span>
            </>
          ) : null}
          {beat.visual === "expert" ? (
            <>
              <span className="reel__chip">create_case</span>
              <span className="reel__chip gold">escalate_expert</span>
            </>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div className="reel__visual">
      <div className="reel__chips">
        <span className="reel__chip">Voice-first</span>
        <span className="reel__chip gold">Bharat · Hindi</span>
      </div>
    </div>
  );
}
