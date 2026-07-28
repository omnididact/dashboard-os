export type Breakpoint = "lg" | "md" | "sm";

export type ModuleCategory =
  | "info"
  | "productivity"
  | "alerts"
  | "media"
  | "system";

export type GridItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
};

export type ModuleInstance = {
  i: string;
  moduleId: string;
  config: Record<string, unknown>;
};

export type DashboardLayouts = Record<Breakpoint, GridItem[]>;

export type DashboardPayload = {
  instances: ModuleInstance[];
  layouts: DashboardLayouts;
};

export type TaskPriority = "low" | "medium" | "high";

export type TaskItem = {
  id: string;
  title: string;
  notes?: string | null;
  dueAt?: string | null;
  priority: TaskPriority;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DisplayOrientation = "portrait" | "landscape";
/** Software rotation for wall monitors when the OS does not rotate the framebuffer */
export type ScreenRotation = 0 | 90 | 270;

export type ThemeMode = "light" | "dark";

export type AppSettings = {
  pinHash: string | null;
  displayName: string;
  refreshSeconds: number;
  performanceMode: boolean;
  accent: "cyan" | "indigo" | "emerald";
  /** Wall / companion color scheme */
  theme: ThemeMode;
  /** Primary layout mode — portrait for vertical wall monitors */
  orientation: DisplayOrientation;
  /** Extra CSS rotation of the wall display (0 = none) */
  screenRotation: ScreenRotation;
  /** Wall focus mode: board or a single module id */
  wallView: string;
  /** Optional auto-rotate seconds between module modes (0 = off) */
  autoRotateSeconds: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  pinHash: null,
  displayName: "Dashboard OS",
  refreshSeconds: 120,
  /** On by default for Raspberry Pi 2GB (no glass blur, no Leaflet map). */
  performanceMode: true,
  accent: "cyan",
  theme: "dark",
  orientation: "portrait",
  screenRotation: 0,
  wallView: "board",
  autoRotateSeconds: 0,
};

/** Landscape (horizontal) column counts */
export const COLS_LANDSCAPE: Record<Breakpoint, number> = {
  lg: 12,
  md: 8,
  sm: 4,
};

/** Portrait (vertical) column counts — fewer cols, taller stacking */
export const COLS_PORTRAIT: Record<Breakpoint, number> = {
  lg: 6,
  md: 4,
  sm: 4,
};

export const COLS = COLS_LANDSCAPE;

export const BREAKPOINTS_LANDSCAPE: Record<Breakpoint, number> = {
  lg: 1200,
  md: 768,
  sm: 0,
};

/** Portrait: treat typical vertical monitor widths (1080, 1200, 1440) as large */
export const BREAKPOINTS_PORTRAIT: Record<Breakpoint, number> = {
  lg: 900,
  md: 600,
  sm: 0,
};

export const BREAKPOINTS = BREAKPOINTS_LANDSCAPE;

export function gridConfigForOrientation(orientation: DisplayOrientation) {
  if (orientation === "portrait") {
    return {
      cols: COLS_PORTRAIT,
      breakpoints: BREAKPOINTS_PORTRAIT,
      rowHeight: 40,
    };
  }
  return {
    cols: COLS_LANDSCAPE,
    breakpoints: BREAKPOINTS_LANDSCAPE,
    rowHeight: 36,
  };
}
