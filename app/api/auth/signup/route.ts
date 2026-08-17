import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  hashPassword,
  provisionOrgForUser,
  setSessionCookie,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(80).optional(),
  orgName: z.string().min(2).max(80).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name ?? email.split("@")[0],
        passwordHash: await hashPassword(body.password),
      },
    });

    const org = await provisionOrgForUser({
      userId: user.id,
      orgName: body.orgName ?? `${user.name}'s workspace`,
      email,
    });

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: org.orgId,
      orgSlug: org.orgSlug,
      orgName: body.orgName ?? `${user.name}'s workspace`,
      role: "owner",
      plan: "free",
    });

    return NextResponse.json({
      ok: true,
      orgSlug: org.orgSlug,
      agentId: org.agentId,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
