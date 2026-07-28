import { NextRequest, NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/tasks-store";
import type { TaskPriority } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await req.json();
    const task = updateTask(id, {
      title: body.title,
      notes: body.notes,
      dueAt: body.dueAt,
      priority: body.priority as TaskPriority | undefined,
      completed:
        typeof body.completed === "boolean" ? body.completed : undefined,
    });
    if (!task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ok = deleteTask(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
