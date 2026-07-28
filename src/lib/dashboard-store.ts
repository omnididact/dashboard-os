import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  cacheEntries,
  dashboardState,
  settings,
} from "@/lib/db/schema";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type DashboardPayload,
  type GridItem,
  type ModuleInstance,
} from "@/lib/types";

const DEFAULT_INSTANCES: ModuleInstance[] = [
  {
    i: "weather-1",
    moduleId: "weather",
    config: {
      latitude: 42.84552,
      longitude: -73.818871,
      city: "Clifton Park, NY",
      units: "fahrenheit",
      refreshMinutes: 15,
    },
  },
  {
    i: "tasks-1",
    moduleId: "tasks",
    config: {
      showCompleted: false,
      sortBy: "priority",
    },
  },
  {
    i: "commute-1",
    moduleId: "commute",
    config: {
      homeLabel: "Home · Clifton Park",
      homeLat: 42.8630374,
      homeLon: -73.7747623,
      refreshMinutes: 10,
      people: [
        {
          id: "mike",
          name: "Mike",
          destLabel: "5 Enterprise Ave, Clifton Park",
          destLat: 42.8674015,
          destLon: -73.7449753,
          color: "#22d3ee",
          workStart: "08:00",
          bufferMinutes: 10,
        },
        {
          id: "emily",
          name: "Emily",
          destLabel: "Richard Pastrana DDS, Albany",
          destLat: 42.6782962,
          destLon: -73.8445738,
          color: "#a78bfa",
          workStart: "08:00",
          bufferMinutes: 10,
        },
      ],
    },
  },
  {
    i: "needs-1",
    moduleId: "needs",
    config: {
      showCompleted: false,
    },
  },
  {
    i: "events-1",
    moduleId: "events",
    config: {
      events: [
        {
          id: "baby-shower",
          title: "Emily & Jack’s Baby Shower",
          date: "2026-08-02",
          location: "Forno Bistro, Saratoga",
        },
        {
          id: "carmine-grad",
          title: "Carmine’s Graduation",
          date: "2026-12-18",
          location: "",
        },
      ],
    },
  },
  {
    i: "quote-1",
    moduleId: "quote",
    config: {
      refreshHours: 12,
    },
  },
];

/** Default landscape (horizontal) layouts */
const DEFAULT_LAYOUTS_LANDSCAPE: DashboardPayload["layouts"] = {
  lg: [
    { i: "events-1", x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: "weather-1", x: 4, y: 0, w: 4, h: 6, minW: 3, minH: 4 },
    { i: "tasks-1", x: 8, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: "commute-1", x: 0, y: 6, w: 6, h: 8, minW: 3, minH: 5 },
    { i: "needs-1", x: 6, y: 6, w: 3, h: 8, minW: 2, minH: 4 },
    { i: "quote-1", x: 9, y: 6, w: 3, h: 4, minW: 2, minH: 3 },
  ],
  md: [
    { i: "events-1", x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: "weather-1", x: 4, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: "commute-1", x: 0, y: 6, w: 8, h: 7, minW: 3, minH: 5 },
    { i: "tasks-1", x: 0, y: 13, w: 4, h: 6, minW: 2, minH: 4 },
    { i: "needs-1", x: 4, y: 13, w: 4, h: 6, minW: 2, minH: 4 },
  ],
  sm: [
    { i: "events-1", x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: "weather-1", x: 0, y: 6, w: 4, h: 5, minW: 2, minH: 4 },
    { i: "commute-1", x: 0, y: 11, w: 4, h: 7, minW: 2, minH: 5 },
    { i: "tasks-1", x: 0, y: 18, w: 2, h: 6, minW: 2, minH: 4 },
    { i: "needs-1", x: 2, y: 18, w: 2, h: 6, minW: 2, minH: 4 },
  ],
};

/**
 * Portrait layouts — impact order (top → bottom), viewport-fit ~24 rows.
 * Header: clock + quote (not in grid).
 * 1. Family Events  2. Weather  3. Commute  4. Tasks|Needs
 */
