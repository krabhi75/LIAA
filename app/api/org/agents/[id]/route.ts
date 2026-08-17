import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  greeting: z.string().min(10).max(2000).optional(),
  systemPrompt: z.string().min(40).max(20000).optional(),
  failureMessage: z.string().min(5).max(500).optional(),
  ttsVoiceId: z.string().min(3).max(120).optional(),
  llmModel: z.string().min(3).max(80).optional(),
  idleTimeout: z.number().int().min(30).max(600).optional(),
  enabled: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const agent = await prisma.agentConfig.findFirst({
    where: { id, workspace: { orgId: session.orgId } },
  });
  if (!agent) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ agent });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const existing = await prisma.agentConfig.findFirst({
    where: { id, workspace: { orgId: session.orgId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = patchSchema.parse(await req.json());
  const agent = await prisma.agentConfig.update({
    where: { id },
    data: body,
  });
  return NextResponse.json({ agent });
}
