import { NextRequest, NextResponse } from "next/server";
import { agoraClient, appId } from "@/lib/agora";

export async function POST(req: NextRequest) {
  try {
    const { agentId } = await req.json();
    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    await agoraClient().agents.stop({
      appid: appId(),
      agentId,
    });
    return NextResponse.json({ stopped: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `stop failed: ${message}` }, { status: 502 });
  }
}
