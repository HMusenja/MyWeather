import crypto from "crypto";
import { severityEnum, urgencyEnum, certaintyEnum } from "../../dto/alertSchema.js";

/**
 * Make a stable id string from provider + parts
 */
export function makeAlertId(provider, parts) {
  const raw = `${provider}:${parts.event ?? ""}:${parts.startsAt ?? ""}:${parts.endsAt ?? ""}`;
  return `${provider}_${crypto.createHash("md5").update(raw).digest("hex")}`;
}

// ---- Severity mappers (examples; extend per provider) ----

/** Map OpenWeather (NWS-like) severity strings to our buckets */
export function mapSeverityFromOpenWeather(input = "") {
  const s = input.toLowerCase();
  if (s.includes("extreme")) return "extreme";
  if (s.includes("severe")) return "severe";
  if (s.includes("moderate")) return "moderate";
  if (s.includes("minor") || s.includes("advisory")) return "minor";
  // fallbacks:
  if (s.includes("warning")) return "severe";
  if (s.includes("watch")) return "moderate";
  return "moderate";
}

/** Map CAP (Meteoalarm/DWD) severity terms to our buckets */
export function mapSeverityFromCAP(input = "") {
  const s = input.toLowerCase();
  // CAP v1.2 recommended values: Extreme, Severe, Moderate, Minor, Unknown
  if (s.startsWith("extreme")) return "extreme";
  if (s.startsWith("severe")) return "severe";
  if (s.startsWith("moderate")) return "moderate";
  if (s.startsWith("minor")) return "minor";
  return "moderate";
}

/** Map urgency strings to our enum */
export function mapUrgency(input = "") {
  const s = input.toLowerCase();
  if (s.includes("immediate")) return "immediate";
  if (s.includes("expected")) return "expected";
  if (s.includes("future")) return "future";
  if (s.includes("past") || s.includes("unknown")) return "past";
  return "expected";
}

/** Map certainty to our enum */
export function mapCertainty(input = "") {
  const s = input.toLowerCase();
  if (s.includes("observed")) return "observed";
  if (s.includes("likely")) return "likely";
  if (s.includes("possible")) return "possible";
  return "unknown";
}
