"use client";

import { useSyncExternalStore } from "react";
import { newChannelName } from "@/lib/ids";

function subscribe(): () => void {
  return () => undefined;
}

function getClientChannel(): string {
  const g = globalThis as typeof globalThis & { __molvaaniChannel?: string };
  if (!g.__molvaaniChannel) g.__molvaaniChannel = newChannelName();
  return g.__molvaaniChannel;
}

function getServerChannel(): string {
  return "";
}

export function useClientChannel(): string {
  return useSyncExternalStore(subscribe, getClientChannel, getServerChannel);
}
