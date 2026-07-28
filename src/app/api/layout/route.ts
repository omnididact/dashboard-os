import { NextRequest, NextResponse } from "next/server";
import {
  addModule,
  getDashboard,
  removeModule,
  saveDashboard,
  updateInstanceConfig,
  updateLayouts,
} from "@/lib/dashboard-store";
import { getModule } from "@/modules/registry";
import type { DashboardPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getDashboard());
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: string;
      layouts?: DashboardPayload["layouts"];
      payload?: DashboardPayload;
      instanceId?: string;
      config?: Record<string, unknown>;
      moduleId?: string;
    };

    if (body.action === "layouts" && body.layouts) {
      return NextResponse.json(updateLayouts(body.layouts));
    }

    if (body.action === "config" && body.instanceId && body.config) {
      return NextResponse.json(
        updateInstanceConfig(body.instanceId, body.config)
      );
    }

    if (body.action === "add" && body.moduleId) {
      const mod = getModule(body.moduleId);
      if (!mod) {
        return NextResponse.json({ error: "Unknown module" }, { status: 400 });
      }
      return NextResponse.json(
        addModule(
          body.moduleId,
          body.config ?? (mod.defaultConfig as Record<string, unknown>),
          mod.defaultSize
        )
      );
    }

    if (body.action === "remove" && body.instanceId) {
      return NextResponse.json(removeModule(body.instanceId));
    }

    if (body.payload) {
      return NextResponse.json(saveDashboard(body.payload));
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
