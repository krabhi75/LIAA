export type TranscriptLine = {
  role: "user" | "agent" | "system";
  text: string;
  final: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

export function parseTranscriptMessage(
  raw: string | Uint8Array,
): TranscriptLine | null {
  const text =
    typeof raw === "string" ? raw : new TextDecoder().decode(raw);
  try {
    const parsed = JSON.parse(text) as unknown;
    const obj = asRecord(parsed);
    if (!obj) return null;

    const nested = asRecord(obj.data) ?? asRecord(obj.payload) ?? obj;
    const objectType = String(nested.object ?? obj.object ?? obj.type ?? "");
    const roleRaw = String(nested.role ?? obj.role ?? "");
    const body = String(
      nested.text ?? nested.transcript ?? obj.text ?? obj.message ?? "",
    ).trim();
    if (!body) return null;

    const isAgent =
      objectType.includes("assistant") ||
      roleRaw === "assistant" ||
      roleRaw === "agent" ||
      objectType === "transcript.agent";
    const isUser =
      objectType.includes("user") ||
      roleRaw === "user" ||
      objectType === "transcript.user";
    if (!isAgent && !isUser && objectType && !objectType.includes("transcript")) {
      return null;
    }

    const final = Boolean(
      nested.is_final ?? nested.final ?? obj.is_final ?? obj.final ?? true,
    );
    return {
      role: isAgent ? "agent" : "user",
      text: body,
      final,
    };
  } catch {
    return null;
  }
}
