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
import { getSession } from "@/lib/auth";
import { AGENT_UID } from "@/lib/ids";
import { FAILURE_MESSAGE, liaaGreeting } from "@/lib/prompt";
import { ensureDemoTenant, getDefaultAgentForOrg, recordUsage } from "@/lib/saas";
import { bindSessionMeta, setAgentId } from "@/lib/store";
import { buildLiaaSystemPrompt, TOOL_NAMES } from "@/lib/tools";
import { prisma } from "@/lib/db";
import { loadMemories } from "@/lib/memory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const channel = body.channel as string | undefined;
    const agentConfigId = body.agentConfigId as string | undefined;
    if (!channel) {
      return NextResponse.json({ error: "channel required" }, { status: 400 });
    }

    await loadMemories();

    let orgId: string | undefined;
    let config: {
      id: string;
      workspaceId?: string;
      llmModel: string;
      failureMessage: string;
      mcpKey: string;
      sttModel: string;
      ttsModel: string;
      ttsVoiceId: string;
      idleTimeout: number;
    } | null = null;

    try {
      const sessionUser = await getSession();
      config = agentConfigId
        ? await prisma.agentConfig.findUnique({ where: { id: agentConfigId } })
        : null;

      if (!config && sessionUser) {
        config = await getDefaultAgentForOrg(sessionUser.orgId);
        orgId = sessionUser.orgId;
      }

      if (!config) {
        const demo = await ensureDemoTenant();
        config = demo.agent;
        orgId = demo.org.id;
      } else if (!orgId) {
        if (config.workspaceId) {
          const ws = await prisma.workspace.findUnique({
            where: { id: config.workspaceId },
          });
          orgId = ws?.orgId;
        }
      }
    } catch (err) {
      console.error("[invite-agent] database unavailable; using demo agent", err);
    }

    if (!config) {
      config = {
        id: "liaa-demo",
        llmModel: "gpt-4o-mini",
        failureMessage: FAILURE_MESSAGE,
        mcpKey: mcpKey(),
        sttModel: "nova-3",
        ttsModel: "speech-2.6-turbo",
        ttsVoiceId:
          process.env.LIAA_TTS_VOICE ||
          process.env.NOVA_TTS_VOICE ||
          "English_captivating_female1",
        idleTimeout: 180,
      };
    }

    bindSessionMeta(channel, {
      orgId,
      agentConfigId: config.id,
    });

    const base = publicBaseUrl(req);
    const mcpEndpoint = base ? `${base}/api/mcp` : null;
    const localhost =
      !base ||
      base.includes("localhost") ||
      base.includes("127.0.0.1");
    const mcpAttached = Boolean(mcpEndpoint && !localhost);
    const toolKey = config.mcpKey || mcpKey();
    const systemPrompt = await buildLiaaSystemPrompt(channel);
    const greeting = await liaaGreeting();

    const llm = new OpenAI({
      model: config.llmModel || "gpt-4o-mini",
      maxHistory: 50,
      temperature: 0.6,
      systemMessages: [{ role: "system", content: systemPrompt }],
      greetingMessage: greeting,
      failureMessage: config.failureMessage || FAILURE_MESSAGE,
      ...(mcpAttached
        ? {
            mcpServers: [
              {
                name: "nova",
                transport: "streamable_http",
                endpoint: mcpEndpoint!,
                headers: {
                  "X-Aether-Channel": channel,
                  "X-Aether-Key": toolKey,
                },
                allowed_tools: [...TOOL_NAMES],
                timeout_ms: 8000,
              },
            ],
          }
        : {}),
    } as ConstructorParameters<typeof OpenAI>[0]);

    const agent = new Agent({
      client: agoraClient(),
      turnDetection: { language: "hi-IN" },
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
      .withStt(
        new DeepgramSTT({
          model: config.sttModel || "nova-3",
          language: "hi",
        } as ConstructorParameters<typeof DeepgramSTT>[0]),
      )
      .withLlm(llm)
      .withTts(
        new MiniMaxTTS({
          model: config.ttsModel || "speech-2.6-turbo",
          // Prefer Hindi-capable voice when set; English id still speaks Hinglish well enough for demos
          voiceId:
            config.ttsVoiceId ||
            process.env.LIAA_TTS_VOICE ||
            process.env.NOVA_TTS_VOICE ||
            "English_captivating_female1",
        } as ConstructorParameters<typeof MiniMaxTTS>[0]),
      )
      .withTools(mcpAttached);

    const voiceSession = agent.createSession({
      channel,
      agentUid: AGENT_UID,
      remoteUids: ["*"],
      name: `nova-${channel}`.slice(0, 64),
      idleTimeout: config.idleTimeout || 180,
      expiresIn: ExpiresIn.hours(1),
    });

    const agentId = await voiceSession.start();
    setAgentId(channel, agentId);

    if (orgId) {
      void recordUsage(orgId, "session_start", 1, {
        channel,
        agentConfigId: config.id,
      });
    }

    return NextResponse.json({
      agentId,
      agentUid: AGENT_UID,
      channel,
      mcpAttached,
      agentConfigId: config.id,
      orgId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `start failed: ${message}` }, { status: 502 });
  }
}
