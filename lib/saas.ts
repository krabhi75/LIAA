import { prisma } from "./db";
import {
  FAILURE_MESSAGE,
  GREETING,
  LIAA_INSTRUCTIONS,
} from "./prompt";
import { mcpKey } from "./agora";

export async function getDefaultAgentForOrg(orgId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: { orgId },
    include: {
      agents: { where: { enabled: true }, orderBy: { createdAt: "asc" } },
    },
  });
  return workspace?.agents[0] ?? null;
}

export async function getAgentBySlug(orgSlug: string, agentSlug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      workspaces: {
        include: {
          agents: { where: { slug: agentSlug, enabled: true } },
        },
      },
    },
  });
  if (!org) return null;
  for (const ws of org.workspaces) {
    const agent = ws.agents[0];
    if (agent) return { org, agent };
  }
  return null;
}

export async function ensureDemoTenant() {
  const email = "demo@liaa.app";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // migrate legacy demo email if present
    const legacy = await prisma.user.findUnique({
      where: { email: "demo@nova.app" },
    });
    if (legacy) {
      user = await prisma.user.update({
        where: { id: legacy.id },
        data: { email },
      });
    }
  }
  if (!user) {
    const { hashPassword, provisionOrgForUser } = await import("./auth");
    user = await prisma.user.create({
      data: {
        email,
        name: "Demo Operator",
        passwordHash: await hashPassword("demo1234"),
      },
    });
    await provisionOrgForUser({
      userId: user.id,
      orgName: "Liaa Demo",
      email,
    });
  }

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: {
      org: {
        include: {
          workspaces: { include: { agents: true } },
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Demo tenant missing membership");
  }

  let agent = membership.org.workspaces[0]?.agents[0];
  if (!agent) {
    const ws =
      membership.org.workspaces[0] ??
      (await prisma.workspace.create({
        data: { name: "Default", orgId: membership.orgId },
      }));
    agent = await prisma.agentConfig.create({
      data: {
        workspaceId: ws.id,
        name: "Liaa",
        slug: "liaa",
        greeting: GREETING,
        systemPrompt: LIAA_INSTRUCTIONS,
        failureMessage: FAILURE_MESSAGE,
        mcpKey: mcpKey(),
      },
    });
  } else {
    agent = await prisma.agentConfig.update({
      where: { id: agent.id },
      data: {
        name: "Liaa",
        slug:
          agent.slug === "maya" || agent.slug === "nova" ? "liaa" : agent.slug,
        greeting: GREETING,
        systemPrompt: LIAA_INSTRUCTIONS,
        failureMessage: FAILURE_MESSAGE,
      },
    });
  }

  // Keep org display name current for demos
  if (membership.org.name.includes("Nova") || membership.org.name.includes("Maya")) {
    await prisma.organization.update({
      where: { id: membership.org.id },
      data: { name: "Liaa Demo" },
    });
  }

  return { user, org: membership.org, agent };
}

export async function recordUsage(
  orgId: string,
  kind: string,
  quantity = 1,
  meta: Record<string, unknown> = {},
) {
  await prisma.usageEvent.create({
    data: {
      orgId,
      kind,
      quantity,
      metaJson: JSON.stringify(meta),
    },
  });
}
