import { NextResponse } from "next/server";
import { createContact, listContacts } from "@/lib/crm-store";

export async function GET() {
  const contacts = await listContacts();
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
  const contact = await createContact({
    name: body.name,
    phone: body.phone,
    company: body.company,
  });
  return NextResponse.json({ contact });
}
