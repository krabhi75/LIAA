import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SaasShell } from "@/components/saas/SaasShell";
import { prisma } from "@/lib/db";
import { AgentEditor } from "@/components/saas/AgentEditor";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const agent = await prisma.agentConfig.findFirst({
    where: { id, workspace: { orgId: session.orgId } },
  });
  if (!agent) notFound();

  return (
    <SaasShell
      user={session}
      title={agent.name}
      subtitle={`Embed /embed/${session.orgSlug}/${agent.slug}`}
    >
      <AgentEditor
        agent={{
          id: agent.id,
          name: agent.name,
          greeting: agent.greeting,
          systemPrompt: agent.systemPrompt,
          failureMessage: agent.failureMessage,
          ttsVoiceId: agent.ttsVoiceId,
          llmModel: agent.llmModel,
          idleTimeout: agent.idleTimeout,
          enabled: agent.enabled,
        }}
      />
    </SaasShell>
  );
}
