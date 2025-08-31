// src/api/prefsApi.js
// Centralized axios import
import axios from "axios";

export const getWeatherPrefsApi = () =>
  axios.get("/api/prefs/weather", { withCredentials: true });

export const updateWeatherPrefsApi = (partial) =>
  axios.patch("/api/prefs/weather", partial || {}, {
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });
