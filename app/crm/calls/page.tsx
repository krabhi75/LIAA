"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/stitch/Shell";
import { Icon } from "@/components/stitch/Icon";
import {
  type Call,
  isInbound,
  isLive,
  jsonSafe,
  when,
} from "@/components/stitch/crm";

export default function LiveCallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/crm/calls");
    const data = await jsonSafe(res);
    setCalls((data.calls as Call[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 2500);
    return () => clearInterval(t);
  }, [load]);

  const live = calls.filter((c) => isLive(c.status));
  const hot = calls.filter((c) =>
    /escalat|expert|fail/i.test(`${c.disposition} ${c.status}`),
  );

  return (
    <Shell title="Live Calls">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="ks-pulse h-2 w-2 rounded-full bg-ks-primary" />
            <span className="text-[12px] font-semibold uppercase tracking-widest text-ks-primary">
              Real-time monitor
            </span>
          </div>
          <h2 className="ks-display text-4xl font-bold">Active operations</h2>
        </div>
        <div className="flex gap-4">
          <div className="min-w-[140px] rounded-lg border border-ks-outline bg-ks-surface p-4 shadow-sm">
            <span className="text-xs text-ks-muted">Active calls</span>
            <div className="mt-1 font-ks-display text-3xl font-semibold text-ks-primary">
              {live.length}
            </div>
          </div>
          <div className="min-w-[140px] rounded-lg border border-ks-error/20 bg-ks-error-soft p-4 shadow-sm">
            <span className="text-xs text-ks-error">Needs attention</span>
            <div className="mt-1 font-ks-display text-3xl font-semibold text-ks-error">
              {hot.length}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ks-outline bg-ks-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-ks-outline p-4">
          <p className="text-sm font-medium">All directions</p>
          <span className="text-sm text-ks-muted">{calls.length} logged</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ks-low text-xs uppercase tracking-wider text-ks-muted">
              <tr>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Phone / direction</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">AI status</th>
                <th className="px-4 py-3">Disposition</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calls.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-ks-muted" colSpan={6}>
                    Waiting for inbound or outbound. Dial from Farmers or call
                    +91 79714 43138.
                  </td>
                </tr>
              ) : (
                calls.map((call) => {
                  const inbound = isInbound(call.direction);
                  const liveCall = isLive(call.status);
                  const alert = /escalat|expert|fail/i.test(
                    `${call.disposition} ${call.status}`,
                  );
                  const farmerHref = call.contactId
                    ? `/crm/farmers/${call.contactId}`
                    : "/crm";
                  return (
                    <tr
                      key={call.id}
                      className={`border-t border-ks-line hover:bg-ks-low ${alert ? "bg-ks-error-soft/40" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {call.contact?.name ?? "Farmer"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            className="inline-flex items-center gap-1 text-ks-primary hover:underline"
                            href={`tel:${call.phone}`}
                          >
                            <Icon name="call" className="text-[16px]" />
                            {call.phone}
                          </a>
                          <span className="rounded-full bg-ks-container px-2 py-0.5 text-xs">
                            {inbound ? "Inbound" : "Outbound"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {when(call.startedAt)}
                      </td>
                      <td className="px-4 py-3">
                        {liveCall ? (
                          <div className="flex items-center gap-2 text-ks-primary">
                            <span className="flex h-4 items-end gap-0.5">
                              <span className="ks-wave w-1 rounded-t bg-ks-primary" />
                              <span className="ks-wave w-1 rounded-t bg-ks-primary" />
                              <span className="ks-wave w-1 rounded-t bg-ks-primary" />
                            </span>
                            <span className="text-xs font-medium">
                              {call.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-ks-muted">{call.status}</span>
                        )}
                        {call.lastSpeech ? (
                          <p className="mt-1 max-w-xs truncate text-xs text-ks-muted">
                            {call.lastSpeech}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        {alert ? (
                          <span className="rounded-full bg-ks-error px-2 py-0.5 text-xs text-white">
                            {call.disposition || "Attention"}
                          </span>
                        ) : (
                          <span className="text-ks-muted">
                            {call.disposition || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={farmerHref}
                          className="rounded-md border border-ks-primary px-3 py-1.5 text-xs font-medium text-ks-primary hover:bg-ks-low"
                        >
                          View call
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
