// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { connectDB } from "./src/config/db.js";
import { globalErrorHandler, routeNotFound } from "./src/middleware/errorHandler.js";

// Imported routes
import weatherRoutes from "./src/routes/weatherRoutes.js";
import testRoutes from "./src/routes/testRoutes.js";
import alertsRouter from "./src/routes/alerts.js";
import userRoutes from "./src/routes/userRoutes.js"
import prefsRoutes from "./src/routes/prefs.routes.js";

dotenv.config();
await connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------- Middleware -----------------
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// basic rate limit (safe defaults)
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 100 }));

// ----------------- Routers -----------------
app.use("/api/users",userRoutes)
app.use("/api/weather", weatherRoutes);
app.use("/api/test", testRoutes);
app.use("/api/alerts", alertsRouter);
app.use("/api/prefs", prefsRoutes);

// inline test route
app.get("/api/ping", (req, res) => {
  console.log("✅ /api/ping route hit!");
  res.json({ ok: true, at: new Date().toISOString() });
});

// ----------------- Route Dumper -----------------
function dumpRoutes(stack, prefix = "") {
  stack.forEach((middleware) => {
    if (middleware.route) {
      // Direct route
      const methods = Object.keys(middleware.route.methods)
        .map((m) => m.toUpperCase())
        .join(", ");
      console.log(`${methods.padEnd(7)} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === "router" && middleware.handle.stack) {
      // Mounted router → recurse
      let basePath = middleware.regexp?.source || "";
      basePath = basePath
        .replace("^\\", "/") // start
        .replace("\\/?(?=\\/|$)", "") // trailing
        .replace(/\\\//g, "/"); // slashes

      dumpRoutes(middleware.handle.stack, prefix + basePath);
    }
  });
}



// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(
    `\n🚀 Server is up and running!\n` +
      `👉 Listening on http://localhost:${PORT}\n` +
      `⏱  Started at: ${new Date().toLocaleString()}\n`
  );

  console.log("\n=== Registered Routes ===");
  if (app._router?.stack) {
    dumpRoutes(app._router.stack);
  } else {
    console.log("⚠️ No routes registered yet");
  }
  console.log("==========================\n");
});
// ----------------- Error Handlers -----------------
app.use(routeNotFound);
app.use(globalErrorHandler);


