export function makeHeadlineFrom({ location, current, today }) {
  if (!current || !location) return "";

  const city = location?.name || "your area";
  const cond = current?.condition || "";
  const t = round(current?.temp);
  const hi = round(today?.high);
  const lo = round(today?.low);

  const parts = [];
  if (cond) parts.push(cond);
  if (Number.isFinite(t)) parts.push(`${t}°`);
  const left = parts.join(" and ");

  const tail = (Number.isFinite(hi) && Number.isFinite(lo))
    ? `— high ${hi}°, low ${lo}°`
    : "";

  return `${left} in ${city} ${tail}`.replace(/\s+/g, " ").trim();
}

function round(n) { return typeof n === "number" ? Math.round(n) : NaN; }
