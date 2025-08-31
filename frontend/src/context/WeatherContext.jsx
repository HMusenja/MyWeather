// src/context/WeatherContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import {
  getWeatherByCity,
  getWeatherByCoords,
  getForecastByCity,
  getForecastByCoords,
  getAlertsByCoords,
  getAlertsByCountry,
} from "../api/weatherApi";
import { makeHeadlineFrom } from "../utils/makeHeadline";
import { getWeatherPrefsApi, updateWeatherPrefsApi } from "../api/prefsApi";

/* ---------------- utils ---------------- */
function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const asNum = (v) => (isNum(v) ? v : Number.isFinite(Number(v)) ? Number(v) : null);
const pickNum = (...vals) => {
  for (const v of vals) {
    const n = asNum(v);
    if (n !== null) return n;
  }
  return null;
};
const HOUR_MS = 3600000;
const alignToHour = (ms = Date.now()) => {
  const d = new Date(ms);
  d.setMinutes(0, 0, 0);
  return d.getTime();
};
function parseMs(val) {
  if (val == null) return null;
  if (typeof val === "number") return val > 1e12 ? val : val * 1000;
  if (typeof val === "string") {
    if (/[a-z]/i.test(val)) return null; // ignore icon-like strings, e.g. "10n"
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
    const n = Number(val);
    if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
  }
  return null;
}
function timeMsFrom(obj = {}) {
  return (
    parseMs(obj.timeISO) ??
    parseMs(obj.localISO) ??
    parseMs(obj.ts) ??
    parseMs(obj.timestamp) ??
    parseMs(obj.timeEpoch) ??
    parseMs(obj.dt_txt) ??
    (typeof obj.dt === "number" ? parseMs(obj.dt) : null) ??
    // extra vendor keys
    parseMs(obj.startTime) ??
    parseMs(obj.endTime) ??
    parseMs(obj.timestamp_local) ??
    parseMs(obj.timestamp_utc) ??
    parseMs(obj.validTimeLocal) ??
    parseMs(obj.validTimeUtc) ??
    parseMs(obj.datetime) ??
    parseMs(obj.datetimeStr) ??
    parseMs(obj.datetimeEpoch) ??
    null
  );
}
function normalizeCountry(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (s.length === 2) return s.toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

/* --------------- normalization for UI DTOs --------------- */
function normalizeCurrentDTO(src = {}) {
  const cur = src.current || src || {};
  const temp = pickNum(cur.temp, cur.temperature, cur.temp_c, cur.tempC, cur.main?.temp);
  const feelsLike = pickNum(
    cur.feelsLike,
    cur.feels_like,
    cur.apparentTemp,
    cur.apparent_temperature,
    cur.main?.feels_like
  );
  const condition =
    cur.condition || cur.description || cur.weather?.[0]?.description || cur.weather?.[0]?.main || "";
  const icon = cur.icon || cur.weather?.[0]?.icon || "";
  return { temp, feelsLike, condition, icon };
}
function normalizeHourlyDTO(list = []) {
  const arr = Array.isArray(list) ? list : [];
  const pre = arr.map((h, idx) => {
    const temp = pickNum(h.temp, h.temperature, h.main?.temp);
    const icon = h.icon || h.weather?.[0]?.icon || "";
    const condition = h.condition || h.description || h.weather?.[0]?.description || "";
    const ms = timeMsFrom(h);
    return { idx, ms, temp, icon, condition, raw: h };
  });
  let baseMs = pre.find((x) => x.ms != null)?.ms ?? alignToHour(Date.now());
  return pre.map((x) => {
    const ms = x.ms != null ? x.ms : baseMs + x.idx * HOUR_MS;
    return { ...x.raw, temp: x.temp, icon: x.icon, condition: x.condition, timeISO: new Date(ms).toISOString() };
  });
}
function normalizeDailyDTO(list = []) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((d) => {
    const high = pickNum(d.high, d.max, d.temp_max, d.maxTemp, d.temp?.max);
    const low = pickNum(d.low, d.min, d.temp_min, d.minTemp, d.temp?.min);
    const icon = d.icon || d.weather?.[0]?.icon || "";
    const condition = d.condition || d.description || d.weather?.[0]?.description || "";
    const ms = timeMsFrom(d);
    return { ...d, high, low, icon, condition, dayISO: ms ? new Date(ms).toISOString() : undefined };
  });
}
function normalizeForecastDTO(raw = {}) {
  const hourly = normalizeHourlyDTO(raw.hourly || raw.list || []);
  const dailyRaw = raw.daily || raw.days || raw.listDaily || raw.forecast?.daily || [];
  const daily = normalizeDailyDTO(dailyRaw);
  return { hourly, daily };
}
function normalizeWeatherDTO(currentRaw = {}, forecastNorm = null) {
  const city = currentRaw.city || currentRaw.location?.name || currentRaw.name || "";
  const current = normalizeCurrentDTO(currentRaw);
  const d0 = forecastNorm?.daily?.[0] || {};
  const today = {
    high: pickNum(
      currentRaw.today?.high,
      currentRaw.today?.max,
      currentRaw.today?.temp_max,
      d0.high,
      d0.max,
      d0.temp_max,
      d0?.temp?.max
    ),
    low: pickNum(
      currentRaw.today?.low,
      currentRaw.today?.min,
      currentRaw.today?.temp_min,
      d0.low,
      d0.min,
      d0.temp_min,
      d0?.temp?.min
    ),
  };
  return { ...currentRaw, city, current, today };
}

