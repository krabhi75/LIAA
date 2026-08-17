"use client";

import { useState } from "react";

type AgentFields = {
  id: string;
  name: string;
  greeting: string;
  systemPrompt: string;
  failureMessage: string;
  ttsVoiceId: string;
  llmModel: string;
  idleTimeout: number;
  enabled: boolean;
};

export function AgentEditor({ agent }: { agent: AgentFields }) {
  const [form, setForm] = useState(agent);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setStatus(null);
    const res = await fetch(`/api/org/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        greeting: form.greeting,
        systemPrompt: form.systemPrompt,
        failureMessage: form.failureMessage,
        ttsVoiceId: form.ttsVoiceId,
        llmModel: form.llmModel,
        idleTimeout: form.idleTimeout,
        enabled: form.enabled,
      }),
    });
    setSaving(false);
    setStatus(res.ok ? "Saved" : "Save failed");
  }

  return (
    <div className="space-y-4 border border-slate-200 bg-white p-6">
      <label className="block text-sm">
        <span className="text-slate-600">Name</span>
        <input
          className="mt-1 w-full border border-slate-300 px-3 py-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-600">Greeting</span>
        <textarea
          className="mt-1 w-full border border-slate-300 px-3 py-2"
          rows={2}
          value={form.greeting}
          onChange={(e) => setForm({ ...form, greeting: e.target.value })}
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-600">System prompt (sales policy)</span>
        <textarea
          className="mt-1 w-full border border-slate-300 px-3 py-2 font-mono text-xs"
          rows={12}
          value={form.systemPrompt}
          onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm">
          <span className="text-slate-600">LLM model</span>
          <input
            className="mt-1 w-full border border-slate-300 px-3 py-2"
            value={form.llmModel}
            onChange={(e) => setForm({ ...form, llmModel: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">TTS voice ID</span>
          <input
            className="mt-1 w-full border border-slate-300 px-3 py-2"
            value={form.ttsVoiceId}
            onChange={(e) => setForm({ ...form, ttsVoiceId: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Idle timeout (s)</span>
          <input
            type="number"
            className="mt-1 w-full border border-slate-300 px-3 py-2"
            value={form.idleTimeout}
            onChange={(e) =>
              setForm({ ...form, idleTimeout: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
        />
        Enabled
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          {saving ? "Saving…" : "Save agent"}
        </button>
        {status ? <span className="text-sm text-slate-600">{status}</span> : null}
      </div>
    </div>
  );
}
