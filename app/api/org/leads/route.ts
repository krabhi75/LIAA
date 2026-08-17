import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { orgId: session.orgId },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    leads: leads.map((l) => ({
      ...l,
      objections: JSON.parse(l.objections || "[]"),
    })),
  });
}
