// src/pages/About.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Cloud,
  Heart,
  MapPin,
  Shield,
  Sun,
  Moon,
  RefreshCw,
  Sparkles,
  Github,
  Mail,
} from "lucide-react";

// Adjust paths to match your project
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

export default function About() {
  const tech = useMemo(
    () => [
      { label: "React (Vite)", url: "https://react.dev/" },
      { label: "Express", url: "https://expressjs.com/" },
      { label: "MongoDB", url: "https://www.mongodb.com/" },
      { label: "Axios", url: "https://axios-http.com/" },
      { label: "Tailwind CSS", url: "https://tailwindcss.com/" },
      { label: "shadcn/ui", url: "https://ui.shadcn.com/" },
      { label: "Lucide Icons", url: "https://lucide.dev/" },
    ],
    []
  );

  const features = [
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Smart Search & Location",
      text: "Find weather by city or use your current location with one tap.",
    },
    {
      icon: <RefreshCw className="h-5 w-5" />,
      title: "Live Forecasts",
      text: "Current conditions, hourly preview, and multi-day outlook at a glance.",
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Favorites & Recents",
      text: "Pin favorite cities and quickly jump back to recent searches.",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Light/Dark & Units",
      text: "Toggle °C/°F and light/dark themes to match your preference.",
    },
  ];

  const faqs = [
    {
      q: "Where do you get the weather data?",
      a: "From reputable public APIs aggregated on our backend. Exact providers can vary by region and availability.",
    },
    {
      q: "Do you store my location?",
      a: "Your precise location is used only in-session to fetch local weather when you request it. You can also search by city name.",
    },
    {
      q: "Why do numbers sometimes differ from other apps?",
      a: "Different providers use different models and update cycles. We aim for fast updates with sensible defaults.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs md:text-sm text-foreground">
              <Cloud className="h-4 w-4" />
              <span>About this Weather App</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Accurate forecasts with a clean, modern MERN stack
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Built with React, Express, and MongoDB, styled with Tailwind and
              shadcn/ui. Privacy-respecting, fast, and mobile-first.
            </p>
            <div className="flex items-center gap-3">
              <Button asChild>
                <Link to="/">Check today&apos;s weather</Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Github className="h-4 w-4" /> View code
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-5 gap-6">
        <Card className="p-6 md:col-span-3">
          <h2 className="text-xl font-semibold mb-2">Our mission</h2>
          <p className="text-sm text-muted-foreground">
            Make weather information delightful and actionable. Whether you&apos;re
            planning a trip, timing your run, or deciding what to wear, the app
            gives you crisp, glanceable data without ads or clutter.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <Sun className="h-4 w-4" /> <span>Light</span>
            <span className="text-muted-foreground">/</span>
            <Moon className="h-4 w-4" /> <span>Dark</span>
            <span className="text-muted-foreground">•</span>
            <span>°C / °F</span>
          </div>
        </Card>
        <Card className="p-6 md:col-span-2">
          <h3 className="text-base font-semibold mb-3">At a glance</h3>
          <ul className="space-y-2 text-sm">
            <li>• No TypeScript, clean JSX.</li>
            <li>• Mobile-first, responsive layout.</li>
            <li>• Context-driven state for weather & auth.</li>
            <li>• Toasts/modals for key actions.</li>
          </ul>
        </Card>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-semibold mb-6">Key features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Card key={i} className="p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted">
                {f.icon}
              </div>
              <h3 className="font-medium mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-semibold mb-4">Tech stack</h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-2">
            {tech.map((t) => (
              <a key={t.label} href={t.url} target="_blank" rel="noreferrer">
                <Badge
                  variant="secondary"
                  className="hover:opacity-80 cursor-pointer bg-muted text-foreground border border-border"
                >
                  {t.label}
                </Badge>
              </a>
            ))}
          </div>
        </Card>
      </section>

      {/* Privacy & Data */}
      <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Privacy first</h2>
            <Shield className="h-5 w-5" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            We only request location when you ask for it. Favorites and settings
            are stored to enhance your experience. No selling of personal data.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Data sources</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Weather/alerts come from upstream providers via our backend. See the
            repository README for region-specific notes and rate-limit guidance.
          </p>
        </Card>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-semibold mb-4">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details
              key={i}
              className="group rounded-lg border border-border p-4 group-open:bg-muted"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                <span>{f.q}</span>
                <span className="text-muted-foreground group-open:hidden">+</span>
                <span className="text-muted-foreground hidden group-open:inline">
                  –
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Developer */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-semibold mb-4">About the developer</h2>
        <Card className="p-6 flex flex-col md:flex-row items-center gap-6">
          <img
            src="/avatar-placeholder.png"
            alt="Developer avatar"
            className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Humphrey Musenja</h3>
            <p className="text-sm text-muted-foreground mt-1">
              MERN-stack developer focused on clean UIs, real-time experiences,
              and developer-friendly architecture.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Hamburg, Germany
              </span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 underline"
              >
                <Github className="h-4 w-4" /> GitHub
              </a>
              <Link to="/contact" className="inline-flex items-center gap-1 underline">
                <Mail className="h-4 w-4" /> Contact
              </Link>
            </div>
            <ul className="mt-4 grid sm:grid-cols-3 gap-2 text-xs">
              <li className="rounded-lg border border-border bg-muted p-3">
                <span className="block font-medium">Philosophy</span>
                <span className="text-muted-foreground">
                  Mobile-first, accessible, fast.
                </span>
              </li>
              <li className="rounded-lg border border-border bg-muted p-3">
                <span className="block font-medium">Focus</span>
                <span className="text-muted-foreground">
                  Weather, health, analytics dashboards.
                </span>
              </li>
              <li className="rounded-lg border border-border bg-muted p-3">
                <span className="block font-medium">Stack</span>
                <span className="text-muted-foreground">
                  React • Express • MongoDB • Tailwind
                </span>
              </li>
            </ul>
          </div>
        </Card>
      </section>

      {/* Changelog & Credits */}
      <section className="mx-auto max-w-6xl px-4 py-10 grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Changelog</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <li>
              <div className="font-medium">v1.2.0 • 2025-08-28</div>
              <p className="text-muted-foreground">
                Added country weather alerts poller, improved favorites & recent
                searches.
              </p>
            </li>
            <li>
              <div className="font-medium">v1.1.0 • 2025-08-15</div>
              <p className="text-muted-foreground">
                Introduced Weather News section and refreshed CTA layout.
              </p>
            </li>
            <li>
              <div className="font-medium">v1.0.0 • 2025-08-01</div>
              <p className="text-muted-foreground">
                Initial public release with search, forecast, and theming.
              </p>
            </li>
          </ol>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Credits & data sources</h2>
          <ul className="mt-4 space-y-2 text-sm list-disc pl-5">
            <li>
              Upstream weather & alerts providers accessed via our backend
              aggregator.
            </li>
            <li>
              Icons by Lucide. UI components based on shadcn/ui. Styling with
              Tailwind CSS.
            </li>
            <li>Built with React (Vite), Express, MongoDB, and Axios.</li>
          </ul>
        </Card>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Card className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">
              Have feedback or feature ideas?
            </h3>
            <p className="text-sm text-muted-foreground">
              We&apos;d love to hear from you. Help us make the app even better.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link to="/contact" className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4" /> Contact
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2"
              >
                <Github className="h-4 w-4" /> Open issues
              </a>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer meta */}
      <footer className="mx-auto max-w-6xl px-4 pb-24">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Weather App • Built with ❤️ by the MERN
          stack • <Link className="underline" to="/privacy">Privacy</Link>
        </p>
      </footer>
    </div>
  );
}
