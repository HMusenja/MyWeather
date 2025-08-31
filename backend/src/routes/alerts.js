// backend/src/routes/alerts.js
import express from "express";
import NodeCache from "node-cache";
import { z } from "zod";

import { alertScore } from "../dto/alertDTO.js";
// If you want runtime validation, uncomment the line below
// import { alertsResponseSchema } from "../dto/alertSchema.js";

// Providers
import { fetchOpenWeatherAlerts } from "../services/alerts/openWeather.js";
import {
  fetchMeteoalarmByCountry,
  METEOALARM_SUPPORTED,
} from "../services/alerts/meteoalarm.js";
import { fetchNWSByCountry } from "../services/alerts/nws.js";           // US
import { fetchEnvCanadaByCountry } from "../services/alerts/envcanada.js"; // CA
// import { fetchDWDAlerts } from "../services/alerts/dwd.js"; // later

const router = express.Router();
const cache = new NodeCache({ stdTTL: 120, checkperiod: 60 });
const SeverityRank = { minor: 1, moderate: 2, severe: 3, extreme: 4 };

// --- Query validation ---
const CoordsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  lang: z
    .string()
    .trim()
    .toLowerCase()
    .default("en")
    .transform((s) => (["en", "de", "fr", "es", "it"].includes(s) ? s : "en")),
    limit: z.coerce.number().int().min(1).max(500).default(120),
  area: z.string().trim().optional().transform((s) => (s ? s : undefined)),
  minSeverity: z.enum(["minor","moderate","severe","extreme"]).optional(),
});

const CountryQuerySchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(3)
    .transform((s) => s.slice(0, 2).toUpperCase()),
  lang: z
    .string()
    .trim()
    .toLowerCase()
    .default("en")
    .transform((s) => (["en", "de", "fr", "es", "it"].includes(s) ? s : "en")),
});

// --- Cache keys ---
function coordsKey({ lat, lon, lang }) {
  const rlat = Number(lat).toFixed(2);
  const rlon = Number(lon).toFixed(2);
  return `alerts:${rlat},${rlon}:${lang}`;
}
function countryKey({ code, lang }) {
  return `alerts:country:${code}:${lang}`; // cache key ignores filters; we filter post-cache
}
// --- Merge + sort ---
function mergeAlerts(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const a of list || []) {
      map.set(a.id, a); // last one wins
    }
  }
  return Array.from(map.values()).sort((a, b) => alertScore(b) - alertScore(a));
}

// ------ /api/alerts/coords ------
router.get("/coords", async (req, res, next) => {
  try {
    const { lat, lon, lang } = CoordsQuerySchema.parse(req.query);
    const key = coordsKey({ lat, lon, lang });

    const cached = cache.get(key);
    if (cached) return res.json(cached);

    const results = await Promise.allSettled([
      fetchOpenWeatherAlerts?.(lat, lon, lang),
      // fetchDWDAlerts?.(lat, lon, lang), // optional later
    ]);

    const ow = results[0];
    const owAlerts = ow.status === "fulfilled" ? ow.value : [];
    const alerts = mergeAlerts(owAlerts);

    const payload = { updatedAt: new Date().toISOString(), alerts };
    // alertsResponseSchema.parse(payload); // enable if you want strict validation
    cache.set(key, payload);
    res.json(payload);
  } catch (err) {
    if (err?.issues) {
      return res
        .status(400)
        .json({ error: "Invalid query", issues: err.issues });
    }
    next(err);
  }
});

// ------ /api/alerts/country ------
router.get("/country", async (req, res, next) => {
  try {
     const { code, lang, limit, area, minSeverity } = CountryQuerySchema.parse(req.query);
    const key = countryKey({ code, lang });

    const cached = cache.get(key);
    let basePayload = cached;

    // pick providers by country
    /** @type {Promise<any>[]} */
    let providerCalls = [];
    /** @type {string[]} */
    let providersMeta = [];

    if (code === "US") {
      providerCalls = [fetchNWSByCountry(lang)];
      providersMeta = ["nws"];
    } else if (code === "CA") {
      providerCalls = [fetchEnvCanadaByCountry(lang)];
      providersMeta = ["envcanada"];
    } else if (METEOALARM_SUPPORTED[code]) {
      providerCalls = [fetchMeteoalarmByCountry(code, lang)];
      providersMeta = ["meteoalarm"];
    } else {
      // unsupported country for our country-level sources
      providerCalls = [];
      providersMeta = [];
    }

    const results = await Promise.allSettled(providerCalls);
    const lists = results.map((r) => (r.status === "fulfilled" ? r.value : []));
    const alerts = mergeAlerts(...lists);

    const payload = {
      updatedAt: new Date().toISOString(),
      alerts,
      meta: {
        providers: providersMeta,
        meteoalarmSupported: !!METEOALARM_SUPPORTED[code],
      },
    };

    // alertsResponseSchema.parse(payload); // optional strict validation
    cache.set(key, payload);
    res.json(payload);
  } catch (err) {
    if (err?.issues) {
      return res
        .status(400)
        .json({ error: "Invalid query", issues: err.issues });
    }
    next(err);
  }
});

export default router;


