import { Suspense } from "react";
import { GridShell } from "@/components/dashboard/grid-shell";
import { getDashboard, getSettings } from "@/lib/dashboard-store";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const dashboard = getDashboard();
  const settings = getSettings();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-sm text-ink/50">
          Loading dashboard…
        </div>
      }
    >
      <GridShell
        initialDashboard={dashboard}
        displayName={settings.displayName}
        performanceMode={settings.performanceMode}
        orientation={settings.orientation}
        screenRotation={settings.screenRotation}
        initialWallView={settings.wallView}
      />
    </Suspense>
  );
}
