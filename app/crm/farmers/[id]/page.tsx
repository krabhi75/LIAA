"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Shell } from "@/components/stitch/Shell";
import { Icon } from "@/components/stitch/Icon";
import { initials, isCallLive, jsonSafe, when } from "@/components/stitch/crm";
import {
  CASE_DISPOSITIONS,
  CrmButton,
  RecordPanel,
  StatusBadge,
  caseStatusTone,
  isCaseOpen,
  type CaseDisposition,
} from "@/components/stitch/crm-ui";

type TimelineItem = {
  id: string;
  at: string;
  kind: string;
  direction?: string;
  title: string;
  detail: string;
  transcript?: string;
  status?: string;
  recordingUrl?: string;
  recordingSecs?: number;
};

type Farmer = {
  id: string;
  name: string;
  phone: string;
  village?: string;
  district?: string;
  city?: string;
  state?: string;
  crop?: string;
  company?: string;
  weatherSummary?: string;
  weatherAt?: string | null;
  notes: string;
};

type CaseRow = {
  id: string;
  crop: string;
  village: string;
  status: string;
  summary: string;
  escalateReason?: string;
};

type Profile = {
  farmer: Farmer;
  cases: CaseRow[];
  timeline: TimelineItem[];
  lastInbound?: string;
  lastOutbound?: string;
};

const EMPTY_FORM = {
  name: "",
  phone: "",
  village: "",
  district: "",
  city: "",
  state: "",
  crop: "",
};

