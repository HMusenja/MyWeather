import express from "express";
const router = express.Router();

// Quick ping
router.get("/ping", (req, res) => {
  console.log("[testRoutes] /ping hit");
  res.json({ ok: true, who: "testRoutes" });
});

// Echo test
router.get("/echo/:word", (req, res) => {
  console.log("[testRoutes] /echo/:word hit", req.params);
  res.json({ echo: req.params.word });
});

export default router;
