// src/components/PrefsBootstrapper.jsx
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useWeather } from "../context/WeatherContext";
import { getWeatherPrefsApi } from "../api/prefsApi";

export default function PrefsBootstrapper() {
  const { user, initializing } = useAuth();
  const { hydrateFromServer, fetchWeather } = useWeather();

  useEffect(() => {
    let alive = true;
    (async () => {
      if (initializing || !user) return;
      try {
        const { data } = await getWeatherPrefsApi();
        if (!alive) return;
        const prefs = data?.prefs || {};
        await hydrateFromServer(prefs);
        const start = (prefs.lastCity || prefs.defaultCity || "").trim();
        if (start) await fetchWeather(start);
      } catch (e) {
        // optionally toast/log
      }
    })();
    return () => { alive = false; };
  }, [user, initializing, hydrateFromServer, fetchWeather]);

  return null;
}
// This component fetches user weather preferences on mount and hydrates the WeatherContext.