/* ---------------- state & reducer ---------------- */
const WeatherContext = createContext(null);
const MAX_RECENT = 8;

const initialState = {
  city: "",
  data: null,
  loading: false,
  error: "",
  recentSearches: [],
  favorites: [],
  units: "metric",
  theme: "dark",
  lang: "en",
  countryCode: null,
  coords: null,
  lastCoords: null,
  forecastHourly: [],
  forecastDaily: [],
  headline: "",
  alerts: { data: [], updatedAt: null, loading: false, error: null },
};

function uniqPushFront(list, next, max = MAX_RECENT) {
  const norm = (s) => (s || "").toLowerCase().trim();
  return [next, ...list.filter((c) => norm(c) !== norm(next))].slice(0, max);
}

function onWeatherSuccessDispatch(dispatch, dto, coordsHint) {
  const lat = dto?.location?.lat ?? coordsHint?.lat ?? null;
  const lon = dto?.location?.lon ?? coordsHint?.lon ?? null;
  if (lat != null && lon != null) {
    dispatch({ type: "SET_COORDS", payload: { lat, lon } });
  }
  const cc =
    dto?.location?.countryCode ?? dto?.location?.country ?? dto?.country ?? null;
  const iso2 = normalizeCountry(cc);
  if (iso2) dispatch({ type: "SET_COUNTRY", payload: iso2 });

  const headline = makeHeadlineFrom({
    location: dto?.location || { name: dto?.city },
    current: dto?.current,
    today: dto?.today,
  });
  if (headline) dispatch({ type: "SET_HEADLINE", payload: headline });
}

