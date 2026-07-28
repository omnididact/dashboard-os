"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CommutePayload } from "@/app/api/commute/route";
import type { ModuleWidgetProps } from "@/modules/types";
import type { CommuteConfig, CommutePersonConfig } from "@/modules/commute/types";
import { cn } from "@/lib/utils";

const CommuteMap = dynamic(
  () => import("@/modules/commute/map").then((m) => m.CommuteMap),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-full w-full rounded-xl bg-ink/10" />
    ),
  }
);

export function CommuteWidget({
  config,
  density = "compact",
}: ModuleWidgetProps<CommuteConfig>) {
  const [data, setData] = useState<CommutePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const focus = density === "focus";

  const peopleById = useMemo(() => {
    return Object.fromEntries(config.people.map((p) => [p.id, p]));
  }, [config.people]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/commute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeLat: config.homeLat,
            homeLon: config.homeLon,
            homeLabel: config.homeLabel,
            people: config.people,
          }),
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Commute unavailable");
        const json = (await res.json()) as CommutePayload;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load commute");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const mins = focus ? 3 : Math.max(config.refreshMinutes, 10);
    const interval = setInterval(load, mins * 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [config, focus]);

  if (loading && !data) {
    return (
      <div className="flex h-full flex-col gap-2 p-1">
        <Skeleton className="h-14 w-full bg-ink/10" />
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
    return <CommuteFocus data={data} peopleById={peopleById} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {data.routes.map((route) => {
          const shortDest =
            route.destLabel.split(",")[0]?.trim() || route.destLabel;
          return (
            <div
              key={route.id}
              className="rounded-lg border border-ink/10 bg-panel px-2.5 py-1.5"
              style={{ borderLeftColor: route.color, borderLeftWidth: 3 }}
            >
              <div className="flex items-baseline justify-between gap-1">
                <p className="text-xs font-semibold text-ink">{route.name}</p>
                <p className="text-lg font-semibold tabular-nums leading-none text-ink">
                  {route.durationText}
                </p>
              </div>
              <p className="mt-0.5 truncate text-[10px] text-ink/45">
                {shortDest} · {route.distanceText}
              </p>
              {route.leaveBy && (
                <p className="mt-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-200/90">
                  Leave by {route.leaveBy}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-center text-[10px] text-ink/30">
        Open Commute for map & traffic-adjusted times
      </p>
    </div>
  );
}

function CommuteFocus({
  data,
  peopleById,
}: {
  data: CommutePayload;
  peopleById: Record<string, CommutePersonConfig>;
}) {
  const updated = new Date(data.updatedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      {/* Status strip */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/12 bg-panel px-3 py-2 text-[11px] text-ink/50">
        <span>
          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald-400" />
          Live · {updated}
        </span>
        <span className="truncate text-ink/40">
          {data.weather.summary ?? data.note}
        </span>
      </div>

      {/* Leave-by + duration cards */}
      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
        {data.routes.map((route) => {
          const person = peopleById[route.id];
          return (
            <div
              key={route.id}
              className="rounded-2xl border border-ink/12 bg-panel px-4 py-3"
              style={{ borderLeftColor: route.color, borderLeftWidth: 4 }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-lg font-semibold text-ink">{route.name}</p>
                <div className="text-right">
                  <p className="text-3xl font-semibold tabular-nums text-ink">
                    {route.durationText}
                  </p>
                  {route.baseDurationText !== route.durationText && (
                    <p className="text-[10px] text-ink/35">
                      free-flow {route.baseDurationText}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-ink/50">{route.destLabel}</p>
              <p className="mt-0.5 text-xs text-ink/40">
                {route.distanceText}
                {person?.workStart
                  ? ` · work ${person.workStart} Mon–Fri`
                  : ""}
              </p>
              {route.leaveBy ? (
                <p className="mt-3 text-xl font-semibold text-cyan-700 dark:text-cyan-200">
                  Leave by {route.leaveBy}
                </p>
              ) : (
                <p className="mt-3 text-xs text-ink/35">
                  Leave-by weekdays only
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                {route.factors.trafficNote && (
                  <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-amber-800 dark:text-amber-100/90">
                    {route.factors.trafficNote}
                  </span>
                )}
                {route.factors.weatherNote && (
                  <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-sky-800 dark:text-sky-100/90">
                    {route.factors.weatherNote}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map always shown in focus */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-ink/12">
        <CommuteMap data={data} />
        <p className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-panel px-2 py-1 text-center text-[10px] text-ink/55 backdrop-blur-sm">
          {data.note}
        </p>
      </div>
    </div>
  );
}
