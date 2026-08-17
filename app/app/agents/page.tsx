import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SaasShell } from "@/components/saas/SaasShell";
import { prisma } from "@/lib/db";
import { CreateAgentButton } from "@/components/saas/CreateAgentButton";

export default async function AgentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const agents = await prisma.agentConfig.findMany({
    where: { workspace: { orgId: session.orgId } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SaasShell
      user={session}
      title="Agents"
      subtitle="Configure prompts, voice, and embed links"
    >
      <div className="mb-4 flex justify-end">
        <CreateAgentButton />
      </div>
      <div className="border border-slate-200 bg-white">
        <table className="sheet">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>LLM</th>
              <th>Status</th>
              <th>Embed</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td>
                  <Link
                    href={`/app/agents/${agent.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {agent.name}
                  </Link>
                </td>
                <td className="num">{agent.slug}</td>
                <td>{agent.llmModel}</td>
                <td>{agent.enabled ? "Enabled" : "Off"}</td>
                <td>
                  <Link
                    href={`/embed/${session.orgSlug}/${agent.slug}`}
                    className="text-sm text-blue-700 hover:underline"
                  >
                    /embed/{session.orgSlug}/{agent.slug}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SaasShell>
  );
}
