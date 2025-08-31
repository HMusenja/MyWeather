// backend/src/services/alerts/openWeather.js

import { makeAlertId, mapSeverityFromOpenWeather, mapUrgency, mapCertainty } from "./mapping.js";

/**
 * Fetch alerts from OpenWeather One Call API (3.0)
 * @param {number} lat
 * @param {number} lon
 * @param {string} lang
 */
export async function fetchOpenWeatherAlerts(lat, lon, lang = "en") {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHER_API_KEY is missing in env");

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: apiKey,
    lang,
  });

  const url = `https://api.openweathermap.org/data/3.0/onecall?${params.toString()}`;
  const res = await fetch(url); // Node 22: global fetch
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[OpenWeather] error:", res.status, text);
    return [];
  }

  const json = await res.json();
  const rawAlerts = Array.isArray(json.alerts) ? json.alerts : [];

  return rawAlerts.map((a) => {
    const startsAtISO = a.start ? new Date(a.start * 1000).toISOString() : new Date().toISOString();
    const endsAtISO   = a.end   ? new Date(a.end * 1000).toISOString()   : new Date(Date.now() + 3600e3).toISOString();

    return {
      id: makeAlertId("openweather", { event: a.event, startsAt: startsAtISO, endsAt: endsAtISO }),
      source: "openweather",
      event: a.event || "Weather Alert",
      severity: mapSeverityFromOpenWeather(a.severity || a.event || ""),
      urgency: mapUrgency(a.urgency || "expected"),
      areas: Array.isArray(a.tags) ? a.tags : [],
      startsAt: startsAtISO,
      endsAt: endsAtISO,
      headline: a.event || "Weather Alert",
      description: a.description || "",
      instruction: a.instruction || "",
      certainty: mapCertainty(a.certainty || "likely"),
    };
  });
}
