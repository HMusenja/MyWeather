import { Router } from "express";
import { getWeatherPrefs, updateWeatherPrefs } from "../controllers/prefs.controller.js";
import checkToken from "../middleware/checkToken.js";

const router = Router();

router.get("/weather", checkToken, getWeatherPrefs);
router.patch("/weather", checkToken, updateWeatherPrefs);

export default router;
