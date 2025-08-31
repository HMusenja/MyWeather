// JSDoc types for great editor intellisense

/**
 * @typedef {"minor" | "moderate" | "severe" | "extreme"} AlertSeverity
 * @typedef {"immediate" | "expected" | "future" | "past"} AlertUrgency
 * @typedef {"likely" | "observed" | "possible" | "unknown"} AlertCertainty
 * @typedef {"openweather" | "meteoalarm" | "dwd" | "nws" | "metoffice"} AlertSource
 */

/**
 * @typedef {Object} AlertDTO
 * @property {string} id                // stable id (provider+hash(event+startsAt+endsAt))
 * @property {AlertSource} source       // provider id
 * @property {string} event             // e.g., "Severe Thunderstorm"
 * @property {AlertSeverity} severity   // mapped to 4 buckets
 * @property {AlertUrgency} urgency     // mapped
 * @property {string[]} areas           // affected areas/regions
 * @property {string} startsAt          // ISO string
 * @property {string} endsAt            // ISO string
 * @property {string} headline          // short headline
 * @property {string} [description]     // longer text, may include line breaks
 * @property {string} [instruction]     // actionable advice
 * @property {AlertCertainty} [certainty] // likelihood/observed
 */

/**
 * @typedef {Object} AlertsResponse
 * @property {string} updatedAt         // ISO
 * @property {AlertDTO[]} alerts
 */

// ---- Enums & helpers (shared across services) ----

/** @type {Record<string, 1|2|3|4>} */
export const SeverityRank = {
  minor: 1,
  moderate: 2,
  severe: 3,
  extreme: 4,
};

/** @type {Record<string, number>} */
export const UrgencyRank = {
  immediate: 3,
  expected: 2,
  future: 1,
  past: 0,
};

/**
 * Rank an alert for sorting (higher is more important)
 * @param {AlertDTO} a
 */
export function alertScore(a) {
  const s = SeverityRank[a.severity] || 0;
  const u = UrgencyRank[a.urgency] || 0;
  // bias for sooner end time when equal severity/urgency
  const endBias = a.endsAt ? -new Date(a.endsAt).getTime() / 1e13 : 0;
  return s * 10 + u + endBias;
}
