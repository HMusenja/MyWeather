import dotenv from "dotenv";
dotenv.config();

const required = (key, hint = "") => {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing env ${key}${hint ? ` (${hint})` : ""}`);
  }
  return val;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  OPENWEATHER_API_KEY: required("OPENWEATHER_API_KEY", "OpenWeatherMap API key"),
  OPENWEATHER_BASE_URL: process.env.OPENWEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5",
  DEFAULT_UNITS: process.env.WEATHER_UNITS || "metric", // metric | imperial
  DEFAULT_LANG: process.env.WEATHER_LANG || "en",
};