"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Responsive,
  WidthProvider,
  type Layout,
  type ResponsiveLayouts,
} from "react-grid-layout/legacy";
import { Plus } from "lucide-react";
import { AddModuleDialog } from "@/components/dashboard/add-module-dialog";
import { ClockBar } from "@/components/dashboard/clock-bar";
import { ModuleConfigSheet } from "@/components/dashboard/module-config-sheet";
import { ModuleFocus } from "@/components/dashboard/module-focus";
import { ModuleFrame } from "@/components/dashboard/module-frame";
import { Button } from "@/components/ui/button";
import { useKioskFullscreen } from "@/hooks/use-kiosk-fullscreen";
import {
  gridConfigForOrientation,
  type DashboardPayload,
  type DisplayOrientation,
  type GridItem,
  type ModuleInstance,
  type ScreenRotation,
} from "@/lib/types";
import {
  getAvailableModes,
  nextMode,
  parseViewMode,
  prevMode,
  type ViewMode,
} from "@/lib/view-modes";
import { getModule } from "@/modules/registry";
import { cn } from "@/lib/utils";

import "react-grid-layout/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

type GridShellProps = {
  initialDashboard: DashboardPayload;
  displayName: string;
  performanceMode: boolean;
  orientation?: DisplayOrientation;
  screenRotation?: ScreenRotation;
  initialWallView?: string;
};

function layoutExtent(items: GridItem[]) {
  return items.reduce((acc, l) => Math.max(acc, l.y + l.h), 0);
}

