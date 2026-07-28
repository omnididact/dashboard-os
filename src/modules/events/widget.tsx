"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModuleWidgetProps } from "@/modules/types";
import type { EventsConfig, FamilyEvent } from "@/modules/events/types";

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(iso: string) {
  const [y, m, day] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, day || 1);
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function countdownParts(eventDate: Date, today: Date) {
  const diffMs =
    startOfLocalDay(eventDate).getTime() - startOfLocalDay(today).getTime();
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (days < 0) return { primary: "—", unit: "", sub: "Past", urgent: false };
  if (days === 0)
    return { primary: "0", unit: "days", sub: "Today", urgent: true };
  if (days === 1)
    return { primary: "1", unit: "day", sub: "Tomorrow", urgent: true };
  if (days < 14)
    return {
      primary: String(days),
      unit: "days",
      sub: days < 7 ? "This week" : "Coming up",
      urgent: days < 7,
    };
  return {
    primary: String(days),
    unit: "days",
    sub: days < 60 ? "Coming up" : `${Math.round(days / 30)} mo away`,
    urgent: false,
  };
}

function formatLongDate(iso: string) {
  return parseDate(iso).toLocaleDateString([], {
    weekday: "short",
    month: "long",
    day: "numeric",
  });
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const EVENT_DOT = ["bg-cyan-400", "bg-violet-400", "bg-amber-400"] as const;

export function EventsWidget({
  config,
  density = "compact",
}: ModuleWidgetProps<EventsConfig>) {
  const today = useMemo(() => new Date(), []);
  const allEvents = config.events ?? [];

  const upcoming = useMemo(() => {
    return [...allEvents]
      .filter((e) => {
        const d = parseDate(e.date);
        return startOfLocalDay(d).getTime() >= startOfLocalDay(today).getTime();
      })
      .sort(
        (a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime()
      );
  }, [allEvents, today]);

  if (density === "focus") {
    return (
      <EventsMonthFocus events={allEvents} upcoming={upcoming} today={today} />
    );
  }

  const list = upcoming.slice(0, 4);
  if (list.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink/45">
        No upcoming family events
      </div>
    );
  }

  const [next, ...rest] = list;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <NextEventCard event={next} featured />
      {rest.length > 0 && (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2">
          {rest.map((event) => (
            <NextEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function NextEventCard({
  event,
  featured = false,
}: {
  event: FamilyEvent;
  featured?: boolean;
}) {
  const { primary, unit, sub, urgent } = countdownParts(
    parseDate(event.date),
    new Date()
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2",
        featured
          ? "min-h-0 flex-[1.4] border-cyan-400/25 bg-gradient-to-br from-cyan-500/15 to-white/[0.03]"
          : "border-ink/10 bg-ink/[0.04]"
      )}
    >
      <div
        className={cn(
          "flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border px-1.5 py-1.5 text-center",
          urgent
            ? "border-cyan-400/30 bg-cyan-400/10"
            : "border-ink/12 bg-panel"
        )}
      >
        <span
          className={cn(
            "font-semibold tabular-nums leading-none text-ink",
            featured ? "text-2xl" : "text-lg"
          )}
        >
          {primary}
        </span>
        {unit && (
          <span className="mt-0.5 text-[9px] uppercase tracking-wide text-ink/45">
            {unit}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-semibold leading-snug text-ink",
            featured ? "text-base sm:text-lg" : "text-sm"
          )}
        >
          {event.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-ink/50">
          {formatLongDate(event.date)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {featured && (
          <p className="mt-0.5 text-[11px] font-medium text-cyan-700 dark:text-cyan-200/80">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Portrait-first month calendar (iOS/Google Calendar pattern):
 * 1. Month nav
 * 2. Full-width 7×6 grid with day numbers + dots (no squeezed titles)
 * 3. Agenda strip below for selected day / upcoming
 */
function EventsMonthFocus({
  events,
  upcoming,
  today,
}: {
  events: FamilyEvent[];
  upcoming: FamilyEvent[];
  today: Date;
}) {
  const todayIso = toIsoDate(today);
  const [cursor, setCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedIso, setSelectedIso] = useState(todayIso);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });

  const byDate = useMemo(() => {
    const map = new Map<string, FamilyEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: Array<{ date: Date | null; iso: string | null }> = [];
    for (let i = 0; i < startPad; i++) out.push({ date: null, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      out.push({ date, iso: toIsoDate(date) });
    }
    while (out.length % 7 !== 0) out.push({ date: null, iso: null });
    // Always 6 rows for stable cell height
    while (out.length < 42) out.push({ date: null, iso: null });
    return out;
  }, [year, month]);

  // When month changes, select today if in month, else first of month
  useEffect(() => {
    const inMonth =
      selectedIso &&
      parseDate(selectedIso).getMonth() === month &&
      parseDate(selectedIso).getFullYear() === year;
    if (inMonth) return;
    if (
      today.getMonth() === month &&
      today.getFullYear() === year
    ) {
      setSelectedIso(todayIso);
    } else {
      setSelectedIso(toIsoDate(new Date(year, month, 1)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const selectedEvents = selectedIso ? byDate.get(selectedIso) ?? [] : [];
  const selectedLabel = selectedIso
    ? parseDate(selectedIso).toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "";

  const monthEvents = upcoming.filter((e) => {
    const d = parseDate(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  // Next 30 days from today (inclusive)
  const next30 = useMemo(() => {
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const endMs = startOfLocalDay(end).getTime();
    const startMs = startOfLocalDay(today).getTime();
    return upcoming.filter((e) => {
      const t = startOfLocalDay(parseDate(e.date)).getTime();
      return t >= startMs && t <= endMs;
    });
  }, [upcoming, today]);

  /**
   * Agenda priority:
   * 1. Events on selected day
   * 2. Events in the visible month
   * 3. Fallback: upcoming within 30 days (so empty months still feel useful)
   */
  const agendaMode: "day" | "month" | "next30" =
    selectedEvents.length > 0
      ? "day"
      : monthEvents.length > 0
        ? "month"
        : "next30";

  const agendaItems =
    agendaMode === "day"
      ? selectedEvents
      : agendaMode === "month"
        ? monthEvents
        : next30;

  const agendaHeading =
    agendaMode === "day"
      ? "Selected day"
      : agendaMode === "month"
        ? "This month"
        : "Next 30 days";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Month navigation — touch-friendly */}
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-0.5">
        <button
          type="button"
          aria-label="Previous month"
          className="flex size-10 items-center justify-center rounded-full border border-ink/12 bg-ink/5 text-ink/80 active:bg-ink/10"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight text-ink">
            {monthLabel}
          </h2>
          <button
            type="button"
            className="text-[11px] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/80"
            onClick={() => {
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
              setSelectedIso(todayIso);
            }}
          >
            Jump to today
          </button>
        </div>
        <button
          type="button"
          aria-label="Next month"
          className="flex size-10 items-center justify-center rounded-full border border-ink/12 bg-ink/5 text-ink/80 active:bg-ink/10"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Calendar card — owns most of the vertical space */}
      <div className="flex min-h-0 flex-[1.65] flex-col rounded-2xl border border-ink/12 bg-panel p-2 sm:p-3">
        <div className="mb-1 grid shrink-0 grid-cols-7">
          {WEEKDAYS.map((d, i) => (
            <div
              key={`${d}-${i}`}
              className="py-1.5 text-center text-[11px] font-medium tracking-wide text-ink/40"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Equal cells: 6 rows × 7 cols — no side panel squeeze */}
        <div
          className="grid min-h-0 flex-1 grid-cols-7 gap-0.5"
          style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}
        >
          {cells.map((cell, i) => {
            if (!cell.date || !cell.iso) {
              return (
                <div
                  key={`e-${i}`}
                  className="rounded-lg bg-transparent"
                  aria-hidden
                />
              );
            }

            const dayEvents = byDate.get(cell.iso) ?? [];
            const isToday = cell.iso === todayIso;
            const isSelected = cell.iso === selectedIso;
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => setSelectedIso(cell.iso!)}
                className={cn(
                  "relative flex min-h-0 flex-col items-center rounded-xl px-0.5 pt-1.5 pb-1 transition-colors",
                  isSelected && "bg-cyan-400/20 ring-1 ring-cyan-400/50",
                  !isSelected && isToday && "bg-ink/[0.06]",
                  !isSelected && !isToday && "hover:bg-ink/[0.04]"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                    isToday && !isSelected && "bg-cyan-400 text-slate-950",
                    isSelected && isToday && "bg-cyan-300 text-slate-950",
                    isSelected && !isToday && "text-cyan-800 dark:text-cyan-100",
                    !isToday && !isSelected && "text-ink/80"
                  )}
                >
                  {cell.date.getDate()}
                </span>
                {/* Event dots only — never squeeze titles into cells */}
                <div className="mt-0.5 flex min-h-[8px] items-center justify-center gap-0.5">
                  {hasEvents &&
                    dayEvents.slice(0, 3).map((e, idx) => (
                      <span
                        key={e.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          EVENT_DOT[idx % EVENT_DOT.length]
                        )}
                        title={e.title}
                      />
                    ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Agenda under calendar — portrait standard */}
      <div className="mt-2 flex min-h-0 flex-1 flex-col rounded-2xl border border-ink/12 bg-panel">
        <div className="flex shrink-0 items-baseline justify-between border-b border-ink/10 px-3 py-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-700/75 dark:text-cyan-300/70">
              {agendaHeading}
            </p>
            <p className="text-sm font-medium text-ink">
              {agendaMode === "day"
                ? selectedLabel
                : agendaMode === "month"
                  ? monthLabel
                  : "Upcoming family events"}
            </p>
          </div>
          <span className="text-xs tabular-nums text-ink/40">
            {agendaItems.length} event{agendaItems.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
          {agendaItems.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-ink/40">
              No events in the next 30 days
            </p>
          )}
          {agendaMode === "next30" && agendaItems.length > 0 && (
            <p className="px-1 pb-1 text-[11px] text-ink/35">
              Nothing scheduled this month — showing the next 30 days
            </p>
          )}
          {agendaItems.map((event) => {
            const { primary, unit, urgent } = countdownParts(
              parseDate(event.date),
              today
            );
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 rounded-xl border border-ink/10 bg-ink/[0.04] px-3 py-2.5"
              >
                <div
                  className={cn(
                    "flex w-12 shrink-0 flex-col items-center rounded-lg border py-1",
                    urgent
                      ? "border-cyan-400/30 bg-cyan-400/10"
                      : "border-ink/12 bg-panel"
                  )}
                >
                  <span className="text-base font-semibold tabular-nums text-ink">
                    {primary}
                  </span>
                  <span className="text-[9px] uppercase text-ink/40">
                    {unit || "—"}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {event.title}
                  </p>
                  <p className="truncate text-xs text-ink/45">
                    {formatLongDate(event.date)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
