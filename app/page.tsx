import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/app");

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_#f8fafc_45%,_#e2e8f0_100%)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold tracking-tight text-slate-900">
          MolVaani Cloud
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-800"
          >
            Start free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-700">
          Agora Conversational AI
        </p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight text-slate-900">
          MolVaani
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Multi-tenant voice agents that bargain live — barge-in, tools, CRM,
          and human takeover on Agora RTC. Not a chatbot with speech bolted on.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Create your agent
          </Link>
          <Link
            href="/demo"
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Open live demo desk
          </Link>
        </div>

        <section className="mt-20 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Agora-native voice",
              body: "Buyer and Maya share one RTC channel. Turn-taking and interruption stay on Agora.",
            },
            {
              title: "Tools + CRM",
              body: "MCP pricing, competitor compare, calendar book, lead upsert — visible live on the desk.",
            },
            {
              title: "SaaS control plane",
              body: "Orgs, agents, leads, usage metering, embed links, and billing-ready plans.",
            },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {item.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
