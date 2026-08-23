"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/stitch/Shell";
import { Icon } from "@/components/stitch/Icon";
import {
  type AgriCase,
  type Call,
  type Contact,
  initials,
  isCallLive,
  jsonSafe,
  when,
} from "@/components/stitch/crm";
import {
  DataTableShell,
  MetricTile,
  PageHeader,
  StatusBadge,
} from "@/components/stitch/crm-ui";

export default function FarmersPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [cases, setCases] = useState<AgriCase[]>([]);
  const [error, setError] = useState("");
  const [dialing, setDialing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [q, setQ] = useState("");
  const [crop, setCrop] = useState("");

  const load = useCallback(async () => {
    try {
      const [cRes, kRes, aRes] = await Promise.all([
        fetch(`/api/crm/contacts?_=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/crm/calls?_=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/crm/cases?_=${Date.now()}`, { cache: "no-store" }),
      ]);
      const c = await jsonSafe(cRes);
      const k = await jsonSafe(kRes);
      const a = await jsonSafe(aRes);
      setContacts((c.contacts as Contact[]) ?? []);
      setCalls((k.calls as Call[]) ?? []);
      setCases((a.cases as AgriCase[]) ?? []);
    } catch {
      /* keep last snapshot */
    }
  }, []);

  useEffect(() => {
    void load();
    void fetch("/api/vobiz/warm").catch(() => undefined);
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [load]);

  const cropOptions = useMemo(
    () => [...new Set(cases.map((c) => c.crop).filter(Boolean))],
    [cases],
  );

  const rows = useMemo(() => {
    return contacts.filter((c) => {
      const hay = `${c.name} ${c.phone}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (crop) {
        const hit = cases.some(
          (row) =>
            row.crop === crop &&
            (row.phone === c.phone || row.farmerName === c.name),
        );
        if (!hit) return false;
      }
      return true;
    });
  }, [contacts, q, crop, cases]);

  async function addAndCall(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) {
      setError("Enter a mobile number");
      return;
    }
    setDialing(phone);
    const save = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || "Farmer", phone }),
    });
    const saved = await jsonSafe(save);
    const contact = saved.contact as Contact | undefined;
    const res = await fetch("/api/crm/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        name: name.trim() || contact?.name,
        contactId: contact?.id,
      }),
    });
    const data = await jsonSafe(res);
    setDialing(null);
    if (!res.ok) {
      setError(String(data.error ?? "Dial failed"));
      await load();
      return;
    }
    const farmerId = String(data.farmerId ?? contact?.id ?? "");
    setName("");
    setPhone("");
    await load();
    if (farmerId) router.push(`/crm/farmers/${farmerId}`);
  }

  async function saveOnly(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || "Farmer", phone }),
    });
    const data = await jsonSafe(res);
    if (!res.ok) {
      setError(String(data.error ?? "Could not save"));
      return;
    }
    const contact = data.contact as Contact | undefined;
    setName("");
    setPhone("");
    await load();
    if (contact?.id) router.push(`/crm/farmers/${contact.id}`);
  }

  async function dialFarmer(c: Contact) {
    setError("");
    setDialing(c.id);
    const res = await fetch("/api/crm/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId: c.id, phone: c.phone, name: c.name }),
    });
    const data = await jsonSafe(res);
    setDialing(null);
    if (!res.ok) setError(String(data.error ?? "Dial failed"));
    await load();
    router.push(`/crm/farmers/${c.id}`);
  }

  const liveCount = calls.filter((c) => isCallLive(c)).length;

  return (
    <Shell title="Farmers">
      <PageHeader
        eyebrow="CRM registry"
        title="Farmers"
        description="Manage field partners, outbound dials, and case intake from voice calls."
        meta={
          <div className="flex gap-2">
            <MetricTile label="Registry" value={contacts.length} />
            <MetricTile label="Live" value={liveCount} tone="live" />
          </div>
        }
      />

      <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        <strong>CRM Call</strong> uses Vobiz KrishiSaathi (Polly.Aditi). For Agora
        campaign analytics, use{" "}
        <strong>Agora Console → Campaigns</strong>.
      </p>

      <form
        id="dialer"
        className="ks-record-panel mb-4"
        onSubmit={(e) => void addAndCall(e)}
      >
        <div className="ks-record-panel__head">
          <h3 className="ks-record-panel__title">Quick dialer</h3>
        </div>
        <div className="ks-record-panel__body">
        <div className="flex flex-wrap gap-3">
          <input
            className="ks-input min-w-[180px] flex-1"
            placeholder="Farmer name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="ks-input min-w-[180px] flex-1"
            placeholder="Mobile +91…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button
            className="ks-btn ks-btn--brand"
            type="submit"
            disabled={Boolean(dialing)}
          >
            {dialing ? "Dialing…" : "Save & call"}
          </button>
          <button
            className="ks-btn ks-btn--secondary"
            type="button"
            disabled={!phone}
            onClick={(e) => void saveOnly(e)}
          >
            Save only
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-ks-error">{error}</p> : null}
        </div>
      </form>

      <div className="ks-record-panel mb-4">
        <div className="ks-record-panel__body">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ks-muted">
              <Icon name="search" />
            </span>
            <input
              className="ks-input py-2.5 pl-10"
              placeholder="Search farmers by name or phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="ks-select md:w-48"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          >
            <option value="">All crops</option>
            {cropOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        </div>
      </div>

      <DataTableShell
        title="Farmer accounts"
        subtitle={`${rows.length} shown · ${contacts.length} total`}
        footer={
          <>
            <span>
              {liveCount} live call{liveCount === 1 ? "" : "s"} right now
            </span>
            <Link href="/crm/calls" className="font-semibold text-ks-primary-container hover:underline">
              Open live calls monitor
            </Link>
          </>
        }
      >
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-ks-line bg-ks-low text-[11px] font-semibold uppercase tracking-wider text-ks-muted">
              <tr>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Primary crop</th>
                <th className="px-4 py-3">Last call</th>
                <th className="px-4 py-3 text-center">Cases</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-ks-muted" colSpan={8}>
                    No farmers yet. Add a number above or wait for inbound.
                  </td>
                </tr>
              ) : (
                rows.map((c) => {
                  const last = c.calls?.[0];
                  const related = cases.filter(
                    (row) => row.phone === c.phone || row.farmerName === c.name,
                  );
                  const village = related[0]?.village || related[0]?.district || "—";
                  const cropName = related[0]?.crop || "—";
                  const live = last ? isCallLive(last) : false;
                  return (
                    <tr
                      key={c.id}
                      className="h-12 cursor-pointer border-t border-ks-line hover:bg-ks-low"
                      onClick={() => router.push(`/crm/farmers/${c.id}`)}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3 font-medium">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ks-container text-xs font-bold text-ks-primary-container">
                            {initials(c.name)}
                          </span>
                          {c.name}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <a
                          className="inline-flex items-center gap-1 font-medium text-ks-primary hover:underline"
                          href={`tel:${c.phone}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Icon name="call" className="text-[16px]" />
                          {c.phone}
                        </a>
                      </td>
                      <td className="px-4 py-2 text-ks-muted">{village}</td>
                      <td className="px-4 py-2">{cropName}</td>
                      <td className="px-4 py-2 text-ks-muted">
                        {last ? when(last.startedAt) : "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {related.length ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ks-secondary/20 text-xs font-semibold">
                            {related.length}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge
                          label={live ? "Live" : "Active"}
                          tone={live ? "live" : "success"}
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="ks-btn ks-btn--secondary px-3 py-1 text-xs"
                          type="button"
                          disabled={Boolean(dialing)}
                          onClick={(e) => {
                            e.stopPropagation();
                            void dialFarmer(c);
                          }}
                        >
                          Call
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
      </DataTableShell>
    </Shell>
  );
}
