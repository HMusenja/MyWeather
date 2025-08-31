// src/hooks/useCityWeatherSnapshots.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getWeatherByCity } from "../api/weatherApi";

// 🟢 export the icon mapper so Dashboard can reuse it
export function iconToEmoji(rawIcon, conditionText = "") {
  const txt = String(conditionText || "").toLowerCase();
  const raw = String(rawIcon || "").toLowerCase().trim();

  // already an emoji? return as-is
  if (/[^\u0000-\u00ff]/.test(raw) && raw.length <= 4) return raw;

  const map = {
    "01d": "☀️", "01n": "🌙",
    "02d": "🌤️", "02n": "🌤️",
    "03d": "☁️",  "03n": "☁️",
    "04d": "☁️",  "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌧️",
    "11d": "⛈️", "11n": "⛈️",
    "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
  };

  const code = /^[0-9]{2}[dn]$/.test(raw)
    ? raw
    : /^[0-9][dn]$/.test(raw)
    ? `0${raw}`
    : null;

  if (code && map[code]) return map[code];

  if (/(thunder|storm|lightning)/.test(txt)) return "⛈️";
  if (/(drizzle)/.test(txt)) return "🌦️";
  if (/(rain|shower)/.test(txt)) return "🌧️";
  if (/(snow|sleet|blizzard|flurr)/.test(txt)) return "❄️";
  if (/(mist|fog|haze|smog)/.test(txt)) return "🌫️";
  if (/(clear)/.test(txt)) return "☀️";
  if (/(cloud)/.test(txt)) return "☁️";
  return "🌍";
}

// number helpers
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const asNum = (v) => (isNum(v) ? v : (Number.isFinite(Number(v)) ? Number(v) : null));
const pickNum = (...vals) => {
  for (const v of vals) { const n = asNum(v); if (n !== null) return n; }
  return null;
};

export default function useCityWeatherSnapshots(
  cities = [],
  units = "metric",
  { ttlMs = 120000, concurrency = 3 } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snapshots, setSnapshots] = useState({}); // key: cityLower -> snap
  const cacheRef = useRef(new Map()); // `${cityLower}|${units}` -> { value, ts }

  const normalizedCities = useMemo(() => {
    const out = [], seen = new Set();
    for (const c of Array.isArray(cities) ? cities : []) {
      if (!c) continue;
      const trimmed = String(c).trim(); if (!trimmed) continue;
      const lower = trimmed.toLowerCase();
      if (!seen.has(lower)) { seen.add(lower); out.push(trimmed); }
    }
    return out;
  }, [cities]);

  const cacheKey = (cityLower) => `${cityLower}|${units}`;
  const isFresh = (entry) => entry && Date.now() - entry.ts < ttlMs;

  const fetchOne = useCallback(async (city) => {
    const cityLower = city.toLowerCase();
    const key = cacheKey(cityLower);
    const cached = cacheRef.current.get(key);
    if (isFresh(cached)) return [cityLower, cached.value];

    try {
      const dto = await getWeatherByCity(city, { units });
      const cur = dto?.current || dto || {};
      const name = dto?.city || dto?.location?.name || cur?.locationName || city;
      const temp = pickNum(cur.temp, cur.temperature, cur.temp_c, cur.tempC, cur.main?.temp);
      const condition =
        cur.condition ||
        cur.description ||
        (cur.weather && cur.weather[0] && (cur.weather[0].description || cur.weather[0].main)) ||
        "";
      const iconRaw =
        cur.icon ||
        (cur.weather && cur.weather[0] && cur.weather[0].icon) ||
        cur.iconCode || "";
      const icon = iconToEmoji(iconRaw, condition);

      const snap = { name, temp, condition, icon, updatedAt: Date.now() };
      cacheRef.current.set(key, { value: snap, ts: Date.now() });
      return [cityLower, snap];
    } catch (e) {
      const prev = cacheRef.current.get(key)?.value || null;
      return [cityLower, prev];
    }
  }, [units]);

  const runPool = useCallback(async (items, limit = 3) => {
    const queue = items.slice(); let active = 0; const results = {};
    return await new Promise((resolve) => {
      const next = () => {
        if (!queue.length && active === 0) return resolve(results);
        while (active < limit && queue.length) {
          const city = queue.shift(); active += 1;
          fetchOne(city).then(([k, val]) => { if (val) results[k] = val; })
            .finally(() => { active -= 1; next(); });
        }
      };
      next();
    });
  }, [fetchOne]);

  const refresh = useCallback(async () => {
    if (!normalizedCities.length) return;
    setLoading(true); setError("");
    try {
      const toFetch = [];
      for (const city of normalizedCities) {
        const key = cacheKey(city.toLowerCase());
        const cached = cacheRef.current.get(key);
        if (!isFresh(cached)) toFetch.push(city);
      }
      if (toFetch.length) {
        const res = await runPool(toFetch, concurrency);
        setSnapshots((prev) => ({ ...prev, ...res }));
      }
      setSnapshots((prev) => {
        const merged = { ...prev };
        for (const city of normalizedCities) {
          const key = cacheKey(city.toLowerCase());
          const cached = cacheRef.current.get(key);
          if (isFresh(cached)) merged[city.toLowerCase()] = cached.value;
        }
        return merged;
      });
    } catch (e) {
      setError(e?.message || "Failed to load city snapshots");
    } finally {
      setLoading(false);
    }
  }, [normalizedCities, concurrency, runPool]);

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [JSON.stringify(normalizedCities), units]);

  return { data: snapshots, loading, error, refresh };
}
