import { XMLParser } from "fast-xml-parser";
import {
  makeAlertId,
  mapSeverityFromCAP,
  mapUrgency,
  mapCertainty,
} from "./mapping.js";

/** Map ISO-2 -> Meteoalarm country slug used in legacy Atom/RSS feed URLs */
const COUNTRY_SLUG = {
  AT: "austria",
  BE: "belgium",
  BA: "bosnia-herzegovina", // note: without "-and-"
  BG: "bulgaria",
  CH: "switzerland",
  CY: "cyprus",
  CZ: "czech-republic",
  DE: "germany",
  DK: "denmark",
  EE: "estonia",
  ES: "spain",
  FI: "finland",
  FR: "france",
  GR: "greece",
  HR: "croatia",
  HU: "hungary",
  IE: "ireland",
  IL: "israel",
  IS: "iceland",
  IT: "italy",
  LI: "liechtenstein",
  LT: "lithuania",
  LU: "luxembourg",
  LV: "latvia",
  MD: "moldova",
  ME: "montenegro",
  MK: "republic-of-north-macedonia",
  MT: "malta",
  NL: "netherlands",
  NO: "norway",
  PL: "poland",
  PT: "portugal",
  RO: "romania",
  RS: "serbia",
  SE: "sweden",
  SI: "slovenia",
  SK: "slovakia",
  UA: "ukraine",
  GB: "united-kingdom",
  UK: "united-kingdom",
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  textNodeName: "text",
});

/**
 * Public per-country feeds (no auth)
 * - Atom: https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-<slug>
 * - RSS : https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-rss-<slug>
 */

export async function fetchMeteoalarmByCountry(iso2, lang = "en") {
  const slug = COUNTRY_SLUG[(iso2 || "").toUpperCase()];
  if (!slug) {
    console.warn("[Meteoalarm] unsupported country code:", iso2);
    return [];
  }

  const atomUrl = `https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-${slug}`;
  const rssUrl  = `https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-rss-${slug}`;

  // friendly headers — some servers 406 if Accept/UA missing or too strict
  const baseHeaders = {
    "Accept": "application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
    "Accept-Language": lang,
    "User-Agent": `MyWeatherApp/1.0 (+https://example.com)`,
  };

  // 1) Try Atom (strict header)
  let xml = await tryFetchText(atomUrl, baseHeaders);

  // 2) If 406/415 or empty, relax Accept then retry Atom
  if (!xml?.ok && (xml?.status === 406 || xml?.status === 415)) {
    const relaxed = { ...baseHeaders, Accept: "application/xml,text/xml,*/*" };
    xml = await tryFetchText(atomUrl, relaxed);
  }

  // 3) If still not ok, try RSS endpoint (with relaxed headers)
  if (!xml?.ok) {
    const rss = await tryFetchText(rssUrl, { ...baseHeaders, Accept: "application/rss+xml,application/xml,text/xml,*/*" });
    if (rss?.ok) xml = rss;
  }

  if (!xml?.ok || !xml.text) {
    console.error("[Meteoalarm] feed fetch failed:", xml?.status, atomUrl);
    return [];
  }

  // Parse Atom or RSS
  const root = parser.parse(xml.text);
  const isAtom = !!root?.feed || !!root?.Feed;
  const isRss  = !!root?.rss || !!root?.RSS;

  const out = [];
  if (isAtom) {
    const feed = root.feed || root.Feed || {};
    const entries = toArray(feed.entry);
    console.log(`[Meteoalarm] ${iso2} Atom entries:`, entries.length);

    for (const e of entries) {
      out.push(entryToDTOFromAtom(e));
    }
  } else if (isRss) {
    const items = toArray(root?.rss?.channel?.item || []);
    console.log(`[Meteoalarm] ${iso2} RSS items:`, items.length);

    for (const it of items) {
      out.push(entryToDTOFromRss(it));
    }
  } else {
    console.warn("[Meteoalarm] unknown XML shape");
  }

  // Filter empties and ensure uniqueness by id
  const seen = new Set();
  return out.filter(a => a?.id && !seen.has(a.id) && seen.add(a.id));
}

