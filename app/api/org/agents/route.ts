import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FAILURE_MESSAGE, GREETING, SALES_INSTRUCTIONS } from "@/lib/prompt";
import { mcpKey } from "@/lib/agora";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agents = await prisma.agentConfig.findMany({
    where: { workspace: { orgId: session.orgId } },
    orderBy: { createdAt: "asc" },
    include: { workspace: true },
  });

  return NextResponse.json({ agents });
}

const createSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createSchema.parse(await req.json());
  const workspace = await prisma.workspace.findFirst({
    where: { orgId: session.orgId },
  });
  if (!workspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 400 });
  }

  const slug =
    body.slug ??
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);

  const agent = await prisma.agentConfig.create({
    data: {
      workspaceId: workspace.id,
      name: body.name,
      slug: `${slug}-${randomBytes(2).toString("hex")}`,
      greeting: GREETING,
      systemPrompt: SALES_INSTRUCTIONS,
      failureMessage: FAILURE_MESSAGE,
      mcpKey: mcpKey(),
    },
  });

  return NextResponse.json({ agent });
}
