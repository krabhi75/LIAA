import { NextResponse } from "next/server";
import { normalizePhone, placeVobizCall, vobizConfig } from "@/lib/vobiz";
import { voiceBase } from "@/lib/vobiz-xml";
import { createCall, findContact, updateCall, upsertContactByPhone } from "@/lib/crm-store";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    phone?: string;
    contactId?: string;
    name?: string;
  };
  const { authId, token, from } = vobizConfig();
  if (!authId || !token) {
    return NextResponse.json(
      { error: "Vobiz env missing (VOBIZ_AUTH_ID / VOBIZ_AUTH_TOKEN)" },
      { status: 500 },
    );
  }
  const base = voiceBase(req);
  if (base.includes("localhost") || base.includes("127.0.0.1")) {
    return NextResponse.json(
      {
        error:
          "PUBLIC_BASE_URL must be public HTTPS. Set it to https://liaa-ebon.vercel.app on Vercel.",
      },
      { status: 400 },
    );
  }

  let phone = body.phone ? normalizePhone(body.phone) : "";
  let contactId = body.contactId;
  if (contactId) {
    const c = await findContact(contactId);
    if (!c) return NextResponse.json({ error: "contact not found" }, { status: 404 });
    phone = c.phone;
  }
  if (!phone) {
    return NextResponse.json({ error: "phone required" }, { status: 400 });
  }
  const farmer = await upsertContactByPhone({
    name: body.name?.trim() || "Farmer",
    phone,
  });
  contactId = farmer?.id ?? contactId;

  const row = await createCall({
    contactId: contactId ?? null,
    phone,
    direction: "outbound",
    status: "queued",
    disposition: "dialing",
  });

  try {
    const placed = await placeVobizCall({
      to: phone,
      answerUrl: `${base}/api/vobiz/answer`,
      hangupUrl: `${base}/api/vobiz/hangup`,
    });
    const call = await updateCall(row.id, {
      vobizUuid: placed.requestUuid || `pending-${row.id}`,
      status: "ringing",
    });
    return NextResponse.json({ call: call ?? row, from, farmerId: farmer?.id ?? null });
  } catch (err) {
    await updateCall(row.id, { status: "failed", disposition: "failed" });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "call failed" },
      { status: 502 },
    );
  }
}
