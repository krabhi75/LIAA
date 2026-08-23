"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Msg = {
  id: string;
  phone: string;
  name: string;
  direction: string;
  text: string;
  status: string;
  createdAt: string;
};

export default function WhatsappPage() {
  const [live, setLive] = useState(false);
  const [webhook, setWebhook] = useState("https://liaa-ebon.vercel.app/api/webhooks/whatsapp");
  const [kpis, setKpis] = useState({ sent: 0, inbound: 0, total: 0, contacts: 0 });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/whatsapp");
    const d = (await res.json()) as {
      live?: boolean;
      webhook?: string;
      kpis?: typeof kpis;
      messages?: Msg[];
    };
    setLive(Boolean(d.live));
    if (d.webhook) setWebhook(d.webhook);
    if (d.kpis) setKpis(d.kpis);
    setMessages(d.messages ?? []);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  async function copyHook() {
    await navigator.clipboard.writeText(webhook);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function submit(action: "simulate" | "send", e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, phone, name, text }),
    });
    const d = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(d.error ?? "Failed");
      return;
    }
    setText("");
    await load();
  }

  return (
    <div className="saas-paper min-h-screen px-6 py-6">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="nova-mark">LIAA</span>
        <div className="flex gap-3">
          <Link href="/crm" className="nova-btn">
            CRM
          </Link>
          <Link href="/demo" className="nova-btn">
            Desk
          </Link>
          <Link href="/" className="nova-btn">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-5xl">
        <p className="nova-label">WhatsApp · Meta Cloud API · farmer inbox</p>
        <h1 className="mt-2 text-3xl font-semibold">WhatsApp for the field</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--ink-3)]">
          Same CRM as voice: inbound WhatsApp opens a contact and a case. Paste
          the webhook in Meta. Live send needs Vercel env.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Inbound", kpis.inbound],
            ["Outbound", kpis.sent],
            ["Farmers", kpis.contacts],
            ["Messages", kpis.total],
          ].map(([label, n]) => (
            <article key={String(label)} className="nova-card">
              <div className="nova-card__verb">{label}</div>
              <div className="nova-card__title">{n}</div>
            </article>
          ))}
        </div>

        <article className="nova-card mt-6">
          <div className="nova-card__head">
            <span className="nova-card__verb">Meta webhook</span>
            <span className="nova-card__kind">{live ? "token set" : "demo mode"}</span>
          </div>
          <p className="nova-card__detail break-all">{webhook}</p>
          <p className="nova-card__detail mt-2">
            Meta → WhatsApp → Configuration → Webhook callback URL. Verify token
            must match <code>WHATSAPP_VERIFY_TOKEN</code> (default{" "}
            <code>liaa-whatsapp-verify</code> if unset). Subscribe to{" "}
            <code>messages</code>.
          </p>
          <button className="nova-btn mt-3" type="button" onClick={() => void copyHook()}>
            {copied ? "Copied" : "Copy webhook"}
          </button>
        </article>

        <form className="mt-8 flex flex-wrap gap-3" onSubmit={(e) => void submit("simulate", e)}>
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Farmer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Phone +91…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            className="min-w-[220px] flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
            placeholder="Message (Hindi/Hinglish ok)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <button className="nova-btn nova-btn--start" type="submit">
            Simulate inbound (creates CRM lead)
          </button>
          <button
            className="nova-btn nova-btn--primary"
            type="button"
            onClick={(e) => void submit("send", e)}
          >
            Send WhatsApp
          </button>
        </form>
        {error ? <p className="nova-gate__err mt-3">{error}</p> : null}

        <section className="mt-10">
          <h2 className="nova-label-hi">Recent messages</h2>
          {messages.length === 0 ? (
            <p className="nova-empty mt-3">No WhatsApp yet. Simulate above or wait for Meta.</p>
          ) : (
            messages.map((m) => (
              <article key={m.id} className="nova-card mt-3">
                <div className="nova-card__head">
                  <span className="nova-card__verb">{m.direction}</span>
                  <span className="nova-card__kind">{m.status}</span>
                </div>
                <div className="nova-card__title">
                  {m.name} · {m.phone}
                </div>
                <div className="nova-card__detail">{m.text}</div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