const DEFAULT_LAYOUTS_PORTRAIT: DashboardPayload["layouts"] = {
  lg: [
    { i: "events-1", x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: "weather-1", x: 0, y: 6, w: 6, h: 5, minW: 3, minH: 4 },
    { i: "commute-1", x: 0, y: 11, w: 6, h: 7, minW: 3, minH: 5 },
    { i: "tasks-1", x: 0, y: 18, w: 3, h: 6, minW: 2, minH: 4 },
    { i: "needs-1", x: 3, y: 18, w: 3, h: 6, minW: 2, minH: 4 },
  ],
  md: [
    { i: "events-1", x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: "weather-1", x: 0, y: 6, w: 4, h: 5, minW: 2, minH: 4 },
    { i: "commute-1", x: 0, y: 11, w: 4, h: 7, minW: 2, minH: 5 },
    { i: "tasks-1", x: 0, y: 18, w: 2, h: 6, minW: 2, minH: 4 },
    { i: "needs-1", x: 2, y: 18, w: 2, h: 6, minW: 2, minH: 4 },
  ],
  sm: [
    { i: "events-1", x: 0, y: 0, w: 4, h: 6, minW: 2, minH: 4 },
    { i: "weather-1", x: 0, y: 6, w: 4, h: 5, minW: 2, minH: 4 },
    { i: "commute-1", x: 0, y: 11, w: 4, h: 7, minW: 2, minH: 5 },
    { i: "tasks-1", x: 0, y: 18, w: 2, h: 6, minW: 2, minH: 4 },
    { i: "needs-1", x: 2, y: 18, w: 2, h: 6, minW: 2, minH: 4 },
  ],
};

const DEFAULT_LAYOUTS = DEFAULT_LAYOUTS_PORTRAIT;

export function getDefaultDashboard(): DashboardPayload {
  return {
    instances: structuredClone(DEFAULT_INSTANCES),
    layouts: structuredClone(DEFAULT_LAYOUTS),
  };
}

/** Ensure newly shipped modules appear on existing installs */
function mergeMissingModules(payload: DashboardPayload): DashboardPayload {
  const have = new Set(payload.instances.map((i) => i.moduleId));
  const missing = DEFAULT_INSTANCES.filter((i) => !have.has(i.moduleId));
  if (missing.length === 0) return payload;

  let next: DashboardPayload = {
    instances: [...payload.instances],
    layouts: {
      lg: [...payload.layouts.lg],
      md: [...payload.layouts.md],
      sm: [...payload.layouts.sm],
    },
  };

  for (const inst of missing) {
    if (inst.moduleId === "news") continue; // removed feature
    const size =
      inst.moduleId === "commute"
        ? { w: 6, h: 7, minW: 3, minH: 5 }
        : inst.moduleId === "events"
          ? { w: 6, h: 6, minW: 3, minH: 4 }
          : inst.moduleId === "quote"
            ? { w: 6, h: 5, minW: 3, minH: 3 }
            : { w: 3, h: 6, minW: 2, minH: 4 };

    const place = (items: GridItem[], cols: number): GridItem[] => {
      const maxY = items.reduce((acc, l) => Math.max(acc, l.y + l.h), 0);
      return [
        ...items,
        {
          i: inst.i,
          x: 0,
          y: maxY,
          w: Math.min(size.w, cols),
          h: size.h,
          minW: size.minW,
          minH: size.minH,
        },
      ];
    };

    next = {
      instances: [...next.instances, structuredClone(inst)],
      layouts: {
        lg: place(next.layouts.lg, 6),
        md: place(next.layouts.md, 4),
        sm: place(next.layouts.sm, 4),
      },
    };
  }

  return saveDashboard(next);
}

function readDashboardRaw(): DashboardPayload | null {
  const row = db.select().from(dashboardState).limit(1).all()[0];
  if (!row) return null;
  return row.payload as DashboardPayload;
}

export function getDashboard(): DashboardPayload {
  const row = readDashboardRaw();
  if (!row) {
    const payload = {
      ...getDefaultDashboard(),
      layouts: structuredClone(DEFAULT_LAYOUTS_PORTRAIT),
    };
    db.insert(dashboardState)
      .values({ payload, updatedAt: new Date() })
      .run();
    return payload;
  }
  let payload = mergeMissingModules(row);

  // Strip removed news module from existing installs
  if (payload.instances.some((i) => i.moduleId === "news")) {
    payload = saveDashboard({
      instances: payload.instances.filter((i) => i.moduleId !== "news"),
      layouts: {
        lg: payload.layouts.lg.filter(
          (l) =>
            !payload.instances.find(
              (i) => i.i === l.i && i.moduleId === "news"
            )
        ),
        md: payload.layouts.md.filter(
          (l) =>
            !payload.instances.find(
              (i) => i.i === l.i && i.moduleId === "news"
            )
        ),
        sm: payload.layouts.sm.filter(
          (l) =>
            !payload.instances.find(
              (i) => i.i === l.i && i.moduleId === "news"
            )
        ),
      },
    });
  }

  // Ensure commute people have leave-by fields (8:00 default, Mon–Fri)
  payload = {
    ...payload,
    instances: payload.instances.map((inst) => {
      if (inst.moduleId !== "commute") return inst;
      const people = Array.isArray(inst.config.people)
        ? (inst.config.people as Array<Record<string, unknown>>).map((p) => ({
            bufferMinutes: 10,
            ...p,
            // Household work start Mon–Fri
            workStart: "08:00",
          }))
        : inst.config.people;
      return { ...inst, config: { ...inst.config, people } };
    }),
  };

  // Portrait wall: impact order (events top), quote out of grid
  if (getSettings().orientation === "portrait") {
    const maxY = payload.layouts.lg.reduce(
      (acc, l) => Math.max(acc, l.y + l.h),
      0
    );
    const hasQuoteCell = payload.layouts.lg.some((l) =>
      payload.instances.find((i) => i.i === l.i && i.moduleId === "quote")
    );
    const eventsCell = payload.layouts.lg.find((l) =>
      payload.instances.find((i) => i.i === l.i && i.moduleId === "events")
    );
    const eventsNotOnTop = Boolean(eventsCell && eventsCell.y > 0);
    const eventsNotFullWidth = Boolean(eventsCell && eventsCell.w < 6);
    const tasksNeedsStacked = (() => {
      const tasks = payload.layouts.lg.find((l) =>
        payload.instances.find((i) => i.i === l.i && i.moduleId === "tasks")
      );
      const needs = payload.layouts.lg.find((l) =>
        payload.instances.find((i) => i.i === l.i && i.moduleId === "needs")
      );
      return Boolean(tasks && needs && tasks.y !== needs.y);
    })();
    if (
      maxY > 26 ||
      hasQuoteCell ||
      eventsNotOnTop ||
      eventsNotFullWidth ||
      tasksNeedsStacked
    ) {
      payload = applyOrientationLayoutsTo(payload, "portrait");
    }
  }

  return payload;
}

