// src/utils/weatherBackground.js
/**
 * Compute day/night from timestamps (fallbacks if missing)
 */
export function isDaytime(nowUnix, sunriseUnix, sunsetUnix) {
  if (!sunriseUnix || !sunsetUnix) return true; // default day
  return nowUnix >= sunriseUnix && nowUnix < sunsetUnix;
}

/**
 * Map OpenWeather "main" (or similar) to a gradient class string.
 * Returns Tailwind utility classes for bg/overlay.
 */
export function getBackgroundClasses({ main = "Clear", isDay = true }) {
  const m = String(main).toLowerCase();

  // Palette dictionary
  const palettes = {
    clear: isDay
      ? "from-sky-200 via-sky-300 to-sky-500"
      : "from-indigo-900 via-slate-900 to-black",
    clouds: isDay
      ? "from-slate-200 via-slate-300 to-slate-500"
      : "from-slate-900 via-gray-900 to-black",
    rain: isDay
      ? "from-cyan-200 via-cyan-400 to-slate-600"
      : "from-slate-900 via-cyan-900 to-black",
    drizzle: isDay
      ? "from-cyan-100 via-cyan-300 to-slate-400"
      : "from-slate-900 via-cyan-950 to-black",
    thunderstorm: isDay
      ? "from-violet-300 via-indigo-500 to-slate-700"
      : "from-indigo-900 via-violet-900 to-black",
    snow: isDay
      ? "from-slate-100 via-blue-100 to-blue-300"
      : "from-slate-800 via-blue-900 to-slate-900",
    mist: isDay
      ? "from-slate-100 via-slate-200 to-slate-300"
      : "from-slate-900 via-gray-900 to-black",
    fog: isDay
      ? "from-slate-100 via-slate-200 to-slate-300"
      : "from-slate-900 via-gray-900 to-black",
    haze: isDay
      ? "from-amber-100 via-rose-100 to-slate-200"
      : "from-slate-900 via-amber-950 to-black",
    dust: isDay
      ? "from-amber-100 via-amber-200 to-slate-300"
      : "from-slate-900 via-amber-950 to-black",
    sand: isDay
      ? "from-amber-100 via-amber-200 to-slate-300"
      : "from-slate-900 via-amber-950 to-black",
    squall: isDay
      ? "from-slate-200 via-blue-300 to-slate-700"
      : "from-slate-900 via-blue-950 to-black",
    tornado: isDay
      ? "from-gray-300 via-slate-600 to-slate-900"
      : "from-black via-slate-950 to-black",
    extreme: isDay
      ? "from-rose-200 via-amber-300 to-orange-500"
      : "from-rose-900 via-amber-900 to-black",
  };

  // Choose key
  let key = "clear";
  if (m.includes("cloud")) key = "clouds";
  else if (m.includes("rain")) key = "rain";
  else if (m.includes("drizzle")) key = "drizzle";
  else if (m.includes("thunder")) key = "thunderstorm";
  else if (m.includes("snow")) key = "snow";
  else if (m.includes("mist") || m.includes("fog")) key = "mist";
  else if (m.includes("haze")) key = "haze";
  else if (m.includes("dust")) key = "dust";
  else if (m.includes("sand")) key = "sand";
  else if (m.includes("squall")) key = "squall";
  else if (m.includes("tornado")) key = "tornado";
  else if (m.includes("extreme")) key = "extreme";
  else if (m.includes("clear")) key = "clear";

  const gradient = palettes[key] || palettes.clear;

  // Base background + animated glow overlay (see CSS below)
  return {
    container: `min-h-screen bg-gradient-to-b ${gradient} transition-colors duration-700`,
    overlay: `pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,white/10,transparent_25%),radial-gradient(circle_at_80%_20%,white/8,transparent_30%)] animate-glow`,
  };
}
