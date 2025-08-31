// backend/src/services/alerts/nws.js
import { fetchCapFeeds } from "./capGeneric.js";

/**
 * National Weather Service (US) — national CAP atom feed
 * Docs: alerts.weather.gov (CAP v1.2)
 */
export async function fetchNWSByCountry(lang = "en") {
  const urls = [
    "https://alerts.weather.gov/cap/us.php?x=1", // national active alerts
  ];
  // reuse generic CAP parser
  const list = await fetchCapFeeds(urls, lang);
  // mark source as 'nws'
  return list.map(a => ({ ...a, source: "nws" }));
}