export function saveDashboard(payload: DashboardPayload): DashboardPayload {
  const existing = db.select().from(dashboardState).limit(1).all()[0];
  if (existing) {
    db.update(dashboardState)
      .set({ payload, updatedAt: new Date() })
      .where(eq(dashboardState.id, existing.id))
      .run();
  } else {
    db.insert(dashboardState)
      .values({ payload, updatedAt: new Date() })
      .run();
  }
  return payload;
}

export function updateLayouts(layouts: DashboardPayload["layouts"]) {
  const current = getDashboard();
  return saveDashboard({ ...current, layouts });
}

export function updateInstanceConfig(
  instanceId: string,
  config: Record<string, unknown>
) {
  const current = getDashboard();
  const instances = current.instances.map((inst) =>
    inst.i === instanceId ? { ...inst, config } : inst
  );
  return saveDashboard({ ...current, instances });
}

export function addModule(
  moduleId: string,
  config: Record<string, unknown>,
  size: { w: number; h: number; minW: number; minH: number }
) {
  const current = getDashboard();
  const i = `${moduleId}-${crypto.randomUUID().slice(0, 8)}`;
  const instance: ModuleInstance = { i, moduleId, config };

  const place = (layouts: GridItem[], cols: number): GridItem[] => {
    const maxY = layouts.reduce((acc, l) => Math.max(acc, l.y + l.h), 0);
    return [
      ...layouts,
      {
        i,
        x: 0,
        y: maxY,
        w: Math.min(size.w, cols),
        h: size.h,
        minW: size.minW,
        minH: size.minH,
      },
    ];
  };

  const layouts = {
    lg: place(current.layouts.lg, 12),
    md: place(current.layouts.md, 8),
    sm: place(current.layouts.sm, 4),
  };

  return saveDashboard({
    instances: [...current.instances, instance],
    layouts,
  });
}

export function removeModule(instanceId: string) {
  const current = getDashboard();
  return saveDashboard({
    instances: current.instances.filter((inst) => inst.i !== instanceId),
    layouts: {
      lg: current.layouts.lg.filter((l) => l.i !== instanceId),
      md: current.layouts.md.filter((l) => l.i !== instanceId),
      sm: current.layouts.sm.filter((l) => l.i !== instanceId),
    },
  });
}

export function getSettings(): AppSettings {
  const rows = db.select().from(settings).all();
  if (rows.length === 0) return { ...DEFAULT_SETTINGS };

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const rotationRaw = Number(map.screenRotation ?? 0);
  const screenRotation =
    rotationRaw === 90 || rotationRaw === 270
      ? (rotationRaw as AppSettings["screenRotation"])
      : 0;

  const piEnv = process.env.DASHBOARD_PI === "1";
  const performanceMode =
    piEnv ||
    (map.performanceMode === undefined || map.performanceMode === ""
      ? DEFAULT_SETTINGS.performanceMode
      : map.performanceMode === "true");

  return {
    pinHash: map.pinHash && map.pinHash.length > 0 ? map.pinHash : null,
    displayName: map.displayName || DEFAULT_SETTINGS.displayName,
    refreshSeconds: map.refreshSeconds
      ? Number(map.refreshSeconds)
      : DEFAULT_SETTINGS.refreshSeconds,
    performanceMode,
    accent: (map.accent as AppSettings["accent"]) || DEFAULT_SETTINGS.accent,
    theme: map.theme === "light" ? "light" : "dark",
    orientation:
      map.orientation === "landscape" ? "landscape" : "portrait",
    screenRotation,
    wallView: map.wallView || DEFAULT_SETTINGS.wallView,
    autoRotateSeconds: map.autoRotateSeconds
      ? Number(map.autoRotateSeconds)
      : DEFAULT_SETTINGS.autoRotateSeconds,
  };
}

