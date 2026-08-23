"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  phone: string;
  company: string;
  calls: Call[];
};

type Call = {
  id: string;
  phone: string;
  status: string;
  disposition: string;
  transcript: string;
  lastSpeech: string;
  startedAt: string;
  contact?: { name: string } | null;
};

export default function CrmPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [error, setError] = useState("");
  const [dialing, setDialing] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const load = useCallback(async () => {
    const [c, k] = await Promise.all([
      fetch("/api/crm/contacts").then((r) => r.json()),
      fetch("/api/crm/calls").then((r) => r.json()),
    ]);
    setContacts(c.contacts ?? []);
    setCalls(k.calls ?? []);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  async function addContact(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    setName("");
    setPhone("");
    await load();
  }

  async function dial(to: { phone?: string; contactId?: string }) {
    setError("");
    setDialing(to.contactId ?? to.phone ?? "x");
    const res = await fetch("/api/crm/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(to),
    });
    const data = await res.json();
    setDialing(null);
    if (!res.ok) setError(data.error ?? "Dial failed");
    await load();
  }

  async function setDisposition(id: string, disposition: string) {
    await fetch("/api/crm/calls", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, disposition }),
    });
    await load();
  }

  return (
    <div className="saas-paper min-h-screen px-6 py-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="nova-mark">LIAA</span>
        <div className="flex gap-3">
          <Link href="/demo" className="nova-btn">
            Agora desk
          </Link>
          <Link href="/" className="nova-btn">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-5xl">
        <p className="nova-label">Vobiz telephony · CRM</p>
        <h1 className="mt-2 text-3xl font-semibold">Call any number. Update disposition.</h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--ink-3)]">
          Outbound from your Vobiz trial number. Liaa greets in Hinglish, then calendar /
          meeting / inbox. Hangup writes disposition automatically. PUBLIC_BASE_URL must
          be a Cloudflare HTTPS tunnel.
        </p>
        {error ? <p className="nova-gate__err mt-4">{error}</p> : null}

        <form className="mt-8 flex flex-wrap gap-3" onSubmit={addContact}>
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Phone +91…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button className="nova-btn nova-btn--start" type="submit">
            Save contact
          </button>
          <button
            className="nova-btn nova-btn--primary"
            type="button"
            disabled={!phone || Boolean(dialing)}
            onClick={() => dial({ phone })}
          >
            {dialing ? "Dialing…" : "Call this number"}
          </button>
        </form>

        <section className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="nova-label-hi">Contacts</h2>
            {contacts.length === 0 ? (
              <p className="nova-empty mt-3">No contacts yet.</p>
            ) : (
              contacts.map((c) => (
                <article key={c.id} className="nova-card mt-3">
                  <div className="nova-card__title">{c.name}</div>
                  <div className="nova-card__detail">{c.phone}</div>
                  <button
                    className="nova-btn nova-btn--start mt-3"
                    type="button"
                    disabled={Boolean(dialing)}
                    onClick={() => dial({ contactId: c.id })}
                  >
                    Call
                  </button>
                </article>
              ))
            )}
          </div>
          <div>
            <h2 className="nova-label-hi">Call log · dispositions</h2>
            {calls.length === 0 ? (
              <p className="nova-empty mt-3">No calls yet.</p>
            ) : (
              calls.map((call) => (
                <article key={call.id} className="nova-card mt-3">
                  <div className="nova-card__head">
                    <span className="nova-card__verb">{call.status}</span>
                    <span className="nova-card__kind">{call.disposition}</span>
                  </div>
                  <div className="nova-card__title">
                    {call.contact?.name ?? call.phone}
                  </div>
                  {call.transcript ? (
                    <pre className="nova-card__detail mt-2 whitespace-pre-wrap">
                      {call.transcript}
                    </pre>
                  ) : null}
                  <select
                    className="mt-3 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-sm"
                    value={call.disposition}
                    onChange={(e) => void setDisposition(call.id, e.target.value)}
                  >
                    {[
                      "pending",
                      "dialing",
                      "completed",
                      "interested",
                      "callback",
                      "no_answer",
                      "busy",
                      "failed",
                      "cancelled",
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
