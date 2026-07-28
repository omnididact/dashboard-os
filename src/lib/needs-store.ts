import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { householdNeeds } from "@/lib/db/schema";

export type NeedItem = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

function toItem(row: typeof householdNeeds.$inferSelect): NeedItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function listNeeds(): NeedItem[] {
  return db
    .select()
    .from(householdNeeds)
    .orderBy(desc(householdNeeds.createdAt))
    .all()
    .map(toItem);
}

export function createNeed(input: {
  title: string;
  category?: string;
}): NeedItem {
  const now = new Date();
  const row = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    category: (input.category || "general").trim() || "general",
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
  db.insert(householdNeeds).values(row).run();
  return toItem(row);
}

export function updateNeed(
  id: string,
  patch: Partial<{ title: string; category: string; completed: boolean }>
): NeedItem | null {
  const existing = db
    .select()
    .from(householdNeeds)
    .where(eq(householdNeeds.id, id))
    .all()[0];
  if (!existing) return null;

  const next = {
    title: patch.title?.trim() ?? existing.title,
    category: patch.category?.trim() || existing.category,
    completed: patch.completed ?? existing.completed,
    updatedAt: new Date(),
  };
  db.update(householdNeeds).set(next).where(eq(householdNeeds.id, id)).run();
  return toItem({ ...existing, ...next });
}

export function deleteNeed(id: string): boolean {
  const existing = db
    .select()
    .from(householdNeeds)
    .where(eq(householdNeeds.id, id))
    .all()[0];
  if (!existing) return false;
  db.delete(householdNeeds).where(eq(householdNeeds.id, id)).run();
  return true;
}

export function ensureSampleNeeds() {
  const existing = db.select().from(householdNeeds).limit(1).all();
  if (existing.length > 0) return;
  createNeed({ title: "Paper towels", category: "groceries" });
  createNeed({ title: "Dishwasher pods", category: "household" });
  createNeed({ title: "Dog food", category: "pets" });
}
