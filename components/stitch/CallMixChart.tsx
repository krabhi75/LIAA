"use client";

import { Icon } from "./Icon";

type MixRow = {
  label: string;
  value: number;
  color: string;
  icon: string;
};

export function CallMixChart({
  inbound,
  outbound,
  live,
  casesCount,
}: {
  inbound: number;
  outbound: number;
  live: number;
  casesCount: number;
}) {
  const callTotal = inbound + outbound;
  const safeTotal = Math.max(callTotal, 1);
  const inboundPct = Math.round((inbound / safeTotal) * 100);
  const outboundPct = 100 - inboundPct;

  const rows: MixRow[] = [
    { label: "Inbound calls", value: inbound, color: "#032d60", icon: "call_received" },
    { label: "Outbound calls", value: outbound, color: "#0176d3", icon: "call_made" },
    { label: "Live now", value: live, color: "#fe9339", icon: "graphic_eq" },
    { label: "Agri cases", value: casesCount, color: "#2e844a", icon: "folder_open" },
  ];
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="ks-call-mix">
      <div className="ks-call-mix__donut-wrap">
        <div
          className="ks-call-mix__donut"
          style={{
            background:
              callTotal > 0
                ? `conic-gradient(#032d60 0 ${inboundPct}%, #0176d3 ${inboundPct}% 100%)`
                : "#e5e5e5",
          }}
        >
          <div className="ks-call-mix__donut-hole">
            <span className="ks-call-mix__donut-value">{callTotal}</span>
            <span className="ks-call-mix__donut-label">Total calls</span>
          </div>
        </div>
        <div className="ks-call-mix__legend">
          <span>
            <i className="ks-call-mix__dot" style={{ background: "#032d60" }} />
            Inbound {inboundPct}%
          </span>
          <span>
            <i className="ks-call-mix__dot" style={{ background: "#0176d3" }} />
            Outbound {outboundPct}%
          </span>
        </div>
      </div>

      <div className="ks-call-mix__rows">
        {rows.map((row) => {
          const pct = Math.round((row.value / max) * 100);
          return (
            <div key={row.label} className="ks-call-mix__row">
              <div className="ks-call-mix__row-head">
                <span className="ks-call-mix__row-label">
                  <Icon name={row.icon} className="text-[16px] text-ks-muted" />
                  {row.label}
                </span>
                <span className="ks-call-mix__row-value">{row.value}</span>
              </div>
              <div className="ks-call-mix__track">
                <div
                  className="ks-call-mix__fill"
                  style={{
                    width: `${Math.max(row.value > 0 ? 6 : 0, pct)}%`,
                    background: row.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
