"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/stitch/Shell";
import {
  type AgriCase,
  type Call,
  type Contact,
  isInbound,
  isCallLive,
  jsonSafe,
  when,
} from "@/components/stitch/crm";
import { MetricTile, PageHeader } from "@/components/stitch/crm-ui";
import { CallMixChart } from "@/components/stitch/CallMixChart";
import {
  buildCropBuckets,
  buildIssueBuckets,
} from "@/lib/dashboard-insights";

async function fetchCrm(path: string) {
  const res = await fetch(`${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  return jsonSafe(res);
}

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [cases, setCases] = useState<AgriCase[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [c, k, a] = await Promise.all([
        fetchCrm("/api/crm/contacts"),
        fetchCrm("/api/crm/calls"),
        fetchCrm("/api/crm/cases"),
      ]);
      setContacts((c.contacts as Contact[]) ?? []);
      setCalls((k.calls as Call[]) ?? []);
      setCases((a.cases as AgriCase[]) ?? []);
      setUpdatedAt(new Date().toISOString());
      setError("");
    } catch {
      setError("Could not refresh CRM snapshot");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 3000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void load();
    });
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const live = calls.filter((c) => isCallLive(c)).length;
  const inbound = calls.filter((c) => isInbound(c.direction)).length;
  const outbound = calls.length - inbound;
  const escalated = cases.filter((c) => c.status === "escalated").length;
  const closed = cases.filter((c) =>
    ["closed", "resolved", "completed"].includes((c.status || "").toLowerCase()),
  ).length;
  const open = cases.filter((c) => {
    const s = (c.status || "open").toLowerCase();
    return s === "open" || s === "";
  }).length;
  const lastCall = calls[0];

  const funnelMax = Math.max(calls.length, cases.length, 1);
  // True nest: calls → cases → still open → expert (closed is exit, not a deeper stage)
  const funnel = [
    { label: "Total calls", value: calls.length },
    { label: "Cases opened", value: cases.length },
    { label: "Still open", value: open },
    { label: "Expert escalated", value: escalated },
  ];

  const crops = useMemo(
    () => buildCropBuckets(contacts, calls, cases),
    [contacts, calls, cases],
  );

  const issues = useMemo(
    () => buildIssueBuckets(contacts, calls, cases),
    [contacts, calls, cases],
  );

  return (
    <Shell title="Overview">
      <PageHeader
        eyebrow="Operations dashboard"
        title="Field intelligence"
        description="Live metrics from farmers, calls, and agri cases across Liaa voice and CRM dials."
        meta={
          <div className="text-right text-xs text-ks-muted">
            <p>{loading ? "Syncing…" : "Auto-refresh · 3s"}</p>
            <p>{updatedAt ? `Updated ${when(updatedAt)}` : "—"}</p>
            {error ? <p className="text-ks-error">{error}</p> : null}
            <button
              type="button"
              className="mt-1 font-semibold text-ks-primary-container hover:underline"
              onClick={() => void load()}
            >
              Refresh
            </button>
          </div>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricTile label="Farmers" value={contacts.length} hint="CRM registry" />
        <MetricTile
          label="Calls"
          value={calls.length}
          hint={`${inbound} in · ${outbound} out`}
        />
        <MetricTile
          label="Live now"
          value={live}
          hint="Active legs"
          tone="live"
        />
        <MetricTile label="Escalations" value={escalated} hint="Expert queue" tone="warn" />
        <MetricTile
          label="Open cases"
          value={open}
          hint={`${closed} closed`}
        />
        <MetricTile
          label="Last activity"
          value={lastCall ? when(lastCall.startedAt) : "—"}
          hint={lastCall ? lastCall.phone : "No calls yet"}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="ks-record-panel lg:col-span-8">
          <div className="ks-record-panel__head">
            <h3 className="ks-record-panel__title">Call mix</h3>
          </div>
          <div className="ks-record-panel__body">
            <p className="mb-4 text-sm text-ks-muted">
              Direction split and operations volume from live CRM
            </p>
            <CallMixChart
              inbound={inbound}
              outbound={outbound}
              live={live}
              casesCount={cases.length}
            />
          </div>
        </div>

        <div className="ks-record-panel lg:col-span-4">
          <div className="ks-record-panel__head">
            <h3 className="ks-record-panel__title">Escalation funnel</h3>
          </div>
          <div className="ks-record-panel__body">
          <p className="mb-5 text-sm text-ks-muted">
            Call → case → open / close → expert
          </p>
          <EscalationFunnel steps={funnel} max={funnelMax} closed={closed} />
          </div>
        </div>

        <div className="ks-record-panel lg:col-span-6">
          <div className="ks-record-panel__head">
            <h3 className="ks-record-panel__title">Top farmer issues</h3>
          </div>
          <div className="ks-record-panel__body">
          {contacts.length === 0 ? (
            <p className="text-sm text-ks-muted">
              Issues appear once farmers are in the CRM — one category per
              farmer from call / case context.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-ks-muted">
                {contacts.length} farmers · one issue each
              </p>
              {issues.map((i) => (
                <div key={i.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{i.label}</span>
                    <span className="text-ks-muted">
                      {i.n} · {i.pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ks-low">
                    <div
                      className="h-full rounded-full bg-ks-primary"
                      style={{ width: `${Math.max(i.pct, i.n ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

        <div className="ks-record-panel lg:col-span-6">
          <div className="ks-record-panel__head">
            <h3 className="ks-record-panel__title">Crop focus</h3>
          </div>
          <div className="ks-record-panel__body">
          {crops.length === 0 ? (
            <p className="text-sm text-ks-muted">
              Set a crop on each farmer profile — focus splits only known crops
              (never Unknown).
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-ks-muted">
                From farmer crop fields · {crops.reduce((s, c) => s + c.count, 0)}{" "}
                with known crop
              </p>
              {crops.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-24 truncate text-sm">{c.name}</span>
                  <div className="h-8 flex-1 overflow-hidden rounded-sm bg-ks-low">
                    <div
                      className="h-full bg-ks-primary"
                      style={{ width: `${Math.max(c.pct, 10)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-ks-muted">{c.count}</span>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

/** Fixed trapezoid widths so the chart always reads as a funnel; counts are live. */
const FUNNEL_WIDTHS = [100, 82, 64, 46] as const;
const FUNNEL_TONES = [
  "bg-[#032d60] text-white",
  "bg-[#0176d3] text-white",
  "bg-[#014486] text-white",
  "bg-ks-secondary text-white",
] as const;

function EscalationFunnel({
  steps,
  max,
  closed,
}: {
  steps: { label: string; value: number }[];
  max: number;
  closed: number;
}) {
  return (
    <div>
      <div className="ks-funnel flex flex-col items-center">
        {steps.map((step, i) => {
          const width = FUNNEL_WIDTHS[Math.min(i, FUNNEL_WIDTHS.length - 1)]!;
          const tone = FUNNEL_TONES[Math.min(i, FUNNEL_TONES.length - 1)]!;
          const share = max > 0 ? Math.round((step.value / max) * 100) : 0;
          const prev = i > 0 ? steps[i - 1]!.value : null;
          const drop =
            prev != null && prev > 0
              ? Math.round((step.value / prev) * 100)
              : null;
          return (
            <div
              key={step.label}
              className="ks-funnel-step relative flex w-full flex-col items-center"
              style={{ width: `${width}%` }}
            >
              <div
                className={`ks-funnel-band flex min-h-[3.25rem] w-full items-center justify-between gap-3 px-4 py-3 ${tone}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium uppercase tracking-wide opacity-90">
                    {step.label}
                  </p>
                  {drop != null ? (
                    <p className="text-[10px] opacity-75">{drop}% of prior stage</p>
                  ) : (
                    <p className="text-[10px] opacity-75">{share}% of funnel top</p>
                  )}
                </div>
                <span className="ks-display shrink-0 text-2xl font-semibold tabular-nums leading-none">
                  {step.value}
                </span>
              </div>
              {i < steps.length - 1 ? (
                <div
                  className="ks-funnel-gap h-1.5 w-full bg-transparent"
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-ks-muted">
        Closed / resolved (exit):{" "}
        <span className="font-semibold text-ks-primary">{closed}</span>
      </p>
    </div>
  );
}
