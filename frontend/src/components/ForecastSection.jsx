// src/components/ForecastSection.jsx
import { Cloud, Sun, CloudRain, CloudSnow } from "lucide-react";
import { useWeather } from "../context/WeatherContext";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  Bar,
} from "recharts";

/** Tiny helper: accept unix seconds, Date, ISO string, or pre-labeled text. Returns "Mon", "Tue", ... */
function formatDayLabel(input) {
  try {
    // already a label like "Mon"
    if (
      typeof input === "string" &&
      input.length <= 4 &&
      /^[A-Za-z]+$/.test(input)
    )
      return input;

    let d;
    if (typeof input === "number") {
      // assume unix seconds if it's 10 digits, ms if larger
      d = new Date(input < 2e12 ? input * 1000 : input);
    } else if (input instanceof Date) {
      d = input;
    } else if (typeof input === "string") {
      d = new Date(input);
    } else {
      return "";
    }
    return d.toLocaleDateString(undefined, { weekday: "short" }); // e.g., "Mon"
  } catch {
    return "";
  }
}

function iconFromCode(code) {
  if (!code) return Cloud;
  if (code.startsWith("01")) return Sun;
  if (code.startsWith("09") || code.startsWith("10") || code.startsWith("11"))
    return CloudRain;
  if (code.startsWith("13")) return CloudSnow;
  return Cloud;
}

export default function ForecastSection() {
  const { state } = useWeather();
  const { forecastHourly = [], forecastDaily = [] } = state;

  // Prepare chart data with a temperature band (low baseline + range=high-low)
  const chartData = (forecastDaily || []).map((d) => {
    const low = Number.isFinite(d?.low) ? Number(d.low) : null;
    const high = Number.isFinite(d?.high) ? Number(d.high) : null;
    const range =
      Number.isFinite(low) && Number.isFinite(high) ? high - low : null;

    // Prefer provided label; otherwise compute from dt/date
    const label =
      d?.day ||
      formatDayLabel(d?.dt ?? d?.date ?? d?.timestamp ?? d?.time ?? Date.now());

    return {
      day: label || "",
      low,
      range, // used to fill between low and high
      precip: Number.isFinite(d?.precipitation) ? Number(d.precipitation) : 0, // %
      // keep high if you want to show it in tooltip math
      _high: high,
    };
  });

  const hasDailyChartData =
    chartData.length > 0 &&
    chartData.some((x) => Number.isFinite(x.low) && Number.isFinite(x.range));

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        {/* Hourly Forecast  */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Hourly Forecast
          </h3>
          {forecastHourly.length === 0 ? (
            <p className="text-muted-foreground">No hourly data available.</p>
          ) : (
            <div className="mx-auto max-w-2xl">
              {" "}
              {/* 👈 restrict width on large screens */}
              <ul className="space-y-2">
                {forecastHourly.map((h, idx) => {
                  const Icon = iconFromCode(h.icon);
                  return (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <span className="text-sm text-muted-foreground w-20">
                        {idx === 0 ? "Now" : h.time}
                      </span>
                      <Icon
                        className="h-6 w-6 text-weather-sunny"
                        aria-hidden="true"
                      />
                      <span className="text-lg font-semibold text-foreground">
                        {Number.isFinite(h.temp) ? `${h.temp}°` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Daily Forecast Chart with Temperature Band */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-6">
            Daily Forecast (Chart)
          </h3>
          {!hasDailyChartData ? (
            <p className="text-muted-foreground">
              No daily chart data available.
            </p>
          ) : (
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid
                      stroke="hsl(var(--muted))"
                      strokeOpacity={0.25}
                    />
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      yAxisId="temp"
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `${v}°`}
                    />
                    <YAxis
                      yAxisId="precip"
                      orientation="right"
                      domain={[0, 100]}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                      formatter={(value, name, props) => {
                        if (name === "Precip") return [`${value}%`, "Precip"];
                        if (name === "Temp Range") {
                          // reconstruct low/high for tooltip
                          const low = props?.payload?.low;
                          const high = Number.isFinite(props?.payload?._high)
                            ? props.payload._high
                            : Number.isFinite(low) && Number.isFinite(value)
                            ? low + value
                            : null;
                          return [
                            low != null && high != null
                              ? `${low}°–${high}°`
                              : "—",
                            "Temp Range",
                          ];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: "hsl(var(--muted-foreground))" }}
                    />

                    {/* Invisible baseline: 'low' — needed to stack the band from low upward */}
                    <Area
                      yAxisId="temp"
                      dataKey="low"
                      stackId="band"
                      stroke="transparent"
                      fill="transparent"
                      isAnimationActive={false}
                    />
                    {/* The actual band: range = high - low */}
                    <Area
                      name="Temp Range"
                      yAxisId="temp"
                      dataKey="range"
                      stackId="band"
                      type="monotone"
                      fill="hsl(var(--primary) / 0.25)"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      dot={false}
                    />
                    {/* Precipitation as bars on the right axis */}
                    <Bar
                      name="Precip"
                      yAxisId="precip"
                      dataKey="precip"
                      fill="hsl(var(--accent))"
                      barSize={18}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* 5-Day Forecast List (unchanged aside from label helper used where needed) */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-6">
            5-Day Forecast
          </h3>
          {forecastDaily.length === 0 ? (
            <p className="text-muted-foreground">No daily data available.</p>
          ) : (
            <div className="weather-card">
              <div className="space-y-1">
                {forecastDaily.map((d, idx) => {
                  const Icon = iconFromCode(d.icon);
                  const label =
                    d?.day ||
                    formatDayLabel(d?.dt ?? d?.date ?? d?.timestamp ?? d?.time);
                  return (
                    <div
                      key={idx}
                      className="flex items-center p-4 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-card-foreground">
                          {label || ""}
                        </div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {d.description || "—"}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground hidden sm:block">
                          {Number.isFinite(d.precipitation)
                            ? `${d.precipitation}% chance`
                            : "—"}
                        </div>
                        <Icon className="h-6 w-6 text-weather-sunny" />
                        <div className="flex gap-2 min-w-[80px] text-right">
                          <span className="font-semibold text-card-foreground">
                            {Number.isFinite(d.high) ? `${d.high}°` : "—"}
                          </span>
                          <span className="text-muted-foreground">
                            {Number.isFinite(d.low) ? `${d.low}°` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