// ---------- parsing helpers for Atom ----------
function entryToDTOFromAtom(e) {
  const capEvent      = val(e["cap:event"]);
  const capSeverity   = val(e["cap:severity"]);
  const capUrgency    = val(e["cap:urgency"]);
  const capCertainty  = val(e["cap:certainty"]);
  const capAreaDesc   = val(e["cap:areaDesc"]);
  const capOnset      = val(e["cap:onset"]) || val(e["cap:effective"]) || val(e["cap:sent"]) || val(e.published);
  const capExpires    = val(e["cap:expires"]);
  const title         = val(e.title) || capEvent || "Weather Alert";

  const startsAtISO = toISO(capOnset) || new Date().toISOString();
  const endsAtISO   = toISO(capExpires) || new Date(Date.now() + 3600e3).toISOString();

  let description = stripHtml(val(e.summary)) || "";
  let instruction = "";

  // Optional: follow CAP link for richer description/instruction
  const capLink = findCapLink(e.link);
  const wantCap = process.env.METEOALARM_FETCH_CAP === "1";
  if (wantCap && capLink) ({ description, instruction } = fetchCapDetails(capLink, description, instruction));

  return {
    id: makeAlertId("meteoalarm", { event: capEvent || title, startsAt: startsAtISO, endsAt: endsAtISO }),
    source: "meteoalarm",
    event: capEvent || title,
    severity: mapSeverityFromCAP(capSeverity || title),
    urgency: mapUrgency(capUrgency || "expected"),
    areas: [capAreaDesc].filter(Boolean),
    startsAt: startsAtISO,
    endsAt: endsAtISO,
    headline: title,
    description,
    instruction,
    certainty: mapCertainty(capCertainty || "unknown"),
  };
}

// ---------- parsing helpers for RSS ----------
function entryToDTOFromRss(it) {
  // RSS places CAP fields as namespaced elements on item
  const capEvent      = val(it["cap:event"]);
  const capSeverity   = val(it["cap:severity"]);
  const capUrgency    = val(it["cap:urgency"]);
  const capCertainty  = val(it["cap:certainty"]);
  const capAreaDesc   = val(it["cap:areaDesc"]);
  const capOnset      = val(it["cap:onset"]) || val(it["cap:effective"]) || val(it["cap:sent"]) || val(it.pubDate);
  const capExpires    = val(it["cap:expires"]);
  const title         = val(it.title) || capEvent || "Weather Alert";

  const startsAtISO = toISO(capOnset) || new Date().toISOString();
  const endsAtISO   = toISO(capExpires) || new Date(Date.now() + 3600e3).toISOString();

  let description = stripHtml(val(it.description)) || "";
  let instruction = "";

  // Some RSS items include a CAP link in <link>
  const capLink = val(it.link);
  const wantCap = process.env.METEOALARM_FETCH_CAP === "1";
  if (wantCap && isLikelyCapUrl(capLink)) ({ description, instruction } = fetchCapDetails(capLink, description, instruction));

  return {
    id: makeAlertId("meteoalarm", { event: capEvent || title, startsAt: startsAtISO, endsAt: endsAtISO }),
    source: "meteoalarm",
    event: capEvent || title,
    severity: mapSeverityFromCAP(capSeverity || title),
    urgency: mapUrgency(capUrgency || "expected"),
    areas: [capAreaDesc].filter(Boolean),
    startsAt: startsAtISO,
    endsAt: endsAtISO,
    headline: title,
    description,
    instruction,
    certainty: mapCertainty(capCertainty || "unknown"),
  };
}

// ---------- fetch helpers ----------
async function tryFetchText(url, headers) {
  try {
    const res = await fetch(url, { headers });
    const text = res.ok ? await res.text() : null;
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    console.warn("[Meteoalarm] fetch failed:", err?.message);
    return { ok: false, status: 0, text: null };
  }
}

// CAP details (best-effort, non-blocking)
function fetchCapDetails(url, description, instruction) {
  return {
    description,
    instruction,
    // You can optionally implement an async cache here if you want richer text.
  };
}

// ---------- misc ----------
function toArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }
function val(x) { return typeof x === "object" && x !== null ? (x.text ?? "") : (x ?? ""); }
function toISO(x) { if (!x) return ""; const d = new Date(x); return isFinite(d) ? d.toISOString() : ""; }
function findCapLink(link) {
  const arr = toArray(link);
  const hit = arr.find(l => l?.["@_type"] === "application/cap+xml" && l?.["@_href"]);
  return hit?.["@_href"] || null;
}
function isLikelyCapUrl(u="") { return typeof u === "string" && u.includes(".xml"); }
function stripHtml(s) { return s ? String(s).replace(/<[^>]*>/g, "").trim() : ""; }

export const METEOALARM_SUPPORTED = Object.freeze(COUNTRY_SLUG);
