"use client";

import { Icon } from "./Icon";

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
  const inboundPct = callTotal > 0 ? Math.round((inbound / safeTotal) * 100) : 0;
  const outboundPct = callTotal > 0 ? 100 - inboundPct : 0;

  const stats = [
    {
      label: "Inbound",
      value: inbound,
      pct: inboundPct,
      color: "#032d60",
      icon: "call_received",
    },
    {
      label: "Outbound",
      value: outbound,
      pct: outboundPct,
      color: "#0176d3",
      icon: "call_made",
    },
    {
      label: "Live now",
      value: live,
      pct: null as number | null,
      color: "#fe9339",
      icon: "graphic_eq",
    },
    {
      label: "Agri cases",
      value: casesCount,
      pct: null as number | null,
      color: "#2e844a",
      icon: "folder_open",
    },
  ];

  return (
    <div className="ks-call-mix">
      <div className="ks-call-mix__stats">
        {stats.map((s) => (
          <div key={s.label} className="ks-call-mix__stat">
            <div className="ks-call-mix__stat-icon" style={{ color: s.color }}>
              <Icon name={s.icon} className="text-[20px]" />
            </div>
            <div>
              <p className="ks-call-mix__stat-value">{s.value}</p>
              <p className="ks-call-mix__stat-label">
                {s.label}
                {s.pct != null && callTotal > 0 ? ` · ${s.pct}%` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="ks-call-mix__split">
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
        </div>

        <div className="ks-call-mix__bars">
          <p className="ks-call-mix__bars-title">Direction split</p>
          <div className="ks-call-mix__bar-row">
            <span className="ks-call-mix__bar-label">
              <i className="ks-call-mix__dot" style={{ background: "#032d60" }} />
              Inbound
            </span>
            <div className="ks-call-mix__track ks-call-mix__track--wide">
              <div
                className="ks-call-mix__fill"
                style={{
                  width: `${Math.max(inboundPct, inbound > 0 ? 8 : 0)}%`,
                  background: "#032d60",
                }}
              />
            </div>
            <span className="ks-call-mix__bar-num">{inbound}</span>
          </div>
          <div className="ks-call-mix__bar-row">
            <span className="ks-call-mix__bar-label">
              <i className="ks-call-mix__dot" style={{ background: "#0176d3" }} />
              Outbound
            </span>
            <div className="ks-call-mix__track ks-call-mix__track--wide">
              <div
                className="ks-call-mix__fill"
                style={{
                  width: `${Math.max(outboundPct, outbound > 0 ? 8 : 0)}%`,
                  background: "#0176d3",
                }}
              />
            </div>
            <span className="ks-call-mix__bar-num">{outbound}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
