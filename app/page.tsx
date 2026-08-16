"use client";

import { useEffect, useMemo, useState } from "react";
import { useAetherCall } from "@/hooks/useAetherCall";
import { CUSTOMER_UID, newChannelName } from "@/lib/ids";

const JUDGE_SCRIPT = [
  "Ask about pricing first.",
  "Interrupt and compare Nimbus with Slack or Teams.",
  "Change the expected number of users mid-call.",
  "Ask for an enterprise demonstration.",
];

export default function Home() {
  const [channel, setChannel] = useState("");
  useEffect(() => {
    setChannel(newChannelName());
  }, []);
  const call = useAetherCall(channel, CUSTOMER_UID);
  const humanHref = useMemo(
    () => `/human?channel=${encodeURIComponent(channel)}`,
    [channel],
  );

  const lead = call.session?.lead;
  const outcome =
    lead?.status === "demo_booked"
      ? "Demo booked"
      : lead?.status === "escalated"
        ? "Human escalation"
        : lead?.status === "qualified"
          ? "Lead qualified"
          : lead?.status === "follow_up"
            ? "Follow-up created"
            : "In conversation";

  return (
    <div className="min-h-full">
      <header className="flex items-center justify-between border-b border-[#2a3344] px-6 py-4">
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#d4b15f]">
            EchoSphere PS21 · Agora Conversational AI
          </p>
          <h1 className="text-xl font-semibold tracking-tight">AetherClose</h1>
        </div>
        <div className="text-right text-sm text-[#8b97ab]">
          <div>Channel {channel}</div>
          <div>
            {call.connected
              ? call.agentSpeaking
                ? "Agent speaking — interrupt anytime"
                : "Listening"
              : "Idle"}
          </div>
        </div>
      </header>

      <main className="grid gap-4 p-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-[#2a3344] bg-[#141922] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {!call.connected ? (
              <button
                onClick={call.start}
                disabled={!channel}
                className="rounded-md bg-[#d4b15f] px-4 py-2 text-sm font-semibold text-[#0c0f14]"
              >
                Start live call
              </button>
            ) : (
              <button
                onClick={call.stop}
                className="rounded-md bg-[#f87171] px-4 py-2 text-sm font-semibold text-[#0c0f14]"
              >
                End call
              </button>
            )}
            <a
              href={humanHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-[#2a3344] px-4 py-2 text-sm text-[#e8edf5]"
            >
              Open human specialist
            </a>
            {call.mcpAttached ? (
              <span className="text-xs text-[#6ee7b7]">MCP tools attached</span>
            ) : call.connected ? (
              <span className="text-xs text-[#fbbf24]">
                Voice is live. Set PUBLIC_BASE_URL to the Cloudflare HTTPS URL so Agora can write CRM.
              </span>
            ) : null}
          </div>

          {call.error ? (
            <p className="mb-4 rounded-md border border-[#f87171]/40 bg-[#f87171]/10 p-3 text-sm text-[#f87171]">
              {call.error}
            </p>
          ) : null}

          <h2 className="mb-2 text-sm font-medium text-[#8b97ab]">Live transcript</h2>
          <ol className="flex h-[420px] flex-col gap-3 overflow-y-auto rounded-lg bg-[#0c0f14] p-4 text-sm">
            {call.transcripts.length === 0 ? (
              <li className="text-[#8b97ab]">
                Allow the microphone, then speak. Agora handles turn-taking and
                barge-in — you can interrupt Maya.
              </li>
            ) : (
              call.transcripts.map((line, i) => (
                <li key={`${i}-${line.text.slice(0, 12)}`}>
                  <span
                    className={
                      line.role === "agent"
                        ? "font-medium text-[#d4b15f]"
                        : "font-medium text-[#e8edf5]"
                    }
                  >
                    {line.role === "agent" ? "Maya" : "You"}
                  </span>
                  <span className="text-[#8b97ab]">
                    {line.final ? "" : " …"}
                  </span>
                  <div className="mt-1 leading-6">{line.text}</div>
                </li>
              ))
            )}
          </ol>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-[#2a3344] bg-[#141922] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#8b97ab]">CRM · live lead</h2>
              <span className="rounded-full border border-[#d4b15f]/40 px-2 py-0.5 text-xs text-[#d4b15f]">
                {outcome}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <Field label="Name" value={lead?.name} />
              <Field label="Company" value={lead?.company} />
              <Field label="Seats" value={lead?.seats?.toString()} />
              <Field label="Plan" value={lead?.planId} />
              <Field label="Competitor" value={lead?.competitor} />
              <Field
                label="Objections"
                value={lead?.objections?.join(", ")}
              />
            </dl>
            {call.session?.meetings?.[0] ? (
              <p className="mt-3 text-sm text-[#6ee7b7]">
                Booked: {call.session.meetings[0].label}
              </p>
            ) : null}
            {call.session?.escalation ? (
              <div className="mt-3 rounded-md border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-3 text-sm">
                <div className="font-medium text-[#fbbf24]">Human requested</div>
                <p className="mt-1 text-[#e8edf5]">
                  {call.session.escalation.reason}
                </p>
                <p className="mt-1 text-[#8b97ab]">
                  {call.session.escalation.summary}
                </p>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-[#2a3344] bg-[#141922] p-5">
            <h2 className="mb-2 text-sm font-medium text-[#8b97ab]">
              Tool calls this session
            </h2>
            <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-[#8b97ab]">
              {(call.session?.tools ?? []).length === 0 ? (
                <li>Waiting for MCP tool calls from the Agora agent.</li>
              ) : (
                call.session?.tools?.map((t, i) => (
                  <li key={`${t.at}-${i}`}>
                    <span className="text-[#d4b15f]">{t.tool}</span> · {t.at.slice(11, 19)}
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-[#2a3344] bg-[#1b2230] p-5">
            <h2 className="mb-2 text-sm font-medium text-[#d4b15f]">
              Judge demo path (you say this — Maya must not be scripted)
            </h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[#e8edf5]">
              {JUDGE_SCRIPT.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </aside>
      </main>
      <footer className="border-t border-[#2a3344] px-6 py-4 text-xs text-[#8b97ab]">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>Agora Conversational AI · RTC · RTM</span>
          <span>Deepgram · GPT-4o-mini · MiniMax</span>
          <span>MCP tools · CRM · calendar · human escalation</span>
          <a
            className="text-[#d4b15f]"
            href="https://whimsical.com/aetherclose-architecture-echosphere-ps21-Sp4yxNN5P85iFaowhtygnj"
            target="_blank"
            rel="noreferrer"
          >
            Architecture
          </a>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-[#8b97ab]">{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