export default function FarmerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [dialing, setDialing] = useState(false);

  const applyProfile = useCallback((next: Profile) => {
    setProfile(next);
    if (!editing) {
      setForm({
        name: next.farmer.name ?? "",
        phone: next.farmer.phone ?? "",
        village: next.farmer.village || next.farmer.company || "",
        district: next.farmer.district ?? "",
        city: next.farmer.city ?? "",
        state: next.farmer.state ?? "",
        crop: next.farmer.crop ?? "",
      });
    }
  }, [editing]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/crm/farmers/${id}`);
    const data = await jsonSafe(res);
    if (!res.ok) {
      setError(String(data.error ?? "Not found"));
      return;
    }
    applyProfile(data as unknown as Profile);
    setError("");
  }, [id, applyProfile]);

  useEffect(() => {
    void load();
    void fetch("/api/vobiz/warm").catch(() => undefined);
    const t = setInterval(() => void load(), 4000);
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
        phone: form.phone || profile.farmer.phone,
        name: form.name || profile.farmer.name,
      }),
    });
    const data = await jsonSafe(res);
    setDialing(false);
    if (!res.ok) setError(String(data.error ?? "Dial failed"));
    await load();
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/crm/farmers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await jsonSafe(res);
    setSaving(false);
    if (!res.ok) {
      setError(String(data.error ?? "Could not save farmer"));
      return;
    }
    setEditing(false);
    applyProfile(data as unknown as Profile);
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
    applyProfile(data as unknown as Profile);
  }

  const latest = profile?.cases[0];
  const live = profile?.timeline.some(
    (item) =>
      item.kind === "call" &&
      item.status &&
      isCallLive({
        status: item.status,
        startedAt: item.at,
        endedAt: null,
      }),
  );
  const openCases = profile?.cases.filter((c) => isCaseOpen(c.status)) ?? [];

  return (
    <Shell title="Farmer record">
      {!profile ? (
        <p className="text-ks-muted">{error || "Loading farmer…"}</p>
      ) : (
        <>
          <div className="ks-record-hero">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0176d3] text-lg font-bold text-white">
                  {initials(profile.farmer.name)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="ks-display text-2xl font-bold">
                      {profile.farmer.name}
                    </h2>
                    {live ? (
                      <StatusBadge label="Live call" tone="live" />
                    ) : (
                      <StatusBadge label="Account active" tone="brand" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ks-muted">
                    {profile.farmer.phone}
                    {profile.farmer.village
                      ? ` · ${profile.farmer.village}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-ks-muted">
                    {profile.timeline.length} activities · Inbound{" "}
                    {when(profile.lastInbound)} · Outbound{" "}
                    {when(profile.lastOutbound)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <CrmButton variant="secondary" onClick={() => setEditing((v) => !v)}>
                  {editing ? "Cancel edit" : "Edit record"}
                </CrmButton>
                <CrmButton variant="brand" disabled={dialing} onClick={() => void callNow()}>
                  <Icon name="call" className="text-[16px]" />
                  {dialing ? "Dialing…" : "Call farmer"}
                </CrmButton>
              </div>
            </div>
          </div>
          {error ? <p className="mb-4 text-sm text-ks-error">{error}</p> : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <aside className="flex flex-col gap-4 lg:col-span-3">
              <RecordPanel title="Contact details" icon="badge">
                <form className="space-y-3" onSubmit={(e) => void saveProfile(e)}>
                  <Field
                    label="Name"
                    value={form.name}
                    disabled={!editing}
                    onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  />
                  <Field
                    label="Phone"
                    value={form.phone}
                    disabled={!editing}
                    onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  />
                  <Field
                    label="Village"
                    value={form.village}
                    disabled={!editing}
                    onChange={(v) => setForm((f) => ({ ...f, village: v }))}
                  />
                  <Field
                    label="District"
                    value={form.district}
                    disabled={!editing}
                    onChange={(v) => setForm((f) => ({ ...f, district: v }))}
                  />
                  <Field
                    label="City"
                    value={form.city}
                    disabled={!editing}
                    onChange={(v) => setForm((f) => ({ ...f, city: v }))}
                  />
                  <Field
                    label="State"
                    value={form.state}
                    disabled={!editing}
                    onChange={(v) => setForm((f) => ({ ...f, state: v }))}
                  />
                  <Field
                    label="Primary crop"
                    value={form.crop || latest?.crop || ""}
                    disabled={!editing}
                    onChange={(v) => setForm((f) => ({ ...f, crop: v }))}
                  />
                  {profile.farmer.weatherSummary ? (
                    <div className="rounded-md border border-ks-line bg-ks-low p-3 text-sm">
                      <p className="text-xs font-semibold uppercase text-ks-muted">
                        Live weather
                      </p>
                      <p className="mt-1">{profile.farmer.weatherSummary}</p>
                      {profile.farmer.weatherAt ? (
                        <p className="mt-1 text-xs text-ks-muted">
                          {when(profile.farmer.weatherAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {editing ? (
                    <CrmButton
                      variant="brand"
                      type="submit"
                      disabled={saving}
                      className="w-full"
                    >
                      {saving ? "Saving…" : "Save record"}
                    </CrmButton>
                  ) : null}
                </form>
              </RecordPanel>

              <RecordPanel title="Engagement summary" icon="insights">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ks-muted">Calls</span>
                    <span className="font-semibold">
                      {profile.timeline.filter((i) => i.kind === "call").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ks-muted">Cases</span>
                    <span className="font-semibold">{profile.cases.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ks-muted">Open cases</span>
                    <span className="font-semibold">{openCases.length}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-ks-muted">Latest status</span>
                    {latest ? (
                      <StatusBadge
                        label={latest.status}
                        tone={caseStatusTone(latest.status)}
                      />
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
              </RecordPanel>
            </aside>

            <section className="flex flex-col rounded-xl border border-ks-outline bg-ks-surface shadow-sm lg:col-span-6">
              <div className="flex items-center justify-between border-b border-ks-outline bg-ks-low px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Icon name="forum" /> Call and activity timeline
                </h3>
              </div>
              <div className="relative flex-1 space-y-0 overflow-y-auto p-4">
                {profile.timeline.length === 0 ? (
                  <p className="text-sm text-ks-muted">
                    No events yet. Place a call or wait for inbound.
                  </p>
                ) : (
                  <ol className="relative border-l border-ks-outline pl-4">
                    {profile.timeline.map((item) => (
                      <li key={item.id} className="mb-4 ml-2">
                        <span
                          className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${dot(item.kind)}`}
                        />
                        <article className="rounded-lg border border-ks-line bg-ks-bg p-3">
                          <div className="mb-1 flex justify-between text-xs text-ks-muted">
                            <span className="font-semibold uppercase text-ks-primary">
                              {item.kind}
                              {item.direction ? ` · ${item.direction}` : ""}
                            </span>
                            <span>{when(item.at)}</span>
                          </div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-sm text-ks-muted">{item.detail}</p>
                          {item.recordingUrl ? (
                            <div className="mt-2 rounded-lg border border-ks-outline bg-ks-surface p-2">
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ks-muted">
                                Call recording
                                {item.recordingSecs
                                  ? ` · ${item.recordingSecs}s`
                                  : ""}
                              </p>
                              <audio
                                className="w-full"
                                controls
                                preload="metadata"
                                src={item.recordingUrl}
                              >
                                <a href={item.recordingUrl}>Download recording</a>
                              </audio>
                            </div>
                          ) : null}
                          {item.transcript ? (
                            <pre className="mt-2 whitespace-pre-wrap text-xs text-ks-on-surface">
                              {item.transcript}
                            </pre>
                          ) : null}
                        </article>
                      </li>
                    ))}
                  </ol>
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

            <aside className="flex flex-col gap-4 lg:col-span-3">
              <RecordPanel
                title={`Cases (${profile.cases.length})`}
                icon="folder_open"
              >
                {profile.cases.length === 0 ? (
                  <p className="text-sm text-ks-muted">
                    Cases appear when the farmer describes crop, village, and
                    symptoms on a call.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {profile.cases.map((cs) => (
                      <CaseResolveCard
                        key={cs.id}
                        caseRow={cs}
                        onResolved={() => void load()}
                      />
                    ))}
                  </div>
                )}
              </RecordPanel>
            </aside>
          </div>
        </>
      )}
    </Shell>
  );
}

function CaseResolveCard({
  caseRow,
  onResolved,
}: {
  caseRow: CaseRow;
  onResolved: () => void;
}) {
  const [disposition, setDisposition] = useState<CaseDisposition>("resolved");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const open = isCaseOpen(caseRow.status);

  async function resolveCase(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/crm/cases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: caseRow.id,
        disposition,
        note: note.trim() || undefined,
      }),
    });
    const data = await jsonSafe(res);
    setSaving(false);
    if (!res.ok) {
      setError(String(data.error ?? "Could not update case"));
      return;
    }
    setNote("");
    onResolved();
  }

  return (
    <article className="rounded-md border border-ks-line bg-ks-bg p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{caseRow.crop || "Agri case"}</p>
          <p className="text-xs text-ks-muted">
            {[caseRow.village, caseRow.summary].filter(Boolean).join(" · ")}
          </p>
        </div>
        <StatusBadge label={caseRow.status} tone={caseStatusTone(caseRow.status)} />
      </div>
      {caseRow.escalateReason ? (
        <p className="mb-2 text-xs text-ks-muted">
          Resolution note: {caseRow.escalateReason}
        </p>
      ) : null}
      {open ? (
        <form className="mt-3 space-y-2 border-t border-ks-line pt-3" onSubmit={(e) => void resolveCase(e)}>
          <label className="block text-xs font-semibold text-ks-muted">
            Disposition
            <select
              className="ks-select mt-1"
              value={disposition}
              onChange={(e) => setDisposition(e.target.value as CaseDisposition)}
            >
              {CASE_DISPOSITIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-ks-muted">
            Desk note (optional)
            <input
              className="ks-input mt-1"
              placeholder="What was advised or next step"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          {error ? <p className="text-xs text-ks-error">{error}</p> : null}
          <CrmButton variant="primary" type="submit" disabled={saving} className="w-full">
            {saving ? "Updating…" : "Update case disposition"}
          </CrmButton>
        </form>
      ) : (
        <p className="mt-2 text-xs text-ks-muted">Case closed on record.</p>
      )}
    </article>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-ks-muted">{label}</span>
      <input
        className="ks-input mt-1 disabled:border-transparent disabled:bg-transparent disabled:px-0"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function dot(kind: string): string {
  switch (kind) {
    case "call":
      return "bg-ks-primary";
    case "case":
      return "bg-ks-secondary";
    case "note":
      return "bg-ks-muted";
    default:
      return "bg-ks-outline";
  }
}
