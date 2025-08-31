// src/utils/weatherService.js
import axios from "axios";
import NodeCache from "node-cache";
import createError from "http-errors";
import { ENV } from "../config/env.js";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const http = axios.create({
  baseURL: ENV.OPENWEATHER_BASE_URL,
  timeout: 6000,
});

export async function fetchCoordsWeatherRaw(
  { lat, lon },
  { units = ENV.DEFAULT_UNITS, lang = ENV.DEFAULT_LANG } = {}
) {
  const key = `w:${lat},${lon}|${units}|${lang}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = { lat, lon, units, lang, appid: ENV.OPENWEATHER_API_KEY };

  try {
    const { data } = await http.get("/weather", { params });
    cache.set(key, data);
    return data;
  } catch (err) {
    if (err.response) {
      const status = err.response.status === 404 ? 404 : 502;
      const message = err.response.data?.message || "Weather API error";
      throw createError(status, message);
    }
    throw createError(502, "Weather service unreachable");
  }
}

export async function fetchCityWeatherRaw(
  city,
  { units = ENV.DEFAULT_UNITS, lang = ENV.DEFAULT_LANG } = {}
) {
  const key = `w:${city.toLowerCase()}|${units}|${lang}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = { q: city, units, lang, appid: ENV.OPENWEATHER_API_KEY };

  try {
    const { data } = await http.get("/weather", { params });
    cache.set(key, data);
    return data;
  } catch (err) {
    if (err.response) {
      const status = err.response.status === 404 ? 404 : 502;
      const message = err.response.data?.message || "Weather API error";
      throw createError(status, message);
    }
    throw createError(502, "Weather service unreachable");
  }
}
// add `units` param so we label wind correctly
export function mapToDTO(owm, { units = "metric" } = {}) {
  const speed = owm?.wind?.speed;
  const isMetric = units === "metric";
  const windSpeed =
    typeof speed === "number"
      ? Math.round(isMetric ? speed * 3.6 : speed)
      : undefined;

  return {
    city: owm?.name ?? "",
    country: owm?.sys?.country ?? "",
    units,
    temperature: Math.round(owm?.main?.temp ?? 0),
    feelsLike: Math.round(owm?.main?.feels_like ?? 0),
    humidity: owm?.main?.humidity,
    windSpeed,
    windUnit: isMetric ? "km/h" : "mph",
    description: (owm?.weather?.[0]?.description ?? "").trim(),
    icon: owm?.weather?.[0]?.icon ?? "",
  };
}

export async function fetchCityForecastRaw(
  city,
  { units = ENV.DEFAULT_UNITS, lang = ENV.DEFAULT_LANG } = {}
) {
  const key = `f:q:${city.toLowerCase()}|${units}|${lang}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = { q: city, units, lang, appid: ENV.OPENWEATHER_API_KEY };
  try {
    const { data } = await http.get("/forecast", { params }); // 5-day/3h
    cache.set(key, data, 300);
    return data;
  } catch (err) {
    if (err.response)
      throw createError(
        err.response.status === 404 ? 404 : 502,
        err.response.data?.message || "Forecast API error"
      );
    throw createError(502, "Forecast service unreachable");
  }
}

export async function fetchCoordsForecastRaw(
  { lat, lon },
  { units = ENV.DEFAULT_UNITS, lang = ENV.DEFAULT_LANG } = {}
) {
  const key = `f:xy:${lat},${lon}|${units}|${lang}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = { lat, lon, units, lang, appid: ENV.OPENWEATHER_API_KEY };
  try {
    const { data } = await http.get("/forecast", { params });
    cache.set(key, data, 300);
    return data;
  } catch (err) {
    if (err.response)
      throw createError(
        err.response.status === 404 ? 404 : 502,
        err.response.data?.message || "Forecast API error"
      );
    throw createError(502, "Forecast service unreachable");
  }
}

// -------- map forecast to hourly + daily DTOs ----------
export function mapForecastToDTO(fx) {
  // fx: { city: { timezone, name, country }, list: [3h blocks] }
  const tz = fx?.city?.timezone || 0; // seconds offset from UTC
  const list = Array.isArray(fx?.list) ? fx.list : [];

  // helper: local Date from OWM dt + tz
  const localDate = (dt) => new Date((dt + tz) * 1000);

  // HOURLY: next 8 blocks
  const hourly = list.slice(0, 8).map((item) => {
    const d = localDate(item.dt);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return {
      time: `${hh}:${mm}`,
      temp: Math.round(item.main?.temp ?? 0),
      description: (item.weather?.[0]?.description ?? "").trim(),
      icon: item.weather?.[0]?.icon ?? "",
    };
  });

  // DAILY: group by local day (YYYY-MM-DD), then take next 5 unique days
  const daysMap = new Map();
  for (const item of list) {
    const d = localDate(item.dt);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    const entry = daysMap.get(key) || { temps: [], items: [] };
    entry.temps.push({
      min: Math.round(item.main?.temp_min ?? item.main?.temp ?? 0),
      max: Math.round(item.main?.temp_max ?? item.main?.temp ?? 0),
    });
    entry.items.push(item);
    daysMap.set(key, entry);
  }

  const todayKey = (() => {
    const d = localDate(Math.floor(Date.now() / 1000));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  })();

  const labels = (isoKey, idx) => {
    if (isoKey === todayKey) return "Today";
    if (idx === 1 && isoKey !== todayKey) return "Tomorrow";
    const [Y, M, D] = isoKey.split("-").map(Number);
    const d = new Date(Date.UTC(Y, M - 1, D));
    return d.toLocaleDateString("en-US", { weekday: "long" });
  };

  const daily = Array.from(daysMap.entries())
    .slice(0, 5)
    .map(([key, val], idx) => {
      const high = Math.max(...val.temps.map((t) => t.max));
      const low = Math.min(...val.temps.map((t) => t.min));
      // choose icon/desc from around midday if available
      const noonItem =
        val.items.find((i) => {
          const h = localDate(i.dt).getUTCHours();
          return h >= 11 && h <= 14;
        }) || val.items[0];
      const pop = Math.round((noonItem?.pop ?? 0) * 100);
      return {
        day: labels(key, idx),
        high,
        low,
        precipitation: pop, // %
        description: (noonItem?.weather?.[0]?.description ?? "").trim(),
        icon: noonItem?.weather?.[0]?.icon ?? "",
      };
    });

  return { hourly, daily };
}
