import { NextRequest, NextResponse } from "next/server";
import { AgoraError, generateConvoAIToken } from "agora-agents";
import { agoraClient, appCertificate, appId } from "@/lib/agora";
import { AGENT_UID } from "@/lib/ids";
import {
  clearAgentId,
  endSession,
  findChannelByAgentId,
  findChannelByAgentIdAsync,
} from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { agentId, channel: channelFromBody } = await req.json();
    if (!agentId) {
      return NextResponse.json({ error: "agentId required" }, { status: 400 });
    }

    const channel =
      (typeof channelFromBody === "string" && channelFromBody) ||
      findChannelByAgentId(agentId) ||
      (await findChannelByAgentIdAsync(agentId));
    if (!channel) {
      return NextResponse.json(
        { error: "channel required to stop the agent" },
        { status: 400 },
      );
    }

    const token = generateConvoAIToken({
      appId: appId(),
      appCertificate: appCertificate(),
      channelName: channel,
      uid: Number(AGENT_UID),
    });

    await agoraClient().agents.stop(
      { appid: appId(), agentId },
      { headers: { Authorization: `agora token=${token}` } },
    );
    clearAgentId(channel);
    endSession(channel);
    return NextResponse.json({ stopped: true });
  } catch (err: unknown) {
    if (err instanceof AgoraError && err.statusCode === 404) {
      return NextResponse.json({ stopped: true, alreadyStopped: true });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `stop failed: ${message}` }, { status: 502 });
  }
}
