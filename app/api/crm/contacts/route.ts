import { NextResponse } from "next/server";
import { createContact, listContacts } from "@/lib/crm-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function liveJson(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function GET() {
  const contacts = await listContacts();
  return liveJson({ contacts, at: new Date().toISOString() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    phone?: string;
    company?: string;
  };
  if (!body.phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }
  const contact = await createContact({
    name: body.name?.trim() || "Farmer",
    phone: body.phone,
    company: body.company,
  });
  return liveJson({ contact });
}
