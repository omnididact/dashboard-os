"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { TaskItem, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { ModuleWidgetProps } from "@/modules/types";
import type { TasksConfig } from "@/modules/tasks/types";

const priorityRank: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function TasksWidget({
  config,
  editMode,
  density = "compact",
}: ModuleWidgetProps<TasksConfig>) {
  const focus = density === "focus";
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Tasks unavailable");
      const json = (await res.json()) as { tasks: TaskItem[] };
      setTasks(json.tasks);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const visible = useMemo(() => {
    let list = [...tasks];
    if (!config.showCompleted) {
      list = list.filter((t) => !t.completed);
    }
    list.sort((a, b) => {
      if (config.sortBy === "priority") {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      if (config.sortBy === "due") {
        const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        return ad - bd;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [tasks, config]);

  async function toggle(task: TaskItem) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (res.ok) await load();
  }

  async function addTask() {
    const title = draft.trim();
    if (!title) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        priority: "medium",
        dueAt: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      setDraft("");
      await load();
    }
  }

  if (loading) {
    return (
      <div className="space-y-1.5 p-0.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full bg-ink/10" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-ink/50">
        {error}
      </div>
    );
  }

  const openCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "mb-1.5 flex items-center justify-between text-ink/40",
          focus ? "text-xs" : "text-[10px]"
        )}
      >
        <span>{openCount} open</span>
        {focus && (
          <span className="text-ink/30">Tap to complete · sorted by priority</span>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className={cn("space-y-1", focus && "space-y-2")}>
          {visible.length === 0 && (
            <p className="py-4 text-center text-xs text-ink/45">All clear</p>
          )}
          {visible.map((task) => {
            const overdue =
              !task.completed &&
              task.dueAt &&
              new Date(task.dueAt).getTime() < Date.now() - 60 * 60 * 1000;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => toggle(task)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border text-left",
                  focus ? "gap-3 px-3 py-3" : "px-2 py-1.5",
                  task.completed
                    ? "border-ink/8 bg-ink/[0.03] opacity-55"
                    : overdue
                      ? "border-amber-400/25 bg-amber-500/10"
                      : "border-ink/10 bg-ink/[0.04]",
                  task.priority === "high" &&
                    !task.completed &&
                    "border-l-2 border-l-rose-400"
                )}
              >
                {task.completed ? (
                  <CheckCircle2
                    className={cn(
                      "shrink-0 text-emerald-300",
                      focus ? "size-5" : "size-3.5"
                    )}
                  />
                ) : (
                  <Circle
                    className={cn(
                      "shrink-0 text-ink/30",
                      focus ? "size-5" : "size-3.5"
                    )}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-medium text-ink",
                      focus ? "text-base" : "truncate text-[12px]",
                      task.completed && "line-through text-ink/45"
                    )}
                  >
                    {task.title}
                  </p>
                  {focus && (
                    <p className="mt-0.5 text-xs capitalize text-ink/40">
                      {task.priority}
                      {task.dueAt
                        ? ` · ${new Date(task.dueAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}`
                        : ""}
                      {overdue ? " · overdue" : ""}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {(editMode || focus) && (
        <form
          className={cn("mt-1.5 flex gap-1.5", focus && "mt-3 gap-2")}
          onSubmit={(e) => {
            e.preventDefault();
            void addTask();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={focus ? "Add a task for today…" : "Add…"}
            className={cn(
              "border-ink/12 bg-panel",
              focus ? "h-11 text-sm" : "h-8 text-xs"
            )}
          />
          <Button
            type="submit"
            size="icon"
            variant="secondary"
            className={focus ? "size-11" : "size-8"}
          >
            <Plus className={focus ? "size-4" : "size-3.5"} />
          </Button>
        </form>
      )}
    </div>
  );
}
