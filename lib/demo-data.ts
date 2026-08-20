/** Seeded calendar + inbox when live Google is not wired — always labelled DEMO on cards. */

const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export type DemoEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  meet?: string;
  attendees?: string[];
};

export type DemoMessage = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  body: string;
};

export function seedEvents(): DemoEvent[] {
  return [
    { id: "demo-1", title: "Design review", start: at(0, 11), end: at(0, 12) },
    { id: "demo-2", title: "Standup", start: at(0, 14), end: at(0, 14, 15) },
    { id: "demo-3", title: "Investor call", start: at(1, 10, 30), end: at(1, 11) },
  ];
}

export function seedMessages(): DemoMessage[] {
  return [
    {
      id: "demo-m1",
      from: "Rahul Menon <rahul@example.com>",
      subject: "API deadline — can we pull it forward?",
      snippet:
        "Quick one — is the rate limiter landing before the 20th? Happy to jump on a call.",
      body: "Quick one — is the rate limiter landing before the 20th? Happy to jump on a call.",
    },
    {
      id: "demo-m2",
      from: "Priya Sharma <priya@example.com>",
      subject: "Deck for Thursday",
      snippet:
        "Draft is in the folder. Needs your numbers on slide 6 before I send it out.",
      body: "Draft is in the folder. Needs your numbers on slide 6 before I send it out.",
    },
  ];
}

export const TIMEZONE =
  process.env.NOVA_TIMEZONE ||
  Intl.DateTimeFormat().resolvedOptions().timeZone ||
  "Asia/Kolkata";

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
