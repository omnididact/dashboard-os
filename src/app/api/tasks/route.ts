import { NextRequest, NextResponse } from "next/server";
import {
  createTask,
  ensureSampleTasks,
  listTasks,
} from "@/lib/tasks-store";
import type { TaskPriority } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  ensureSampleTasks();
  return NextResponse.json({ tasks: listTasks() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const task = createTask({
      title,
      notes: body.notes ? String(body.notes) : undefined,
      dueAt: body.dueAt ? String(body.dueAt) : null,
      priority: (body.priority as TaskPriority) || "medium",
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}
