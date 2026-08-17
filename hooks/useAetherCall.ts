"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  TranscriptHelperMode,
  TurnStatus,
  type TranscriptHelperItem,
} from "agora-agent-client-toolkit";
import { api } from "@/lib/api";
import { explainCallError } from "@/lib/call-error";
import { AGENT_UID } from "@/lib/ids";
import type { TranscriptLine } from "@/lib/rtm-parse";

type SessionView = {
  agentId?: string;
  lead?: {
    name?: string;
    company?: string;
    seats?: number;
    status?: string;
    objections?: string[];
    competitor?: string;
    planId?: string;
  };
  meetings?: { id: string; label: string; attendee?: string }[];
  escalation?: { reason: string; summary: string; waiting: boolean };
  tools?: { at: string; tool: string; input: unknown; output: unknown }[];
  mcpAttached?: boolean;
};

type RtcHandle = {
  join: (
    appId: string,
    channel: string,
    token: string,
    uid: number,
  ) => Promise<unknown>;
  publish: (track: unknown) => Promise<unknown>;
  leave: () => Promise<unknown>;
  on: (event: string, handler: (...args: never[]) => void) => void;
  subscribe: (user: unknown, mediaType: string) => Promise<unknown>;
};

type MicHandle = {
  stop: () => void;
  close: () => void;
  getVolumeLevel?: () => number;
};

type AudioLevelHandle = {
  getVolumeLevel?: () => number;
};

export type CallTelemetry = {
  startedAt: number;
  elapsedMs: number;
  buyerLevel: number;
  agentLevel: number;
  agentTalkMs: number;
  listenMs: number;
};

type RtmHandle = {
  login: (opts: { token: string }) => Promise<unknown>;
  subscribe: (channel: string, options?: Record<string, boolean>) => Promise<unknown>;
  addEventListener: (event: string, handler: (...args: never[]) => void) => void;
  removeEventListener: (event: string, handler: (...args: never[]) => void) => void;
  publish: (
    channelName: string,
    message: string | Uint8Array,
    options?: object,
  ) => Promise<unknown>;
  logout: () => Promise<unknown>;
};

type RtmModule = {
  RTMClient?: new (appId: string, userId: string, config?: object) => RtmHandle;
  default?: { RTM?: new (appId: string, userId: string, config?: object) => RtmHandle };
  RTM?: new (appId: string, userId: string, config?: object) => RtmHandle;
};

function resolveRtmCtor(mod: RtmModule) {
  return (
    mod.RTMClient ??
    mod.default?.RTM ??
    mod.RTM ??
    null
  );
}

function mapTranscript(
  items: TranscriptHelperItem<unknown>[],
): TranscriptLine[] {
  return items
    .filter((item) => item.text?.trim())
    .map((item) => {
      const meta = item.metadata as { object?: string; user_id?: string } | null;
      const agent =
        item.uid === AGENT_UID ||
        item.uid === String(AGENT_UID) ||
        meta?.object?.includes("assistant") === true;
      return {
        role: agent ? "agent" : "user",
        text: item.text,
        final: item.status === TurnStatus.END || item.status === TurnStatus.INTERRUPTED,
        at: item._time || Date.now(),
      } satisfies TranscriptLine;
    });
}

