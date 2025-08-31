// controllers/prefs.controller.js
import createError from "http-errors";
import User from "../model/User.js";

const clampUnique = (arr, n) =>
  Array.from(new Set((arr || []).map((s) => String(s || "").trim()).filter(Boolean))).slice(0, n);

export const getWeatherPrefs = async (req, res, next) => {
  try {
    if (!req.user?._id) return next(createError(401, "Unauthorized"));
    const user = await User.findById(req.user._id).select("weatherPrefs");
    if (!user) return next(createError(404, "User not found"));
    res.json({ ok: true, prefs: user.weatherPrefs || {} });
  } catch (err) {
    next(err);
  }
};

export const updateWeatherPrefs = async (req, res, next) => {
  try {
    if (!req.user?._id) return next(createError(401, "Unauthorized"));

    const { units, theme, favorites, defaultCity, recentSearches, lastCity } = req.body || {};
    const $set = {};
    const errors = [];

    if (units !== undefined) {
      if (!["metric", "imperial"].includes(units)) errors.push({ path: "units", msg: "metric|imperial" });
      else $set["weatherPrefs.units"] = units;
    }
    if (theme !== undefined) {
      if (!["dark", "light"].includes(theme)) errors.push({ path: "theme", msg: "dark|light" });
      else $set["weatherPrefs.theme"] = theme;
    }
    if (favorites !== undefined) {
      if (!Array.isArray(favorites)) errors.push({ path: "favorites", msg: "array of strings" });
      else $set["weatherPrefs.favorites"] = clampUnique(favorites, 20);
    }
    if (defaultCity !== undefined) {
      if (typeof defaultCity !== "string") errors.push({ path: "defaultCity", msg: "string" });
      else $set["weatherPrefs.defaultCity"] = defaultCity.trim();
    }
    if (recentSearches !== undefined) {
      if (!Array.isArray(recentSearches)) errors.push({ path: "recentSearches", msg: "array of strings" });
      else $set["weatherPrefs.recentSearches"] = clampUnique(recentSearches, 8);
    }
    if (lastCity !== undefined) {
      if (typeof lastCity !== "string") errors.push({ path: "lastCity", msg: "string" });
      else $set["weatherPrefs.lastCity"] = lastCity.trim();
    }

    if (errors.length) {
      const err = createError(400, "Invalid preference payload");
      err.details = errors;
      return next(err);
    }
    if (Object.keys($set).length === 0) return next(createError(400, "No updatable fields provided"));

    $set["weatherPrefs.updatedAt"] = new Date();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set },
      { new: true, runValidators: true, context: "query", select: "weatherPrefs" }
    );
    if (!user) return next(createError(404, "User not found"));
    res.json({ ok: true, prefs: user.weatherPrefs });
  } catch (err) {
    next(err);
  }
};
