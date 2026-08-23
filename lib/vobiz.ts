function xmlEscape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function vobizXml(inner: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
}

export function speakGatherXml(prompt: string, actionUrl: string): string {
  const speak = `<Speak voice="WOMAN" language="en-IN">${xmlEscape(prompt)}</Speak>`;
  return vobizXml(
    `<Gather action="${xmlEscape(actionUrl)}" method="POST" inputType="speech" language="hi-IN" speechModel="phone_call" speechEndTimeout="auto" executionTimeout="12" hints="fasal,patte,keeda,gehun,gaon,paani,expert">${speak}</Gather><Speak language="en-IN">I did not hear you. Goodbye.</Speak><Hangup/>`,
  );
}

export function hangupXml(message: string): string {
  return vobizXml(
    `<Speak voice="WOMAN" language="en-IN">${xmlEscape(message)}</Speak><Hangup/>`,
  );
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export function vobizConfig() {
  const authId = process.env.VOBIZ_AUTH_ID ?? "";
  const token = process.env.VOBIZ_AUTH_TOKEN ?? "";
  const from = process.env.VOBIZ_FROM_NUMBER ?? "+911171366938";
  return { authId, token, from };
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  return raw.trim();
}

export async function parseVobizBody(
  req: Request,
): Promise<Record<string, string>> {
  const ctype = req.headers.get("content-type") ?? "";
  if (ctype.includes("application/json")) {
    const json = (await req.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([k, v]) => [k, v == null ? "" : String(v)]),
    );
  }
  const text = await req.text();
  const params = new URLSearchParams(text);
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}

export async function placeVobizCall(opts: {
  to: string;
  answerUrl: string;
  hangupUrl: string;
}): Promise<{ requestUuid: string; raw: unknown }> {
  const { authId, token, from } = vobizConfig();
  if (!authId || !token) {
    throw new Error("Vobiz credentials missing. Set VOBIZ_AUTH_ID and VOBIZ_AUTH_TOKEN.");
  }
  const res = await fetch(
    `https://api.vobiz.ai/api/v1/Account/${authId}/Call/`,
    {
      method: "POST",
      headers: {
        "X-Auth-ID": authId,
        "X-Auth-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        answer_url: opts.answerUrl,
        answer_method: "POST",
        hangup_url: opts.hangupUrl,
        hangup_method: "POST",
        caller_name: "Liaa",
        time_limit: 180,
      }),
    },
  );
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof raw.message === "string"
        ? raw.message
        : `Vobiz call failed (${res.status})`,
    );
  }
  const requestUuid = String(raw.request_uuid ?? raw.call_uuid ?? "");
  return { requestUuid, raw };
}

export function mapDisposition(params: Record<string, string>): string {
  const cause = (
    params.HangupCause ??
    params.hangup_cause ??
    params.EndReason ??
    ""
  ).toLowerCase();
  const status = (params.CallStatus ?? params.call_status ?? "").toLowerCase();
  const answered = Boolean(params.AnswerTime || params.answer_time);

  if (cause.includes("busy")) return "busy";
  if (cause.includes("no_answer") || cause.includes("no-answer") || cause.includes("noanswer")) {
    return "no_answer";
  }
  if (cause.includes("cancel")) return "cancelled";
  if (cause.includes("fail") || status === "failed") return "failed";
  if (answered || status === "completed") return "completed";
  return status || "ended";
}
