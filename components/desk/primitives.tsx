"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveNumber } from "@/hooks/useLiveNumber";

export function Waveform({
  buyer,
  agent,
  active,
}: {
  buyer: number;
  agent: number;
  active: boolean;
}) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const loop = (now: number) => {
      setT(now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const bars = 40;
  const peak = Math.max(buyer, agent, active ? 0.08 : 0);

  return (
    <div className="flex h-8 items-end gap-px" aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const phase = Math.sin(t / 140 + i * 0.38);
        const side = i < bars / 2 ? buyer : agent;
        const h = active
          ? Math.max(0.08, Math.min(1, Math.abs(phase) * (0.25 + side * 1.4) + peak * 0.15))
          : 0.12;
        return (
          <span
            key={i}
            className={`w-[3px] origin-bottom rounded-sm ${i >= bars / 2 ? "bg-blue-600" : "bg-slate-400"}`}
            style={{ height: `${h * 100}%`, opacity: active ? 0.9 : 0.35 }}
          />
        );
      })}
    </div>
  );
}

export function LiveMoney({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const n = useLiveNumber(value);
  return <span className={`num ${className ?? ""}`}>{format(n)}</span>;
}

export function FlashValue({
  value,
  fallback = "—",
  className,
}: {
  value?: string | number | null;
  fallback?: string;
  className?: string;
}) {
  const shown = value === 0 ? "0" : value ? String(value) : fallback;
  const prev = useRef(shown);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current === shown) return;
    prev.current = shown;
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), 700);
    return () => window.clearTimeout(id);
  }, [shown]);

  return (
    <span className={`${className ?? ""} ${flash ? "flash-in" : ""}`}>{shown}</span>
  );
}
