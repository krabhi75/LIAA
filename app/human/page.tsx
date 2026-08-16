"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAetherCall } from "@/hooks/useAetherCall";
import { useNow } from "@/hooks/useNow";
import { api } from "@/lib/api";
import { HUMAN_UID } from "@/lib/ids";
import {
  dealEconomics,
  formatDuration,
  formatInr,
  formatIst,
  formatUsd,
  stageLabel,
} from "@/lib/metrics";
import { AppShell } from "@/components/desk/AppShell";
import { FlashValue, LiveMoney } from "@/components/desk/primitives";

function HumanDesk() {
  const params = useSearchParams();
  const channel = params.get("channel") ?? "";
  const call = useAetherCall(channel, HUMAN_UID, { inviteAgent: false });
  const now = useNow(1000);
  const waiting = call.session?.escalation?.waiting;
  const lead = call.session?.lead;
  const economics = dealEconomics(lead);

  const hint = useMemo(() => {
    if (!channel) return "Open this page from Live call → Human specialist.";
    if (waiting) return "Buyer is waiting. Join the Agora channel and take over.";
    return "Join the same RTC channel. After you connect, stop Maya for a clean handover.";
  }, [channel, waiting]);

  const status = call.connected ? "On channel" : "Idle";

  return (
    <AppShell
      active="human"
      channel={channel}
      status={status}
      duration={formatDuration(call.telemetry.elapsedMs)}
      ist={formatIst(now)}
      mcpAttached={call.mcpAttached}
      connected={call.connected}
      connecting={call.connecting}
      onStart={call.start}
      onStop={call.stop}
      startDisabled={!channel || call.connecting}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{hint}</p>
        {call.session?.agentId ? (
          <button
            onClick={() => {
              void api.stop(call.session!.agentId!, channel);
            }}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm"
          >
            Stop Maya
          </button>
        ) : null}
        {call.error ? <p className="text-sm text-red-700">{call.error}</p> : null}

        <section className="panel">
          <table className="sheet">
            <thead>
              <tr>
                <th>Field</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-slate-500">Account</td>
                <td className="font-medium">
                  <FlashValue value={lead?.company} fallback="No account yet" />
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Stage</td>
                <td>{stageLabel(lead?.status)}</td>
              </tr>
              <tr>
                <td className="text-slate-500">ACV</td>
                <td className="num font-semibold">
                  {economics.seats ? (
                    <>
                      <LiveMoney value={economics.arrUsd} format={(n) => formatUsd(n)} />
                      <span className="ml-2 font-normal text-slate-500">
                        {formatInr(economics.arrInr)}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Seats</td>
                <td>
                  <FlashValue value={lead?.seats ?? null} />
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Plan</td>
                <td>
                  <FlashValue value={economics.plan?.name} />
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Competitor</td>
                <td>
                  <FlashValue value={lead?.competitor} />
                </td>
              </tr>
              <tr>
                <td className="text-slate-500">Channel</td>
                <td className="font-mono text-xs">{channel || "—"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {call.session?.escalation ? (
          <section className="panel">
            <table className="sheet">
              <thead>
                <tr>
                  <th>Conversation context</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <p className="font-medium">{call.session.escalation.reason}</p>
                    <p className="mt-1 text-slate-600">{call.session.escalation.summary}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function HumanPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate-500">Loading specialist desk…</p>}>
      <HumanDesk />
    </Suspense>
  );
}
