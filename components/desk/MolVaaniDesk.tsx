"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAetherCall } from "@/hooks/useAetherCall";
import { CUSTOMER_UID } from "@/lib/ids";
import { NovaOrb } from "./NovaOrb";

type ActionCard = {
  key: string;
  verb: string;
  kind: string;
  title: string;
  detail: string;
  demo?: boolean;
  ask?: boolean;
  link?: string;
};

function cardFromTool(tool: string, output: unknown, at: string, i: number): ActionCard {
  const o = (output && typeof output === "object" ? output : {}) as Record<
    string,
    unknown
  >;
  const embedded = o.card as
    | {
        verb?: string;
        kind?: string;
        title?: string;
        detail?: string;
        demo?: boolean;
        ask?: boolean;
        link?: string;
      }
    | undefined;

  if (embedded?.title) {
    return {
      key: `${at}-${tool}-${i}`,
      verb: embedded.verb ?? "Did",
      kind: embedded.kind ?? tool,
      title: embedded.title,
      detail: embedded.detail ?? "",
      demo: embedded.demo,
      ask: embedded.ask,
      link: embedded.link,
    };
  }

  return {
    key: `${at}-${tool}-${i}`,
    verb: "Tool",
    kind: tool,
    title: tool,
    detail: "",
  };
}

