import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SaasShell } from "@/components/saas/SaasShell";
import { prisma } from "@/lib/db";

export default async function LeadsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const leads = await prisma.lead.findMany({
    where: { orgId: session.orgId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <SaasShell
      user={session}
      title="Leads"
      subtitle="Persisted CRM from Agora tool calls"
    >
      <div className="border border-slate-200 bg-white">
        <table className="sheet">
          <thead>
            <tr>
              <th>Company</th>
              <th>Buyer</th>
              <th>Status</th>
              <th>Seats</th>
              <th>Competitor</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-slate-500">
                  Empty until Maya calls upsert_crm_lead / book_demo.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.company ?? "—"}</td>
                  <td>{lead.name ?? "—"}</td>
                  <td>{lead.status}</td>
                  <td className="num">{lead.seats ?? "—"}</td>
                  <td>{lead.competitor ?? "—"}</td>
                  <td className="num text-slate-500">
                    {lead.updatedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SaasShell>
  );
}
