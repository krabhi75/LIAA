import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <div className="saas-paper min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="nova-mark">MOLVAANI</div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-[var(--ink-3)] hover:text-[var(--ink)]">
            Sign in
          </Link>
          <Link href="/signup" className="nova-btn nova-btn--primary" style={{ padding: "8px 16px", fontSize: 13 }}>
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-20">
        <p className="nova-label" style={{ color: "var(--nova)" }}>
          Agora Conversational AI
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-[var(--ink)]">
          Speaks, listens, acts.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--ink-3)]" style={{ lineHeight: 1.6 }}>
          MolVaani is a live Agora voice sales agent for Indian buyers — barge-in,
          mol-bhav, CRM, and human takeover. Layout inspired by{" "}
          <a
            href="https://github.com/vaivikop/nova-agora"
            className="text-[var(--nova)]"
            target="_blank"
            rel="noreferrer"
          >
            nova-agora
          </a>
          ; voice stays on Agora Conversational AI.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo" className="nova-btn nova-btn--primary">
            Wake live desk
          </Link>
          <Link href="/signup" className="nova-btn">
            Create Cloud workspace
          </Link>
        </div>

        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Instrument UI",
              body: "Transcript · orb stage · action cards. Live Agora channel + RTT under the orb.",
            },
            {
              title: "Agora-native voice",
              body: "Buyer and Maya share one RTC channel. Turn-taking and interruption stay on Agora.",
            },
            {
              title: "Tools that land",
              body: "MCP pricing, competitor, CRM, calendar, escalate — cards update as tools fire.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-sm font-semibold text-[var(--ink)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-3)]">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
