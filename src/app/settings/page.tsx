"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  Lock,
  Monitor,
  Moon,
  RotateCcw,
  Shield,
  Smartphone,
  Sparkles,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type PublicSettings = {
  displayName: string;
  refreshSeconds: number;
  performanceMode: boolean;
  accent: "cyan" | "indigo" | "emerald";
  theme?: "light" | "dark";
  orientation: "portrait" | "landscape";
  screenRotation: 0 | 90 | 270;
  hasPin: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setSettings(json.settings);
      setAuthenticated(json.authenticated);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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
    await load();
  }

  async function logout() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    toast.success("Locked");
    await load();
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
      body: JSON.stringify({
        action: "setPin",
        pin: newPin.trim() || null,
      }),
    });
    if (!res.ok) {
      toast.error("Could not update PIN");
      return;
    }
    setNewPin("");
    toast.success(newPin.trim() ? "PIN updated" : "PIN removed");
    await load();
  }

  if (loading || !settings) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-2xl items-center justify-center px-4">
        <p className="text-sm text-ink/50">Loading settings…</p>
      </div>
    );
  }

  if (settings.hasPin && !authenticated) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit text-ink/70"
          )}
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>
        <Card className="border-ink/12 bg-ink/[0.04] text-ink backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4 text-cyan-600 dark:text-cyan-300" />
              Settings locked
            </CardTitle>
            <CardDescription>
              Enter your PIN to configure Dashboard OS from this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void login();
                }}
                className="border-ink/12 bg-panel"
              />
            </div>
            <Button
              className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-2 -ml-2 text-ink/70"
            )}
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            Configure the display, modules, and security from any browser on
            your network.
          </p>
        </div>
        {settings.hasPin && (
          <Button variant="secondary" size="sm" onClick={() => void logout()}>
            Lock
          </Button>
        )}
      </div>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="size-4 text-cyan-600 dark:text-cyan-300" />
            Orientation
          </CardTitle>
          <CardDescription>
            Portrait for vertical wall monitors (default). Landscape is optional.
            Switching reflows the module grid.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setSettings({ ...settings, orientation: "portrait" });
                void saveSettings({ orientation: "portrait" });
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
                setSettings({ ...settings, orientation: "landscape" });
                void saveSettings({ orientation: "landscape" });
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
                    setSettings({ ...settings, screenRotation: opt.value });
                    void saveSettings({ screenRotation: opt.value });
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

      <Card className="border-ink/12 bg-ink/[0.04] text-ink backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-cyan-600 dark:text-cyan-300" />
            Appearance
          </CardTitle>
          <CardDescription>
            Display name and performance profile for wall monitors / Pi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Color theme</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium",
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
                  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium",
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
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) =>
                setSettings({ ...settings, displayName: e.target.value })              }
              onBlur={() =>
                void saveSettings({ displayName: settings.displayName })
              }
              className="border-ink/12 bg-panel"
            />
          </div>
          <div className="space-y-2">
            <Label>Accent</Label>
            <Select
              value={settings.accent}
              onValueChange={(accent) => {
                if (!accent) return;
                const next = accent as PublicSettings["accent"];
                setSettings({ ...settings, accent: next });
                void saveSettings({ accent: next });
              }}
            >
              <SelectTrigger className="w-full border-ink/12 bg-panel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cyan">Cyan</SelectItem>
                <SelectItem value="indigo">Indigo</SelectItem>
                <SelectItem value="emerald">Emerald</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/12 bg-panel px-3 py-3">
            <div>
              <p className="text-sm font-medium">Performance mode</p>
              <p className="text-xs text-ink/45">
                Disable glass blur for Raspberry Pi / low-power devices
              </p>
            </div>
            <Switch
              checked={settings.performanceMode}
              onCheckedChange={(performanceMode) => {
                setSettings({ ...settings, performanceMode });
                void saveSettings({ performanceMode });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutDashboard className="size-4 text-cyan-600 dark:text-cyan-300" />
            Modules & layout
          </CardTitle>
          <CardDescription>
            Use the dashboard Edit layout mode to drag, resize, add, remove, and
            configure modules. Changes save to local SQLite automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/?edit=1"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "border border-ink/12 bg-ink/5"
            )}
          >
            Open dashboard editor
          </Link>
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4 text-cyan-600 dark:text-cyan-300" />
            Security
          </CardTitle>
          <CardDescription>
            Optional PIN protects settings on phones and laptops. The wall
            display can stay open without a PIN.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="newPin">
              {settings.hasPin ? "Change PIN" : "Set PIN"}
            </Label>
            <Input
              id="newPin"
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder={settings.hasPin ? "New PIN" : "e.g. 4820"}
              className="border-ink/12 bg-panel"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
              onClick={() => void savePin()}
            >
              {newPin.trim() ? "Save PIN" : settings.hasPin ? "Clear PIN" : "Save PIN"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-ink/12 bg-ink/[0.04] text-ink backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">Local-first notes</CardTitle>
          <CardDescription>
            Layout, tasks, and settings live in{" "}
            <code className="text-cyan-600 dark:text-cyan-300">data/dashboard.db</code>. Weather
            uses Open-Meteo. Tasks expose{" "}
            <code className="text-cyan-600 dark:text-cyan-300">/api/tasks</code> for future
            integrations.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
