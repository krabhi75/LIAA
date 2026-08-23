import { NextResponse } from "next/server";
import { publicBaseUrl } from "@/lib/agora";
import { normalizePhone, placeVobizCall, vobizConfig } from "@/lib/vobiz";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as { phone?: string; contactId?: string };
  const { authId, token, from } = vobizConfig();
  if (!authId || !token) {
    return NextResponse.json(
      { error: "Vobiz env missing (VOBIZ_AUTH_ID / VOBIZ_AUTH_TOKEN)" },
      { status: 500 },
    );
  }
  const base = publicBaseUrl(req);
  if (!base || base.includes("localhost") || base.includes("127.0.0.1")) {
    return NextResponse.json(
      {
        error:
          "PUBLIC_BASE_URL must be public HTTPS (Cloudflare tunnel). Vobiz cannot fetch localhost XML.",
      },
      { status: 400 },
    );
  }

  let phone = body.phone ? normalizePhone(body.phone) : "";
  let contactId = body.contactId;
  if (contactId) {
    const c = await prisma.crmContact.findUnique({ where: { id: contactId } });
    if (!c) return NextResponse.json({ error: "contact not found" }, { status: 404 });
    phone = c.phone;
  }
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }

  const row = await prisma.crmCall.create({
    data: {
      contactId: contactId ?? null,
      phone,
      direction: "outbound",
      status: "queued",
      disposition: "dialing",
    },
  });

  try {
    const placed = await placeVobizCall({
      to: phone,
      answerUrl: `${base}/api/vobiz/answer`,
      hangupUrl: `${base}/api/vobiz/hangup`,
    });
    const call = await prisma.crmCall.update({
      where: { id: row.id },
      data: {
        vobizUuid: placed.requestUuid || `pending-${row.id}`,
        status: "ringing",
      },
    });
    return NextResponse.json({ call, from });
  } catch (err) {
    await prisma.crmCall.update({
      where: { id: row.id },
      data: { status: "failed", disposition: "failed" },
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "call failed" },
      { status: 502 },
    );
  }
}
