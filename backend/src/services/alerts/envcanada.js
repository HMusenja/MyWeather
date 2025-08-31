// backend/src/services/alerts/envcanada.js
import { fetchCapFeeds } from "./capGeneric.js";

/**
 * Environment Canada CAP
 * National feed aggregates provincial alerts.
 * (If this URL ever changes, you can switch to province feeds easily.)
 */
export async function fetchEnvCanadaByCountry(lang = "en") {
  const urls = [
    // national CAP XML (commonly available under dd.weather.gc.ca)
    "https://dd.weather.gc.ca/alerts/cap/Canada-cap.xml",
  ];
  const list = await fetchCapFeeds(urls, lang);
  return list.map(a => ({ ...a, source: "metoffice" })); // choose 'metoffice' or 'nws'? define 'source' if you wish (you have 'metoffice' in enum)
}
