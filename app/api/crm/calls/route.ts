import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const calls = await prisma.crmCall.findMany({
    orderBy: { startedAt: "desc" },
    take: 40,
    include: { contact: true },
  });
  return NextResponse.json({ calls });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as { id?: string; disposition?: string };
  if (!body.id || !body.disposition) {
    return NextResponse.json({ error: "id and disposition required" }, { status: 400 });
  }
  const call = await prisma.crmCall.update({
    where: { id: body.id },
    data: { disposition: body.disposition },
  });
  return NextResponse.json({ call });
}