function applyOrientationLayoutsTo(
  current: DashboardPayload,
  orientation: AppSettings["orientation"]
): DashboardPayload {
  const template =
    orientation === "portrait"
      ? DEFAULT_LAYOUTS_PORTRAIT
      : DEFAULT_LAYOUTS_LANDSCAPE;

  // Quote lives in the header on portrait — keep instance for config, no grid cell
  const gridInstances =
    orientation === "portrait"
      ? current.instances.filter((i) => i.moduleId !== "quote")
      : current.instances;

  const build = (cols: number, templateItems: GridItem[]): GridItem[] => {
    const byModule = new Map<string, GridItem>();
    for (const item of templateItems) {
      const inst = DEFAULT_INSTANCES.find((d) => d.i === item.i);
      const moduleId = inst?.moduleId ?? item.i.split("-")[0];
      byModule.set(moduleId, item);
    }

    const placed: GridItem[] = [];
    let fallbackY = 0;

    for (const inst of gridInstances) {
      const tmpl = byModule.get(inst.moduleId);
      if (tmpl) {
        placed.push({
          i: inst.i,
          x: Math.min(tmpl.x, Math.max(0, cols - 1)),
          y: tmpl.y,
          w: Math.min(tmpl.w, cols),
          h: tmpl.h,
          minW: tmpl.minW,
          minH: tmpl.minH,
        });
        fallbackY = Math.max(fallbackY, tmpl.y + tmpl.h);
      } else {
        const h = 5;
        placed.push({
          i: inst.i,
          x: 0,
          y: fallbackY,
          w: cols,
          h,
          minW: 2,
          minH: 3,
        });
        fallbackY += h;
      }
    }

    return placed;
  };

  const layouts =
    orientation === "portrait"
      ? {
          lg: build(6, template.lg),
          md: build(4, template.md),
          sm: build(4, template.sm),
        }
      : {
          lg: build(12, template.lg),
          md: build(8, template.md),
          sm: build(4, template.sm),
        };

  return saveDashboard({ ...current, layouts });
}

/**
 * Apply orientation templates. Portrait keeps modules inside one viewport:
 * quote stays out of the grid (header), tasks + needs side-by-side.
 */
export function applyOrientationLayouts(
  orientation: AppSettings["orientation"]
): DashboardPayload {
  const row = readDashboardRaw();
  const current = row
    ? mergeMissingModules(row)
    : {
        ...getDefaultDashboard(),
        layouts: structuredClone(DEFAULT_LAYOUTS_PORTRAIT),
      };
  return applyOrientationLayoutsTo(current, orientation);
}

/** Force compact portrait layout (call when wall is vertical / viewport-fit). */
export function ensurePortraitViewportLayout(): DashboardPayload {
  const settings = getSettings();
  if (settings.orientation !== "portrait") {
    return getDashboard();
  }
  return applyOrientationLayouts("portrait");
}

export function saveSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const next = { ...current, ...partial };

  for (const [key, value] of Object.entries(next)) {
    const serialized =
      value === null || value === undefined
        ? ""
        : typeof value === "boolean"
          ? value
            ? "true"
            : "false"
          : String(value);

    const existing = db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .all()[0];

    if (existing) {
      db.update(settings)
        .set({ value: serialized, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .run();
    } else {
      db.insert(settings)
        .values({ key, value: serialized, updatedAt: new Date() })
        .run();
    }
  }

  return next;
}

export function getCache<T>(key: string): T | null {
  const row = db
    .select()
    .from(cacheEntries)
    .where(eq(cacheEntries.key, key))
    .all()[0];

  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    db.delete(cacheEntries).where(eq(cacheEntries.key, key)).run();
    return null;
  }
  return row.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number) {
  const expiresAt = new Date(Date.now() + ttlMs);
  const existing = db
    .select()
    .from(cacheEntries)
    .where(eq(cacheEntries.key, key))
    .all()[0];

  if (existing) {
    db.update(cacheEntries)
      .set({ data, expiresAt })
      .where(eq(cacheEntries.key, key))
      .run();
  } else {
    db.insert(cacheEntries).values({ key, data, expiresAt }).run();
  }
}
