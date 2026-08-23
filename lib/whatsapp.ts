import { upsertCaseFromCall } from "./agri-cases";
import { upsertContactByPhone } from "./crm-store";
import { addWaMessage } from "./whatsapp-store";
import { normalizePhone } from "./vobiz";

export function whatsappEnv() {
  const token = process.env.WHATSAPP_TOKEN ?? process.env.WHATSAPP_ACCESS_TOKEN ?? "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN ?? "liaa-whatsapp-verify";
  const from = process.env.WHATSAPP_FROM_NUMBER ?? "";
  return { token, phoneNumberId, verifyToken, from, live: Boolean(token && phoneNumberId) };
}

type MetaMsg = {
  from?: string;
  id?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};

function bodyFromType(msg: MetaMsg): string {
  const kind = msg.type ?? "text";
  switch (kind) {
    case "text":
      return msg.text?.body ?? "";
    case "button":
      return msg.button?.text ?? "";
    case "interactive":
      return (
        msg.interactive?.button_reply?.title ??
        msg.interactive?.list_reply?.title ??
        ""
      );
    case "image":
      return "[image]";
    case "audio":
      return "[audio]";
    case "video":
      return "[video]";
    case "document":
      return "[document]";
    default: {
      const _never: string = kind;
      return _never ? `[${kind}]` : "";
    }
  }
}

export async function ingestWhatsappInbound(opts: {
  phone: string;
  name?: string;
  text: string;
  waId?: string;
}): Promise<{ contactId: string | null; caseId: string; messageId: string }> {
  const phone = normalizePhone(opts.phone);
  const name = opts.name?.trim() || "Farmer";
  const text = opts.text.trim() || "(empty)";
  const contact = await upsertContactByPhone({ name, phone });
  const agri = upsertCaseFromCall({
    phone,
    farmerName: name,
    direction: "inbound",
    source: "whatsapp",
    channel: opts.waId || `wa-${phone}`,
    summary: text.slice(0, 280),
    transcript: text,
    status: "open",
  });
  const msg = addWaMessage({
    id: opts.waId,
    waId: opts.waId ?? "",
    phone,
    name,
    direction: "inbound",
    text,
    status: "received",
  });
  return { contactId: contact?.id ?? null, caseId: agri.id, messageId: msg.id };
}

export function extractMetaMessages(payload: unknown): {
  phone: string;
  name: string;
  text: string;
  waId: string;
}[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
          messages?: MetaMsg[];
        };
      }>;
    }>;
  };
  const out: { phone: string; name: string; text: string; waId: string }[] = [];
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const name = value?.contacts?.[0]?.profile?.name ?? "Farmer";
      for (const msg of value?.messages ?? []) {
        if (!msg.from) continue;
        out.push({
          phone: msg.from,
          name,
          text: bodyFromType(msg),
          waId: msg.id ?? "",
        });
      }
    }
  }
  return out;
}

export async function sendWhatsappText(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const { token, phoneNumberId, live } = whatsappEnv();
  const phone = normalizePhone(to).replace(/^\+/, "");
  addWaMessage({
    waId: "",
    phone: normalizePhone(to),
    name: "Liaa",
    direction: "outbound",
    text,
    status: live ? "queued" : "demo",
  });
  if (!live) {
    return { ok: true, error: "Demo only — set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to send on Meta." };
  }
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err.slice(0, 400) };
  }
  return { ok: true };
}
