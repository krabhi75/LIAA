"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAetherCall } from "@/hooks/useAetherCall";
import { CUSTOMER_UID } from "@/lib/ids";
import { NovaOrb } from "./NovaOrb";

const TOOL_CARD: Record<
  string,
  { verb: string; kind: string; title: (out: unknown) => string; detail?: (out: unknown) => string }
> = {
  get_pricing: {
    verb: "Priced",
    kind: "catalog",
    title: (o) => {
      const r = o as { recommended_plan?: string; seats?: number };
      return `${r.recommended_plan ?? "Plan"} · ${r.seats ?? "?"} seats`;
    },
    detail: (o) => {
      const r = o as { estimated_monthly_usd?: number };
      return r.estimated_monthly_usd != null
        ? `≈ $${r.estimated_monthly_usd}/mo list`
        : "";
    },
  },
  compare_competitor: {
    verb: "Compared",
    kind: "objection",
    title: (o) => `vs ${(o as { competitor?: string }).competitor ?? "competitor"}`,
  },
  get_availability: {
    verb: "Checked",
    kind: "calendar",
    title: () => "IST demo slots",
  },
  upsert_crm_lead: {
    verb: "CRM",
    kind: "lead",
    title: (o) => {
      const r = o as { company?: string; name?: string; seats?: number };
      return [r.company, r.name, r.seats ? `${r.seats} seats` : null]
        .filter(Boolean)
        .join(" · ") || "Lead updated";
    },
  },
  book_demo: {
    verb: "Booked",
    kind: "calendar",
    title: (o) => (o as { label?: string }).label ?? "Demo booked",
    detail: (o) => (o as { attendee?: string }).attendee ?? "",
  },
  escalate_to_human: {
    verb: "Escalated",
    kind: "handoff",
    title: (o) => (o as { reason?: string }).reason ?? "Human requested",
    detail: (o) => (o as { summary?: string }).summary ?? "",
  },
  get_lead: {
    verb: "Read",
    kind: "lead",
    title: () => "CRM snapshot",
  },
};

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
    "MolVaani needs your microphone. Allow it once and the desk wakes itself from then on.",
  );
  const [booting, setBooting] = useState(true);
  const [showWake, setShowWake] = useState(false);
  const autoTried = useRef(false);
  const transcriptRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLElement>(null);

  const tools = call.session?.tools ?? [];
  const lead = call.session?.lead;
  const agentLive = call.remoteUsers.length > 0 || call.agentSpeaking;

  const cards = useMemo(() => {
    return [...tools].reverse().map((t, i) => {
      const meta = TOOL_CARD[t.tool] ?? {
        verb: "Tool",
        kind: "mcp",
        title: () => t.tool,
      };
      return {
        key: `${t.at}-${t.tool}-${i}`,
        verb: meta.verb,
        kind: meta.kind,
        title: meta.title(t.output),
        detail: meta.detail?.(t.output) ?? "",
        at: t.at,
      };
    });
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
        } else {
          setGateHint(
            "MolVaani needs your microphone. Allow it once and the desk wakes itself from then on.",
          );
        }
      } catch {
        setGateHint(
          "MolVaani needs your microphone. Allow it once and the desk wakes itself from then on.",
        );
      }
      setBooting(false);
      setShowWake(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wake once on mount
  }, [channel]);

  async function wake() {
    setShowWake(false);
    setBooting(true);
    await call.start();
    setBooting(false);
    if (!call.error) setShowWake(false);
  }

  async function end() {
    await call.stop();
    setGateOpen(true);
    setShowWake(true);
    setBooting(false);
    setGateHint("Session ended. Wake MolVaani again when you are ready.");
  }

  return (
    <div className="nova-app">
      <header className="nova-bar">
        <span className="nova-mark">MOLVAANI</span>
        <span className={`nova-dot ${agentLive ? "nova-dot--on" : ""}`}>
          {agentLive ? "agent live" : "agent"}
        </span>
        <span className={`nova-dot ${call.mcpAttached ? "nova-dot--on" : "nova-dot--warn"}`}>
          {call.mcpAttached ? "mcp live" : "mcp tunnel"}
        </span>
        <span className="nova-bar__spacer" />
        {call.error ? (
          <span className="nova-dot nova-dot--warn">{call.error.slice(0, 70)}</span>
        ) : null}
        <Link
          href={`/human?channel=${encodeURIComponent(channel)}`}
          className="nova-btn"
          style={{ textDecoration: "none" }}
        >
          Human
        </Link>
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
            Nothing yet. Just talk — pricing, interrupt, seats, demo. No button to hold.
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
                {line.role === "agent" ? "MAYA" : "YOU"}
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
        {lead?.company || lead?.seats || lead?.status ? (
          <article className="nova-card">
            <div className="nova-card__head">
              <span className="nova-card__verb">Lead</span>
              <span className="nova-card__kind">{lead.status}</span>
            </div>
            <div className="nova-card__title">
              {[lead.company, lead.name].filter(Boolean).join(" · ") || "Buyer"}
            </div>
            <div className="nova-card__detail">
              {[
                lead.seats ? `${lead.seats} seats` : null,
                lead.competitor ? `vs ${lead.competitor}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </article>
        ) : null}
        {cards.length === 0 ? (
          <p className="nova-empty">
            Everything Maya actually does lands here — pricing, CRM writes, demo bookings,
            human handoff.
          </p>
        ) : (
          cards.map((c) => (
            <article key={c.key} className="nova-card nova-card--flash">
              <div className="nova-card__head">
                <span className="nova-card__verb">{c.verb}</span>
                <span className="nova-card__kind">{c.kind}</span>
              </div>
              <div className="nova-card__title">{c.title}</div>
              {c.detail ? (
                <div className="nova-card__detail">{c.detail}</div>
              ) : null}
            </article>
          ))
        )}
      </aside>

      {gateOpen && !call.connected ? (
        <div className="nova-gate">
          <div className="nova-gate__mark">MOLVAANI</div>
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
              {call.connecting ? "Connecting…" : "Wake MolVaani"}
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