function weatherReducer(state, action) {
  switch (action.type) {
    case "REQUEST":
      return { ...state, loading: true, error: "" };

    case "SUCCESS": {
      const payload = action.payload;
      const cityName = payload?.city || state.city || "";
      const recent = cityName ? uniqPushFront(state.recentSearches, cityName) : state.recentSearches;
      return {
        ...state,
        loading: false,
        error: "",
        data: payload,
        city: cityName,
        recentSearches: recent,
      };
    }

    case "FORECAST_SUCCESS":
      return {
        ...state,
        forecastHourly: action.payload.hourly || [],
        forecastDaily: action.payload.daily || [],
      };

    case "FAIL":
      return { ...state, loading: false, error: action.payload, data: null };

    case "SET_SERVER_PREFS": {
      const p = action.payload || {};
      return {
        ...state,
        units: ["metric", "imperial"].includes(p.units) ? p.units : state.units,
        theme: ["dark", "light"].includes(p.theme) ? p.theme : state.theme,
        favorites: Array.isArray(p.favorites) ? p.favorites.slice(0, 20) : state.favorites,
        recentSearches: Array.isArray(p.recentSearches) ? p.recentSearches.slice(0, 8) : state.recentSearches,
      };
    }

    case "SET_UNITS":
      return { ...state, units: action.payload };

    case "SET_THEME":
      return { ...state, theme: action.payload };

    case "SET_LANG":
      return { ...state, lang: action.payload || "en" };

    case "SET_COUNTRY":
      return { ...state, countryCode: action.payload || null };

    case "SET_LAST_COORDS":
      return { ...state, lastCoords: action.payload };

    case "SET_COORDS":
      return { ...state, coords: action.payload };

    case "SET_FAVORITES":
      return { ...state, favorites: action.payload };

    case "LOAD_RECENT":
      return { ...state, recentSearches: action.payload || [] };

    case "CLEAR_RECENT":
      return { ...state, recentSearches: [] };

    case "SET_HEADLINE":
      return { ...state, headline: action.payload || "" };

    case "ALERTS_LOADING":
      return { ...state, alerts: { ...state.alerts, loading: true, error: null } };

    case "ALERTS_SUCCESS":
      return {
        ...state,
        alerts: {
          data: action.payload.alerts || [],
          updatedAt: action.payload.updatedAt || new Date().toISOString(),
          loading: false,
          error: null,
        },
      };

    case "ALERTS_ERROR":
      return { ...state, alerts: { ...state.alerts, loading: false, error: action.payload } };

    default:
      return state;
  }
}