export function MolVaaniDesk({
  channel,
  agentConfigId,
}: {
  channel: string;
  agentConfigId?: string;
}) {
  const call = useAetherCall(channel, CUSTOMER_UID, { agentConfigId });
  const [gateOpen, setGateOpen] = useState(true);
  const [gateHint, setGateHint] = useState(
    "Nova needs your microphone. Allow it once and it wakes by itself from then on.",
  );
  const [booting, setBooting] = useState(true);
  const [showWake, setShowWake] = useState(false);
  const autoTried = useRef(false);
  const transcriptRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLElement>(null);

  const tools = call.session?.tools ?? [];
  const agentLive = call.remoteUsers.length > 0 || call.agentSpeaking;

  const cards = useMemo(() => {
    return [...tools]
      .reverse()
      .map((t, i) => cardFromTool(t.tool, t.output, t.at, i));
  }, [tools]);

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [call.transcripts]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [cards.length]);

  useEffect(() => {
    if (call.connected) {
      setGateOpen(false);
      setBooting(false);
      setShowWake(false);
    }
  }, [call.connected]);

  useEffect(() => {
    if (call.error) {
      setBooting(false);
      setShowWake(true);
      setGateOpen(true);
    }
  }, [call.error]);

  useEffect(() => {
    if (autoTried.current || !channel) return;
    autoTried.current = true;
    const manual = new URLSearchParams(window.location.search).has("manual");
    if (manual) {
      setBooting(false);
      setShowWake(true);
      return;
    }
    (async () => {
      try {
        const p = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (p.state === "granted") {
          setBooting(true);
          await call.start();
          return;
        }
        if (p.state === "denied") {
          setGateHint(
            "Microphone is blocked for this site. Allow it in the address bar, then reload.",
          );
        }
      } catch {
        /* Safari / Firefox */
      }
      setBooting(false);
      setShowWake(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  async function wake() {
    setShowWake(false);
    setBooting(true);
    await call.start();
    setBooting(false);
  }

  async function end() {
    await call.stop();
    setGateOpen(true);
    setShowWake(true);
    setBooting(false);
    setGateHint("Session ended. Wake Nova again when you are ready.");
  }

  return (
    <div className="nova-app">
      <header className="nova-bar">
        <span className="nova-mark">NOVA</span>
        <span className={`nova-dot ${agentLive ? "nova-dot--on" : ""}`}>
          {agentLive ? "agent live" : "agent"}
        </span>
        <span
          className={`nova-dot ${call.mcpAttached ? "nova-dot--on" : "nova-dot--warn"}`}
        >
          {call.mcpAttached ? "tools live" : "tools offline"}
        </span>
        <span className="nova-bar__spacer" />
        {call.error ? (
          <span className="nova-dot nova-dot--warn">{call.error.slice(0, 70)}</span>
        ) : null}
        {call.connected ? (
          <button type="button" className="nova-btn" onClick={end}>
            End
          </button>
        ) : null}
      </header>

      <section className="nova-transcript" ref={transcriptRef as never}>
        <span className="nova-label">Transcript</span>
        {call.transcripts.length === 0 ? (
          <p className="nova-empty">
            Nothing yet. Just talk — no button to hold. Ask about your day, book a
            meeting, or read mail.
          </p>
        ) : (
          call.transcripts.map((line, i) => (
            <div
              key={`${line.at}-${i}`}
              className={`nova-turn ${line.role === "agent" ? "nova-turn--maya" : ""} ${
                line.final ? "" : "nova-turn--partial"
              }`}
            >
              <span className="nova-turn__who">
                {line.role === "agent" ? "NOVA" : "YOU"}
              </span>
              <p className="nova-turn__text">{line.text}</p>
            </div>
          ))
        )}
      </section>

      <div className="nova-stage-wrap">
        <NovaOrb
          buyerLevel={call.telemetry.buyerLevel}
          agentLevel={call.telemetry.agentLevel}
          connected={call.connected}
          agentSpeaking={call.agentSpeaking}
        />
        <div className={`nova-agora ${call.connected ? "nova-agora--on" : ""}`}>
          <span className="nova-agora__live" />
          <span className="nova-agora__mark">AGORA</span>
          <span>Conversational AI</span>
          <span className="nova-agora__v">{channel || "—"}</span>
          <span>
            rtt{" "}
            <span className="nova-agora__v">
              {call.rttMs != null ? `${call.rttMs}ms` : "—"}
            </span>
          </span>
          <span>
            uid <span className="nova-agora__v">{CUSTOMER_UID}→123456</span>
          </span>
        </div>
      </div>

      <aside className="nova-log" ref={logRef as never}>
        <div className="nova-log__head">
          <span className="nova-label">Actions</span>
          <span className="nova-label">{cards.length || ""}</span>
        </div>
        {cards.length === 0 ? (
          <p className="nova-empty">
            Everything Nova actually does lands here — calendar, mail, tabs, memory.
            Seeded results show a DEMO DATA badge.
          </p>
        ) : (
          cards.map((c) => (
            <article
              key={c.key}
              className={`nova-card nova-card--flash ${c.demo ? "nova-card--demo" : ""} ${
                c.ask ? "nova-card--ask" : ""
              }`}
            >
              <div className="nova-card__head">
                <span className="nova-card__verb">{c.verb}</span>
                {c.demo ? <span className="nova-card__demo">DEMO DATA</span> : null}
                <span className="nova-card__kind">{c.kind}</span>
              </div>
              <div className="nova-card__title">{c.title}</div>
              {c.detail ? (
                <div className="nova-card__detail">{c.detail}</div>
              ) : null}
              {c.link ? (
                <div className="nova-card__foot">
                  <a
                    className="nova-card__link"
                    href={c.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {c.link.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              ) : null}
            </article>
          ))
        )}
      </aside>

      {gateOpen && !call.connected ? (
        <div className="nova-gate">
          <div className="nova-gate__mark">NOVA</div>
          <p className="nova-gate__sub">{gateHint}</p>
          <div className="nova-gate__row">
            <span className={`nova-dot ${call.mcpAttached ? "nova-dot--on" : ""}`}>
              tools
            </span>
            <span className="nova-dot nova-dot--on">agora</span>
          </div>
          {showWake ? (
            <button
              type="button"
              className="nova-btn nova-btn--primary"
              onClick={wake}
              disabled={call.connecting}
            >
              {call.connecting ? "Connecting…" : "Wake Nova"}
            </button>
          ) : null}
          {booting || call.connecting ? (
            <p className="nova-label">initialising</p>
          ) : null}
          {call.error ? <p className="nova-gate__err">{call.error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
