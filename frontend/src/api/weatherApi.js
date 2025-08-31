import axios from "axios";

export async function getWeatherByCity(city, { units = "metric" } = {}) {
  const q = city?.trim();
  if (!q) throw new Error("City is required");
  const { data } = await axios.get(`/api/weather/${encodeURIComponent(q)}`, { params: { units } });
  return data;
}

export async function getWeatherByCoords(lat, lon,{ units = "metric" } = {}) {
  const { data } = await axios.get(`/api/weather/coords`, { params: { lat, lon,units } });
  return data;
}

export async function getForecastByCity(city,{ units = "metric" } = {}) {
  const q = city?.trim();
  if (!q) throw new Error("City is required");
  const { data } = await axios.get(`/api/weather/forecast/${encodeURIComponent(q)}`,{ params: { units } });
  return data; // { hourly: [...], daily: [...] }
}
export async function getForecastByCoords(lat, lon,{ units = "metric" } = {}) {
  const { data } = await axios.get(`/api/weather/forecast/coords`, { params: { lat, lon,units } });
  return data;
}

// ----- Alerts -----
export async function getAlertsByCoords(
  lat,
  lon,
  { lang = "en" } = {}
) {
  if (lat == null || lon == null) throw new Error("Coordinates required");
  const { data } = await axios.get(`/api/alerts/coords`, {
    params: { lat, lon, lang },
    withCredentials: true, // keep cookies/session if needed
  });
  return data; // { updatedAt, alerts: [...] }
}

export async function getAlertsByCountry(code, { lang = "en", area, limit, minSeverity  } = {}) {
  const cc = (code || "").trim();
  if (!cc) throw new Error("Country code required");
  const { data } = await axios.get(`/api/alerts/country`, {
    params: { code: cc, lang,limit, minSeverity,area },
    withCredentials: true,
  });
  return data; // { updatedAt, alerts: [...] }
}