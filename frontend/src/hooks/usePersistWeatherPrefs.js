// src/hooks/usePersistWeatherPrefs.js
import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { updateWeatherPrefsApi } from "../api/prefsApi";

export default function usePersistWeatherPrefs() {
  const { user } = useAuth();

  const send = useCallback(async (payload) => {
    if (!user) return; // no-op if not signed in
    try {
      await updateWeatherPrefsApi(payload);
    } catch (e) {
      // keep UI optimistic; you can surface a toast here if you like
      console.warn("[prefs] save failed:", e?.message || e);
    }
  }, [user]);

  return {
    saveUnits: (units) => send({ units }),
    saveTheme: (theme) => send({ theme }),
    saveFavorites: (favorites) => send({ favorites }),
    saveDefaultCity: (defaultCity) => send({ defaultCity }),
  };
}
