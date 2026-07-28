import { NextRequest, NextResponse } from "next/server";
import {
  clearSession,
  createSession,
  isAuthenticated,
  setPin,
  verifyPin,
} from "@/lib/auth";
import {
  applyOrientationLayouts,
  getSettings,
  saveSettings,
} from "@/lib/dashboard-store";
import type { AppSettings, ScreenRotation } from "@/lib/types";

export const runtime = "nodejs";

function publicSettings(settings: AppSettings) {
  return {
    displayName: settings.displayName,
    refreshSeconds: settings.refreshSeconds,
    performanceMode: settings.performanceMode,
    accent: settings.accent,
    theme: settings.theme ?? "dark",
    orientation: settings.orientation,
    screenRotation: settings.screenRotation,
    wallView: settings.wallView,
    autoRotateSeconds: settings.autoRotateSeconds,
    hasPin: Boolean(settings.pinHash),
  };
}

export async function GET() {
  const settings = getSettings();
  const authenticated = await isAuthenticated();
  return NextResponse.json({
    settings: publicSettings(settings),
    authenticated,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "login") {
      const ok = await verifyPin(String(body.pin ?? ""));
      if (!ok) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
      }
      await createSession();
      return NextResponse.json({ ok: true });
    }

    if (body.action === "logout") {
      await clearSession();
      return NextResponse.json({ ok: true });
    }

    // Theme is non-sensitive — allow wall/kiosk toggle without PIN
    if (body.action === "updateTheme") {
      const theme = body.theme === "light" ? "light" : "dark";
      const settings = saveSettings({ theme });
      return NextResponse.json({ ok: true, settings: publicSettings(settings) });
    }

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (body.action === "setPin") {
      await setPin(body.pin ? String(body.pin) : null);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update") {
      const patch: Partial<AppSettings> = {};
      if (typeof body.displayName === "string") {
        patch.displayName = body.displayName;
      }
      if (typeof body.refreshSeconds === "number") {
        patch.refreshSeconds = body.refreshSeconds;
      }
      if (typeof body.performanceMode === "boolean") {
        patch.performanceMode = body.performanceMode;
      }
      if (
        body.accent === "cyan" ||
        body.accent === "indigo" ||
        body.accent === "emerald"
      ) {
        patch.accent = body.accent;
      }
      if (body.theme === "light" || body.theme === "dark") {
        patch.theme = body.theme;
      }
      if (body.orientation === "portrait" || body.orientation === "landscape") {
        patch.orientation = body.orientation;
      }
      if (
        body.screenRotation === 0 ||
        body.screenRotation === 90 ||
        body.screenRotation === 270
      ) {
        patch.screenRotation = body.screenRotation as ScreenRotation;
      }
      if (typeof body.wallView === "string") {
        patch.wallView = body.wallView;
      }
      if (typeof body.autoRotateSeconds === "number") {
        patch.autoRotateSeconds = body.autoRotateSeconds;
      }

      const prev = getSettings();
      const settings = saveSettings(patch);

      // When switching portrait/landscape, reflow module layout to match
      if (
        patch.orientation &&
        patch.orientation !== prev.orientation &&
        body.reflowLayout !== false
      ) {
        applyOrientationLayouts(settings.orientation);
      }

      return NextResponse.json({
        settings: publicSettings(settings),
      });
    }

    if (body.action === "reflowLayout") {
      const settings = getSettings();
      applyOrientationLayouts(settings.orientation);
      return NextResponse.json({ ok: true, settings: publicSettings(settings) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
