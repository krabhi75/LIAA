import { NextResponse } from "next/server";
import { getSession, planLimits } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const events = await prisma.usageEvent.findMany({
    where: { orgId: session.orgId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const minutes = events
    .filter((e) => e.kind === "voice_minutes")
    .reduce((sum, e) => sum + e.quantity, 0);
  const starts = events.filter((e) => e.kind === "session_start").length;
  const limits = planLimits(session.plan);

  return NextResponse.json({
    plan: session.plan,
    limits,
    usage: { minutes, sessionStarts: starts },
    events: events.slice(0, 40),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  });
}
