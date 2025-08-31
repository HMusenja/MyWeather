// src/App.jsx
import { useEffect } from "react";
import { setAxiosDefaults } from "./utils/axiosConfig";
import AppRoutes from "./routing/appRoutes";
import { useWeather } from "./context/WeatherContext";
import { isDaytime, resolveSkyKey, applySkyTheme } from "./utils/skyTheme";

function App() {
  setAxiosDefaults();
  const { state } = useWeather();
  const { current } = state || {}; // raw OpenWeather response

  useEffect(() => {
    if (!current) return;

    const main = current?.weather?.[0]?.main || "Clear";
    const now = current?.dt;
    const sunrise = current?.sys?.sunrise;
    const sunset = current?.sys?.sunset;

    // fallback via icon (e.g., "01d" / "01n")
    const isDay =
      isDaytime(now, sunrise, sunset) ||
      /\dd$/.test(current?.weather?.[0]?.icon || "");

    const key = resolveSkyKey(main, isDay);
    applySkyTheme(key);
  }, [current]);

  return (
    <>
      <div className="sky-overlay" />
      <AppRoutes />
    </>
  );
}

export default App;
