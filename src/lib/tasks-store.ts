import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tasks } from "@/lib/db/schema";
import type { TaskItem, TaskPriority } from "@/lib/types";

function toItem(row: typeof tasks.$inferSelect): TaskItem {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    dueAt: row.dueAt ? row.dueAt.toISOString() : null,
    priority: row.priority as TaskPriority,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function listTasks(): TaskItem[] {
  return db
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt))
    .all()
    .map(toItem);
}

export function createTask(input: {
  title: string;
  notes?: string;
  dueAt?: string | null;
  priority?: TaskPriority;
}): TaskItem {
  const now = new Date();
  const id = crypto.randomUUID();
  const row = {
    id,
    title: input.title.trim(),
    notes: input.notes?.trim() || null,
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
    priority: input.priority ?? "medium",
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(tasks).values(row).run();
  return toItem(row);
}

export function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    notes: string | null;
    dueAt: string | null;
    priority: TaskPriority;
    completed: boolean;
  }>
): TaskItem | null {
  const existing = db.select().from(tasks).where(eq(tasks.id, id)).all()[0];
  if (!existing) return null;

  const next = {
    title: patch.title?.trim() ?? existing.title,
    notes:
      patch.notes === undefined ? existing.notes : patch.notes?.trim() || null,
    dueAt:
      patch.dueAt === undefined
        ? existing.dueAt
        : patch.dueAt
          ? new Date(patch.dueAt)
          : null,
    priority: patch.priority ?? existing.priority,
    completed: patch.completed ?? existing.completed,
    updatedAt: new Date(),
  };

  db.update(tasks).set(next).where(eq(tasks.id, id)).run();
  return toItem({ ...existing, ...next });
}

export function deleteTask(id: string): boolean {
  const existing = db.select().from(tasks).where(eq(tasks.id, id)).all()[0];
  if (!existing) return false;
  db.delete(tasks).where(eq(tasks.id, id)).run();
  return true;
}

/** Seed a few sample tasks if the table is empty (first run). */
export function ensureSampleTasks() {
  const existing = db.select().from(tasks).limit(1).all();
  if (existing.length > 0) return;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  createTask({
    title: "Review Dashboard OS layout",
    dueAt: today.toISOString(),
    priority: "high",
  });
  createTask({
    title: "Configure weather location",
    dueAt: today.toISOString(),
    priority: "medium",
  });
  createTask({
    title: "Review family events on the wall",
    priority: "low",
  });
}
