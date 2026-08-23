"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TimelineItem = {
  id: string;
  at: string;
  kind: string;
  direction?: string;
  title: string;
  detail: string;
  transcript?: string;
  status?: string;
};

type Profile = {
  farmer: {
    id: string;
    name: string;
    phone: string;
    notes: string;
    createdAt: string;
  };
  cases: Array<{
    id: string;
    crop: string;
    village: string;
    status: string;
    summary: string;
  }>;
  timeline: TimelineItem[];
  lastInbound?: string;
  lastOutbound?: string;
};

async function jsonSafe(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function when(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { hour12: true });
}

export default function FarmerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [dialing, setDialing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/farmers/${id}`);
    const data = await jsonSafe(res);
    if (!res.ok) {
      setError(String(data.error ?? "Not found"));
      return;
    }
    setProfile(data as unknown as Profile);
    setError("");
  }, [id]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [load]);

  async function callNow() {
    if (!profile) return;
    setDialing(true);
    setError("");
    const res = await fetch("/api/crm/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: profile.farmer.id,
        phone: profile.farmer.phone,
        name: profile.farmer.name,
      }),
    });
    const data = await jsonSafe(res);
    setDialing(false);
    if (!res.ok) setError(String(data.error ?? "Dial failed"));
    await load();
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    const res = await fetch(`/api/crm/farmers/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    const data = await jsonSafe(res);
    if (!res.ok) {
      setError(String(data.error ?? "Could not save note"));
      return;
    }
    setNote("");
    setProfile(data as unknown as Profile);
  }

  const latest = profile?.cases[0];

  return (
    <div className="saas-paper min-h-screen px-6 py-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <span className="nova-mark">LIAA</span>
        <div className="flex gap-3">
          <Link href="/crm" className="nova-btn">
            All farmers
          </Link>
          <Link href="/demo" className="nova-btn">
            Desk
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-10 max-w-3xl">
        {!profile ? (
          <p className="nova-empty">{error || "Loading farmer…"}</p>
        ) : (
          <>
            <p className="nova-label">Farmer profile · live timeline</p>
            <h1 className="mt-2 text-3xl font-semibold">{profile.farmer.name}</h1>
            <p className="mt-1 text-[var(--ink-3)]">{profile.farmer.phone}</p>
            <p className="mt-2 text-sm text-[var(--ink-3)]">
              {[latest?.crop, latest?.village, latest?.status]
                .filter(Boolean)
                .join(" · ") || "No case yet — speak on the call to fill this."}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-3)]">
              Last inbound {when(profile.lastInbound)} · Last outbound{" "}
              {when(profile.lastOutbound)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="nova-btn nova-btn--primary"
                type="button"
                disabled={dialing}
                onClick={() => void callNow()}
              >
                {dialing ? "Dialing…" : "Call this farmer"}
              </button>
            </div>
            {error ? <p className="nova-gate__err mt-3">{error}</p> : null}

            <form className="mt-8 flex flex-wrap gap-3" onSubmit={(e) => void addNote(e)}>
              <input
                className="min-w-[220px] flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
                placeholder="Add a desk note to the timeline"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button className="nova-btn nova-btn--start" type="submit">
                Pin note
              </button>
            </form>

            <h2 className="nova-label-hi mt-10">Timeline</h2>
            {profile.timeline.length === 0 ? (
              <p className="nova-empty mt-3">
                No events yet. Place a call or wait for inbound.
              </p>
            ) : (
              profile.timeline.map((item) => (
                <article key={item.id} className="nova-card mt-3">
                  <div className="nova-card__head">
                    <span className="nova-card__verb">
                      {item.direction || item.kind}
                    </span>
                    <span className="nova-card__kind">{when(item.at)}</span>
                  </div>
                  <div className="nova-card__title">{item.title}</div>
                  <div className="nova-card__detail">{item.detail}</div>
                  {item.transcript ? (
                    <pre className="nova-card__detail mt-2 whitespace-pre-wrap">
                      {item.transcript}
                    </pre>
                  ) : null}
                </article>
              ))
            )}
          </>
        )}
      </main>
    </div>
  );
}
