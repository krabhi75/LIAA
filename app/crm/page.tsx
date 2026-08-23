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
  isLive,
  jsonSafe,
  when,
} from "@/components/stitch/crm";

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

  const liveCount = calls.filter((c) => isLive(c.status)).length;

  return (
    <Shell title="Farmers">
      <div className="mb-6">
        <h1 className="ks-display text-3xl font-semibold">Farmers registry</h1>
        <p className="mt-1 text-sm text-ks-muted">
          Manage field partners. Inbound on +91 79714 43138 creates a farmer
          automatically.
        </p>
        <p className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <strong>CRM Call</strong> uses Vobiz KrishiSaathi (Polly.Aditi Hindi).
          It updates this dashboard and{" "}
          <Link href="/crm/calls" className="underline">
            /crm/calls
          </Link>
          , not Agora Campaign stats. For Agora outbound analytics, dial from{" "}
          <strong>Agora Console → Campaigns</strong>. See{" "}
          <a
            className="underline"
            href="https://github.com/krabhi75/LIAA/blob/main/docs/OUTBOUND_PATHS.md"
            target="_blank"
            rel="noreferrer"
          >
            OUTBOUND_PATHS.md
          </a>
          .
        </p>
      </div>

      <form
        id="dialer"
        className="mb-4 rounded-xl border border-ks-outline bg-ks-surface p-4 shadow-sm"
        onSubmit={(e) => void addAndCall(e)}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ks-muted">
          Add farmer / outbound dialer
        </p>
        <div className="flex flex-wrap gap-3">
          <input
            className="rounded-lg border border-ks-outline bg-ks-bg px-4 py-2.5 text-sm outline-none focus:border-ks-primary-container"
            placeholder="Farmer name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-ks-outline bg-ks-bg px-4 py-2.5 text-sm outline-none focus:border-ks-primary-container"
            placeholder="Mobile +91…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button
            className="rounded-lg bg-ks-primary-container px-4 py-2.5 text-sm font-medium text-white hover:bg-ks-primary disabled:opacity-40"
            type="submit"
            disabled={Boolean(dialing)}
          >
            {dialing ? "Dialing…" : "Save & call"}
          </button>
          <button
            className="rounded-lg border border-ks-primary px-4 py-2.5 text-sm font-medium text-ks-primary hover:bg-ks-low"
            type="button"
            disabled={!phone}
            onClick={(e) => void saveOnly(e)}
          >
            Save only
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-ks-error">{error}</p> : null}
      </form>

      <div className="mb-4 rounded-xl border border-ks-outline bg-ks-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ks-muted">
              <Icon name="search" />
            </span>
            <input
              className="w-full rounded-lg border border-ks-outline bg-ks-bg py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ks-primary-container"
              placeholder="Search farmers by name or phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-ks-outline bg-ks-bg px-3 py-2.5 text-sm"
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

      <div className="overflow-hidden rounded-xl border border-ks-outline bg-ks-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-ks-low text-[12px] font-semibold uppercase tracking-wider text-ks-muted">
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
                  const live = last ? isLive(last.status) : false;
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
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${
                            live
                              ? "border-ks-error/30 bg-ks-error-soft text-ks-error"
                              : "border-ks-mint/50 bg-ks-mint/20 text-ks-primary"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${live ? "bg-ks-error" : "bg-ks-primary"}`}
                          />
                          {live ? "Live" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="rounded-lg border border-ks-primary px-3 py-1 text-xs font-medium text-ks-primary hover:bg-ks-low"
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
        </div>
        <div className="flex items-center justify-between border-t border-ks-line bg-ks-low px-4 py-3 text-sm text-ks-muted">
          <span>
            Showing {rows.length} of {contacts.length} farmers · {liveCount} live
          </span>
          <Link href="/crm/calls" className="text-ks-primary hover:underline">
            Open live calls
          </Link>
        </div>
      </div>
    </Shell>
  );
}
