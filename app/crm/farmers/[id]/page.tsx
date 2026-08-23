"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/stitch/Shell";
import { Icon } from "@/components/stitch/Icon";
import { initials, jsonSafe, when } from "@/components/stitch/crm";

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
  farmer: { id: string; name: string; phone: string; notes: string };
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
  const live = profile?.timeline.some(
    (item) => item.kind === "call" && item.status && ["queued", "ringing", "dialing", "in-progress"].includes(item.status),
  );

  return (
    <Shell title="Call detail">
      {!profile ? (
        <p className="text-ks-muted">{error || "Loading farmer…"}</p>
      ) : (
        <>
          <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center">
                {live ? (
                  <span className="absolute inset-0 animate-ping rounded-full bg-ks-error/30" />
                ) : null}
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-ks-error text-white">
                  <Icon name="mic" filled />
                </span>
              </div>
              <div>
                <h2 className="ks-display text-2xl font-semibold">
                  {live ? "Active call" : "Farmer timeline"}{" "}
                  <span className="text-base font-normal text-ks-muted">
                    {profile.farmer.name}
                  </span>
                </h2>
                <p className="mt-1 text-sm text-ks-muted">
                  Last inbound {when(profile.lastInbound)} · Last outbound{" "}
                  {when(profile.lastOutbound)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-2 rounded-lg bg-ks-primary-container px-4 py-2 text-sm font-medium text-white hover:bg-ks-primary disabled:opacity-40"
                type="button"
                disabled={dialing}
                onClick={() => void callNow()}
              >
                <Icon name="call" />
                {dialing ? "Dialing…" : "Call this farmer"}
              </button>
            </div>
          </header>
          {error ? <p className="mb-4 text-sm text-ks-error">{error}</p> : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <aside className="flex flex-col gap-4 lg:col-span-3">
              <div className="rounded-xl border border-ks-outline bg-ks-surface p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3 border-b border-ks-line pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ks-container font-semibold text-ks-primary">
                    {initials(profile.farmer.name)}
                  </div>
                  <div>
                    <h3 className="ks-display text-lg font-semibold">
                      {profile.farmer.name}
                    </h3>
                    <p className="text-xs text-ks-muted">Verified farmer</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <Row icon="location_on" label="Location" value={latest?.village || "—"} />
                  <Row
                    icon="call"
                    label="Phone"
                    value={profile.farmer.phone}
                    href={`tel:${profile.farmer.phone}`}
                  />
                  <Row icon="agriculture" label="Primary crop" value={latest?.crop || "—"} />
                </div>
              </div>
              <div className="rounded-xl border border-ks-outline bg-ks-surface p-4 shadow-sm">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ks-muted">
                  History
                </h4>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Cases</span>
                  <span className="rounded-full bg-ks-low px-2 py-0.5 text-xs">
                    {profile.cases.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <span className="text-ks-muted">{latest?.status || "none"}</span>
                </div>
              </div>
            </aside>

            <section className="flex flex-col rounded-xl border border-ks-outline bg-ks-surface shadow-sm lg:col-span-6">
              <div className="flex items-center justify-between border-b border-ks-outline bg-ks-low px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Icon name="forum" /> Live transcript
                </h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {profile.timeline.length === 0 ? (
                  <p className="text-sm text-ks-muted">
                    No events yet. Place a call or wait for inbound.
                  </p>
                ) : (
                  profile.timeline.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-ks-line bg-ks-bg p-3"
                    >
                      <div className="mb-1 flex justify-between text-xs text-ks-muted">
                        <span className="font-semibold text-ks-primary">
                          {item.direction || item.kind}
                        </span>
                        <span>{when(item.at)}</span>
                      </div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-sm text-ks-muted">{item.detail}</p>
                      {item.transcript ? (
                        <pre className="mt-2 whitespace-pre-wrap text-xs text-ks-on-surface">
                          {item.transcript}
                        </pre>
                      ) : null}
                    </article>
                  ))
                )}
              </div>
              <form
                className="flex gap-2 border-t border-ks-outline p-3"
                onSubmit={(e) => void addNote(e)}
              >
                <input
                  className="flex-1 rounded-lg border border-ks-outline bg-ks-bg px-3 py-2 text-sm outline-none focus:border-ks-primary-container"
                  placeholder="Pin a desk note to this timeline"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <button
                  className="rounded-lg bg-ks-secondary px-3 py-2 text-sm font-medium text-white"
                  type="submit"
                >
                  Pin
                </button>
              </form>
            </section>

            <aside className="rounded-xl border border-ks-outline bg-ks-surface p-4 shadow-sm lg:col-span-3">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ks-muted">
                Open cases
              </h4>
              {profile.cases.length === 0 ? (
                <p className="text-sm text-ks-muted">
                  Cases appear as the farmer describes crop, village, and symptoms.
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.cases.map((cs) => (
                    <div key={cs.id} className="rounded-lg border border-ks-line p-3">
                      <p className="text-xs uppercase text-ks-muted">{cs.status}</p>
                      <p className="font-medium">{cs.crop || "Crop"}</p>
                      <p className="text-sm text-ks-muted">
                        {[cs.village, cs.summary].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </Shell>
  );
}

function Row({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon name={icon} className="mt-0.5 text-ks-muted" />
      <div>
        <p className="text-xs text-ks-muted">{label}</p>
        {href ? (
          <a className="font-medium text-ks-primary hover:underline" href={href}>
            {value}
          </a>
        ) : (
          <p>{value}</p>
        )}
      </div>
    </div>
  );
}
