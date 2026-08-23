import { publicBaseUrl } from "@/lib/agora";
import { vobizConfig } from "@/lib/vobiz";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { from, sipDomain, outboundTrunkId, inboundTrunkId } = vobizConfig();
  const base = publicBaseUrl(req);
  return NextResponse.json({
    number: from,
    sipDomain,
    outboundTrunkId,
    inboundTrunkId,
    vobizWebhook: base ? `${base}/api/webhooks/vobiz` : null,
    agoraWebhook: base ? `${base}/api/webhooks/agora` : null,
    hangupUrl: base ? `${base}/api/vobiz/hangup` : null,
    answerUrl: base ? `${base}/api/vobiz/answer` : null,
    gatherUrl: base ? `${base}/api/vobiz/gather` : null,
    inboundTrunkWebhook: base ? `${base}/api/webhooks/vobiz` : null,
    outboundTrunkWebhook: base ? `${base}/api/webhooks/vobiz` : null,
    answerUrlFallback: base ? `${base}/api/vobiz/answer` : null,
    agoraSbc: "sbc-ap-south.viblinx.com",
    docs: "https://www.vobiz.ai/docs/integrations/agora",
  });
}
