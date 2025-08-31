import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

// --- Weather prefs subdoc (no _id) ---
const WeatherPrefsSchema = new Schema(
  {
    units: { type: String, enum: ["metric", "imperial"], default: "metric" },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
    defaultCity: { type: String, default: "" },
    favorites: { type: [String], default: [] }, // city names
    updatedAt: { type: Date, default: Date.now },
    recentSearches: { type: [String], default: [] }, // keep last 8
    lastCity: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    lastActive: { type: Date },

    // 🔹 new: embedded weather prefs
    weatherPrefs: { type: WeatherPrefsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// 🔹 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔹 Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default model("User", userSchema);