/* ---------------- provider ---------------- */
export function WeatherProvider({ children, defaultCity = "Hamburg" }) {
  const [state, dispatch] = useReducer(weatherReducer, initialState);

  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  // debounced server sync for recents + lastCity
  const syncRecentsDebounced = useMemo(
    () =>
      debounce((recentSearches, lastCity) => {
        updateWeatherPrefsApi({ recentSearches, lastCity }).catch(() => {});
      }, 400),
    []
  );

  // ---------- API fetchers ----------
  const fetchWeather = useCallback(
    async (city, unitsOverride) => {
      const q = (city || "").trim();
      if (!q) return dispatch({ type: "FAIL", payload: "Please enter a city name." });

      const units = unitsOverride || state.units;
      dispatch({ type: "REQUEST" });
      try {
        const [currentRaw, forecastRaw] = await Promise.all([
          getWeatherByCity(q, { units }),
          getForecastByCity(q, { units }).catch(() => null),
        ]);

        const forecast = forecastRaw ? normalizeForecastDTO(forecastRaw) : null;
        const payload = normalizeWeatherDTO(currentRaw, forecast);

        dispatch({ type: "SUCCESS", payload });
        if (forecast) dispatch({ type: "FORECAST_SUCCESS", payload: forecast });

        onWeatherSuccessDispatch(dispatch, payload);
        dispatch({ type: "SET_LAST_COORDS", payload: null });

        // sync recents + lastCity to DB
        const cityName = payload?.city || q;
        const nextRecents = cityName ? uniqPushFront(state.recentSearches, cityName) : state.recentSearches;
        syncRecentsDebounced(nextRecents, cityName);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Unable to fetch weather.";
        dispatch({ type: "FAIL", payload: msg });
      }
    },
    [state.units, state.recentSearches, syncRecentsDebounced]
  );

  const fetchWeatherByCoordinates = useCallback(
    async (lat, lon, unitsOverride) => {
      const units = unitsOverride || state.units;
      dispatch({ type: "REQUEST" });
      try {
        const [currentRaw, forecastRaw] = await Promise.all([
          getWeatherByCoords(lat, lon, { units }),
          getForecastByCoords(lat, lon, { units }).catch(() => null),
        ]);

        const forecast = forecastRaw ? normalizeForecastDTO(forecastRaw) : null;
        const payload = normalizeWeatherDTO(currentRaw, forecast);

        dispatch({ type: "SUCCESS", payload });
        if (forecast) dispatch({ type: "FORECAST_SUCCESS", payload: forecast });

        onWeatherSuccessDispatch(dispatch, payload, { lat, lon });
        dispatch({ type: "SET_LAST_COORDS", payload: { lat, lon } });

        const cityName = payload?.city || "";
        if (cityName) {
          const nextRecents = uniqPushFront(state.recentSearches, cityName);
          syncRecentsDebounced(nextRecents, cityName);
        }
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || "Unable to fetch weather.";
        dispatch({ type: "FAIL", payload: msg });
      }
    },
    [state.units, state.recentSearches, syncRecentsDebounced]
  );

  // ---------- public actions (persist to DB) ----------
  const toggleUnits = useCallback(async () => {
    const next = state.units === "metric" ? "imperial" : "metric";
    dispatch({ type: "SET_UNITS", payload: next });
    updateWeatherPrefsApi({ units: next }).catch(() => {});

    if (state.lastCoords) {
      await fetchWeatherByCoordinates(state.lastCoords.lat, state.lastCoords.lon, next);
    } else if (state.city) {
      await fetchWeather(state.city, next);
    }
  }, [state.units, state.lastCoords, state.city, fetchWeather, fetchWeatherByCoordinates]);

  const toggleTheme = useCallback(() => {
    const next = state.theme === "dark" ? "light" : "dark";
    dispatch({ type: "SET_THEME", payload: next });
    applyTheme(next);
    updateWeatherPrefsApi({ theme: next }).catch(() => {});
  }, [state.theme, applyTheme]);

  const isFavorite = useCallback(
    (name) => state.favorites.some((c) => c.toLowerCase() === (name || "").toLowerCase()),
    [state.favorites]
  );

  const toggleFavorite = useCallback(() => {
    const name = state.city || state.data?.city;
    if (!name) return;
    const exists = isFavorite(name);
    const next = exists
      ? state.favorites.filter((c) => c.toLowerCase() !== name.toLowerCase())
      : [name, ...state.favorites.filter((c) => c.toLowerCase() !== name.toLowerCase())].slice(0, 20);
    dispatch({ type: "SET_FAVORITES", payload: next });
    updateWeatherPrefsApi({ favorites: next }).catch(() => {});
  }, [state.city, state.data, state.favorites, isFavorite]);

  const clearRecent = useCallback(() => {
    dispatch({ type: "CLEAR_RECENT" });
    updateWeatherPrefsApi({ recentSearches: [] }).catch(() => {});
  }, []);

  // ----- Alerts fetchers (country preferred, coords fallback) -----
  const fetchAlertsByCountry = async (code, lang = "en", coordsFallback = null, opts = {}) => {
    if (!code) return;
    dispatch({ type: "ALERTS_LOADING" });
    try {
      const json = await getAlertsByCountry(code, { lang, ...opts });
      dispatch({ type: "ALERTS_SUCCESS", payload: json });
      if ((!json?.alerts || json.alerts.length === 0) && coordsFallback?.lat && coordsFallback?.lon) {
        await fetchAlertsByCoordsWrapped(coordsFallback.lat, coordsFallback.lon, lang);
      }
    } catch (err) {
      dispatch({ type: "ALERTS_ERROR", payload: err?.message || "Failed to load alerts" });
      if (coordsFallback?.lat && coordsFallback?.lon) {
        await fetchAlertsByCoordsWrapped(coordsFallback.lat, coordsFallback.lon, lang);
      }
    }
  };

  const fetchAlertsByCoordsWrapped = async (lat, lon, lang = "en") => {
    if (lat == null || lon == null) return;
    dispatch({ type: "ALERTS_LOADING" });
    try {
      const json = await getAlertsByCoords(lat, lon, { lang });
      dispatch({ type: "ALERTS_SUCCESS", payload: json });
    } catch (err) {
      dispatch({ type: "ALERTS_ERROR", payload: err?.message || "Failed to load alerts" });
    }
  };

  // ---------- boot: DB-first prefs, then decide start city ----------
  useEffect(() => {
    // language from browser
    try {
      const navLang = (navigator?.language || "en").slice(0, 2).toLowerCase();
      if (navLang && navLang !== "en") dispatch({ type: "SET_LANG", payload: navLang });
    } catch {}

    const getCoords = () =>
      new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) return reject(new Error("Geolocation not supported"));
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          reject,
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      });

    (async () => {
      try {
        // 1) fetch prefs from DB
        const { data } = await getWeatherPrefsApi();
        const prefs = data?.prefs || {};
        dispatch({ type: "SET_SERVER_PREFS", payload: prefs });
        if (prefs.theme) applyTheme(prefs.theme);

        // 2) decide starting city (DB lastCity > defaultCity > geo > prop default)
        const startCity = (prefs.lastCity || prefs.defaultCity || "").trim();
        if (startCity) {
          await fetchWeather(startCity);
          return;
        }
        try {
          const { lat, lon } = await getCoords();
          await fetchWeatherByCoordinates(lat, lon);
        } catch {
          await fetchWeather(defaultCity);
        }
      } catch {
        // prefs failed → fall back gracefully
        try {
          const { lat, lon } = await getCoords();
          await fetchWeatherByCoordinates(lat, lon);
        } catch {
          await fetchWeather(defaultCity);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- hydrateFromServer (used by PrefsBootstrapper or after login) ----------
  const hydrateFromServer = useCallback(
    async (prefs = {}) => {
      if (prefs.units && ["metric", "imperial"].includes(prefs.units) && prefs.units !== state.units) {
        dispatch({ type: "SET_UNITS", payload: prefs.units });
      }
      if (prefs.theme && ["dark", "light"].includes(prefs.theme) && prefs.theme !== state.theme) {
        dispatch({ type: "SET_THEME", payload: prefs.theme });
        applyTheme(prefs.theme);
      }
      if (Array.isArray(prefs.favorites)) {
        dispatch({ type: "SET_FAVORITES", payload: prefs.favorites.slice(0, 20) });
      }
      if (Array.isArray(prefs.recentSearches)) {
        dispatch({ type: "LOAD_RECENT", payload: prefs.recentSearches.slice(0, 8) });
      }
      // optionally load default/last city if none active
      const hasCity = Boolean(state.city || state?.data?.city);
      if (!hasCity) {
        const start = (prefs.lastCity || prefs.defaultCity || "").trim();
        if (start) try { await fetchWeather(start); } catch {}
      }
    },
    [state.units, state.theme, state.city, state?.data?.city, fetchWeather, applyTheme]
  );

  const value = useMemo(
    () => ({
      state,
      fetchWeather,
      fetchWeatherByCoordinates,
      fetchAlertsByCountry,
      fetchAlertsByCoords: fetchAlertsByCoordsWrapped,
      toggleUnits,
      toggleTheme,
      toggleFavorite,
      isFavorite,
      clearRecent,
      useMyLocation: () => {
        if (!("geolocation" in navigator))
          return dispatch({ type: "FAIL", payload: "Geolocation is not supported on this browser." });
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeatherByCoordinates(pos.coords.latitude, pos.coords.longitude),
          () => dispatch({ type: "FAIL", payload: "Unable to get your location." }),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
        );
      },
      hydrateFromServer,
    }),
    [
      state,
      fetchWeather,
      fetchWeatherByCoordinates,
      fetchAlertsByCountry,
      fetchAlertsByCoordsWrapped,
      toggleUnits,
      toggleTheme,
      toggleFavorite,
      isFavorite,
      clearRecent,
      hydrateFromServer,
    ]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

/* ---------------- hook ---------------- */
export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error("useWeather must be used within WeatherProvider");
  return ctx;
}
// This context manages weather data, user preferences, and syncs with backend APIs.