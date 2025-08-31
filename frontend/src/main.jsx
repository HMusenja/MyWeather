// src/main.jsx or src/index.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

import { WeatherProvider } from "./context/WeatherContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { useAuth } from "./context/AuthContext";

// 🔑 Wrap WeatherProvider in a component so we can use the hook
function KeyedWeatherProvider({ children }) {
  const { user, initializing } = useAuth();

  // (optional) gate while auth bootstraps
  if (initializing) return null; // or a spinner

  // changing 'key' forces a full remount → fresh state for each user
  return (
    <WeatherProvider key={user?._id || "anon"} defaultCity="Hamburg">
      {children}
    </WeatherProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <KeyedWeatherProvider>
          <App />
        </KeyedWeatherProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

