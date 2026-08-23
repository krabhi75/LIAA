import { runTool } from "./tools";

export type PhoneTurn = {
  speak: string;
  hangup: boolean;
  tool?: string;
};

export function handlePhoneSpeech(channel: string, speech: string): PhoneTurn {
  const t = speech.trim().toLowerCase();
  if (!t) {
    return {
      speak: "I did not catch that. Say calendar, book a meeting, or inbox.",
      hangup: false,
    };
  }
  if (/\b(bye|goodbye|alvida|band karo|hang up|stop)\b/.test(t)) {
    return { speak: "Theek hai. Dhanyavaad. Liaa signing off.", hangup: true };
  }

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);

  if (/\b(calendar|schedule|din|agenda|aaj)\b/.test(t)) {
    const out = runTool(channel, "get_calendar", {
      start: start.toISOString(),
      end: end.toISOString(),
    }) as { card?: { title?: string; detail?: string } };
    return {
      speak: `Calendar: ${out.card?.title ?? "checked"}. ${out.card?.detail ?? ""} It is on screen in CRM.`,
      hangup: false,
      tool: "get_calendar",
    };
  }

  if (/\b(book|meeting|meet|milo|sync)\b/.test(t)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(16, 0, 0, 0);
    const endAt = new Date(tomorrow.getTime() + 30 * 60 * 1000);
    const out = runTool(channel, "create_event", {
      title: "Liaa demo sync",
      start: tomorrow.toISOString(),
      end: endAt.toISOString(),
    }) as { card?: { title?: string; detail?: string } };
    return {
      speak: `Meeting booked. ${out.card?.title ?? ""} ${out.card?.detail ?? ""}. Demo data, on screen.`,
      hangup: false,
      tool: "create_event",
    };
  }

  if (/\b(mail|email|inbox|inbox mein)\b/.test(t)) {
    const out = runTool(channel, "read_email", {
      query: "",
      limit: 3,
    }) as { card?: { title?: string; detail?: string } };
    return {
      speak: `Mail: ${out.card?.title ?? "checked"}. ${out.card?.detail ?? ""} On screen.`,
      hangup: false,
      tool: "read_email",
    };
  }

  return {
    speak: "Main calendar dekh sakti hoon, meeting book kar sakti hoon, ya inbox padh sakti hoon. Kya karna hai?",
    hangup: false,
  };
}
