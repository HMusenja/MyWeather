// src/components/WeatherNews.jsx
import { useMemo, useState } from "react";
import { useWeather } from "../context/WeatherContext";
import WeatherAlertsModal from "./WeatherAlertsModal";

export default function WeatherNews({ className = "" }) {
  const { state } = useWeather();
  const { city, alerts, headline: weatherHeadline } = state || {};
  const [open, setOpen] = useState(false);

  const { items, total } = useMemo(() => {
    const list = alerts?.data || [];
    const relevant = pickRelevant(list, city, 2);
    return { items: relevant, total: list.length };
  }, [alerts?.data, city]);

  const hasAlerts = items.length > 0;

  return (
    <>
      <div
        className={`w-full lg:w-3/4 mx-auto mt-4 md:mt-6 lg:mt-10 px-4 py-2 md:py-3 rounded-lg border border-border/50 bg-background/40 backdrop-blur-sm ${className}`}

        role="region"
        aria-label="Weather alerts"
      >
        {!hasAlerts ? (
          <p className="text-sm md:text-base font-medium">
            {weatherHeadline || "Weather updates will appear here once location is set."}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <LiveDot />
              <p className="text-sm md:text-base font-semibold">LIVE alerts</p>
              <span className="text-xs px-2 py-0.5 rounded-full border">{total} total</span>
              <button
                onClick={() => setOpen(true)}
                className="ml-auto text-xs px-2 py-1 rounded-md border hover:bg-muted"
              >
                View all
              </button>
            </div>

            <ul className="space-y-1">
              {items.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <SeverityChip severity={a.severity} />
                  <span className="text-sm md:text-base truncate" title={composeAlertLine(a)}>
                    {composeAlertLine(a)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <WeatherAlertsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// --- helpers (same as before) ---
function pickRelevant(list, city, max = 5) {
  if (!Array.isArray(list) || list.length === 0) return [];
  const norm = (s) => (s || "").toLowerCase();
  const c = norm(city);
  const matches = c
    ? list.filter((a) =>
        (a.areas || []).some((ar) => norm(ar).includes(c)) ||
        norm(a.headline).includes(c) ||
        norm(a.event).includes(c)
      )
    : [];
  const set = new Set(matches.map((a) => a.id));
  const filler = list.filter((a) => !set.has(a.id));
  return [...matches, ...filler].slice(0, max);
}
function composeAlertLine(a) {
  const event = (a?.event || "").trim();
  const headline = (a?.headline || "").trim();
  const startsWithEvent = headline && event && headline.toLowerCase().startsWith(event.toLowerCase());
  const base = startsWithEvent || !event ? (headline || event) : `${event} — ${headline}`;
  const area = (a?.areas?.[0] || "").trim();
  const withArea = area && !base.toLowerCase().includes(area.toLowerCase()) ? `${base} — ${area}` : base;
  const until = a?.endsAt ? ` (until ${fmtTime(a.endsAt)})` : "";
  return clamp(withArea + until, 200);
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
function LiveDot() { return <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />; }
function clamp(s, max) { return s?.length > max ? s.slice(0, max - 1) + "…" : s || ""; }
function fmtTime(iso) { try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } }



