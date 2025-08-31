import { useMemo } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Cloud,
  User as UserIcon,
  MapPin,
  Thermometer,
  Sun,
  Moon,
  Heart,
  Settings,
  LogOut,
  Eye,
  Trash2,
  Star,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useWeather } from "../context/WeatherContext";
import useCityWeatherSnapshots, {
  iconToEmoji,
} from "../hooks/useCityWeatherSnapshots";
import usePersistWeatherPrefs from "../hooks/usePersistWeatherPrefs";
import { useNavigate } from "react-router-dom";

/* ----------------- helpers: tolerant numbers & dates ----------------- */
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const asNum = (v) => {
  if (isNum(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const pickNum = (...vals) => {
  for (const v of vals) {
    const n = asNum(v);
    if (n !== null) return n;
  }
  return null;
};

// parse many possible time fields → ms (avoid strings like "10n")
const parseMs = (val) => {
  if (val == null) return null;
  if (typeof val === "number") return val > 1e12 ? val : val * 1000;
  if (typeof val === "string") {
    // reject icon-like strings (e.g., "10n", "04d")
    if (/[a-z]/i.test(val)) return null;
    const parsed = Date.parse(val);
    if (!Number.isNaN(parsed)) return parsed;
    const n = Number(val);
    if (Number.isFinite(n)) return n > 1e12 ? n : n * 1000;
  }
  return null;
};

const timeMsFrom = (obj = {}) =>
  parseMs(obj.timeISO) ??
  parseMs(obj.localISO) ??
  parseMs(obj.ts) ??
  parseMs(obj.timestamp) ??
  parseMs(obj.timeEpoch) ??
  parseMs(obj.dt_txt) ??
  // only accept numeric dt; ignore strings like "10n"
  (typeof obj.dt === "number" ? parseMs(obj.dt) : null) ??
  null;

const formatHourFrom = (h) => {
  const iso = h?.timeISO || h?.dayISO;
  if (iso) {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "numeric" });
    } catch {}
  }
  const ms = timeMsFrom(h);
  if (ms) return new Date(ms).toLocaleTimeString([], { hour: "numeric" });
  return ""; // don't show "—" for time label
};

const dayLabelFrom = (d, index) => {
  const now = new Date();
  const ms = timeMsFrom(d);
  if (ms) {
    const dd = new Date(ms);
    const isToday = dd.toDateString() === now.toDateString();
    const isTomorrow =
      dd.toDateString() === new Date(now.getTime() + 86400000).toDateString();
    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";
    return dd.toLocaleDateString(undefined, { weekday: "long" });
  }
  // graceful fallback
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return new Date(now.getTime() + index * 86400000).toLocaleDateString(
    undefined,
    { weekday: "long" }
  );
};
/* -------------------------------------------------------------------- */

export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    state,
    fetchWeather,
    toggleUnits,
    toggleTheme,
    toggleFavorite,
    isFavorite,
    clearRecent,
    useMyLocation,
  } = useWeather();
  const { saveUnits, saveTheme, saveFavorites, saveDefaultCity } =
    usePersistWeatherPrefs();

  const unitLabel = state.units === "metric" ? "°C" : "°F";
  const selectedCity = state.city || state?.data?.city || "—";
  const current = state?.data?.current || {};
  const today = state?.data?.today || {};

  const navigate = useNavigate();

  // tolerate different DTO keys for temperatures
  const currentTemp = pickNum(
    current.temp,
    current.temperature,
    current.temp_c,
    current.tempC,
    current.main?.temp
  );
  const feelsLike = pickNum(
    current.feelsLike,
    current.feels_like,
    current.apparentTemp,
    current.apparent_temperature
  );
  const highToday = pickNum(
    today.high,
    today.max,
    today.highTemp,
    today.temp_max,
    today.maxTemp
  );
  const lowToday = pickNum(
    today.low,
    today.min,
    today.lowTemp,
    today.temp_min,
    today.minTemp
  );

  // live lightweight snapshots for favorites (non-selected cards)
  const { data: citySnaps, loading: snapsLoading } = useCityWeatherSnapshots(
    state.favorites,
    state.units
  );

  const displayName = useMemo(() => {
    if (user?.fullName) return user.fullName;
    if (user?.username) return user.username;
    if (user?.email) return String(user.email).split("@")[0];
    return "Guest";
  }, [user]);

  // build 24 points from normalized hourly; skip null temps
  const hourlyChartData = useMemo(() => {
    const arr = Array.isArray(state.forecastHourly) ? state.forecastHourly : [];
    return arr
      .map((h, idx) => {
        const t =
          typeof h.temp === "number"
            ? h.temp
            : typeof h.temperature === "number"
            ? h.temperature
            : h.main && typeof h.main?.temp === "number"
            ? h.main.temp
            : null;
        if (t == null) return null;
        const label = h.timeISO
          ? new Date(h.timeISO).toLocaleTimeString([], { hour: "numeric" })
          : `H+${idx}`;
        return { label, temp: Math.round(t), raw: h };
      })
      .filter(Boolean)
      .slice(0, 24);
  }, [state.forecastHourly]);

  const HourlyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload[0]?.payload || {};
      const cond =
        p.raw?.condition ||
        p.raw?.description ||
        (p.raw?.weather && p.raw.weather[0]?.description) ||
        "";
      return (
        <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow">
          <div className="font-medium">{label}</div>
          <div>
            {p.temp}
            {unitLabel}
          </div>
          {cond ? <div className="text-muted-foreground">{cond}</div> : null}
        </div>
      );
    }
    return null;
  };

  const persistAfterToggleFavorite = (cityName) => {
    const name = (cityName || state.city || state?.data?.city || "").trim();
    if (!name) return;
    const exists = state.favorites.some(
      (c) => c.toLowerCase() === name.toLowerCase()
    );
    const next = exists
      ? state.favorites.filter((c) => c.toLowerCase() !== name.toLowerCase())
      : [
          name,
          ...state.favorites.filter(
            (c) => c.toLowerCase() !== name.toLowerCase()
          ),
        ].slice(0, 20);

    toggleFavorite(); // optimistic
    saveFavorites(next); // persist
  };

  const handleRemoveFavorite = async (city) => {
    persistAfterToggleFavorite(city);
  };

  const hourly = Array.isArray(state.forecastHourly)
    ? state.forecastHourly
    : [];
  const daily = Array.isArray(state.forecastDaily) ? state.forecastDaily : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600">
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header / Navbar with User Profile */}
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-primary/20 backdrop-blur-sm">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  MyWeather Dashboard
                </h1>
                <nav className="flex space-x-4 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() =>
                      // fetchWeather(state.city || state?.data?.city || "Hamburg")
                      navigate("/")
                    }
                  >
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    onClick={useMyLocation}
                  >
                    My Location
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                    onClick={() => clearRecent()}
                  >
                    Clear Recent
                  </Button>
                </nav>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 text-white hover:bg-white/10"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:block">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-white dark:bg-gray-800 text-foreground"
              >
                <DropdownMenuItem onClick={toggleTheme}>
                  <Settings className="mr-2 h-4 w-4" />
                  Toggle Theme
                </DropdownMenuItem>
                {user ? (
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Welcome / User Info Section */}
        <div className="weather-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome back, {displayName}! 👋
              </h2>
              <p className="text-muted-foreground">
                Here's your weather dashboard overview
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 text-sm">
                <Heart className="h-4 w-4 text-primary" />
                <span>{state.favorites?.length || 0} favorites</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>City: {selectedCity}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Thermometer className="h-4 w-4 text-primary" />
                <span>Preferred: {unitLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Favorites Weather Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="weather-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Your Favorite Cities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!state.favorites?.length ? (
                  <div className="text-sm text-muted-foreground">
                    No favorites yet. Search a city and click “Add to
                    favorites”.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {state.favorites.map((name) => {
                      const selected =
                        selectedCity &&
                        name.toLowerCase() ===
                          String(selectedCity).toLowerCase();
                      const snap = citySnaps[name?.toLowerCase?.() || ""];

                      const showTemp = selected
                        ? currentTemp
                        : pickNum(snap?.temp, snap?.temperature);
                      const showCond = selected
                        ? current?.condition ||
                          current?.description ||
                          current?.weather?.[0]?.description ||
                          "—"
                        : snap?.condition || "—";
                      const showIcon = selected
                        ? iconToEmoji(
                            current?.icon,
                            current?.condition ||
                              current?.description ||
                              current?.weather?.[0]?.main
                          )
                        : iconToEmoji(snap?.icon, snap?.condition);
                      return (
                        <div
                          key={name}
                          className={`forecast-card cursor-pointer ${
                            selected ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => fetchWeather(name)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{name}</span>
                              {selected && (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <span className="text-2xl">{showIcon}</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold">
                              {showTemp != null
                                ? Math.round(showTemp)
                                : snapsLoading
                                ? "…"
                                : "—"}
                              {showTemp != null ? unitLabel : ""}
                            </span>
                            <Badge variant="secondary">{showCond}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                              {selected
                                ? "Live"
                                : snap
                                ? "Updated just now"
                                : "Click to load"}
                            </span>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fetchWeather(name);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFavorite(name);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Weather Section */}
            <Card className="weather-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Detailed Forecast — {selectedCity}</span>
                  <div className="flex items-center gap-2">
                    {!isFavorite(selectedCity) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => persistAfterToggleFavorite(selectedCity)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Add to Favorites
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => persistAfterToggleFavorite(selectedCity)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Remove Favorite
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => persistAfterToggleFavorite(selectedCity)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Remove Favorite
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const name = (
                          state.city ||
                          state?.data?.city ||
                          ""
                        ).trim();
                        if (!name) return;

                        saveDefaultCity(name);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Set as Default
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                      Temperature
                    </div>
                    <div className="text-xl font-semibold">
                      {currentTemp != null
                        ? `${Math.round(currentTemp)}${unitLabel}`
                        : "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                      Condition
                    </div>
                    <div className="text-xl font-semibold">
                      {current?.condition ||
                        current?.description ||
                        current?.weather?.[0]?.main ||
                        "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                      High / Low
                    </div>
                    <div className="text-xl font-semibold">
                      {highToday != null && lowToday != null
                        ? `${Math.round(highToday)} / ${Math.round(
                            lowToday
                          )}${unitLabel}`
                        : "—"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground">
                      Feels Like
                    </div>
                    <div className="text-xl font-semibold">
                      {feelsLike != null
                        ? `${Math.round(feelsLike)}${unitLabel}`
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Hourly Forecast */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Hourly Forecast</span>
                  </h4>
                  {state.loading ? (
                    <div className="flex space-x-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="forecast-card text-center min-w-[80px] animate-pulse"
                        >
                          <div className="h-4 bg-muted rounded mb-2" />
                          <div className="h-6 bg-muted rounded mb-2" />
                          <div className="h-4 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : hourly.length ? (
                    <div className="flex space-x-4 overflow-x-auto pb-2">
                      {hourly.map((h, idx) => {
                        const hTemp = pickNum(
                          h.temp,
                          h.temperature,
                          h.main?.temp
                        );
                        return (
                          <div
                            key={idx}
                            className="forecast-card text-center min-w-[80px]"
                          >
                            <p className="text-sm text-muted-foreground">
                              {h.label || formatHourFrom(h)}
                            </p>
                            <div className="text-xl my-2">
                              {iconToEmoji(
                                h.icon,
                                h.condition || h.description
                              )}
                            </div>
                            <p className="font-semibold">
                              {hTemp != null ? Math.round(hTemp) : "—"}
                              {hTemp != null ? unitLabel : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No hourly data available.
                    </div>
                  )}
                </div>
                {/* Hourly Graph */}
                <div className="mt-4">
                  <div className="w-full h-56 sm:h-64">
                    {hourlyChartData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={hourlyChartData}
                          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="tempGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="100%"
                                stopColor="hsl(var(--primary))"
                                stopOpacity={0.05}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            stroke="rgba(255,255,255,0.12)"
                            strokeDasharray="3 3"
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={10}
                            tick={{ fill: "currentColor", fontSize: 12 }}
                          />
                          <YAxis
                            tickFormatter={(v) => `${v}${unitLabel}`}
                            width={40}
                            tick={{ fill: "currentColor", fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            domain={["dataMin - 2", "dataMax + 2"]}
                            allowDecimals={false}
                          />
                          <Tooltip content={<HourlyTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="temp"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#tempGradient)"
                            activeDot={{ r: 4 }}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No data to plot.
                      </div>
                    )}
                  </div>
                </div>

                {/* 5-Day Forecast */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>5-Day Forecast</span>
                  </h4>
                  {state.loading ? (
                    <div className="grid grid-cols-1 gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-pulse"
                        >
                          <div className="h-6 w-40 bg-muted rounded" />
                          <div className="h-6 w-24 bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  ) : daily.length ? (
                    <div className="space-y-2">
                      {daily.slice(0, 5).map((d, index) => {
                        const hi = pickNum(
                          d.high,
                          d.max,
                          d.temp_max,
                          d.maxTemp
                        );
                        const lo = pickNum(d.low, d.min, d.temp_min, d.minTemp);
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">
                                {iconToEmoji(
                                  d.icon,
                                  d.condition || d.description
                                )}
                              </span>
                              <div>
                                <p className="font-medium">
                                  {d.label || dayLabelFrom(d, index)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {d.condition || d.description || ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {hi != null && lo != null
                                  ? `${Math.round(hi)} / ${Math.round(
                                      lo
                                    )}${unitLabel}`
                                  : d.tempRange || "—"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No daily forecast available.
                    </div>
                  )}
                </div>

                {/* Alerts (if any) */}
                {state.alerts?.data?.length ? (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4" />
                      <span>
                        {state.alerts.data.length} active weather alert(s) for{" "}
                        {state.countryCode}
                      </span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preferences */}
            <Card className="weather-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-primary" />
                    <span>Temperature Unit</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">°F</span>
                    <Switch
                      checked={state.units === "metric"}
                      onCheckedChange={() => {
                        const next =
                          state.units === "metric" ? "imperial" : "metric";
                        toggleUnits(); // optimistic UI
                        saveUnits(next); // persist
                      }}
                    />
                    <span className="text-sm">°C</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4 text-primary" />
                    <span>Theme</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="h-4 w-4" />
                    <Switch
                      checked={state.theme === "dark"}
                      onCheckedChange={() => {
                        const next = state.theme === "dark" ? "light" : "dark";
                        toggleTheme(); // optimistic UI
                        saveTheme(next); // persist
                      }}
                    />
                    <Moon className="h-4 w-4" />
                  </div>
                </div>

                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage All Preferences (coming next)
                </Button>
              </CardContent>
            </Card>

            {/* Recent Searches */}
            <Card className="weather-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Recent Searches</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(state.recentSearches || []).map((city) => (
                    <Button
                      key={city}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => fetchWeather(city)}
                    >
                      <MapPin className="h-3 w-3 mr-2" />
                      {city}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Toast-ish */}
        {state.error ? (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
            {state.error}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