export function GridShell({
  initialDashboard,
  displayName,
  performanceMode,
  orientation = "portrait",
  screenRotation = 0,
  initialWallView = "board",
}: GridShellProps) {
  const searchParams = useSearchParams();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [editMode, setEditMode] = useState(
    () => searchParams.get("edit") === "1"
  );
  const [addOpen, setAddOpen] = useState(false);
  const [configTarget, setConfigTarget] = useState<ModuleInstance | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { isFullscreen, chromeVisible, toggle: toggleFullscreen, exit: exitFullscreen } =
    useKioskFullscreen();

  const gridHostRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(36);
  const [margin, setMargin] = useState<[number, number]>([8, 8]);

  const [liveOrientation, setLiveOrientation] =
    useState<DisplayOrientation>(orientation);
  const [liveRotation, setLiveRotation] =
    useState<ScreenRotation>(screenRotation);
  const [livePerformance, setLivePerformance] = useState(performanceMode);
  const [liveName, setLiveName] = useState(displayName);

  const availableModes = useMemo(
    () => getAvailableModes(dashboard.instances),
    [dashboard.instances]
  );

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const fromUrl = parseViewMode(searchParams.get("view"));
    if (fromUrl && getAvailableModes(initialDashboard.instances).includes(fromUrl)) {
      return fromUrl;
    }
    const fromSettings = parseViewMode(initialWallView);
    if (
      fromSettings &&
      getAvailableModes(initialDashboard.instances).includes(fromSettings)
    ) {
      return fromSettings;
    }
    return "board";
  });

  const setViewModePersist = useCallback(
    (mode: ViewMode) => {
      const modes = getAvailableModes(dashboard.instances);
      const next = modes.includes(mode) ? mode : "board";
      setViewMode(next);
      setEditMode(false);
      try {
        const url = new URL(window.location.href);
        if (next === "board") url.searchParams.delete("view");
        else url.searchParams.set("view", next);
        window.history.replaceState({}, "", url.pathname + url.search);
      } catch {
        // ignore
      }
      void fetch("/api/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ view: next }),
      }).catch(() => undefined);
    },
    [dashboard.instances]
  );

  useEffect(() => {
    setLiveOrientation(orientation);
    setLiveRotation(screenRotation);
    setLivePerformance(performanceMode);
    setLiveName(displayName);
  }, [orientation, screenRotation, performanceMode, displayName]);

  useEffect(() => {
    let cancelled = false;
    // Pi: poll settings; pick up Siri / companion view changes
    async function pullSettings() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled || !json.settings) return;
        const nextOrientation = json.settings.orientation as DisplayOrientation;
        const nextRotation = json.settings.screenRotation as ScreenRotation;
        setLiveOrientation(
          nextOrientation === "landscape" ? "landscape" : "portrait"
        );
        setLiveRotation(
          nextRotation === 90 || nextRotation === 270 ? nextRotation : 0
        );
        setLivePerformance(Boolean(json.settings.performanceMode));
        if (typeof json.settings.displayName === "string") {
          setLiveName(json.settings.displayName);
        }
        const remote = parseViewMode(json.settings.wallView);
        if (remote) {
          const modes = getAvailableModes(dashboard.instances);
          if (modes.includes(remote)) {
            setViewMode((cur) => (cur === remote ? cur : remote));
          }
        }
      } catch {
        // ignore
      }
    }
    const id = setInterval(() => void pullSettings(), 15_000);
    void pullSettings();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [dashboard.instances]);

  useEffect(() => {
    let cancelled = false;
    async function refreshLayout() {
      try {
        const res = await fetch("/api/layout");
        if (!res.ok || cancelled) return;
        setDashboard((await res.json()) as DashboardPayload);
      } catch {
        // ignore
      }
    }
    void refreshLayout();
  }, [liveOrientation]);

  const isPortrait = liveOrientation === "portrait";

  // Quote lives in the header on portrait — hide its grid tile
  const gridInstances = useMemo(() => {
    if (!isPortrait) return dashboard.instances;
    return dashboard.instances.filter((i) => i.moduleId !== "quote");
  }, [dashboard.instances, isPortrait]);

  const layouts = useMemo(() => {
    if (!isPortrait) {
      return {
        lg: dashboard.layouts.lg,
        md: dashboard.layouts.md,
        sm: dashboard.layouts.sm,
      };
    }
    const filter = (items: GridItem[]) =>
      items.filter((l) =>
        gridInstances.some((inst) => inst.i === l.i)
      );
    return {
      lg: filter(dashboard.layouts.lg),
      md: filter(dashboard.layouts.md),
      sm: filter(dashboard.layouts.sm),
    };
  }, [dashboard.layouts, gridInstances, isPortrait]);

  const activeGridConfig = useMemo(
    () => gridConfigForOrientation(liveOrientation),
    [liveOrientation]
  );

  // Fit entire grid into the remaining viewport height (no page scroll)
  useEffect(() => {
    const el = gridHostRef.current;
    if (!el) return;

    const compute = () => {
      const height = el.clientHeight;
      const width = el.clientWidth;
      const extent = Math.max(
        layoutExtent(layouts.lg),
        layoutExtent(layouts.md),
        layoutExtent(layouts.sm),
        1
      );

      const tight = isPortrait || width < 900;
      const m: [number, number] = tight ? [6, 6] : [10, 10];
      setMargin(m);

      // vertical margins: (n+1) * margin between/around rows approx n*margin for RGL
      const verticalChrome = m[1] * (extent + 1);
      const usable = Math.max(120, height - verticalChrome);
      const next = Math.floor(usable / extent);
      setRowHeight(Math.max(isPortrait ? 18 : 24, Math.min(next, 80)));
    };

    compute();
    const ro = new ResizeObserver(() => compute());
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [layouts, isPortrait, isFullscreen, editMode]);

  const toGridItems = (items?: Layout | GridItem[]): GridItem[] =>
    (items ?? []).map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
      static: item.static,
    }));

  const persistLayouts = useCallback(async (nextLayouts: ResponsiveLayouts) => {
    setSaving(true);
    try {
      const payload = {
        lg: toGridItems(nextLayouts.lg),
        md: toGridItems(nextLayouts.md),
        sm: toGridItems(nextLayouts.sm),
      };
      const res = await fetch("/api/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "layouts", layouts: payload }),
      });
      if (res.ok) {
        const next = (await res.json()) as DashboardPayload;
        setDashboard(next);
        setDirty(false);
      }
    } finally {
      setSaving(false);
    }
  }, []);

  const onLayoutChange = useCallback(
    (_current: Layout, allLayouts: ResponsiveLayouts) => {
      if (!editMode) return;
      setDashboard((prev) => ({
        ...prev,
        layouts: {
          lg: toGridItems(allLayouts.lg ?? prev.layouts.lg),
          md: toGridItems(allLayouts.md ?? prev.layouts.md),
          sm: toGridItems(allLayouts.sm ?? prev.layouts.sm),
        },
      }));
      setDirty(true);
    },
    [editMode]
  );

  useEffect(() => {
    if (!editMode || !dirty) return;
    const handle = window.setTimeout(() => {
      void persistLayouts(layouts as ResponsiveLayouts);
    }, 500);
    return () => window.clearTimeout(handle);
  }, [layouts, editMode, dirty, persistLayouts]);

  async function handleAdd(moduleId: string) {
    const res = await fetch("/api/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", moduleId }),
    });
    if (res.ok) {
      setDashboard((await res.json()) as DashboardPayload);
    }
  }

  async function handleRemove(instanceId: string) {
    const res = await fetch("/api/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", instanceId }),
    });
    if (res.ok) {
      setDashboard((await res.json()) as DashboardPayload);
    }
  }

  async function handleSaveConfig(
    instanceId: string,
    config: Record<string, unknown>
  ) {
    const res = await fetch("/api/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "config", instanceId, config }),
    });
    if (res.ok) {
      setDashboard((await res.json()) as DashboardPayload);
    }
  }

  useEffect(() => {
    if (isFullscreen) setEditMode(false);
  }, [isFullscreen]);

  useEffect(() => {
    if (viewMode !== "board") setEditMode(false);
  }, [viewMode]);

  // Keyboard: arrows / numbers / B / Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "Escape") {
        if (viewMode !== "board") {
          e.preventDefault();
          setViewModePersist("board");
          return;
        }
        if (document.fullscreenElement) {
          e.preventDefault();
          void exitFullscreen();
        }
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setViewModePersist(nextMode(viewMode, availableModes));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setViewModePersist(prevMode(viewMode, availableModes));
        return;
      }
      if (e.key === "b" || e.key === "B" || e.key === "0") {
        e.preventDefault();
        setViewModePersist("board");
        return;
      }
      if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key);
        if (availableModes[idx]) {
          e.preventDefault();
          setViewModePersist(availableModes[idx]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, availableModes, setViewModePersist, exitFullscreen]);

  const focusInstance =
    viewMode === "board" || viewMode === "lists"
      ? null
      : dashboard.instances.find((i) => i.moduleId === viewMode) ?? null;

  return (
    <div
      className={cn(
        "dashboard-stage relative flex h-dvh max-h-dvh flex-col overflow-hidden",
        isFullscreen && "kiosk-active bg-background"
      )}
      data-orientation={liveOrientation}
      data-rotation={liveRotation}
      data-kiosk={isFullscreen ? "true" : "false"}
      data-performance={livePerformance ? "true" : "false"}
      data-view={viewMode}
      data-fit="viewport"
    >
      <ClockBar
        editMode={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
        kioskMode
        isFullscreen={isFullscreen}
        chromeVisible={chromeVisible}
        onToggleFullscreen={() => void toggleFullscreen()}
        compact={isPortrait}
        showQuote
        viewMode={viewMode}
        modes={availableModes}
        onViewModeChange={setViewModePersist}
      />

      {editMode && !isFullscreen && viewMode === "board" && (
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-1 md:px-4">
          <p className="text-[11px] text-ink/45">
            {isPortrait ? "Portrait · fits screen" : "Landscape"} · drag headers
            {saving ? " · saving…" : dirty ? " · unsaved…" : ""}
            {" · "}
            ← → switch views
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="border border-ink/12 bg-ink/5"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      )}

      {viewMode !== "board" && (viewMode === "lists" || focusInstance) ? (
        <ModuleFocus
          instance={focusInstance}
          instances={dashboard.instances}
          performanceMode={livePerformance}
          viewMode={viewMode}
          onConfigure={(inst) => setConfigTarget(inst)}
        />
      ) : (
        <div
          ref={gridHostRef}
          className="min-h-0 flex-1 overflow-hidden px-1.5 pb-1.5 md:px-2 md:pb-2"
        >
          <ResponsiveGridLayout
            className="layout h-full"
            layouts={layouts}
            breakpoints={activeGridConfig.breakpoints}
            cols={activeGridConfig.cols}
            rowHeight={rowHeight}
            margin={margin}
            containerPadding={[4, 4]}
            isDraggable={editMode && !isFullscreen}
            isResizable={editMode && !isFullscreen}
            draggableHandle=".drag-handle"
            onLayoutChange={onLayoutChange}
            compactType="vertical"
            useCSSTransforms
            style={{ minHeight: 0, height: "100%" }}
          >
            {gridInstances.map((instance) => {
              const mod = getModule(instance.moduleId);
              if (!mod) {
                return (
                  <div key={instance.i}>
                    <div className="flex h-full items-center justify-center rounded-2xl border border-ink/12 text-sm text-ink/50">
                      Unknown module
                    </div>
                  </div>
                );
              }
              const Icon = mod.icon;
              const Widget = mod.Widget;
              return (
                <div key={instance.i} className="h-full min-h-0">
                  <ModuleFrame
                    title={mod.name}
                    icon={<Icon className="size-3.5 text-cyan-600 dark:text-cyan-300" />}
                    editMode={editMode && !isFullscreen}
                    performanceMode={livePerformance}
                    onConfigure={() => setConfigTarget(instance)}
                    onRemove={() => void handleRemove(instance.i)}
                  >
                    <Widget
                      config={instance.config as never}
                      instanceId={instance.i}
                      editMode={editMode}
                      density="compact"
                    />
                  </ModuleFrame>
                </div>
              );
            })}
          </ResponsiveGridLayout>

          {gridInstances.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md rounded-2xl border border-dashed border-ink/15 bg-ink/[0.04] p-8 text-center">
                <p className="text-lg font-medium text-ink">No modules yet</p>
                <Button
                  type="button"
                  className="mt-4 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  onClick={() => {
                    setEditMode(true);
                    setAddOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add module
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <AddModuleDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
      />
      <ModuleConfigSheet
        open={Boolean(configTarget)}
        onOpenChange={(open) => {
          if (!open) setConfigTarget(null);
        }}
        instanceId={configTarget?.i ?? null}
        moduleId={configTarget?.moduleId ?? null}
        config={configTarget?.config ?? null}
        onSave={handleSaveConfig}
      />
    </div>
  );
}
