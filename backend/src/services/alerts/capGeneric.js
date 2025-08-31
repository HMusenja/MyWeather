// backend/src/services/alerts/capGeneric.js
import { XMLParser } from "fast-xml-parser";
import {
  makeAlertId,
  mapSeverityFromCAP,
  mapUrgency,
  mapCertainty,
} from "./mapping.js";

/**
 * Fetch one or more CAP/Atom/RSS feeds and normalize to AlertDTO[]
 * @param {string[]} urls
 * @param {string} lang - preferred 2-letter language (best-effort)
 */
export async function fetchCapFeeds(urls = [], lang = "en") {
  const headers = {
    "Accept": "application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7",
    "Accept-Language": lang,
    "User-Agent": `MyWeatherApp/1.0 (+https://example.com)`,
  };

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    textNodeName: "text",
  });

  /** @type {import('../../dto/alertDTO.js').AlertDTO[]} */
  const out = [];
  for (const url of urls) {
    if (!url) continue;
    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        // try relaxed accept
        const res2 = await fetch(url, { headers: { ...headers, Accept: "application/xml,text/xml,*/*" } });
        if (!res2.ok) { console.warn("[CAP] fetch failed", res.status, url); continue; }
        const xml2 = await res2.text();
        out.push(...parseCap(xml2, parser, lang));
      } else {
        const xml = await res.text();
        out.push(...parseCap(xml, parser, lang));
      }
    } catch (e) {
      console.warn("[CAP] error", e?.message, url);
    }
  }
  // de-dupe by id
  const seen = new Set();
  return out.filter(a => a?.id && !seen.has(a.id) && seen.add(a.id));
}

function parseCap(xml, parser, lang = "en") {
  const root = parser.parse(xml);
  const isAtom = !!root?.feed || !!root?.Feed;
  const isRss  = !!root?.rss || !!root?.RSS;
  const isCap  = !!root?.alert;

  if (isAtom) return parseAtom(root, lang);
  if (isRss)  return parseRss(root, lang);
  if (isCap)  return parseCapDoc(root, lang); // a single CAP alert document
  return [];
}

// ---- Atom ----
function parseAtom(root, lang) {
  const feed = root.feed || root.Feed || {};
  const entries = toArray(feed.entry);
  return entries.map((e) => {
    const info = readCapFromAtomItem(e);
    return toDTO("cap-atom", info);
  }).filter(Boolean);
}

// ---- RSS ----
function parseRss(root, lang) {
  const items = toArray(root?.rss?.channel?.item || []);
  return items.map((it) => {
    const info = readCapFromRssItem(it);
    return toDTO("cap-rss", info);
  }).filter(Boolean);
}

// ---- CAP (single) ----
function parseCapDoc(root, lang) {
  const info = readCapFromAlert(root.alert, lang);
  return [toDTO("cap-doc", info)].filter(Boolean);
}

// ---------- Info Extraction ----------
function readCapFromAtomItem(e) {
  const cap = (k) => val(e[`cap:${k}`]);
  return {
    event: cap("event"),
    severity: cap("severity"),
    urgency: cap("urgency"),
    certainty: cap("certainty"),
    areaDesc: cap("areaDesc"),
    onset: cap("onset") || cap("effective") || cap("sent") || val(e.published),
    expires: cap("expires"),
    title: val(e.title),
    summary: stripHtml(val(e.summary)),
  };
}

function readCapFromRssItem(it) {
  const cap = (k) => val(it[`cap:${k}`]);
  return {
    event: cap("event"),
    severity: cap("severity"),
    urgency: cap("urgency"),
    certainty: cap("certainty"),
    areaDesc: cap("areaDesc"),
    onset: cap("onset") || cap("effective") || cap("sent") || val(it.pubDate),
    expires: cap("expires"),
    title: val(it.title),
    summary: stripHtml(val(it.description)),
  };
}

function readCapFromAlert(alert, lang = "en") {
  const infos = toArray(alert?.info);
  // best-effort language selection
  const info = infos.find(i => startsWith(i?.language, lang)) || infos[0] || {};
  const area = toArray(info?.area)[0] || {};
  return {
    event: val(info?.event),
    severity: val(info?.severity),
    urgency: val(info?.urgency),
    certainty: val(info?.certainty),
    areaDesc: val(area?.areaDesc),
    onset: val(info?.onset) || val(info?.effective) || val(alert?.sent),
    expires: val(info?.expires),
    title: val(info?.headline) || val(alert?.identifier),
    summary: stripHtml(val(info?.description)),
    instruction: stripHtml(val(info?.instruction)),
  };
}

// ---------- DTO ----------
function toDTO(source, info) {
  const event = (info?.event || info?.title || "Weather Alert").trim();
  const startsAtISO = toISO(info?.onset) || new Date().toISOString();
  const endsAtISO   = toISO(info?.expires) || new Date(Date.now() + 3600e3).toISOString();

  return {
    id: makeAlertId(source, { event, startsAt: startsAtISO, endsAt: endsAtISO }),
    source: sourceName(source),
    event,
    severity: mapSeverityFromCAP(info?.severity || event),
    urgency: mapUrgency(info?.urgency || "expected"),
    areas: [info?.areaDesc].filter(Boolean),
    startsAt: startsAtISO,
    endsAt: endsAtISO,
    headline: info?.title || event,
    description: info?.summary || "",
    instruction: info?.instruction || "",
    certainty: mapCertainty(info?.certainty || "unknown"),
  };
}

function sourceName(src) {
  if (src.startsWith("nws")) return "nws";
  if (src.startsWith("ec"))  return "metoffice"; // placeholder if you later add Met Office
  return "meteoalarm";
}

// ---------- utils ----------
function toArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }
function val(x) { return typeof x === "object" && x !== null ? (x.text ?? "") : (x ?? ""); }
function stripHtml(s) { return s ? String(s).replace(/<[^>]*>/g, "").trim() : ""; }
function startsWith(s, pref) { return (s||"").toLowerCase().startsWith((pref||"").toLowerCase()); }
function toISO(x) { if (!x) return ""; const d = new Date(x); return isFinite(d) ? d.toISOString() : ""; }
