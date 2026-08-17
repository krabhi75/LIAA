import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const agents = await prisma.agentConfig.count({
    where: { workspace: { orgId: session.orgId }, enabled: true },
  });
  const leads = await prisma.lead.count({ where: { orgId: session.orgId } });
  const sessions = await prisma.voiceSession.count({
    where: { orgId: session.orgId },
  });

  return NextResponse.json({
    user: session,
    stats: { agents, leads, sessions },
  });
}
