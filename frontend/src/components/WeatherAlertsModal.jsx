import { useMemo, useState } from "react";
import { useWeather } from "../context/WeatherContext";

const SEVERITY_RANK = { extreme: 4, severe: 3, moderate: 2, minor: 1 };

export default function WeatherAlertsModal({ open, onClose }) {
  const { state } = useWeather();
  const all = state?.alerts?.data || [];

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("severity"); // 'severity' | 'soonest' | 'latest'

  const items = useMemo(() => {
    const norm = (s) => (s || "").toLowerCase();
    const filtered = q
      ? all.filter((a) =>
          [a.event, a.headline, ...(a.areas || [])]
            .some((t) => norm(t).includes(norm(q)))
        )
      : all.slice();

    filtered.sort((a, b) => {
      if (sortKey === "severity") {
        const d = (SEVERITY_RANK[b.severity] || 0) - (SEVERITY_RANK[a.severity] || 0);
        if (d) return d;
        // tie-breaker: sooner end first
        return new Date(a.endsAt) - new Date(b.endsAt);
      }
      if (sortKey === "soonest") {
        return new Date(a.endsAt) - new Date(b.endsAt);
      }
      if (sortKey === "latest") {
        return new Date(b.endsAt) - new Date(a.endsAt);
      }
      return 0;
    });

    return filtered;
  }, [all, q, sortKey]);

  if (!open) return null;

  const copyAlert = async (a) => {
    const text =
`[${a.severity?.toUpperCase() || "ALERT"}] ${a.event}
${a.headline}
Areas: ${(a.areas || []).join(", ") || "—"}
From: ${fmt(a.startsAt)}   Until: ${fmt(a.endsAt)}
${a.description || ""}${a.instruction ? "\nInstruction: " + a.instruction : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      // eslint-disable-next-line no-alert
      alert("Alert copied to clipboard.");
    } catch {
      // eslint-disable-next-line no-alert
      alert("Copy failed. Select and copy manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* modal */}
      <div className="relative z-10 w-[min(900px,92vw)] max-h-[86vh] rounded-xl border bg-background p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">All weather alerts</h2>
          <span className="text-xs px-2 py-0.5 rounded-full border">
            {all.length} total
          </span>
          <button
            onClick={onClose}
            className="ml-auto text-sm px-3 py-1 rounded-md border hover:bg-muted"
            aria-label="Close alerts"
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search alerts (event, headline, area)…"
            className="flex-1 min-w-[220px] px-3 py-2 rounded-md border bg-transparent"
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="px-3 py-2 rounded-md border bg-transparent"
            aria-label="Sort alerts"
          >
            <option value="severity">Sort by severity</option>
            <option value="soonest">Ending soonest</option>
            <option value="latest">Ending latest</option>
          </select>
        </div>

        <div className="overflow-auto max-h-[70vh] pr-1">
          <ul className="space-y-2">
            {items.map((a) => (
              <li key={a.id} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <SeverityChip severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm md:text-base">
                      {dedupeEventHeadline(a.event, a.headline)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {a.source?.toUpperCase()} · {a.urgency || "expected"} · {a.certainty || "unknown"}
                    </div>
                    {(a.areas?.length ? (
                      <div className="mt-1 text-xs">
                        Areas: <span className="text-muted-foreground">{a.areas.join(", ")}</span>
                      </div>
                    ) : null)}
                    <div className="mt-1 text-xs">
                      From <strong>{fmt(a.startsAt)}</strong> until <strong>{fmt(a.endsAt)}</strong>
                    </div>
                    {a.description ? (
                      <p className="mt-2 text-sm whitespace-pre-wrap">{a.description}</p>
                    ) : null}
                    {a.instruction ? (
                      <p className="mt-2 text-sm font-medium whitespace-pre-wrap">Instruction: {a.instruction}</p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => copyAlert(a)}
                    className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
                  >
                    Copy
                  </button>
                  {/* placeholder for “share” or “open source link” later */}
                </div>
              </li>
            ))}

            {items.length === 0 && (
              <li className="text-sm text-muted-foreground p-3">
                No alerts match your search.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SeverityChip({ severity }) {
  const s = String(severity || "").toLowerCase();
  const cls =
    s === "extreme" ? "bg-red-600/20 text-red-400 border-red-500/40" :
    s === "severe"  ? "bg-orange-600/20 text-orange-400 border-orange-500/40" :
    s === "moderate"? "bg-yellow-600/20 text-yellow-400 border-yellow-500/40" :
                      "bg-sky-600/20 text-sky-300 border-sky-500/40";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wide ${cls}`}>
      {severity || "minor"}
    </span>
  );
}

function dedupeEventHeadline(event = "", headline = "") {
  const e = event.trim();
  const h = headline.trim();
  if (!e) return h || e;
  if (!h) return e;
  return h.toLowerCase().startsWith(e.toLowerCase()) ? h : `${e} — ${h}`;
}

function fmt(x) {
  try {
    return new Date(x).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  } catch { return String(x || ""); }
}
