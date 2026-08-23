import { publicBaseUrl } from "@/lib/agora";
import { xmlResponse, parseVobizBody, speakGatherXml } from "@/lib/vobiz";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const params = await parseVobizBody(req);
  const uuid = params.CallUUID || params.RequestUUID || "";
  if (uuid) {
    await prisma.crmCall.updateMany({
      where: { vobizUuid: uuid },
      data: { status: "in-progress", answeredAt: new Date() },
    });
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
