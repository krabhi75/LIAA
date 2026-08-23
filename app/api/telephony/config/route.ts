import { publicBaseUrl } from "@/lib/agora";
import { vobizConfig } from "@/lib/vobiz";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { from } = vobizConfig();
  const base = publicBaseUrl(req);
  return NextResponse.json({
    number: from,
    hangupUrl: base ? `${base}/api/vobiz/hangup` : null,
    answerUrlFallback: base ? `${base}/api/vobiz/answer` : null,
    agoraSbc: "sbc-ap-south.viblinx.com",
    docs: "https://www.vobiz.ai/docs/integrations/agora",
  });
}
