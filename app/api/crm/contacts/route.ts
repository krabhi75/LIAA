import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/vobiz";

export async function GET() {
  const contacts = await prisma.crmContact.findMany({
    orderBy: { updatedAt: "desc" },
    include: { calls: { orderBy: { startedAt: "desc" }, take: 3 } },
  });
  return NextResponse.json({ contacts });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    company?: string;
  };
  if (!body.name || !body.phone) {
    return NextResponse.json({ error: "name and phone required" }, { status: 400 });
  }
  const contact = await prisma.crmContact.create({
    data: {
      name: body.name,
      phone: normalizePhone(body.phone),
      company: body.company ?? "",
    },
  });
  return NextResponse.json({ contact });
}
