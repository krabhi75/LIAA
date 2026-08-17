import { NextResponse } from "next/server";
import { getAgentBySlug } from "@/lib/saas";

export async function GET(
  _req: Request,
  context: { params: Promise<{ orgSlug: string; agentSlug: string }> },
) {
  const { orgSlug, agentSlug } = await context.params;
  const match = await getAgentBySlug(orgSlug, agentSlug);
  if (!match) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }
  return NextResponse.json({
    agentConfigId: match.agent.id,
    agentName: match.agent.name,
    orgName: match.org.name,
    orgSlug: match.org.slug,
    agentSlug: match.agent.slug,
  });
}
