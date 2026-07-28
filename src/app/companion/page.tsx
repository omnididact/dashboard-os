import type { Metadata } from "next";
import { CompanionShell } from "@/components/companion/companion-shell";
import { getDashboard, getSettings } from "@/lib/dashboard-store";
import { ensureSampleTasks, listTasks } from "@/lib/tasks-store";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Companion · Dashboard OS",
  description:
    "Mobile companion to control your wall dashboard without touching the display",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dashboard OS",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function CompanionPage() {
  ensureSampleTasks();
  const dashboard = getDashboard();
  const appSettings = getSettings();
  const authenticated = await isAuthenticated();
  const tasks = listTasks();

  return (
    <CompanionShell
      initialDashboard={dashboard}
      initialTasks={tasks}
      initialSettings={{
        displayName: appSettings.displayName,
        refreshSeconds: appSettings.refreshSeconds,
        performanceMode: appSettings.performanceMode,
        accent: appSettings.accent,
        orientation: appSettings.orientation,
        screenRotation: appSettings.screenRotation,
        wallView: appSettings.wallView,
        hasPin: Boolean(appSettings.pinHash),
      }}
      initialAuthenticated={authenticated}
    />
  );
}
