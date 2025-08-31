// src/controllers/weatherController.js
import { z } from "zod";
import createError from "http-errors";
import {
  fetchCityWeatherRaw,
  fetchCoordsWeatherRaw,
  mapToDTO,
  fetchCityForecastRaw,
  fetchCoordsForecastRaw,
  mapForecastToDTO,
} from "../utils/weatherService.js";

const CitySchema = z
  .string()
  .trim()
  .min(1, "City is required")
  .regex(/^[\p{L}\p{M}\s.'-]+$/u, "City contains invalid characters");

const CoordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// helper: parse units/lang from query
function parseUnitsLang(req) {
  const u = String(req.query.units || "").toLowerCase();
  const units = u === "metric" || u === "imperial" ? u : undefined; // default handled in mapper
  const lang = (req.query.lang || "").trim() || undefined;
  return { units, lang };
}

export async function getWeatherByCity(req, res, next) {
  console.log("[weatherController] city ->", req.params.city);
  try {
    const { units, lang } = parseUnitsLang(req);
    const city = CitySchema.parse(req.params.city ?? "");
    const data = await fetchCityWeatherRaw(city, { units, lang });
    const payload = mapToDTO(data, { units: units || "metric" });
    if (!payload.city) return next(createError(404, "City not found"));
    res.json(payload);
  } catch (err) {
    console.log("[weatherController] error:", err.message);
    if (err instanceof z.ZodError) return next(createError(400, err.errors?.[0]?.message || "Invalid city"));
    next(err);
  }
}

export async function getWeatherByCoords(req, res, next) {
  try {
    const { units, lang } = parseUnitsLang(req);
    const { lat, lon } = CoordsSchema.parse({ lat: req.query.lat, lon: req.query.lon });
    const data = await fetchCoordsWeatherRaw({ lat, lon }, { units, lang });
    const payload = mapToDTO(data, { units: units || "metric" });
    if (!payload.city) return next(createError(404, "City not found"));
    res.json(payload);
  } catch (err) {
    if (err instanceof z.ZodError) return next(createError(400, err.errors?.[0]?.message || "Invalid coordinates"));
    next(err);
  }
}

export async function getForecastByCity(req, res, next) {
  try {
    const { units, lang } = parseUnitsLang(req);
    const city = z.string().trim().min(1).parse(req.params.city ?? "");
    const fx = await fetchCityForecastRaw(city, { units, lang });
    if (!fx?.city?.name) return next(createError(404, "City not found"));
    res.json(mapForecastToDTO(fx));
  } catch (err) {
    if (err instanceof z.ZodError) return next(createError(400, "Invalid city"));
    next(err);
  }
}

export async function getForecastByCoords(req, res, next) {
  try {
    const { units, lang } = parseUnitsLang(req);
    const { lat, lon } = CoordsSchema.parse({ lat: req.query.lat, lon: req.query.lon });
    const fx = await fetchCoordsForecastRaw({ lat, lon }, { units, lang });
    if (!fx?.city?.name) return next(createError(404, "City not found"));
    res.json(mapForecastToDTO(fx));
  } catch (err) {
    if (err instanceof z.ZodError) return next(createError(400, "Invalid coordinates"));
    next(err);
  }
}
