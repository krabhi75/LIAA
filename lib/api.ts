const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export type TokenResponse = {
  rtcToken: string;
  rtmToken: string;
  expireAt: number;
};

export type InviteResponse = {
  agentId: string;
  agentUid: string;
  channel: string;
  mcpAttached: boolean;
};

export const api = {
  token: (channel: string, uid: number) =>
    post<TokenResponse>("/api/token", { channel, uid }),
  invite: (channel: string) =>
    post<InviteResponse>("/api/invite-agent", { channel }),
  stop: (agentId: string) =>
    post<{ stopped: boolean }>("/api/stop-conversation", { agentId }),
  session: async (channel: string) => {
    const res = await fetch(`${BACKEND}/api/session/${encodeURIComponent(channel)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("session fetch failed");
    return res.json();
  },
};
