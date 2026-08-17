import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SaasShell } from "@/components/saas/SaasShell";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AppHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [agents, leads, sessions, usage] = await Promise.all([
    prisma.agentConfig.count({
      where: { workspace: { orgId: session.orgId } },
    }),
    prisma.lead.count({ where: { orgId: session.orgId } }),
    prisma.voiceSession.count({ where: { orgId: session.orgId } }),
    prisma.usageEvent.count({
      where: {
        orgId: session.orgId,
        kind: "session_start",
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const recentLeads = await prisma.lead.findMany({
    where: { orgId: session.orgId },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return (
    <SaasShell
      user={session}
      title="Overview"
      subtitle="Agora voice agents · CRM · usage"
    >
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Agents", value: agents },
          { label: "Leads", value: leads },
          { label: "Sessions", value: sessions },
          { label: "Starts (30d)", value: usage },
        ].map((card) => (
          <div key={card.label} className="border border-slate-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              {card.label}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Quick actions
          </div>
          <div className="space-y-2 p-4 text-sm">
            <Link className="block text-blue-700 hover:underline" href="/app/live">
              Open authenticated live desk
            </Link>
            <Link className="block text-blue-700 hover:underline" href="/app/agents">
              Edit Maya prompt / voice
            </Link>
            <Link
              className="block text-blue-700 hover:underline"
              href={`/embed/${session.orgSlug}/maya`}
            >
              Open embed widget
            </Link>
            <Link className="block text-blue-700 hover:underline" href="/demo">
              Public hackathon demo (no login)
            </Link>
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Recent leads
          </div>
          <table className="sheet">
            <thead>
              <tr>
                <th>Company</th>
                <th>Status</th>
                <th>Seats</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-slate-500">
                    No leads yet — run a live call with MCP attached.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>{lead.company ?? lead.name ?? lead.channel}</td>
                    <td>{lead.status}</td>
                    <td className="num">{lead.seats ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </SaasShell>
  );
}
