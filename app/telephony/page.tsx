"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/stitch/Shell";

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
    answerUrl?: string | null;
    inboundTrunkWebhook?: string | null;
    outboundTrunkWebhook?: string | null;
    agoraSbc: string;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/telephony/config")
      .then((r) => r.json())
      .then(setCfg);
  }, []);

  const prompt = STUDIO_PROMPT;

  return (
    <Shell title="Settings">
      <div className="mx-auto max-w-3xl">
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
            Inbound trunk {cfg?.inboundTrunkId ?? "c56b68cd-591f-4196-92df-e9e7a34aae9b"}
          </div>
        </article>

        <article className="nova-card mt-4 border-amber-500/30 bg-amber-500/5">
          <div className="nova-card__verb">Agora Campaign vs CRM dial</div>
          <p className="nova-card__detail mt-2">
            <strong>Agora → Campaigns</strong> (CSV outbound) updates the Agora
            campaign dashboard and uses Conversational AI over SIP. The{" "}
            <strong>/crm Call button</strong> uses Vobiz XML KrishiSaathi and
            only updates the LIAA CRM — not Agora campaign counts. See{" "}
            <code className="text-xs">docs/OUTBOUND_PATHS.md</code>.
          </p>
        </article>

        <article className="nova-card mt-4">
          <div className="nova-card__head">
            <span className="nova-card__verb">Inbound webhook</span>
            <span className="nova-card__kind">SIP trunk</span>
          </div>
          <p className="nova-card__detail">
            Vobiz → SIP → Inbound trunks → Liaa Testing → Webhook Configuration →
            POST URL (events: incoming.ringing / answered / ended).
          </p>
          <code className="nova-card__detail mt-2 block break-all">
            {cfg?.inboundTrunkWebhook ??
              "https://liaa-ebon.vercel.app/api/webhooks/vobiz"}
          </code>
          <p className="nova-card__detail mt-2">
            Do not set a Voice App Answer URL on +917971443138. That steals the
            call from Agora.
          </p>
        </article>

        <article className="nova-card mt-4">
          <div className="nova-card__head">
            <span className="nova-card__verb">Outbound webhook</span>
            <span className="nova-card__kind">SIP trunk + CRM Dial</span>
          </div>
          <p className="nova-card__detail">
            Vobiz → SIP → Outbound trunks → + Add Webhook / POST URL (started /
            answered / ended). Same CRM endpoint:
          </p>
          <code className="nova-card__detail mt-2 block break-all">
            {cfg?.outboundTrunkWebhook ??
              "https://liaa-ebon.vercel.app/api/webhooks/vobiz"}
          </code>
          <p className="nova-card__detail mt-3">
            CRM <strong>Call this number</strong> does not use the Voice App.
            Liaa already sends these on each API dial:
          </p>
          <div className="nova-card__detail mt-1">
            Answer URL:{" "}
            {cfg?.answerUrl ?? "https://liaa-ebon.vercel.app/api/vobiz/answer"}
          </div>
          <div className="nova-card__detail">
            Hangup URL:{" "}
            {cfg?.hangupUrl ?? "https://liaa-ebon.vercel.app/api/vobiz/hangup"}
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
            Webhook POST URL:{" "}
            <code>
              {cfg?.inboundTrunkWebhook ??
                "https://liaa-ebon.vercel.app/api/webhooks/vobiz"}
            </code>
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
      </div>
    </Shell>
  );
}
