"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplets, Sunrise, Sunset, Wind } from "lucide-react";
import { Sparkline } from "@/components/charts/sparkline";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ModuleWidgetProps } from "@/modules/types";
import { weatherEmoji, weatherLabel } from "@/modules/weather/codes";
import type { WeatherConfig, WeatherPayload } from "@/modules/weather/types";

export function WeatherWidget({
  config,
  density = "compact",
}: ModuleWidgetProps<WeatherConfig>) {
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const focus = density === "focus";

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      lat: String(config.latitude),
      lon: String(config.longitude),
      city: config.city,
      units: config.units,
    });

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/weather?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Weather unavailable");
        const json = (await res.json()) as WeatherPayload;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load weather");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    // Live: refresh every 5 min in focus, 15 min compact
    const mins = focus ? 5 : Math.max(config.refreshMinutes, 15);
    const interval = setInterval(load, mins * 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [config, focus]);

  const sparkValues = useMemo(
    () => (data?.hourly ?? []).map((h) => h.temperature),
    [data]
  );

  if (loading && !data) {
    return (
      <div className="flex h-full flex-col gap-2 p-1">
        <Skeleton className="h-10 w-32 bg-ink/10" />
        <Skeleton className="min-h-0 flex-1 w-full bg-ink/10" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink/50">
        {error}
      </div>
    );
  }

  if (!data) return null;

  if (focus) {
    return <WeatherFocus data={data} />;
  }

  const unit = "°";
  const today = data.daily?.[0];

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/75">
            {data.city}
          </p>
          <div className="mt-0.5 flex items-end gap-2">
            <span className="text-4xl font-semibold leading-none tracking-tight text-ink tabular-nums">
              {Math.round(data.current.temperature)}
              <span className="text-lg text-ink/45">{unit}</span>
            </span>
            <span className="mb-0.5 text-2xl" aria-hidden>
              {weatherEmoji(data.current.weatherCode)}
            </span>
            <div className="mb-0.5 min-w-0">
              <p className="truncate text-xs text-ink/70">
                {weatherLabel(data.current.weatherCode)}
              </p>
              {today && (
                <p className="text-[11px] tabular-nums text-ink/40">
                  H {Math.round(today.tempMax)}° · L {Math.round(today.tempMin)}
                  °
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5 text-[10px] text-ink/55">
          <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-ink/5 px-1.5 py-0.5">
            <Droplets className="size-3 text-cyan-600 dark:text-cyan-300" />
            {data.current.humidity}%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-ink/12 bg-ink/5 px-1.5 py-0.5">
            <Wind className="size-3 text-cyan-600 dark:text-cyan-300" />
            {Math.round(data.current.windSpeed)}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-ink/10 bg-panel p-1">
        <Sparkline
          values={sparkValues}
          className="h-full w-full min-h-[40px]"
        />
      </div>

      <div className="grid grid-cols-3 gap-1">
        {data.daily.slice(0, 3).map((d) => (
          <div
            key={d.date}
            className="rounded-md border border-ink/10 bg-ink/[0.04] px-1 py-1 text-center"
          >
            <p className="text-[9px] uppercase tracking-wide text-ink/40">
              {new Date(d.date).toLocaleDateString([], { weekday: "short" })}
            </p>
            <p className="text-sm leading-none">
              {weatherEmoji(d.weatherCode)}
            </p>
            <p className="text-[10px] tabular-nums text-ink/70">
              {Math.round(d.tempMax)}°
              <span className="text-ink/35">/{Math.round(d.tempMin)}°</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeatherFocus({ data }: { data: WeatherPayload }) {
  const unit = data.units === "celsius" ? "°C" : "°F";
  const today = data.daily[0];
  const hours = data.hourly;
  const now = Date.now();

  const temps = hours.map((h) => h.temperature);
  const tMin = temps.length ? Math.min(...temps) : 0;
  const tMax = temps.length ? Math.max(...temps) : 1;
  const tRange = tMax - tMin || 1;

  const updated = new Date(data.updatedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {/* Live current */}
      <div className="shrink-0 rounded-2xl border border-ink/12 bg-gradient-to-br from-cyan-500/12 via-panel to-panel px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/75">
                {data.city}
              </p>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:text-emerald-200">
                Live · {updated}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-end gap-2.5">
              <span className="text-5xl font-semibold leading-none tabular-nums text-ink sm:text-6xl">
                {Math.round(data.current.temperature)}
                <span className="text-xl text-ink/40 sm:text-2xl">
                  {unit}
                </span>
              </span>
              <span className="mb-1 text-3xl sm:text-4xl" aria-hidden>
                {weatherEmoji(data.current.weatherCode)}
              </span>
              <div className="mb-1 min-w-0">
                <p className="text-base font-medium text-ink/85 sm:text-lg">
                  {weatherLabel(data.current.weatherCode)}
                </p>
                <p className="text-xs text-ink/45 sm:text-sm">
                  Feels {Math.round(data.current.apparentTemperature)}
                  {unit}
                  {today
                    ? ` · H ${Math.round(today.tempMax)}° · L ${Math.round(today.tempMin)}°`
                    : ""}
                </p>
              </div>
            </div>
            {today && (today.sunrise || today.sunset) && (
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-ink/45">
                {today.sunrise && (
                  <span className="inline-flex items-center gap-1">
                    <Sunrise className="size-3.5 text-amber-600 dark:text-amber-300/80" />
                    {new Date(today.sunrise).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {today.sunset && (
                  <span className="inline-flex items-center gap-1">
                    <Sunset className="size-3.5 text-orange-600 dark:text-orange-300/80" />
                    {new Date(today.sunset).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {today.uvIndexMax != null && (
                  <span>UV {Math.round(today.uvIndexMax)}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-1.5 text-xs text-ink/60">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-panel px-2.5 py-1">
              <Droplets className="size-3.5 text-cyan-600 dark:text-cyan-300" />
              {data.current.humidity}%
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-panel px-2.5 py-1">
              <Wind className="size-3.5 text-cyan-600 dark:text-cyan-300" />
              {Math.round(data.current.windSpeed)}
            </span>
          </div>
        </div>
      </div>

      {/* 7-day horizontal */}
      <div className="shrink-0">
        <p className="mb-1.5 px-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ink/40">
          7-day forecast
        </p>
        <div className="grid grid-cols-7 gap-1">
          {data.daily.slice(0, 7).map((d, i) => (
            <div
              key={d.date}
              className={cn(
                "flex flex-col items-center rounded-xl border px-0.5 py-2 text-center",
                i === 0
                  ? "border-cyan-400/35 bg-cyan-500/12"
                  : "border-ink/10 bg-ink/[0.04]"
              )}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-ink/45">
                {new Date(d.date).toLocaleDateString([], { weekday: "short" })}
              </p>
              <p className="my-1 text-lg leading-none sm:text-xl">
                {weatherEmoji(d.weatherCode)}
              </p>
              <p className="text-xs font-semibold tabular-nums text-ink">
                {Math.round(d.tempMax)}°
              </p>
              <p className="text-[10px] tabular-nums text-ink/40">
                {Math.round(d.tempMin)}°
              </p>
              {d.precipProbabilityMax != null && d.precipProbabilityMax > 15 && (
                <p className="mt-0.5 text-[9px] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/80">
                  {Math.round(d.precipProbabilityMax)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Full day hourly — all 24 hours */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-ink/12 bg-panel">
        <div className="flex shrink-0 items-center justify-between border-b border-ink/10 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/75">
            Today · full day forecast
          </p>
          <p className="text-[10px] text-ink/35">
            {hours.length} hours · Open-Meteo
          </p>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="divide-y divide-ink/[0.08] px-1">
            {hours.map((h) => {
              const t = new Date(h.time).getTime();
              const isPast = t < now - 30 * 60 * 1000;
              const isNow = Math.abs(t - now) < 35 * 60 * 1000;
              const barPct = ((h.temperature - tMin) / tRange) * 100;
              return (
                <div
                  key={h.time}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2",
                    isNow && "bg-cyan-500/12",
                    isPast && !isNow && "opacity-45"
                  )}
                >
                  <span
                    className={cn(
                      "w-12 shrink-0 text-xs tabular-nums",
                      isNow ? "font-semibold text-cyan-700 dark:text-cyan-200" : "text-ink/50"
                    )}
                  >
                    {new Date(h.time).toLocaleTimeString([], {
                      hour: "numeric",
                    })}
                  </span>
                  <span className="w-7 text-center text-base leading-none">
                    {weatherEmoji(h.weatherCode)}
                  </span>
                  <span className="w-10 text-sm font-semibold tabular-nums text-ink">
                    {Math.round(h.temperature)}°
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isNow ? "bg-cyan-300" : "bg-cyan-400/65"
                        )}
                        style={{
                          width: `${Math.min(100, Math.max(8, barPct))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-9 text-right text-[10px] tabular-nums text-ink/40">
                    {h.precipProbability != null
                      ? `${Math.round(h.precipProbability)}%`
                      : h.precipitation > 0
                        ? `${h.precipitation.toFixed(1)}"`
                        : "—"}
                  </span>
                  {h.windSpeed != null && (
                    <span className="hidden w-10 text-right text-[10px] text-ink/35 sm:inline">
                      {Math.round(h.windSpeed)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
