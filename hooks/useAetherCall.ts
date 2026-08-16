"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { parseTranscriptMessage, type TranscriptLine } from "@/lib/rtm-parse";

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
};

type RtmHandle = {
  login: (opts: { token: string }) => Promise<unknown>;
  subscribe: (channel: string) => Promise<unknown>;
  addEventListener: (
    event: "message",
    handler: (e: { message: string | Uint8Array }) => void,
  ) => void;
  logout: () => Promise<unknown>;
};

export function useAetherCall(
  channel: string,
  uid: number,
  options: { inviteAgent?: boolean } = {},
) {
  const inviteAgent = options.inviteAgent !== false;
  const rtcRef = useRef<RtcHandle | null>(null);
  const micRef = useRef<MicHandle | null>(null);
  const rtmRef = useRef<RtmHandle | null>(null);
  const agentIdRef = useRef<string | null>(null);

  const [connected, setConnected] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mcpAttached, setMcpAttached] = useState(false);
  const [session, setSession] = useState<SessionView | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<string[]>([]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const [{ default: AgoraRTC }, rtmMod] = await Promise.all([
        import("agora-rtc-sdk-ng"),
        import("agora-rtm-sdk"),
      ]);
      const RTMClient = rtmMod.RTMClient;

      const { rtcToken, rtmToken } = await api.token(channel, uid);
      const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
      if (!appId) throw new Error("NEXT_PUBLIC_AGORA_APP_ID is not set");

      const rtc = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      rtc.on("user-published", async (user, mediaType) => {
        if (mediaType !== "audio") return;
        await rtc.subscribe(user, mediaType);
        user.audioTrack?.play();
        setAgentSpeaking(true);
        setRemoteUsers((prev) =>
          prev.includes(String(user.uid)) ? prev : [...prev, String(user.uid)],
        );
      });
      rtc.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "audio") setAgentSpeaking(false);
        setRemoteUsers((prev) => prev.filter((id) => id !== String(user.uid)));
      });
      await rtc.join(appId, channel, rtcToken, uid);
      const mic = await AgoraRTC.createMicrophoneAudioTrack();
      await rtc.publish(mic);
      rtcRef.current = rtc as unknown as RtcHandle;
      micRef.current = mic;

      const rtm = new RTMClient(appId, String(uid));
      await rtm.login({ token: rtmToken });
      await rtm.subscribe(channel);
      rtm.addEventListener("message", (event) => {
        const line = parseTranscriptMessage(event.message);
        if (!line) return;
        setTranscripts((prev) => {
          if (!line.final && prev.length) {
            const last = prev[prev.length - 1];
            if (last.role === line.role && !last.final) {
              return [...prev.slice(0, -1), line];
            }
          }
          return [...prev, line];
        });
      });
      rtmRef.current = rtm as unknown as RtmHandle;

      if (inviteAgent) {
        const invite = await api.invite(channel);
        agentIdRef.current = invite.agentId;
        setMcpAttached(invite.mcpAttached);
      }
      setConnected(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      micRef.current?.stop();
      micRef.current?.close();
      await rtcRef.current?.leave().catch(() => undefined);
      await rtmRef.current?.logout().catch(() => undefined);
    }
  }, [channel, uid, inviteAgent]);

  const stop = useCallback(async () => {
    try {
      if (agentIdRef.current) await api.stop(agentIdRef.current);
    } finally {
      micRef.current?.stop();
      micRef.current?.close();
      await rtcRef.current?.leave().catch(() => undefined);
      await rtmRef.current?.logout().catch(() => undefined);
      agentIdRef.current = null;
      rtcRef.current = null;
      micRef.current = null;
      rtmRef.current = null;
      setConnected(false);
      setAgentSpeaking(false);
      setRemoteUsers([]);
    }
  }, []);

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
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [channel]);

  useEffect(() => {
    const onUnload = () => {
      if (agentIdRef.current) {
        void api.stop(agentIdRef.current);
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  return {
    connected,
    agentSpeaking,
    transcripts,
    error,
    mcpAttached,
    session,
    remoteUsers,
    start,
    stop,
  };
}
