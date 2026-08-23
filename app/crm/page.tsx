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

type AgriCase = {
  id: string;
  farmerName: string;
  crop: string;
  village: string;
  district: string;
  symptoms: string;
  summary: string;
  status: string;
  escalateReason: string;
  transcript?: string;
  direction?: string;
  phone?: string;
};

const DISPOSITIONS = [
  "pending",
  "dialing",
  "completed",
  "interested",
  "callback",
  "no_answer",
  "busy",
  "failed",
  "cancelled",
] as const;

async function jsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export default function CrmPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [cases, setCases] = useState<AgriCase[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [dialing, setDialing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [farmer, setFarmer] = useState("");
  const [crop, setCrop] = useState("");
  const [village, setVillage] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [hooks, setHooks] = useState<{
    vobizWebhook?: string;
    agoraWebhook?: string;
    hangupUrl?: string;
  }>({});

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
    void fetch("/api/telephony/config")
      .then((r) => r.json())
      .then((d) =>
        setHooks({
          vobizWebhook: d.vobizWebhook,
          agoraWebhook: d.agoraWebhook,
          hangupUrl: d.hangupUrl,
        }),
      );
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  async function copy(label: string, value?: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 1500);
  }

  async function addContact(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await jsonSafe(res);
    if (!res.ok) {
      setError(String(data.error ?? "Could not save contact"));
      return;
    }
    setName("");
    setPhone("");
    await load();
  }

  async function addCase(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/crm/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        farmerName: farmer,
        phone,
        crop,
        village,
        symptoms,
      }),
    });
    const data = await jsonSafe(res);
    if (!res.ok) {
      setError(String(data.error ?? "Could not open case"));
      return;
    }
    setFarmer("");
    setCrop("");
    setVillage("");
    setSymptoms("");
    await load();
  }

  async function patchCase(id: string, status: "escalated" | "closed" | "open") {
    await fetch("/api/crm/cases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        reason: status === "escalated" ? "Handed to agri expert" : undefined,
      }),
    });
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
    const data = await jsonSafe(res);
    setDialing(null);
    if (!res.ok) setError(String(data.error ?? "Dial failed"));
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
          <Link href="/telephony" className="nova-btn">
            SIP
          </Link>
          <Link href="/" className="nova-btn">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-5xl">
        <p className="nova-label">Field CRM · Vercel · expert desk</p>
        <h1 className="mt-2 text-3xl font-semibold">Farmer cases. Call. Escalate.</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-3)]">
          Desk tool calls and phone hangups land here. Paste the webhook URLs
          into Vobiz inbound and Agora post-call — not Zoho.
        </p>

        {hooks.vobizWebhook ? (
          <div className="nova-card mt-5">
            <div className="nova-card__head">
              <span className="nova-card__verb">Webhooks</span>
              <span className="nova-card__kind">liaa-ebon.vercel.app</span>
            </div>
            <p className="nova-card__detail break-all">
              Vobiz: {hooks.vobizWebhook}
            </p>
            <p className="nova-card__detail break-all">
              Agora: {hooks.agoraWebhook}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="nova-btn"
                type="button"
                onClick={() => void copy("vobiz", hooks.vobizWebhook)}
              >
                Copy Vobiz
              </button>
              <button
                className="nova-btn"
                type="button"
                onClick={() => void copy("agora", hooks.agoraWebhook)}
              >
                Copy Agora
              </button>
              {copied ? (
                <span className="nova-card__detail">Copied {copied}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <form className="mt-8 flex flex-wrap gap-3" onSubmit={addContact}>
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Contact name"
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

        <form className="mt-4 flex flex-wrap gap-3" onSubmit={addCase}>
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Farmer name"
            value={farmer}
            onChange={(e) => setFarmer(e.target.value)}
            required
          />
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Crop"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
          />
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Village"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
          />
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
          <button className="nova-btn nova-btn--start" type="submit">
            Open case
          </button>
        </form>

        {error ? <p className="nova-gate__err mt-4">{error}</p> : null}

        <section className="mt-10 grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="nova-label-hi">Field cases</h2>
            {cases.length === 0 ? (
              <p className="nova-empty mt-3">
                No cases yet. Talk on /demo, open a case above, or wait for a
                webhook.
              </p>
            ) : (
              cases.map((cs) => (
                <article key={cs.id} className="nova-card mt-3">
                  <div className="nova-card__head">
                    <span className="nova-card__verb">{cs.status}</span>
                    <span className="nova-card__kind">{cs.crop || "crop?"}</span>
                  </div>
                  <div className="nova-card__title">{cs.farmerName}</div>
                  <div className="nova-card__detail">
                    {[cs.phone, cs.village, cs.district, cs.symptoms || cs.summary]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {cs.escalateReason ? (
                    <div className="nova-card__detail">Expert: {cs.escalateReason}</div>
                  ) : null}
                  {cs.transcript ? (
                    <pre className="nova-card__detail mt-2 whitespace-pre-wrap">
                      {cs.transcript}
                    </pre>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="nova-btn nova-btn--start"
                      type="button"
                      onClick={() => void patchCase(cs.id, "escalated")}
                    >
                      Escalate
                    </button>
                    <button
                      className="nova-btn"
                      type="button"
                      onClick={() => void patchCase(cs.id, "closed")}
                    >
                      Close
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
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
                    {DISPOSITIONS.map((d) => (
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
