"use client";

import { useEffect, useMemo, useRef } from "react";

type Mode = "standby" | "idle" | "listening" | "thinking" | "speaking";

const LABELS: Record<Mode, string> = {
  standby: "प्रतीक्षा",
  idle: "आपकी आवाज़ का इंतज़ार",
  listening: "सुन रहा है",
  thinking: "काम कर रहा है",
  speaking: "बोल रहा है",
};

export function NovaOrb({
  buyerLevel,
  agentLevel,
  connected,
  agentSpeaking,
}: {
  buyerLevel: number;
  agentLevel: number;
  connected: boolean;
  agentSpeaking: boolean;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<SVGCircleElement>(null);
  const waveRefs = useRef<(SVGCircleElement | null)[]>([]);
  const stateRef = useRef<HTMLSpanElement>(null);
  const levelRef = useRef(0);
  const modeRef = useRef<Mode>("standby");
  const spokeAt = useRef(0);
  const heardAt = useRef(0);

  const ticks = useMemo(() => {
    const items: { x1: string; y1: string; x2: string; y2: string; major: boolean }[] =
      [];
    for (let i = 0; i < 72; i++) {
      const major = i % 6 === 0;
      const a = (i / 72) * Math.PI * 2 - Math.PI / 2;
      const r1 = 190;
      const r2 = major ? 176 : 183;
      items.push({
        x1: (Math.cos(a) * r1).toFixed(1),
        y1: (Math.sin(a) * r1).toFixed(1),
        x2: (Math.cos(a) * r2).toFixed(1),
        y2: (Math.sin(a) * r2).toFixed(1),
        major,
      });
    }
    return items;
  }, []);

  useEffect(() => {
    const BASE = [96, 74, 56];
    let raf = 0;

    const frame = (t: number) => {
      const m = buyerLevel;
      const a = agentLevel;
      const now = performance.now();
      if (a > 0.02 || agentSpeaking) {
        spokeAt.current = now;
        heardAt.current = 0;
      } else if (m > 0.03) {
        heardAt.current = now;
      }

      let next: Mode = "idle";
      if (!connected) next = "standby";
      else if (now - spokeAt.current < 260) next = "speaking";
      else if (now - heardAt.current < 320) next = "listening";
      else if (heardAt.current && now - heardAt.current < 9000) next = "thinking";
      else next = "idle";

      if (next !== modeRef.current) {
        modeRef.current = next;
        if (stageRef.current) stageRef.current.className = `nova-stage is-${next}`;
        if (stateRef.current) stateRef.current.textContent = LABELS[next];
        if (coreRef.current) {
          coreRef.current.setAttribute(
            "class",
            next === "idle" || next === "standby"
              ? "nova-core"
              : "nova-core nova-core--live",
          );
        }
      }

      const target = Math.max(a, m) * 2.6;
      levelRef.current += (target - levelRef.current) * 0.16;
      const breath = Math.sin(t / 1400) * 0.5 + 0.5;
      const level = levelRef.current;

      waveRefs.current.forEach((w, i) => {
        if (!w) return;
        const push = level * (26 - i * 5) + (next === "idle" ? breath * 3 : 0);
        w.setAttribute("r", (BASE[i] + push).toFixed(1));
        w.style.opacity = Math.min(0.14 + level * 1.5, 0.85).toFixed(2);
      });
      if (coreRef.current) {
        coreRef.current.setAttribute(
          "r",
          (30 + level * 9 + (next === "idle" ? breath * 1.5 : 0)).toFixed(1),
        );
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [buyerLevel, agentLevel, connected, agentSpeaking]);

  return (
    <div className="nova-stage is-standby" ref={stageRef}>
      <svg className="nova-orb" viewBox="-200 -200 400 400" aria-hidden="true">
        <g>
          {ticks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              className={tick.major ? "nova-tick nova-tick--major" : "nova-tick"}
            />
          ))}
        </g>
        <circle className="nova-ring nova-ring--outer" r="182" />
        <circle className="nova-ring" r="150" />
        <circle className="nova-ring" r="118" />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            className="nova-wave"
            ref={(el) => {
              waveRefs.current[i] = el;
            }}
            r={[96, 74, 56][i]}
          />
        ))}
        <circle className="nova-core" ref={coreRef} r="30" />
      </svg>
      <div className="nova-state">
        <span className="nova-state__text" ref={stateRef}>
          प्रतीक्षा
        </span>
      </div>
    </div>
  );
}
