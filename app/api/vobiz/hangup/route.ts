import { NextResponse } from "next/server";
import { mapDisposition, parseVobizBody } from "@/lib/vobiz";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const params = await parseVobizBody(req);
  const uuid = params.CallUUID || params.RequestUUID || "";
  const disposition = mapDisposition(params);
  if (uuid) {
    await prisma.crmCall.updateMany({
      where: { vobizUuid: uuid },
      data: {
        status: "ended",
        disposition,
        hangupCause: params.HangupCause ?? params.hangup_cause ?? "",
        endedAt: new Date(),
      },
    });
  }
  return NextResponse.json({ ok: true, disposition });
}
