"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STUDIO_PROMPT = `You are Liaa, a field voice assistant for Indian farmers, cooperatives, and rural workers.

Language
- Speak Hindi or Hinglish. Keep to one or two short spoken sentences.
- If they mix English, code-switch. Simple words. No markdown, lists, or emoji.
- Never read a URL or case id aloud.

How to talk
- Do not diagnose on the first complaint. Ask follow-up questions: crop, village, what they see, when it started, watering.
- If unsure, say so. Never invent pesticide doses or scheme money.
- Say a human agri expert will get the case so they do not repeat the story.

Greeting: Namaste. Main Liaa, kheti sahayak. Fasal mein kya ho raha hai?`;

export default function TelephonyPage() {
  const [cfg, setCfg] = useState<{
    number: string;
    sipDomain: string;
    outboundTrunkId: string;
    inboundTrunkId: string;
    hangupUrl: string | null;
    vobizWebhook?: string | null;
    agoraWebhook?: string | null;
    agoraSbc: string;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/telephony/config")
      .then((r) => r.json())
      .then(setCfg);
  }, []);

  const prompt = STUDIO_PROMPT;

  return (
    <div className="saas-paper min-h-screen px-6 py-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <span className="nova-mark">LIAA</span>
        <div className="flex gap-3">
          <Link href="/crm" className="nova-btn">
            CRM
          </Link>
          <Link href="/demo" className="nova-btn nova-btn--primary">
            Desk
          </Link>
        </div>
      </header>
      <main className="mx-auto mt-10 max-w-3xl">
        <p className="nova-label">Vobiz × Agora SIP</p>
        <h1 className="mt-2 text-3xl font-semibold">Inbound and outbound phone</h1>
        <p className="mt-3 text-sm text-[var(--ink-3)]">
          Real Liaa conversation on the handset uses Agora SIP trunks, not the XML
          app named test. Follow these steps once. Guide:{" "}
          <a
            className="text-[var(--agora)]"
            href="https://www.vobiz.ai/docs/integrations/agora"
            target="_blank"
            rel="noreferrer"
          >
            vobiz.ai/docs/integrations/agora
          </a>
        </p>

        <article className="nova-card mt-6">
          <div className="nova-card__verb">Your DID</div>
          <div className="nova-card__title">{cfg?.number ?? "+917971443138"}</div>
          <div className="nova-card__detail">
            SIP Domain (paste in Agora): {cfg?.sipDomain ?? "a4dc1a99.sip.vobiz.ai"}
          </div>
          <div className="nova-card__detail">
            Outbound trunk {cfg?.outboundTrunkId ?? "a4dc1a99-2efa-4f52-b481-5dfd99aca03d"}
          </div>
          <div className="nova-card__detail">
            CRM Vobiz webhook: {cfg?.vobizWebhook ?? "set PUBLIC_BASE_URL"}
          </div>
          <div className="nova-card__detail">
            CRM Agora webhook: {cfg?.agoraWebhook ?? "set PUBLIC_BASE_URL"}
          </div>
        </article>

        <ol className="mt-8 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-[var(--ink-2)]">
          <li>
            Agora Console → Agents → Create Agent. Paste the prompt below.
          </li>
          <li>
            Vobiz → SIP → Credentials → add username/password. Keep the password.
          </li>
          <li>
            Vobiz → Outbound trunks → attach that credential. Copy SIP Domain
            <code className="ml-1">*.sip.vobiz.ai</code>
          </li>
          <li>
            Agora → Add Phone Number → Vendor SIP Trunk → number{" "}
            <strong>+917971443138</strong>, address{" "}
            <strong>{cfg?.sipDomain ?? "a4dc1a99.sip.vobiz.ai"}</strong>, UDP,
            SIP credential username/password (not the trunk UUID).
          </li>
          <li>
            Agora → Campaigns → one contact = your mobile. That is outbound.
          </li>
          <li>
            Vobiz → Origination URI: <code>{cfg?.agoraSbc ?? "sbc-ap-south.viblinx.com"}</code>{" "}
            (no sip: prefix), UDP, Active.
          </li>
          <li>
            Vobiz → Inbound trunk → that URI → Link Numbers → +917971443138.
            Optional hangup webhook: <code>{cfg?.hangupUrl ?? "/api/vobiz/hangup"}</code>
          </li>
          <li>
            Agora → that number → Inbound Settings → inbound agent = Liaa.
          </li>
          <li>Call +917971443138 from another phone. Speak Hindi/Hinglish.</li>
        </ol>

        <h2 className="nova-label-hi mt-10">Paste into Agora agent</h2>
        <textarea
          readOnly
          className="mt-3 h-56 w-full rounded-xl border border-[var(--line)] bg-[var(--sunk)] p-3 text-sm"
          value={prompt}
        />
      </main>
    </div>
  );
}
