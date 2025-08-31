import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Heart, Thermometer, Moon, Sun } from "lucide-react";
import { useWeather } from "../context/WeatherContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const CTASection = () => {

  const { state, toggleUnits, toggleTheme, toggleFavorite, isFavorite } = useWeather();
    const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentCity = state?.city || state?.data?.city || "";
  const fav = isFavorite(currentCity);
  const isMetric = state.units === "metric";
  const isDark = state.theme === "dark";

  const handleFavorite = () => {
    if (!currentCity) return;
    if (!user) {
      // Send them to a protected route with a clear message
      navigate("/dashboard", {
        replace: false,
        state: {
          authMessage: `You need to login or register to save ${currentCity} to your favorites.`,
          // optionally keep track of where they came from
          from: location.pathname,
        },
      });
      return;
    }
    toggleFavorite();
  };


  return (
    <section className="py-12 bg-white/5 dark:bg-black/10 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Personalization Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">Personalize Your Experience</h3>
            <p className="text-muted-foreground">Customize settings and save your favorite locations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Save to Favorites */}
            <div className="weather-card text-center">
              <div className="p-4 rounded-full bg-red-500/10 w-fit mx-auto mb-4">
                <Heart className={`h-8 w-8 ${fav ? "text-red-400 fill-red-400" : "text-red-400"}`} />
              </div>
             <h4 className="text-xl font-semibold text-card-foreground mb-2">
    {fav ? "In Favorites" : "Save to Favorites"}
  </h4>
              <p className="text-muted-foreground mb-6">
                {currentCity ? (
                  <>
                    Save <span className="font-semibold">{currentCity}</span> and other cities to quickly
                    check their weather anytime
                  </>
                ) : (
                  "Search a city and save it to your favorites"
                )}
              </p>
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                disabled={!currentCity}
                onClick={handleFavorite}
              >
                <Heart className={`h-4 w-4 mr-2 ${fav ? "fill-current" : ""}`} />
                {fav ? "Remove from Favorites" : "Add to Favorites"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {user ? "Favorites sync to your account" : "Sign in to save favorites"}
              </p>
            </div>

            {/* Settings Panel */}
            <div className="weather-card">
              <h4 className="text-xl font-semibold text-card-foreground mb-6">Preferences</h4>
              <div className="space-y-6">
                {/* Temperature Unit Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-weather-warm/10">
                      <Thermometer className="h-5 w-5 text-weather-warm" />
                    </div>
                    <div>
                      <div className="font-medium text-card-foreground">Temperature Unit</div>
                      <div className="text-sm text-muted-foreground">°C / °F</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">°F</span>
                    <Switch checked={isMetric} onCheckedChange={toggleUnits} />
                    <span className="text-sm text-card-foreground">°C</span>
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      {isDark ? <Moon className="h-5 w-5 text-accent" /> : <Sun className="h-5 w-5 text-accent" />}
                    </div>
                    <div>
                      <div className="font-medium text-card-foreground">Theme</div>
                      <div className="text-sm text-muted-foreground">Light / Dark mode</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    <Switch checked={isDark} onCheckedChange={toggleTheme} />
                    <Moon className="h-4 w-4 text-card-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;