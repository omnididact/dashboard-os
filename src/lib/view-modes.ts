import type { ModuleInstance } from "@/lib/types";

/**
 * Board + focusable modes.
 * Tasks + Needs share one combined "lists" view (two columns).
 */
export const VIEW_MODE_ORDER = [
  "board",
  "events",
  "weather",
  "commute",
  "lists",
] as const;

export type ViewMode = (typeof VIEW_MODE_ORDER)[number];

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  board: "Board",
  events: "Family",
  weather: "Weather",
  commute: "Commute",
  lists: "Tasks & Needs",
};

/** Siri / Shortcuts aliases → view mode */
export const VIEW_ALIASES: Record<string, ViewMode> = {
  board: "board",
  home: "board",
  dashboard: "board",
  all: "board",
  events: "events",
  family: "events",
  calendar: "events",
  event: "events",
  weather: "weather",
  commute: "commute",
  traffic: "commute",
  drive: "commute",
  map: "commute",
  lists: "lists",
  tasks: "lists",
  task: "lists",
  todo: "lists",
  needs: "lists",
  shopping: "lists",
  house: "lists",
};

export function isViewMode(value: string): value is ViewMode {
  return (VIEW_MODE_ORDER as readonly string[]).includes(value);
}

export function parseViewMode(raw: string | null | undefined): ViewMode | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (VIEW_ALIASES[key]) return VIEW_ALIASES[key];
  if (isViewMode(key)) return key;
  // legacy single-module modes
  if (key === "tasks" || key === "needs") return "lists";
  return null;
}

export function getAvailableModes(instances: ModuleInstance[]): ViewMode[] {
  const present = new Set(instances.map((i) => i.moduleId));
  return VIEW_MODE_ORDER.filter((m) => {
    if (m === "board") return true;
    if (m === "lists") return present.has("tasks") || present.has("needs");
    return present.has(m);
  });
}

export function nextMode(current: ViewMode, modes: ViewMode[]): ViewMode {
  if (modes.length === 0) return "board";
  const idx = modes.indexOf(current);
  if (idx < 0) return modes[0];
  return modes[(idx + 1) % modes.length];
}

export function prevMode(current: ViewMode, modes: ViewMode[]): ViewMode {
  if (modes.length === 0) return "board";
  const idx = modes.indexOf(current);
  if (idx < 0) return modes[0];
  return modes[(idx - 1 + modes.length) % modes.length];
}
