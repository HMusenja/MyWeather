// src/utils/skyTheme.js
export function isDaytime(nowUnix, sunriseUnix, sunsetUnix) {
  if (!sunriseUnix || !sunsetUnix || !nowUnix) return true;
  return nowUnix >= sunriseUnix && nowUnix < sunsetUnix;
}

export function resolveSkyKey(main = "Clear", isDay = true) {
  const m = String(main).toLowerCase();

  const cond =
    m.includes("thunder") ? "thunder" :
    m.includes("drizzle") || m.includes("squall") ? "rain" :
    m.includes("rain") ? "rain" :
    m.includes("snow") ? "snow" :
    m.includes("mist") || m.includes("fog") || m.includes("haze") ? "mist" :
    m.includes("dust") ? "dust" :
    m.includes("sand") ? "dust" :
    m.includes("tornado") || m.includes("extreme") ? "extreme" :
    m.includes("cloud") ? "clouds" :
    "clear";

  return `${cond}-${isDay ? "day" : "night"}`;
}

export function applySkyTheme(key) {
  if (typeof document === "undefined") return;
  document.body.setAttribute("data-sky", key);
}