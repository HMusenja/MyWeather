// src/components/SearchSection.jsx
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, MapPin, Clock, LocateFixed, Trash2 } from "lucide-react";
import { useWeather } from "../context/WeatherContext";

const quickCities = ["London", "New York", "Tokyo", "Paris", "Sydney"];

export default function SearchSection() {
  const { state, fetchWeather, clearRecent, useMyLocation } = useWeather();
  const { loading, error, recentSearches } = state;

  const [city, setCity] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = city.trim();
    if (!q) {
      setLocalError("Please enter a city name.");
      return;
    }
    setLocalError("");
    fetchWeather(q);
  };

  const handleQuickCity = (c) => {
    setCity(c);
    fetchWeather(c);
  };

  const handlePick = (c) => {
    const q = (c || "").trim();
    if (!q) return;
    setCity(q);
    fetchWeather(q);
  };

  return (
    <section className="py-12 ">
      <div className="container mx-auto px-4">
        <div className="mx-auto w-full max-w-3xl p-8 rounded-2xl 
                 bg-card/80 backdrop-blur-sm shadow-[var(--shadow-card)] 
                 border border-border/50">
          {/* Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Search Any City</h3>
            <p className="text-muted-foreground">
              Get instant weather updates for any location worldwide
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative">
            <label htmlFor="city-input" className="sr-only">
              City name
            </label>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="city-input"
                  type="text"
                  inputMode="search"
                  placeholder="Enter city name..."
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (localError) setLocalError("");
                  }}
                  aria-label="City name"
                  className="pl-10 pr-4 py-6 text-base bg-card text-foreground border-border placeholder:text-muted-foreground"
                />
              </div>

              <Button
                size="lg"
                className="px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                type="submit"
                disabled={!city.trim() || loading}
                aria-busy={loading}
              >
                <Search className={`h-5 w-5 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Searching…" : "Search"}
              </Button>

              {/* Use my location */}
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="px-4 border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => useMyLocation()}
                disabled={loading}
                aria-busy={loading}
                title="Use my current location"
              >
                <LocateFixed className="h-5 w-5 mr-2" />
                Use my location
              </Button>
            </div>

            {/* Inline status / errors */}
            <div className="mt-2 min-h-[1.5rem]">
              {localError ? (
                <p className="text-sm text-destructive">{localError}</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Tip: Try “Hamburg”, “Berlin”, or “Accra”.</p>
              )}
            </div>

            {/* Autocomplete (placeholder) */}
            <div className="absolute top-full left-0 right-0 mt-2 hidden">
              <div className="rounded-lg border border-border bg-card shadow-sm">
                <div className="space-y-2 p-2">
                  <button
                    type="button"
                    className="flex w-full items-center space-x-3 rounded-md p-3 hover:bg-muted transition"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-card-foreground">Hamburg, Germany</div>
                      <div className="text-sm text-muted-foreground">Northern Germany</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center space-x-3 rounded-md p-3 hover:bg-muted transition"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="text-left">
                      <div className="font-medium text-card-foreground">Hamburg, USA</div>
                      <div className="text-sm text-muted-foreground">New York, United States</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Quick City Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {quickCities.map((c) => (
              <Button
                key={c}
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                disabled={loading}
                onClick={() => handleQuickCity(c)}
                aria-label={`Search weather for ${c}`}
              >
                {c}
              </Button>
            ))}
          </div>

          {/* Recent Searches */}
          {recentSearches?.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recent searches</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:bg-muted"
                  onClick={clearRecent}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Clear
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {recentSearches.map((c) => (
                  <Button
                    key={c}
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-accent hover:text-accent-foreground"
                    disabled={loading}
                    onClick={() => handlePick(c)}
                    aria-label={`Search weather for ${c}`}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

