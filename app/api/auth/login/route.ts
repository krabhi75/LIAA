import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: { org: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const membership = user.memberships[0];
    if (!membership) {
      return NextResponse.json({ error: "No organization" }, { status: 400 });
    }

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      orgId: membership.orgId,
      orgSlug: membership.org.slug,
      orgName: membership.org.name,
      role: membership.role,
      plan: membership.org.plan,
    });

    return NextResponse.json({ ok: true, orgSlug: membership.org.slug });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
