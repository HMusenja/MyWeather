import express from "express";
import {
  getWeatherByCity,
  getWeatherByCoords,
  getForecastByCity,
  getForecastByCoords,
} from "../controllers/weatherController.js";

const router = express.Router();



// Weather lookup
router.get("/coords", getWeatherByCoords);
router.get("/:city", getWeatherByCity);

// forecast
router.get("/forecast/coords", getForecastByCoords);
router.get("/forecast/:city", getForecastByCity);

export default router;
