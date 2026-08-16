import { NextRequest, NextResponse } from "next/server";
import {
  Agent,
  AudioScenario,
  DataChannel,
  DeepgramSTT,
  ExpiresIn,
  InterruptionModeStartOfSpeech,
  MiniMaxTTS,
  OpenAI,
} from "agora-agents";
import {
  agoraClient,
  mcpKey,
  publicBaseUrl,
} from "@/lib/agora";
import { AGENT_UID } from "@/lib/ids";
import { FAILURE_MESSAGE, GREETING, SALES_INSTRUCTIONS } from "@/lib/prompt";
import { setAgentId } from "@/lib/store";
import { TOOL_NAMES } from "@/lib/tools";

export async function POST(req: NextRequest) {
  try {
    const { channel } = await req.json();
    if (!channel) {
      return NextResponse.json({ error: "channel required" }, { status: 400 });
    }

    const base = publicBaseUrl(req);
    const mcpEndpoint = base ? `${base}/api/mcp` : null;
    const localhost =
      !base ||
      base.includes("localhost") ||
      base.includes("127.0.0.1");
    const mcpAttached = Boolean(mcpEndpoint && !localhost);

    const llm = new OpenAI({
      model: "gpt-4o-mini",
      maxHistory: 50,
      temperature: 0.6,
      systemMessages: [{ role: "system", content: SALES_INSTRUCTIONS }],
      greetingMessage: GREETING,
      failureMessage: FAILURE_MESSAGE,
      ...(mcpAttached
        ? {
            mcpServers: [
              {
                name: "aetherclose",
                transport: "streamable_http",
                endpoint: mcpEndpoint,
                headers: {
                  "X-Aether-Channel": channel,
                  "X-Aether-Key": mcpKey(),
                },
                allowed_tools: [...TOOL_NAMES],
                timeout_ms: 8000,
              },
            ],
          }
        : {}),
    });

    const agent = new Agent({
      client: agoraClient(),
      turnDetection: { language: "en-US" },
      interruption: { enable: true, mode: InterruptionModeStartOfSpeech },
      advancedFeatures: {
        enable_rtm: true,
        enable_tools: mcpAttached,
      },
      parameters: {
        data_channel: DataChannel.Rtm,
        enable_error_message: true,
        enable_metrics: true,
        audio_scenario: AudioScenario.Aiserver,
        transcript: { enable: true, protocol_version: "v2" },
      } as never,
    })
      .withStt(new DeepgramSTT({ model: "nova-3", language: "en-US" }))
      .withLlm(llm)
      .withTts(
        new MiniMaxTTS({
          model: "speech-2.6-turbo",
          voiceId: "English_captivating_female1",
        }),
      )
      .withTools(mcpAttached);

    const session = agent.createSession({
      channel,
      agentUid: AGENT_UID,
      remoteUids: ["*"],
      name: `aetherclose-${channel}`.slice(0, 64),
      idleTimeout: 180,
      expiresIn: ExpiresIn.hours(1),
    });

    const agentId = await session.start();
    setAgentId(channel, agentId);

    return NextResponse.json({
      agentId,
      agentUid: AGENT_UID,
      channel,
      mcpAttached,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `start failed: ${message}` }, { status: 502 });
  }
}
