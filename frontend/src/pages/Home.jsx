// src/pages/Home.jsx
import { useEffect, useState } from "react";
import Header from "../components/Header";
import WeatherHero from "../components/WeatherHero";
import SearchSection from "../components/SearchSection";
import ForecastSection from "../components/ForecastSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";
import WeatherNews from "../components/WeatherNews";

import { getWeatherByCity } from "../api/weatherApi";
import { isDaytime, resolveSkyKey, applySkyTheme } from "../utils/skyTheme";

const DEFAULT_CITY = "Berlin";

const Home = () => {
  const [weather, setWeather] = useState(null);
  const [loadingHero, setLoadingHero] = useState(false);
  const [heroError, setHeroError] = useState("");

  // Hydrate background once on mount using last city (or Berlin)
  useEffect(() => {
    const lastCity =
      (typeof window !== "undefined" &&
        localStorage.getItem("lastCity")) ||
      DEFAULT_CITY;

    let active = true;
    (async () => {
      try {
        setLoadingHero(true);
        setHeroError("");

        const res = await getWeatherByCity(lastCity);
        // Allow both shapes: raw or { current: raw }
        const payload = res?.current || res;

        // Essentials from raw OpenWeather response
        const main = payload?.weather?.[0]?.main || "Clear";
        const now = payload?.dt;
        const sunrise = payload?.sys?.sunrise;
        const sunset = payload?.sys?.sunset;
        const icon = payload?.weather?.[0]?.icon || "";

        const dayFlag =
          isDaytime(now, sunrise, sunset) || /\dd$/.test(icon);

        const key = resolveSkyKey(main, dayFlag);
        if (active) {
          applySkyTheme(key);
          setWeather(payload);
        }
      } catch (e) {
        console.error("[Home] hero background fetch failed:", e);
        setHeroError("Failed to load weather background.");
      } finally {
        setLoadingHero(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* optional soft animated glow; remove if you don’t want it */}
      <div className="sky-overlay" />

      <Header />

      <main>
        <WeatherHero weather={weather} loading={loadingHero} error={heroError} />
        <SearchSection />
        <WeatherNews />
        <ForecastSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
