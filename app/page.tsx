"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/stitch/Shell";
import { Icon } from "@/components/stitch/Icon";
import {
  type AgriCase,
  type Call,
  type Contact,
  isInbound,
  isLive,
  jsonSafe,
  when,
} from "@/components/stitch/crm";

function Card({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-ks-outline bg-ks-surface p-4 shadow-[0_2px_4px_rgba(0,0,0,0.04)] ${accent ? "relative overflow-hidden" : ""}`}
    >
      {accent ? (
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-ks-secondary" />
      ) : null}
      <div className={`flex items-start justify-between ${accent ? "pl-2" : ""}`}>
        <p className="text-[12px] font-semibold uppercase tracking-wider text-ks-muted">
          {label}
        </p>
        <span className="rounded-md bg-ks-low p-1 text-ks-primary-container">
          <Icon name={icon} />
        </span>
      </div>
      <h3 className={`ks-display mt-2 text-3xl font-semibold ${accent ? "pl-2" : ""}`}>
        {value}
      </h3>
      <p className={`mt-1 text-sm text-ks-muted ${accent ? "pl-2" : ""}`}>{hint}</p>
    </div>
  );
}

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
  const [hello, setHello] = useState("Good evening");
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
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
    );
    if (hour < 12) setHello("Good morning");
    else if (hour < 17) setHello("Good afternoon");
    else setHello("Good evening");

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

  const live = calls.filter((c) => isLive(c.status)).length;
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
  const funnel = [
    { label: "Total calls", value: calls.length },
    { label: "Inbound conversations", value: inbound },
    { label: "Cases opened", value: cases.length },
    { label: "Closed / resolved", value: closed },
    { label: "Expert required", value: escalated },
  ];

  const crops = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of cases) {
      const crop = (row.crop || "Unknown").trim() || "Unknown";
      map.set(crop, (map.get(crop) ?? 0) + 1);
    }
    const list = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const total = list.reduce((n, [, v]) => n + v, 0) || 1;
    return list.map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [cases]);

  const issues = useMemo(() => {
    const keys = [
      ["disease", "Crop disease"],
      ["pani|water|irrig", "Irrigation"],
      ["keeda|pest", "Pest control"],
      ["khad|fert", "Fertilizer"],
      ["scheme|yojana", "Schemes"],
    ] as const;
    const buckets = keys.map(([re, label]) => {
      const rx = new RegExp(re, "i");
      const n = cases.filter((c) =>
        rx.test(`${c.summary} ${c.symptoms ?? ""} ${c.crop}`),
      ).length;
      return { label, n };
    });
    const total = buckets.reduce((s, b) => s + b.n, 0) || 1;
    return buckets.map((b) => ({ ...b, pct: Math.round((b.n / total) * 100) }));
  }, [cases]);

  return (
    <Shell title="Overview">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="ks-display text-3xl font-bold text-ks-on-surface md:text-4xl">
            {hello}, Abhishek
          </h2>
          <p className="mt-2 max-w-3xl text-base text-ks-muted md:text-lg">
            Live field operations across Liaa voice, inbound DID, and outbound CRM
            dials.
          </p>
        </div>
        <div className="text-right text-sm text-ks-muted">
          <p>
            {loading ? "Loading…" : "Live CRM"} · refreshes every 3s
          </p>
          <p>{updatedAt ? `Updated ${when(updatedAt)}` : "—"}</p>
          {error ? <p className="text-ks-error">{error}</p> : null}
          <button
            type="button"
            className="mt-1 text-ks-primary underline"
            onClick={() => void load()}
          >
            Refresh now
          </button>
        </div>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          label="Total farmers"
          value={contacts.length}
          hint="From /api/crm/contacts"
          icon="groups"
        />
        <Card
          label="Calls logged"
          value={calls.length}
          hint={`${inbound} inbound · ${outbound} outbound`}
          icon="call"
        />
        <Card
          label="Live now"
          value={live}
          hint="Queued, ringing, or in progress"
          icon="graphic_eq"
          accent
        />
        <Card
          label="Expert escalations"
          value={escalated}
          hint="Human agri expert needed"
          icon="record_voice_over"
        />
        <Card
          label="Open cases"
          value={open}
          hint={`${cases.length} total · ${closed} closed`}
          icon="folder_open"
        />
        <Card
          label="Last activity"
          value={lastCall ? when(lastCall.startedAt) : "—"}
          hint={
            lastCall
              ? `${lastCall.phone} · ${lastCall.status}`
              : "No calls yet"
          }
          icon="schedule"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-ks-outline bg-ks-surface p-6 shadow-[0_2px_4px_rgba(0,0,0,0.04)] lg:col-span-8">
          <h3 className="ks-display text-xl font-semibold">Call mix</h3>
          <p className="text-sm text-ks-muted">Inbound vs outbound from live CRM</p>
          <div className="mt-8 flex h-48 items-end gap-8 px-4">
            <Bar label="Inbound" h={inbound} max={funnelMax} color="bg-ks-primary" />
            <Bar
              label="Outbound"
              h={outbound}
              max={funnelMax}
              color="bg-ks-secondary"
            />
            <Bar label="Live" h={live} max={funnelMax} color="bg-ks-mint" />
            <Bar
              label="Cases"
              h={cases.length}
              max={funnelMax}
              color="bg-ks-primary-container"
            />
          </div>
        </div>

        <div className="rounded-xl border border-ks-outline bg-ks-surface p-6 shadow-[0_2px_4px_rgba(0,0,0,0.04)] lg:col-span-4">
          <h3 className="ks-display text-xl font-semibold">Escalation funnel</h3>
          <p className="mb-4 text-sm text-ks-muted">Widths follow live counts</p>
          {funnel.map((step) => (
            <FunnelStep
              key={step.label}
              label={step.label}
              value={step.value}
              pct={Math.max(18, Math.round((step.value / funnelMax) * 100))}
            />
          ))}
        </div>

        <div className="rounded-xl border border-ks-outline bg-ks-surface p-6 lg:col-span-6">
          <h3 className="ks-display mb-4 text-xl font-semibold">Top farmer issues</h3>
          {issues.every((i) => i.n === 0) ? (
            <p className="text-sm text-ks-muted">
              Issues fill in as farmers speak on the call.
            </p>
          ) : (
            <div className="space-y-4">
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

        <div className="rounded-xl border border-ks-outline bg-ks-surface p-6 lg:col-span-6">
          <h3 className="ks-display mb-4 text-xl font-semibold">Crop focus</h3>
          {crops.length === 0 ? (
            <p className="text-sm text-ks-muted">Crops appear from case intake.</p>
          ) : (
            <div className="space-y-3">
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
      </section>
    </Shell>
  );
}

function Bar({
  label,
  h,
  max,
  color,
}: {
  label: string;
  h: number;
  max: number;
  color: string;
}) {
  const pct = Math.max(h > 0 ? 8 : 2, Math.round((h / Math.max(max, 1)) * 100));
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-end gap-2">
      <div className={`w-full rounded-t-sm ${color}`} style={{ height: `${pct}%` }} />
      <span className="text-[11px] text-ks-muted">{label}</span>
      <span className="ks-display text-sm font-semibold">{h}</span>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  pct,
}: {
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div className="mx-auto mb-2" style={{ width: `${pct}%` }}>
      <div className="flex items-center justify-between rounded-lg border border-ks-outline bg-ks-low px-3 py-2">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-bold text-ks-primary">{value}</span>
      </div>
    </div>
  );
}
