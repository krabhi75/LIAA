"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAetherCall } from "@/hooks/useAetherCall";
import { api } from "@/lib/api";
import { HUMAN_UID } from "@/lib/ids";

function HumanDesk() {
  const params = useSearchParams();
  const channel = params.get("channel") ?? "";
  const call = useAetherCall(channel, HUMAN_UID, { inviteAgent: false });
  const waiting = call.session?.escalation?.waiting;

  const hint = useMemo(() => {
    if (!channel) return "Open this page from the main call using Open human specialist.";
    if (waiting) return "Customer is waiting. Join the live Agora channel and take over.";
    return "Join the same RTC channel. If Maya is still speaking, end the agent from the main desk after you connect.";
  }, [channel, waiting]);

  return (
    <div className="min-h-full p-6">
      <p className="text-[11px] tracking-[0.2em] uppercase text-[#d4b15f]">
        Human specialist
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Warm transfer desk</h1>
      <p className="mt-2 max-w-xl text-sm text-[#8b97ab]">{hint}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          disabled={!channel || call.connected}
          onClick={call.start}
          className="rounded-md bg-[#d4b15f] px-4 py-2 text-sm font-semibold text-[#0c0f14]"
        >
          Join live channel
        </button>
        {call.connected ? (
          <button
            onClick={call.stop}
            className="rounded-md bg-[#f87171] px-4 py-2 text-sm font-semibold text-[#0c0f14]"
          >
            Leave
          </button>
        ) : null}
        {call.session?.agentId ? (
          <button
            onClick={() => {
              void api.stop(call.session!.agentId!);
            }}
            className="rounded-md border border-[#2a3344] px-4 py-2 text-sm"
          >
            Stop Maya (handover)
          </button>
        ) : null}
      </div>

      {call.error ? (
        <p className="mt-4 text-sm text-[#f87171]">{call.error}</p>
      ) : null}

      {call.session?.escalation ? (
        <section className="mt-8 max-w-xl rounded-xl border border-[#2a3344] bg-[#141922] p-5">
          <h2 className="text-sm font-medium text-[#d4b15f]">Conversation context</h2>
          <p className="mt-2 text-sm">{call.session.escalation.reason}</p>
          <p className="mt-2 text-sm text-[#8b97ab]">{call.session.escalation.summary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-[11px] uppercase text-[#8b97ab]">Company</dt>
              <dd>{call.session.lead?.company || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase text-[#8b97ab]">Seats</dt>
              <dd>{call.session.lead?.seats ?? "—"}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}

export default function HumanPage() {
  return (
    <Suspense fallback={<p className="p-6 text-[#8b97ab]">Loading desk…</p>}>
      <HumanDesk />
    </Suspense>
  );
}
