import { NextResponse } from "next/server";
import { publicBaseUrl } from "@/lib/agora";
import { xmlResponse, parseVobizBody, speakGatherXml } from "@/lib/vobiz";
import { findCallByUuid, updateCall } from "@/lib/crm-store";
import { ingestCallWebhook, flattenWebhook } from "@/lib/crm-ingest";

export async function POST(req: Request) {
  const params = await parseVobizBody(req);
  const uuid = params.CallUUID || params.RequestUUID || "";
  if (uuid) {
    const existing = await findCallByUuid(uuid);
    if (existing) {
      await updateCall(existing.id, {
        status: "in-progress",
        answeredAt: new Date().toISOString(),
      });
    } else {
      await ingestCallWebhook("vobiz", flattenWebhook(params));
    }
  }
  const base = publicBaseUrl(req);
  const action = `${base}/api/vobiz/gather`;
  return xmlResponse(
    speakGatherXml(
      "Namaste. Main Liaa, kheti sahayak. Kaun si fasal hai aur kya dikh raha hai?",
      action,
    ),
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Vobiz Answer URL for CRM XML outbound. Do not attach this Voice App to the SIP DID.",
  });
}
