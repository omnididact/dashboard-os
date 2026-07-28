"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  CloudSun,
  Home,
  LayoutGrid,
  ListTodo,
  Monitor,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings2,
  Shield,
  Smartphone,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import type { DashboardPayload, TaskItem, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  VIEW_MODE_LABELS,
  getAvailableModes,
  type ViewMode,
} from "@/lib/view-modes";
import { getModule, getModules } from "@/modules/registry";
import type { WeatherPayload } from "@/modules/weather/types";
import { weatherEmoji, weatherLabel } from "@/modules/weather/codes";

type Tab = "home" | "tasks" | "modules" | "settings";

type PublicSettings = {
  displayName: string;
  refreshSeconds: number;
  performanceMode: boolean;
  accent: "cyan" | "indigo" | "emerald";
  orientation: "portrait" | "landscape";
  screenRotation: 0 | 90 | 270;
  wallView?: string;
  hasPin: boolean;
};

const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "modules", label: "Modules", icon: LayoutGrid },
  { id: "settings", label: "Settings", icon: Settings2 },
];

type CompanionShellProps = {
  initialDashboard: DashboardPayload;
  initialTasks: TaskItem[];
  initialSettings: PublicSettings;
  initialAuthenticated: boolean;
};

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
  timeoutMs = 12_000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function CompanionShell({
  initialDashboard,
  initialTasks,
  initialSettings,
  initialAuthenticated,
}: CompanionShellProps) {
  const [tab, setTab] = useState<Tab>("home");
  const [dashboard, setDashboard] =
    useState<DashboardPayload>(initialDashboard);
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [settings, setSettings] = useState<PublicSettings>(initialSettings);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draftTask, setDraftTask] = useState("");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [editingInstance, setEditingInstance] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<Record<string, unknown>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  const loadFeeds = useCallback(async (layout: DashboardPayload) => {
    const weatherInst = layout.instances.find((i) => i.moduleId === "weather");
    if (!weatherInst) return;
    try {
      const cfg = weatherInst.config as {
        latitude: number;
        longitude: number;
        city: string;
        units: string;
      };
      const params = new URLSearchParams({
        lat: String(cfg.latitude),
        lon: String(cfg.longitude),
        city: cfg.city,
        units: cfg.units,
      });
      const data = await fetchJson<WeatherPayload>(
        `/api/weather?${params}`,
        undefined,
        10_000
      );
      setWeather(data);
    } catch {
      // weather optional on companion home
    }
  }, []);

  const loadAll = useCallback(
    async (soft = false) => {
      if (soft) setRefreshing(true);
      try {
        const [layout, taskJson, settingsJson] = await Promise.all([
          fetchJson<DashboardPayload>("/api/layout"),
          fetchJson<{ tasks: TaskItem[] }>("/api/tasks"),
          fetchJson<{
            settings: PublicSettings;
            authenticated: boolean;
          }>("/api/settings"),
        ]);

        setDashboard(layout);
        setTasks(taskJson.tasks);
        setSettings(settingsJson.settings);
        setAuthenticated(settingsJson.authenticated);
        setLoadError(null);

        // Feeds never block the main UI
        void loadFeeds(layout);
      } catch {
        setLoadError("Could not reach the dashboard server");
        if (!soft) toast.error("Could not refresh companion data");
      } finally {
        setRefreshing(false);
      }
    },
    [loadFeeds]
  );

  useEffect(() => {
    // Hydrated with server data — only refresh feeds + poll
    void loadFeeds(initialDashboard);
    const id = setInterval(() => void loadAll(true), 45_000);
    return () => clearInterval(id);
  }, [initialDashboard, loadAll, loadFeeds]);

  async function login() {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", pin }),
    });
    if (!res.ok) {
      toast.error("Invalid PIN");
      return;
    }
    setPin("");
    toast.success("Unlocked");
    await loadAll();
  }

  async function saveSettings(patch: Partial<PublicSettings>) {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", ...patch }),
    });
    if (!res.ok) {
      toast.error("Could not save settings");
      return;
    }
    const json = await res.json();
    setSettings(json.settings);
    toast.success("Saved");
  }

  async function savePin() {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setPin", pin: newPin.trim() || null }),
    });
    if (!res.ok) {
      toast.error("Could not update PIN");
      return;
    }
    setNewPin("");
    toast.success(newPin.trim() ? "PIN updated" : "PIN removed");
    await loadAll();
  }

  async function addTask() {
    const title = draftTask.trim();
    if (!title) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priority: "medium",
        dueAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      toast.error("Could not add task");
      return;
    }
    setDraftTask("");
    toast.success("Task added — wall display will pick it up");
    await loadAll(true);
  }

  async function toggleTask(task: TaskItem) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (res.ok) await loadAll(true);
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Task removed");
      await loadAll(true);
    }
  }

  async function setTaskPriority(task: TaskItem, priority: TaskPriority) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    if (res.ok) await loadAll(true);
  }

  async function addModule(moduleId: string) {
    const res = await fetch("/api/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", moduleId }),
    });
    if (!res.ok) {
      toast.error("Could not add module");
      return;
    }
    toast.success("Module added to wall display");
    await loadAll(true);
  }

  async function removeModule(instanceId: string) {
    const res = await fetch("/api/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", instanceId }),
    });
    if (!res.ok) {
      toast.error("Could not remove module");
      return;
    }
    toast.success("Module removed from wall");
    setEditingInstance(null);
    await loadAll(true);
  }

  async function saveInstanceConfig() {
    if (!editingInstance) return;
    setSavingConfig(true);
    try {
      const res = await fetch("/api/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "config",
          instanceId: editingInstance,
          config: configDraft,
        }),
      });
      if (!res.ok) {
        toast.error("Could not save module config");
        return;
      }
      toast.success("Saved — wall display will update on next refresh");
      setEditingInstance(null);
      await loadAll(true);
    } finally {
      setSavingConfig(false);
    }
  }

  const openTasks = tasks.filter((t) => !t.completed);

  if (settings.hasPin && !authenticated) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-8">
        <div className="text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/80">
            Dashboard OS
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Companion</h1>
          <p className="mt-1 text-sm text-ink/50">
            Enter your PIN to control the wall display
          </p>
        </div>
        <Card className="border-ink/12 bg-ink/[0.04] text-ink backdrop-blur-xl">
          <CardContent className="space-y-3 pt-6">
            <div className="space-y-2">
              <Label htmlFor="companion-pin">PIN</Label>
              <Input
                id="companion-pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void login();
                }}
                className="h-11 border-ink/12 bg-panel text-base"
              />
            </div>
            <Button
              className="h-11 w-full bg-cyan-400 text-base text-slate-950 hover:bg-cyan-300"
              onClick={() => void login()}
            >
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/80">
              Companion
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              {settings?.displayName ?? "Dashboard OS"}
            </h1>
            <p className="mt-0.5 text-xs text-ink/45">
              Control your wall display from this phone
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-ink/70"
              onClick={() => void loadAll(true)}
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
              />
            </Button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-ink/70"
              )}
              aria-label="Open wall dashboard"
            >
              <Monitor className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-4 px-4 py-4">
        {loadError && (
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {loadError}. Pull to refresh or tap the refresh icon.
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => void loadAll(true)}
            >
              Retry
            </button>
          </div>
        )}

        {tab === "home" && (
          <HomeTab
            weather={weather}
            openTaskCount={openTasks.length}
            moduleCount={dashboard.instances.filter((i) => i.moduleId !== "quote").length}
            tasks={openTasks.slice(0, 4)}
            wallView={settings.wallView ?? "board"}
            modes={getAvailableModes(dashboard.instances)}
            onWallView={async (mode) => {
              const res = await fetch("/api/view", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ view: mode }),
              });
              if (res.ok) {
                setSettings({ ...settings, wallView: mode });
                toast.success(`Wall → ${VIEW_MODE_LABELS[mode]}`);
              } else {
                toast.error("Could not change wall view");
              }
            }}
            onToggleTask={(t) => void toggleTask(t)}
            onGoTasks={() => setTab("tasks")}
            onGoModules={() => setTab("modules")}
          />
        )}

        {tab === "tasks" && (
          <TasksTab
            tasks={tasks}
            draft={draftTask}
            onDraftChange={setDraftTask}
            onAdd={() => void addTask()}
            onToggle={(t) => void toggleTask(t)}
            onDelete={(id) => void deleteTask(id)}
            onPriority={(t, p) => void setTaskPriority(t, p)}
          />
        )}

        {tab === "modules" && (
          <ModulesTab
            dashboard={dashboard}
            editingInstance={editingInstance}
            configDraft={configDraft}
            savingConfig={savingConfig}
            onEdit={(instanceId, config) => {
              setEditingInstance(instanceId);
              setConfigDraft(config);
            }}
            onCancelEdit={() => setEditingInstance(null)}
            onConfigChange={setConfigDraft}
            onSaveConfig={() => void saveInstanceConfig()}
            onRemove={(id) => void removeModule(id)}
            onAdd={(moduleId) => void addModule(moduleId)}
          />
        )}

        {tab === "settings" && (
          <SettingsTab
            settings={settings}
            newPin={newPin}
            onNewPinChange={setNewPin}
            onSaveSettings={(patch) => void saveSettings(patch)}
            onSettingsLocal={(next) => setSettings(next)}
            onSavePin={() => void savePin()}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/12 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition",
                  active
                    ? "bg-cyan-400/15 text-cyan-700 dark:text-cyan-200"
                    : "text-ink/45 hover:bg-ink/5 hover:text-ink/70"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeTab({
  weather,
  openTaskCount,
  moduleCount,
  tasks,
  wallView,
  modes,
  onWallView,
  onToggleTask,
  onGoTasks,
  onGoModules,
}: {
  weather: WeatherPayload | null;
  openTaskCount: number;
  moduleCount: number;
  tasks: TaskItem[];
  wallView: string;
  modes: ViewMode[];
  onWallView: (mode: ViewMode) => void;
  onToggleTask: (task: TaskItem) => void;
  onGoTasks: () => void;
  onGoModules: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-ink/12 bg-gradient-to-br from-cyan-500/10 via-white/[0.04] to-indigo-500/10 text-ink backdrop-blur-xl">
        <CardContent className="space-y-3 pt-5">
          {weather ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/80">
                    {weather.city}
                  </p>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="text-5xl font-semibold tabular-nums">
                      {Math.round(weather.current.temperature)}°
                    </span>
                    <span className="mb-1 text-3xl">
                      {weatherEmoji(weather.current.weatherCode)}
                    </span>
                  </div>
                  <p className="text-sm text-ink/65">
                    {weatherLabel(weather.current.weatherCode)}
                  </p>
                </div>
                <CloudSun className="size-8 text-cyan-600 dark:text-cyan-700/75 dark:text-cyan-300/70" />
              </div>
            </>
          ) : (
            <p className="text-sm text-ink/50">Weather not on dashboard yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Wall view</CardTitle>
          <CardDescription>
            Fullscreen a module on the wall (works with Siri Shortcuts too)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onWallView(mode)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm font-medium",
                wallView === mode
                  ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-800 dark:text-cyan-100"
                  : "border-ink/12 bg-panel text-ink/80"
              )}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <StatChip label="Open tasks" value={String(openTaskCount)} onClick={onGoTasks} />
        <StatChip label="Modules" value={String(moduleCount)} onClick={onGoModules} />
      </div>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today&apos;s tasks</CardTitle>
            <Button size="sm" variant="ghost" className="text-cyan-600 dark:text-cyan-300" onClick={onGoTasks}>
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {tasks.length === 0 && (
            <p className="py-4 text-center text-sm text-ink/45">No open tasks</p>
          )}
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onToggleTask(task)}
              className="flex w-full items-center gap-3 rounded-xl border border-ink/10 bg-panel px-3 py-3 text-left"
            >
              <Circle className="size-5 shrink-0 text-ink/35" />
              <span className="min-w-0 flex-1 text-sm font-medium">{task.title}</span>
              <Badge className="capitalize border-ink/12 bg-ink/5 text-ink/60">
                {task.priority}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatChip({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="rounded-2xl border border-ink/12 bg-ink/[0.04] px-3 py-3 text-left"
    >
      <p className="text-2xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-ink/45">{label}</p>
    </Comp>
  );
}

function TasksTab({
  tasks,
  draft,
  onDraftChange,
  onAdd,
  onToggle,
  onDelete,
  onPriority,
}: {
  tasks: TaskItem[];
  draft: string;
  onDraftChange: (v: string) => void;
  onAdd: () => void;
  onToggle: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onPriority: (task: TaskItem, priority: TaskPriority) => void;
}) {
  const sorted = useMemo(() => {
    const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return rank[a.priority] - rank[b.priority];
    });
  }, [tasks]);

  return (
    <div className="space-y-4">
      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add task</CardTitle>
          <CardDescription>
            Changes sync to the wall display automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAdd();
            }}
          >
            <Input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="What needs doing?"
              className="h-11 border-ink/12 bg-panel text-base"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            >
              <Plus className="size-5" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {sorted.map((task) => (
          <div
            key={task.id}
            className={cn(
              "rounded-2xl border px-3 py-3",
              task.completed
                ? "border-ink/8 bg-ink/[0.03] opacity-70"
                : "border-ink/12 bg-ink/[0.04]"
            )}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onToggle(task)}
                className="mt-0.5 text-ink/70"
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
              >
                {task.completed ? (
                  <CheckCircle2 className="size-5 text-emerald-300" />
                ) : (
                  <Circle className="size-5" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium text-ink",
                    task.completed && "line-through text-ink/50"
                  )}
                >
                  {task.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(["high", "medium", "low"] as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onPriority(task, p)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] capitalize",
                        task.priority === p
                          ? p === "high"
                            ? "bg-rose-500/20 text-rose-200"
                            : p === "medium"
                              ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-200"
                              : "bg-ink/10 text-ink/70"
                          : "bg-panel text-ink/35"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="text-ink/35 hover:text-rose-300"
                aria-label="Delete task"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="py-10 text-center text-sm text-ink/45">No tasks yet</p>
        )}
      </div>
    </div>
  );
}

