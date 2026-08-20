"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAetherCall } from "@/hooks/useAetherCall";
import { CUSTOMER_UID } from "@/lib/ids";
import { NovaOrb } from "./NovaOrb";

type ActionCard = {
  key: string;
  at: string;
  verb: string;
  kind: string;
  title: string;
  detail: string;
  demo?: boolean;
  ask?: boolean;
  link?: string;
};

type ActionChain = {
  id: string;
  cards: ActionCard[];
  done: number;
  total: number;
};

const CHAIN_WINDOW_MS = 12_000;

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
      at,
      verb: embedded.verb ?? "किया",
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
    at,
    verb: "टूल",
    kind: tool,
    title: tool,
    detail: "",
  };
}

/** Group tools that fire close together into one linked progress chain. */
function buildChains(cardsChronological: ActionCard[]): ActionChain[] {
  if (cardsChronological.length === 0) return [];

  const chains: ActionChain[] = [];
  let current: ActionCard[] = [];
  let anchor = 0;

  for (const card of cardsChronological) {
    const t = Date.parse(card.at) || 0;
    if (current.length === 0) {
      current = [card];
      anchor = t;
      continue;
    }
    if (t - anchor <= CHAIN_WINDOW_MS) {
      current.push(card);
    } else {
      chains.push({
        id: current[0].key,
        cards: current,
        done: current.length,
        total: current.length,
      });
      current = [card];
      anchor = t;
    }
  }
  if (current.length) {
    chains.push({
      id: current[0].key,
      cards: current,
      done: current.length,
      total: current.length,
    });
  }
  return chains.reverse();
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
    "Nova को आपके माइक्रोफ़ोन की ज़रूरत है। एक बार अनुमति दें — फिर बात शुरू करें।",
  );
  const [booting, setBooting] = useState(true);
  const [showWake, setShowWake] = useState(false);
  const autoTried = useRef(false);
  const transcriptRef = useRef<HTMLElement>(null);
  const logRef = useRef<HTMLElement>(null);

  const tools = call.session?.tools ?? [];
  const agentLive = call.remoteUsers.length > 0 || call.agentSpeaking;

  const cardsChrono = useMemo(() => {
    return tools.map((t, i) => cardFromTool(t.tool, t.output, t.at, i));
  }, [tools]);

  const chains = useMemo(() => buildChains(cardsChrono), [cardsChrono]);

  const latestChainActive =
    chains.length > 0 &&
    chains[0].total > 1 &&
    Date.now() - (Date.parse(chains[0].cards[chains[0].cards.length - 1]?.at) || 0) <
      CHAIN_WINDOW_MS + 4000;

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [call.transcripts]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = 0;
  }, [chains.length, tools.length]);

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
            "इस साइट के लिए माइक्रोफ़ोन ब्लॉक है। एड्रेस बार में Allow करें, फिर पेज रीलोड करें।",
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

  async function startConversation() {
    setShowWake(false);
    setBooting(true);
    await call.start();
    setBooting(false);
  }

  async function stopConversation() {
    await call.stop();
    setGateOpen(true);
    setShowWake(true);
    setBooting(false);
    setGateHint("बातचीत बंद। जब तैयार हों, फिर से शुरू करें।");
  }

  return (
    <div className="nova-app">
      <header className="nova-bar">
        <span className="nova-mark">NOVA</span>
        <span className={`nova-dot ${agentLive ? "nova-dot--on" : ""}`}>
          {agentLive ? "एजेंट लाइव" : "एजेंट"}
        </span>
        <span
          className={`nova-dot ${call.mcpAttached ? "nova-dot--on" : "nova-dot--warn"}`}
        >
          {call.mcpAttached ? "टूल लाइव" : "टूल ऑफलाइन"}
        </span>
        <span className="nova-bar__spacer" />
        {call.error ? (
          <span className="nova-dot nova-dot--warn">{call.error.slice(0, 70)}</span>
        ) : null}
        {call.connected ? (
          <button
            type="button"
            className="nova-btn nova-btn--stop"
            onClick={stopConversation}
            disabled={call.connecting}
          >
            <span className="nova-ctrl">
              बातचीत बंद करें
              <small>Stop conversation</small>
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="nova-btn nova-btn--start"
            onClick={startConversation}
            disabled={call.connecting || booting}
          >
            <span className="nova-ctrl">
              {call.connecting || booting ? "जोड़ रहे हैं…" : "बातचीत शुरू करें"}
              <small>Start conversation</small>
            </span>
          </button>
        )}
      </header>

      <section className="nova-transcript" ref={transcriptRef as never}>
        <div className="nova-panel-head">
          <div>
            <div className="nova-label-hi">लाइव ट्रांसक्रिप्ट</div>
            <span className="nova-label">Hindi · realtime</span>
          </div>
          {call.connected ? <span className="nova-live-pill">लाइव</span> : null}
        </div>
        {call.transcripts.length === 0 ? (
          <p className="nova-empty">
            अभी कुछ नहीं। माइक ऑन करके हिंदी या हिंग्लिश में बोलें — कैलेंडर, मेल, या याद
            रखवाने के लिए कहें। ट्रांसक्रिप्ट यहाँ तुरंत दिखेगा।
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
                {line.role === "agent" ? "नोवा" : "आप"}
                {!line.final ? " · लिख रहा है…" : ""}
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
        {call.connected ? (
          <button
            type="button"
            className="nova-btn nova-btn--stop"
            onClick={stopConversation}
          >
            <span className="nova-ctrl">
              बातचीत बंद · ट्रांसक्रिप्ट रोकें
              <small>Stop conversation & transcription</small>
            </span>
          </button>
        ) : null}
      </div>

      <aside className="nova-log" ref={logRef as never}>
        <div className="nova-log__head">
          <div>
            <div className="nova-label-hi">क्रियाएँ · प्रगति</div>
            <span className="nova-label">linked actions</span>
          </div>
          <span className="nova-label">{cardsChrono.length || ""}</span>
        </div>
        {chains.length === 0 ? (
          <p className="nova-empty">
            जब Nova कई काम एक साथ करेगा (जैसे कैलेंडर पढ़ो → मीटिंग बनाओ → मेल ड्राफ्ट),
            यहाँ चरण-दर-चरण प्रगति दिखेगी। DEMO DATA बैज = डेमो डेटा।
          </p>
        ) : (
          chains.map((chain, chainIdx) => {
            const multi = chain.total > 1;
            const isLive = chainIdx === 0 && latestChainActive && multi;
            const pct = Math.round((chain.done / chain.total) * 100);

            if (!multi) {
              const c = chain.cards[0];
              return (
                <article
                  key={chain.id}
                  className={`nova-card nova-card--flash ${c.demo ? "nova-card--demo" : ""} ${
                    c.ask ? "nova-card--ask" : ""
                  }`}
                >
                  <div className="nova-card__head">
                    <span className="nova-card__verb">{c.verb}</span>
                    {c.demo ? (
                      <span className="nova-card__demo">DEMO DATA</span>
                    ) : null}
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
              );
            }

            return (
              <div key={chain.id} className="nova-chain">
                <div className="nova-chain__top">
                  <span className="nova-chain__title">
                    {isLive ? "लिंक की गई क्रियाएँ चल रही हैं" : "लिंक की गई क्रियाएँ पूरी"}
                  </span>
                  <span className="nova-chain__meta">
                    {chain.done}/{chain.total} · {pct}%
                  </span>
                </div>
                <div className="nova-progress" aria-hidden>
                  <div
                    className="nova-progress__bar"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="nova-steps">
                  {chain.cards.map((c, stepIdx) => {
                    const isLast = stepIdx === chain.cards.length - 1;
                    const stepClass = isLive && isLast
                      ? "nova-step--active"
                      : "nova-step--done";
                    return (
                      <div key={c.key} className={`nova-step ${stepClass}`}>
                        <div className="nova-step__rail">
                          <span className="nova-step__dot" />
                          <span className="nova-step__line" />
                        </div>
                        <article
                          className={`nova-card ${c.demo ? "nova-card--demo" : ""} ${
                            c.ask ? "nova-card--ask" : ""
                          }`}
                        >
                          <div className="nova-card__head">
                            <span className="nova-card__verb">
                              चरण {stepIdx + 1}/{chain.total} · {c.verb}
                            </span>
                            {c.demo ? (
                              <span className="nova-card__demo">DEMO DATA</span>
                            ) : null}
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
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </aside>

      {gateOpen && !call.connected ? (
        <div className="nova-gate">
          <div className="nova-gate__mark">NOVA</div>
          <p className="nova-gate__sub">{gateHint}</p>
          <div className="nova-gate__row">
            <span className={`nova-dot ${call.mcpAttached ? "nova-dot--on" : ""}`}>
              टूल
            </span>
            <span className="nova-dot nova-dot--on">agora</span>
          </div>
          {showWake ? (
            <button
              type="button"
              className="nova-btn nova-btn--primary"
              onClick={startConversation}
              disabled={call.connecting}
            >
              {call.connecting ? "जोड़ रहे हैं…" : "बातचीत शुरू करें"}
            </button>
          ) : null}
          {booting || call.connecting ? (
            <p className="nova-label">शुरू हो रहा है…</p>
          ) : null}
          {call.error ? <p className="nova-gate__err">{call.error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
