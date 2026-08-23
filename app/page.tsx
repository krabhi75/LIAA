import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="saas-paper min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="nova-mark">LIAA</div>
        <Link
          href="/demo"
          className="nova-btn nova-btn--primary"
          style={{ padding: "8px 16px", fontSize: 13 }}
        >
          Open desk
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-20">
        <p className="nova-label" style={{ color: "var(--nova)" }}>
          Agora Conversational AI
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-[var(--ink)]">
          Speaks, listens, acts.
        </h1>
        <p
          className="mt-4 max-w-xl text-lg text-[var(--ink-3)]"
          style={{ lineHeight: 1.6 }}
        >
          Liaa — your voice assistant for calendar, mail, tabs, and memory. Not a
          sales rep. Layout inspired by{" "}
          <a
            href="https://github.com/vaivikop/nova-agora"
            className="text-[var(--nova)]"
            target="_blank"
            rel="noreferrer"
          >
            nova-agora
          </a>
          ; voice on Agora Conversational AI.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo" className="nova-btn nova-btn--primary">
            Wake Liaa
          </Link>
          <Link href="/crm" className="nova-btn nova-btn--start">
            Phone CRM
          </Link>
        </div>

        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Instrument UI",
              body: "Transcript · orb · action cards. Live Agora channel and RTT under the orb.",
            },
            {
              title: "Tools that land",
              body: "get_calendar, create_event, read_email, draft/send, open_tab, remember — with DEMO DATA badges when seeded.",
            },
            {
              title: "Not sales",
              body: "No lead qualification pitch. Liaa is a personal assistant that does things.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-sm font-semibold text-[var(--ink)]">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-3)]">
                {item.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
