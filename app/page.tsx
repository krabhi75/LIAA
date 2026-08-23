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
          PS1 · Agriculture & rural · Agora Conversational AI
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-[var(--ink)]">
          Voice for the field. Cases for the expert.
        </h1>
        <p
          className="mt-4 max-w-xl text-lg text-[var(--ink-3)]"
          style={{ lineHeight: 1.6 }}
        >
          Liaa talks to farmers in Hindi and Hinglish, asks follow-ups, pulls live
          weather, opens a structured case, and escalates a human expert — so the
          farmer never repeats the story.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/demo" className="nova-btn nova-btn--primary">
            Wake Liaa
          </Link>
          <Link href="/telephony" className="nova-btn">
            Phone SIP
          </Link>
          <Link href="/crm" className="nova-btn nova-btn--start">
            Phone CRM
          </Link>
          <Link href="/whatsapp" className="nova-btn">
            WhatsApp
          </Link>
        </div>

        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Ask, don’t guess",
              body: "Follow-ups for crop, village, symptoms, watering. Uncertainty is spoken out loud.",
            },
            {
              title: "Live weather + case",
              body: "Open-Meteo API, structured CRM case, expert escalation — visible on screen.",
            },
            {
              title: "Phone + desk",
              body: "Agora desk for judges. Vobiz call so a farmer can talk from a feature phone.",
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