export function useAetherCall(
  channel: string,
  uid: number,
  options: { inviteAgent?: boolean; agentConfigId?: string } = {},
) {
  const inviteAgent = options.inviteAgent !== false;
  const agentConfigId = options.agentConfigId;
  const rtcRef = useRef<RtcHandle | null>(null);
  const micRef = useRef<MicHandle | null>(null);
  const remoteAudioRef = useRef<AudioLevelHandle | null>(null);
  const rtmRef = useRef<RtmHandle | null>(null);
  const agentIdRef = useRef<string | null>(null);
  const speakingRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mcpAttached, setMcpAttached] = useState(false);
  const [session, setSession] = useState<SessionView | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<string[]>([]);
  const [telemetry, setTelemetry] = useState<CallTelemetry>({
    startedAt: 0,
    elapsedMs: 0,
    buyerLevel: 0,
    agentLevel: 0,
    agentTalkMs: 0,
    listenMs: 0,
  });

  const cleanupMedia = useCallback(async () => {
    try {
      AgoraVoiceAI.getInstance().unsubscribe();
      AgoraVoiceAI.getInstance().destroy();
    } catch {
      /* not initialized */
    }
    micRef.current?.stop();
    micRef.current?.close();
    await rtcRef.current?.leave().catch(() => undefined);
    await rtmRef.current?.logout().catch(() => undefined);
    rtcRef.current = null;
    micRef.current = null;
    remoteAudioRef.current = null;
    rtmRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!channel) {
      setError("Channel is not ready. Refresh the page.");
      return;
    }
    setError(null);
    setConnecting(true);
    setTranscripts([]);
    setTelemetry({
      startedAt: Date.now(),
      elapsedMs: 0,
      buyerLevel: 0,
      agentLevel: 0,
      agentTalkMs: 0,
      listenMs: 0,
    });
    try {
      const [{ default: AgoraRTC }, rtmMod] = await Promise.all([
        import("agora-rtc-sdk-ng"),
        import("agora-rtm"),
      ]);
      const RTMClient = resolveRtmCtor(rtmMod as RtmModule);
      if (!RTMClient) {
        throw new Error("Agora Signaling SDK did not export RTMClient");
      }

      const { rtcToken, rtmToken } = await api.token(channel, uid);
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) throw new Error("NEXT_PUBLIC_AGORA_APP_ID is not set");

      const rtcSdk = AgoraRTC as typeof AgoraRTC & {
        setParameter?: (key: string, value: unknown) => void;
      };
      rtcSdk.setParameter?.("ENABLE_AUDIO_PTS_METADATA", true);
      const rtc = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      rtc.on("user-published", async (user, mediaType) => {
        if (mediaType !== "audio") return;
        await rtc.subscribe(user, mediaType);
        user.audioTrack?.play();
        remoteAudioRef.current = user.audioTrack as AudioLevelHandle;
        setAgentSpeaking(true);
        speakingRef.current = true;
        setRemoteUsers((prev) =>
          prev.includes(String(user.uid)) ? prev : [...prev, String(user.uid)],
        );
      });
      rtc.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") {
          setAgentSpeaking(false);
          speakingRef.current = false;
          remoteAudioRef.current = null;
        }
        setRemoteUsers((prev) => prev.filter((id) => id !== String(user.uid)));
      });

      await rtc.join(appId, channel, rtcToken, uid);
      const mic = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: "speech_standard",
        AEC: true,
        ANS: true,
      });
      await rtc.publish(mic);
      rtcRef.current = rtc as unknown as RtcHandle;
      micRef.current = mic;

      const rtm = new RTMClient(appId, String(uid), { useStringUserId: false });
      await rtm.login({ token: rtmToken });
      await rtm.subscribe(channel, { withMessage: true, withPresence: true });
      rtmRef.current = rtm;

      const ai = await AgoraVoiceAI.init({
        rtcEngine: rtc,
        rtmEngine: rtm,
        renderMode: TranscriptHelperMode.TEXT,
        enableLog: false,
      });
      ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (items) => {
        setTranscripts(mapTranscript(items));
      });
      ai.on(AgoraVoiceAIEvents.AGENT_SPEAKING_CHANGED, (_id, active) => {
        setAgentSpeaking(Boolean(active));
        speakingRef.current = Boolean(active);
      });
      ai.on(AgoraVoiceAIEvents.AGENT_ERROR, (_id, err) => {
        const text = typeof err === "object" && err && "message" in err
          ? String((err as { message: string }).message)
          : "Agent error";
        setError(text);
      });
      ai.subscribeMessage(channel);

      if (inviteAgent) {
        const invite = await api.invite(channel, agentConfigId);
        agentIdRef.current = invite.agentId;
        setMcpAttached(invite.mcpAttached);
      }
      setConnected(true);
    } catch (e) {
      setError(explainCallError(e));
      await cleanupMedia();
    } finally {
      setConnecting(false);
    }
  }, [channel, uid, inviteAgent, agentConfigId, cleanupMedia]);

  const stop = useCallback(async () => {
    try {
      if (agentIdRef.current) await api.stop(agentIdRef.current, channel);
    } finally {
      await cleanupMedia();
      agentIdRef.current = null;
      setConnected(false);
      setConnecting(false);
      setAgentSpeaking(false);
      speakingRef.current = false;
      setRemoteUsers([]);
      setTelemetry((prev) => ({
        ...prev,
        buyerLevel: 0,
        agentLevel: 0,
      }));
    }
  }, [channel, cleanupMedia]);

  useEffect(() => {
    if (!channel) return;
    const tick = async () => {
      try {
        const data = await api.session(channel);
        setSession(data);
      } catch {
        /* keep last snapshot */
      }
    };
    tick();
    const id = setInterval(tick, connected ? 700 : 2500);
    return () => clearInterval(id);
  }, [channel, connected]);

  useEffect(() => {
    if (!connected) return;
    const id = window.setInterval(() => {
      const buyer = micRef.current?.getVolumeLevel?.() ?? 0;
      const agent = remoteAudioRef.current?.getVolumeLevel?.() ?? 0;
      setTelemetry((prev) => ({
        ...prev,
        elapsedMs: prev.startedAt ? Date.now() - prev.startedAt : prev.elapsedMs,
        buyerLevel: buyer,
        agentLevel: agent,
        agentTalkMs: prev.agentTalkMs + (speakingRef.current ? 80 : 0),
        listenMs: prev.listenMs + (speakingRef.current ? 0 : 80),
      }));
    }, 80);
    return () => window.clearInterval(id);
  }, [connected]);

  useEffect(() => {
    const onUnload = () => {
      if (agentIdRef.current) {
        void api.stop(agentIdRef.current, channel);
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [channel]);

  return {
    connected,
    connecting,
    agentSpeaking,
    transcripts,
    error,
    mcpAttached,
    session,
    remoteUsers,
    telemetry,
    start,
    stop,
  };
}
