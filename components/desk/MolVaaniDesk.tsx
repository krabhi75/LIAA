"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAetherCall } from "@/hooks/useAetherCall";
import { useNow } from "@/hooks/useNow";
import { CUSTOMER_UID } from "@/lib/ids";
import {
  dealEconomics,
  formatDuration,
  formatInr,
  formatIst,
  formatUsd,
  stageLabel,
  winProbability,
} from "@/lib/metrics";
import { FlashValue, LiveMoney, Waveform } from "./primitives";

const PLAYBOOK = [
  {
    id: "pricing",
    label: "Ask pricing first",
    hint: "Pehle rate / per user",
    test: /pric|kitna|cost|per user|rate|usd|dollar/i,
  },
  {
    id: "interrupt",
    label: "Interrupt with a competitor",
    hint: "Slack / Teams / wait",
    test: /slack|teams|asana|notion|wait|interrupt|alag/i,
  },
  {
    id: "seats",
    label: "Change seat count",
    hint: "Seats / users / 50",
    test: /seat|users?|fifty|\b50\b|pachaas/i,
  },
  {
    id: "demo",
    label: "Ask for an enterprise demo",
    hint: "Demo / Thursday / IST",
    test: /demo|enterprise|calendar|thursday|book/i,
  },
] as const;

