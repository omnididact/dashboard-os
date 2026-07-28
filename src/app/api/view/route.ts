import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/dashboard-store";
import {
  VIEW_MODE_LABELS,
  getAvailableModes,
  parseViewMode,
  type ViewMode,
} from "@/lib/view-modes";
import { getDashboard } from "@/lib/dashboard-store";

export const runtime = "nodejs";

/**
 * Wall view API — designed for Siri Shortcuts / Home automations.
 *
 * GET  /api/view              → current mode + available modes
 * GET  /api/view?view=calendar → set mode (aliases: calendar→events) + redirect to /
 * POST /api/view { "view": "events" } → set mode (JSON)
 *
 * No PIN required: kiosk LAN control. Restrict network as needed.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw =
    searchParams.get("view") ||
    searchParams.get("mode") ||
    searchParams.get("v");
  const redirect = searchParams.get("redirect") !== "0";

  if (raw) {
    const mode = parseViewMode(raw);
    if (!mode) {
      return NextResponse.json(
        {
          error: "Unknown view",
          hint: Object.keys(VIEW_MODE_LABELS).join(", "),
          aliases: "calendar→events, todo→tasks, shopping→needs",
        },
        { status: 400 }
      );
    }
    saveSettings({ wallView: mode });
    if (redirect) {
      const url = new URL("/", req.url);
      url.searchParams.set("view", mode);
      return NextResponse.redirect(url, 302);
    }
    return NextResponse.json({
      ok: true,
      view: mode,
      label: VIEW_MODE_LABELS[mode],
    });
  }

  const settings = getSettings();
  const dashboard = getDashboard();
  const modes = getAvailableModes(dashboard.instances);
  const current =
    parseViewMode(settings.wallView) &&
    modes.includes(parseViewMode(settings.wallView) as ViewMode)
      ? (parseViewMode(settings.wallView) as ViewMode)
      : "board";

  return NextResponse.json({
    view: current,
    label: VIEW_MODE_LABELS[current],
    modes: modes.map((m) => ({
      id: m,
      label: VIEW_MODE_LABELS[m],
    })),
    siri: {
      example: "GET /api/view?view=calendar",
      shortcuts: "Use Shortcuts → Get Contents of URL with that link",
      homebridge: "Optional HTTP switch hitting this endpoint",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = String(body.view ?? body.mode ?? body.v ?? "");
    const mode = parseViewMode(raw);
    if (!mode) {
      return NextResponse.json({ error: "Unknown view" }, { status: 400 });
    }
    saveSettings({ wallView: mode });
    return NextResponse.json({
      ok: true,
      view: mode,
      label: VIEW_MODE_LABELS[mode],
    });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
