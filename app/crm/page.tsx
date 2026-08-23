"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Contact = {
  id: string;
  name: string;
  phone: string;
  company: string;
  calls: Call[];
  updatedAt?: string;
};

type Call = {
  id: string;
  phone: string;
  direction?: string;
  status: string;
  disposition: string;
  transcript: string;
  lastSpeech: string;
  startedAt: string;
  contact?: { name: string } | null;
};

type AgriCase = {
  id: string;
  farmerName: string;
  crop: string;
  village: string;
  status: string;
  phone?: string;
  summary: string;
};

async function jsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default function CrmPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [cases, setCases] = useState<AgriCase[]>([]);
  const [error, setError] = useState("");
  const [dialing, setDialing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async () => {
    try {
      const [cRes, kRes, aRes] = await Promise.all([
        fetch("/api/crm/contacts"),
        fetch("/api/crm/calls"),
        fetch("/api/crm/cases"),
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
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [load]);

  const inbound = useMemo(
    () => calls.filter((c) => (c.direction ?? "").includes("in")).length,
    [calls],
  );
  const outbound = useMemo(
    () => calls.filter((c) => !(c.direction ?? "").includes("in")).length,
    [calls],
  );
  const live = useMemo(
    () =>
      calls.filter((c) =>
        ["queued", "ringing", "dialing", "in-progress"].includes(c.status),
      ).length,
    [calls],
  );

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

  return (
    <div className="saas-paper min-h-screen px-6 py-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="nova-mark">LIAA</span>
        <div className="flex gap-3">
          <Link href="/demo" className="nova-btn">
            Agora desk
          </Link>
          <Link href="/telephony" className="nova-btn">
            SIP
          </Link>
          <Link href="/" className="nova-btn">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-5xl">
        <p className="nova-label">Live field CRM · inbound + outbound</p>
        <h1 className="mt-2 text-3xl font-semibold">Farmers. Call. Timeline.</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-3)]">
          Add a number and start an outbound call. Inbound on +917971443138
          creates the farmer automatically. Speech lands on their profile
          timeline.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {[
            ["Farmers", contacts.length],
            ["Inbound", inbound],
            ["Outbound", outbound],
            ["Live now", live],
          ].map(([label, n]) => (
            <article key={String(label)} className="nova-card">
              <div className="nova-card__verb">{label}</div>
              <div className="nova-card__title">{n}</div>
            </article>
          ))}
        </div>

        <form className="nova-card mt-8" onSubmit={(e) => void addAndCall(e)}>
          <div className="nova-card__head">
            <span className="nova-card__verb">Outbound</span>
            <span className="nova-card__kind">manual number</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
              placeholder="Farmer name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
              placeholder="Mobile +91…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button
              className="nova-btn nova-btn--primary"
              type="submit"
              disabled={Boolean(dialing)}
            >
              {dialing ? "Dialing…" : "Save & call"}
            </button>
            <button
              className="nova-btn nova-btn--start"
              type="button"
              disabled={!phone}
              onClick={(e) => void saveOnly(e)}
            >
              Save only
            </button>
          </div>
        </form>
        {error ? <p className="nova-gate__err mt-4">{error}</p> : null}

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="nova-label-hi">Farmer profiles</h2>
            {contacts.length === 0 ? (
              <p className="nova-empty mt-3">
                No farmers yet. Add a number above or wait for an inbound call.
              </p>
            ) : (
              contacts.map((c) => {
                const last = c.calls?.[0];
                return (
                  <article key={c.id} className="nova-card mt-3">
                    <div className="nova-card__head">
                      <span className="nova-card__verb">
                        {last?.direction ?? "new"}
                      </span>
                      <span className="nova-card__kind">{c.phone}</span>
                    </div>
                    <div className="nova-card__title">{c.name}</div>
                    <div className="nova-card__detail">
                      {last
                        ? `${last.status} · ${last.disposition}`
                        : "No calls yet"}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/crm/farmers/${c.id}`}
                        className="nova-btn"
                      >
                        Open profile
                      </Link>
                      <button
                        className="nova-btn nova-btn--start"
                        type="button"
                        disabled={Boolean(dialing)}
                        onClick={() => void dialFarmer(c)}
                      >
                        Call
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
          <div>
            <h2 className="nova-label-hi">Live call board</h2>
            {calls.length === 0 ? (
              <p className="nova-empty mt-3">Waiting for inbound or outbound.</p>
            ) : (
              calls.slice(0, 12).map((call) => (
                <article key={call.id} className="nova-card mt-3">
                  <div className="nova-card__head">
                    <span className="nova-card__verb">
                      {call.direction ?? "call"}
                    </span>
                    <span className="nova-card__kind">{call.status}</span>
                  </div>
                  <div className="nova-card__title">
                    {call.contact?.name ?? call.phone}
                  </div>
                  <div className="nova-card__detail">{call.disposition}</div>
                  {call.transcript ? (
                    <pre className="nova-card__detail mt-2 whitespace-pre-wrap">
                      {call.transcript.slice(0, 280)}
                    </pre>
                  ) : null}
                </article>
              ))
            )}
            <h2 className="nova-label-hi mt-8">Open cases</h2>
            {cases.length === 0 ? (
              <p className="nova-empty mt-3">Cases appear as the farmer speaks.</p>
            ) : (
              cases.slice(0, 8).map((cs) => (
                <article key={cs.id} className="nova-card mt-3">
                  <div className="nova-card__head">
                    <span className="nova-card__verb">{cs.status}</span>
                    <span className="nova-card__kind">{cs.crop || "crop"}</span>
                  </div>
                  <div className="nova-card__title">{cs.farmerName}</div>
                  <div className="nova-card__detail">
                    {[cs.phone, cs.village, cs.summary].filter(Boolean).join(" · ")}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