export function MolVaaniDesk({ channel }: { channel: string }) {
  const call = useAetherCall(channel, CUSTOMER_UID);
  const now = useNow(1000);
  const lead = call.session?.lead;
  const tools = call.session?.tools ?? [];
  const economics = dealEconomics(lead);
  const win = winProbability(
    lead,
    tools,
    call.transcripts.filter((l) => l.final).length,
  );
  const talkTotal = call.telemetry.agentTalkMs + call.telemetry.listenMs;
  const agentShare =
    call.connected && talkTotal > 0
      ? call.telemetry.agentTalkMs / talkTotal
      : 0;
  const turns = call.transcripts.filter((l) => l.final).length;
  const words = call.transcripts.reduce(
    (n, l) => n + l.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  const humanHref = `/human?channel=${encodeURIComponent(channel)}`;
  const playbook = useMemo(
    () =>
      PLAYBOOK.map((step) => ({
        ...step,
        done: call.transcripts.some((line) => step.test.test(line.text)),
      })),
    [call.transcripts],
  );
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [call.transcripts]);

  const status = call.connected
    ? call.agentSpeaking
      ? "Maya speaking"
      : "Listening"
    : "Idle";

  return (
    <div className="min-h-full bg-[#f4f6f8]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">MolVaani</h1>
          <p className="text-xs text-slate-500">Voice revenue desk · EchoSphere PS21 · Agora</p>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                call.connected
                  ? call.agentSpeaking
                    ? "speak-dot bg-blue-600"
                    : "live-dot bg-emerald-600"
                  : "bg-slate-300"
              }`}
            />
            <span className="text-slate-700">{status}</span>
          </div>
          <div>
            <span className="text-xs text-slate-500">Duration </span>
            <span className="num font-medium">{formatDuration(call.telemetry.elapsedMs)}</span>
          </div>
          <div className="hidden md:block">
            <span className="text-xs text-slate-500">IST </span>
            <span className="num">{formatIst(now)}</span>
          </div>
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {!call.connected ? (
            <button
              onClick={call.start}
              disabled={!channel}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Start live call
            </button>
          ) : (
            <button
              onClick={call.stop}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
            >
              End call
            </button>
          )}
          <a
            href={humanHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
          >
            Open human specialist
          </a>
          {call.mcpAttached ? (
            <span className="text-xs font-medium text-emerald-700">MCP live</span>
          ) : call.connected ? (
            <span className="text-xs text-amber-700">
              Voice live. Set PUBLIC_BASE_URL so Agora can write CRM.
            </span>
          ) : (
            <span className="text-xs text-slate-500">Microphone required. You can interrupt Maya.</span>
          )}
        </div>

        {call.error ? (
          <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {call.error}
          </p>
        ) : null}

        <section className="panel">
          <table className="sheet">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Detail</th>
                <th>Metric</th>
                <th>Value</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-slate-500">Annual contract</td>
                <td className="num font-semibold">
                  {economics.seats ? (
                    <LiveMoney value={economics.arrUsd} format={(n) => formatUsd(n)} />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-slate-500">
                  {economics.seats ? formatInr(economics.arrInr) : "Awaiting seats"}
                </td>
                <td className="text-slate-500">Monthly run-rate</td>
                <td className="num font-semibold">
                  {economics.seats ? (
                    <LiveMoney value={economics.monthlyUsd} format={(n) => formatUsd(n)} />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-slate-500">
                  <FlashValue value={economics.seats || null} /> seats
                  {economics.plan ? ` · ${economics.plan.name}` : ""}
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Close probability</td>
                <td className="num font-semibold">{win}%</td>
                <td className="text-slate-500">From CRM + talk</td>
                <td className="text-slate-500">Talk mix</td>
                <td className="num font-semibold">{Math.round(agentShare * 100)}% Maya</td>
                <td className="text-slate-500">
                  {Math.round((1 - agentShare) * 100)}% buyer / listen
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Turns</td>
                <td className="num font-semibold">
                  <FlashValue value={turns} />
                </td>
                <td className="text-slate-500">Final transcript lines</td>
                <td className="text-slate-500">Words / tools</td>
                <td className="num font-semibold">
                  <FlashValue value={words} /> / <FlashValue value={tools.length} />
                </td>
                <td className="text-slate-500">
                  {call.remoteUsers.length} remote · {channel}
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Audio</td>
                <td colSpan={5}>
                  <div className="flex items-center gap-4">
                    <Waveform
                      buyer={call.telemetry.buyerLevel}
                      agent={call.telemetry.agentLevel}
                      active={call.connected}
                    />
                    <span className="num text-xs text-slate-500">
                      Buyer {Math.round(call.telemetry.buyerLevel * 100)} · Maya{" "}
                      {Math.round(call.telemetry.agentLevel * 100)}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="panel flex max-h-[560px] flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Live transcript
            </div>
            <div ref={scroller} className="min-h-0 flex-1 overflow-auto">
              <table className="sheet">
                <thead className="sticky top-0">
                  <tr>
                    <th className="w-24">Time</th>
                    <th className="w-20">Speaker</th>
                    <th>Text</th>
                    <th className="w-16">State</th>
                  </tr>
                </thead>
                <tbody>
                  {call.transcripts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-slate-500">
                        Allow the microphone, then speak. Pricing, interruption, seats, demo — Maya is not scripted.
                      </td>
                    </tr>
                  ) : (
                    call.transcripts.map((line, i) => (
                      <tr key={`${line.at}-${i}`}>
                        <td className="num text-slate-500">
                          {new Date(line.at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false,
                          })}
                        </td>
                        <td className="font-medium">
                          {line.role === "agent" ? "Maya" : "You"}
                        </td>
                        <td>{line.text}</td>
                        <td className="text-slate-500">{line.final ? "Final" : "Live"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-4">
            <section className="panel">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                CRM lead
              </div>
              <table className="sheet">
                <tbody>
                  <Row label="Account" value={lead?.company} />
                  <Row label="Buyer" value={lead?.name} />
                  <Row label="Stage" value={stageLabel(lead?.status)} />
                  <Row label="Seats" value={lead?.seats} />
                  <Row label="Plan" value={economics.plan?.name} />
                  <Row
                    label="List / user"
                    value={
                      economics.plan
                        ? economics.plan.pricePerUserUsd === "custom"
                          ? "Custom"
                          : formatUsd(economics.plan.pricePerUserUsd)
                        : undefined
                    }
                  />
                  <Row label="Competitor" value={lead?.competitor} />
                  <Row
                    label="Objections"
                    value={lead?.objections?.length ? lead.objections.join(", ") : undefined}
                  />
                  <Row
                    label="Meeting"
                    value={call.session?.meetings?.[0]?.label}
                  />
                </tbody>
              </table>
              {call.session?.escalation ? (
                <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                  <div className="font-medium text-amber-800">Human requested</div>
                  <p>{call.session.escalation.reason}</p>
                  <p className="text-slate-600">{call.session.escalation.summary}</p>
                </div>
              ) : null}
            </section>

            <section className="panel max-h-48 overflow-auto">
              <table className="sheet">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Tool</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-slate-500">
                        Waiting for MCP tool calls
                      </td>
                    </tr>
                  ) : (
                    tools.map((t, i) => (
                      <tr key={`${t.at}-${i}`}>
                        <td className="num text-slate-500">{t.at.slice(11, 19)}</td>
                        <td className="font-medium">{t.tool}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <table className="sheet">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Judge playbook (you speak this)</th>
                    <th className="w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {playbook.map((step, i) => (
                    <tr key={step.id}>
                      <td className="num text-slate-500">{i + 1}</td>
                      <td>
                        {step.label}
                        <span className="block text-xs text-slate-500">{step.hint}</span>
                      </td>
                      <td className={step.done ? "font-medium text-emerald-700" : "text-slate-500"}>
                        {step.done ? "Done" : "Pending"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  return (
    <tr>
      <td className="w-36 text-slate-500">{label}</td>
      <td className="font-medium">
        <FlashValue value={value ?? null} />
      </td>
    </tr>
  );
}