function ModulesTab({
  dashboard,
  editingInstance,
  configDraft,
  savingConfig,
  onEdit,
  onCancelEdit,
  onConfigChange,
  onSaveConfig,
  onRemove,
  onAdd,
}: {
  dashboard: DashboardPayload;
  editingInstance: string | null;
  configDraft: Record<string, unknown>;
  savingConfig: boolean;
  onEdit: (instanceId: string, config: Record<string, unknown>) => void;
  onCancelEdit: () => void;
  onConfigChange: (config: Record<string, unknown>) => void;
  onSaveConfig: () => void;
  onRemove: (instanceId: string) => void;
  onAdd: (moduleId: string) => void;
}) {
  const catalog = getModules();
  const editing = dashboard.instances.find((i) => i.i === editingInstance);
  const editingMod = editing ? getModule(editing.moduleId) : null;

  if (editing && editingMod) {
    const ConfigForm = editingMod.ConfigForm;
    return (
      <div className="space-y-4">
        <Button
          type="button"
          variant="ghost"
          className="px-0 text-ink/70"
          onClick={onCancelEdit}
        >
          ← Back to modules
        </Button>
        <Card className="border-ink/12 bg-ink/[0.04] text-ink">
          <CardHeader>
            <CardTitle className="text-base">Configure {editingMod.name}</CardTitle>
            <CardDescription>{editingMod.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfigForm
              value={configDraft as never}
              onChange={(value) =>
                onConfigChange(value as Record<string, unknown>)
              }
            />
            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="h-11 bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                disabled={savingConfig}
                onClick={onSaveConfig}
              >
                {savingConfig ? "Saving…" : "Save to wall display"}
              </Button>
              <Button
                variant="secondary"
                className="h-11 border border-rose-400/20 bg-rose-500/10 text-rose-200"
                onClick={() => onRemove(editing.i)}
              >
                Remove module from wall
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">On the wall</CardTitle>
          <CardDescription>
            Tap a module to configure it. The display is view-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {dashboard.instances.map((instance) => {
            const mod = getModule(instance.moduleId);
            if (!mod) return null;
            const Icon = mod.icon;
            return (
              <button
                key={instance.i}
                type="button"
                onClick={() => onEdit(instance.i, instance.config)}
                className="flex w-full items-center gap-3 rounded-xl border border-ink/12 bg-panel px-3 py-3 text-left transition active:scale-[0.99]"
              >
                <div className="rounded-lg border border-ink/12 bg-ink/5 p-2">
                  <Icon className="size-4 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{mod.name}</p>
                  <p className="truncate text-xs text-ink/45">
                    {mod.description}
                  </p>
                </div>
                <Settings2 className="size-4 text-ink/35" />
              </button>
            );
          })}
          {dashboard.instances.length === 0 && (
            <p className="py-6 text-center text-sm text-ink/45">
              No modules on the display
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {catalog.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onAdd(mod.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-ink/15 bg-panel px-3 py-3 text-left"
              >
                <div className="rounded-lg border border-ink/12 bg-ink/5 p-2">
                  <Icon className="size-4 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{mod.name}</p>
                  <p className="text-xs text-ink/45">{mod.description}</p>
                </div>
                <Plus className="size-4 text-cyan-600 dark:text-cyan-300" />
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab({
  settings,
  newPin,
  onNewPinChange,
  onSaveSettings,
  onSettingsLocal,
  onSavePin,
}: {
  settings: PublicSettings;
  newPin: string;
  onNewPinChange: (v: string) => void;
  onSaveSettings: (patch: Partial<PublicSettings>) => void;
  onSettingsLocal: (next: PublicSettings) => void;
  onSavePin: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="size-4 text-cyan-600 dark:text-cyan-300" />
            Orientation
          </CardTitle>
          <CardDescription>
            Vertical (portrait) is default for wall monitors. Landscape is optional.
            Changes reflow the wall layout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onSettingsLocal({ ...settings, orientation: "portrait" });
                onSaveSettings({ orientation: "portrait" });
              }}
              className={cn(
                "rounded-2xl border px-3 py-4 text-left transition",
                settings.orientation === "portrait"
                  ? "border-cyan-400/40 bg-cyan-400/15"
                  : "border-ink/12 bg-panel"
              )}
            >
              <Smartphone className="mb-2 size-5 text-cyan-600 dark:text-cyan-300" />
              <p className="text-sm font-medium">Portrait</p>
              <p className="mt-0.5 text-[11px] text-ink/45">
                Vertical · stacked modules
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                onSettingsLocal({ ...settings, orientation: "landscape" });
                onSaveSettings({ orientation: "landscape" });
              }}
              className={cn(
                "rounded-2xl border px-3 py-4 text-left transition",
                settings.orientation === "landscape"
                  ? "border-cyan-400/40 bg-cyan-400/15"
                  : "border-ink/12 bg-panel"
              )}
            >
              <Monitor className="mb-2 size-5 text-cyan-600 dark:text-cyan-300" />
              <p className="text-sm font-medium">Landscape</p>
              <p className="mt-0.5 text-[11px] text-ink/45">
                Horizontal · side-by-side
              </p>
            </button>
          </div>

          <div className="space-y-2">
            <Label>Software rotation</Label>
            <p className="text-xs text-ink/45">
              Use if the OS does not rotate the screen but the panel is mounted
              vertically.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 0 as const, label: "None" },
                  { value: 90 as const, label: "90° CW" },
                  { value: 270 as const, label: "90° CCW" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSettingsLocal({
                      ...settings,
                      screenRotation: opt.value,
                    });
                    onSaveSettings({ screenRotation: opt.value });
                  }}
                  className={cn(
                    "rounded-xl border px-2 py-3 text-center text-sm font-medium",
                    settings.screenRotation === opt.value
                      ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-800 dark:text-cyan-100"
                      : "border-ink/12 bg-panel text-ink/70"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader>
          <CardTitle className="text-base">Display</CardTitle>
          <CardDescription>What shows on the wall monitor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) =>
                onSettingsLocal({ ...settings, displayName: e.target.value })
              }
              onBlur={() => onSaveSettings({ displayName: settings.displayName })}
              className="h-11 border-ink/12 bg-panel text-base"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/12 bg-panel px-3 py-3">
            <div>
              <p className="text-sm font-medium">Performance mode</p>
              <p className="text-xs text-ink/45">Best for Raspberry Pi</p>
            </div>
            <Switch
              checked={settings.performanceMode}
              onCheckedChange={(performanceMode) => {
                onSettingsLocal({ ...settings, performanceMode });
                onSaveSettings({ performanceMode });
              }}
            />
          </div>
          <ThemeToggleRow />
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4 text-cyan-600 dark:text-cyan-300" />
            Security
          </CardTitle>
          <CardDescription>
            Optional PIN for this companion (wall stays unlocked)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={(e) => onNewPinChange(e.target.value)}
            placeholder={settings.hasPin ? "New PIN" : "Set a PIN"}
            className="h-11 border-ink/12 bg-panel text-base"
          />
          <Button
            className="h-11 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            onClick={onSavePin}
          >
            {newPin.trim()
              ? "Save PIN"
              : settings.hasPin
                ? "Clear PIN"
                : "Save PIN"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink">
        <CardHeader>
          <CardTitle className="text-base">Tips</CardTitle>
          <CardDescription>
            Bookmark this page on your phone home screen for app-like access.
            The wall display at <code className="text-cyan-600 dark:text-cyan-300">/</code> is meant
            for passive viewing.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="space-y-2">
      <Label>Color theme</Label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium",
            theme === "light"
              ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-800 dark:text-cyan-100"
              : "border-ink/12 bg-panel text-ink/70"
          )}
        >
          <Sun className="size-4" />
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium",
            theme === "dark"
              ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-800 dark:text-cyan-100"
              : "border-ink/12 bg-panel text-ink/70"
          )}
        >
          <Moon className="size-4" />
          Dark
        </button>
      </div>
    </div>
  );
}
