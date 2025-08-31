import { MapPin, Thermometer, Droplets, Wind, Sun } from "lucide-react";
import { useWeather } from "../context/WeatherContext";

/* eslint-disable react/prop-types */
const WeatherHero = () => {
  const { state } = useWeather();
  const { data, loading, error } = state;

  const city = data?.city || "—";
  const country = data?.country ? `, ${data.country}` : "";
  const temp = Number.isFinite(data?.temperature) ? `${data.temperature}°` : "—";
  const feels = Number.isFinite(data?.feelsLike) ? `${data.feelsLike}°` : "—";
  const humidity = Number.isFinite(data?.humidity) ? `${data.humidity}%` : "—";
  const wind = Number.isFinite(data?.windSpeed) ? `${data.windSpeed} km/h` : "—";
  const desc = data?.description || (loading ? "Loading…" : "—");
  const iconUrl = data?.icon ? `https://openweathermap.org/img/wn/${data.icon}@4x.png` : null;

  return (
    <section className="relative py-12">
      <div className="container mx-auto px-4">
        {/* Location Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <MapPin className="h-5 w-5 text-white/80" />
            <span className="text-white/80 text-lg">Weather in</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {city}{country}
          </h2>
          {error ? (
            <p className="mt-2 text-red-300 text-sm">{error}</p>
          ) : loading ? (
            <p className="mt-2 text-white/70 text-sm">Loading current conditions…</p>
          ) : null}
        </div>

        {/* Main Weather Card */}
        <div className="weather-hero max-w-4xl mx-auto text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 rounded-full bg-white/10 mb-4">
              {iconUrl ? (
                <img src={iconUrl} alt={desc || "weather icon"} className="h-16 w-16" />
              ) : (
                <Sun className="h-16 w-16 text-yellow-300" />
              )}
            </div>
            <div className="space-y-2">
              <div className="text-6xl md:text-8xl font-light">{temp}</div>
              <div className="text-xl text-white/90 capitalize">{desc}</div>
              {Number.isFinite(data?.feelsLike) && (
                <div className="text-white/70">Feels like {feels}</div>
              )}
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="forecast-card text-center">
              <Thermometer className="h-8 w-8 text-weather-warm mx-auto mb-3" />
              <div className="text-2xl font-semibold text-card-foreground">{feels}</div>
              <div className="text-sm text-muted-foreground">Real Feel</div>
            </div>

            <div className="forecast-card text-center">
              <Droplets className="h-8 w-8 text-weather-cold mx-auto mb-3" />
              <div className="text-2xl font-semibold text-card-foreground">{humidity}</div>
              <div className="text-sm text-muted-foreground">Humidity</div>
            </div>

            <div className="forecast-card text-center">
              <Wind className="h-8 w-8 text-weather-cloudy mx-auto mb-3" />
              <div className="text-2xl font-semibold text-card-foreground">{wind}</div>
              <div className="text-sm text-muted-foreground">Wind Speed</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeatherHero;