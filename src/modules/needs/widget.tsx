"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { NeedItem } from "@/lib/needs-store";
import { cn } from "@/lib/utils";
import type { ModuleWidgetProps } from "@/modules/types";
import type { NeedsConfig } from "@/modules/needs/types";

export function NeedsWidget({
  config,
  editMode,
  density = "compact",
}: ModuleWidgetProps<NeedsConfig>) {
  const focus = density === "focus";
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/needs");
      if (!res.ok) throw new Error("unavailable");
      const json = (await res.json()) as { needs: NeedItem[] };
      setNeeds(json.needs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, [load]);

  const visible = useMemo(() => {
    let list = [...needs];
    if (!config.showCompleted) list = list.filter((n) => !n.completed);
    return list;
  }, [needs, config.showCompleted]);

  async function addNeed() {
    const title = draft.trim();
    if (!title) return;
    const res = await fetch("/api/needs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category: "household" }),
    });
    if (res.ok) {
      setDraft("");
      await load();
    }
  }

  async function toggle(item: NeedItem) {
    await fetch(`/api/needs/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !item.completed }),
    });
    await load();
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

  const openCount = needs.filter((n) => !n.completed).length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "mb-1.5 flex items-center justify-between text-ink/40",
          focus ? "text-xs" : "text-[10px]"
        )}
      >
        <span>{openCount} open</span>
        {focus && <span className="text-ink/30">Household shopping list</span>}
      </div>

      <ScrollArea className="min-h-0 flex-1 pr-1">
        <div className={cn("space-y-1", focus && "space-y-2")}>
          {visible.length === 0 && (
            <p className="py-4 text-center text-xs text-ink/45">List empty</p>
          )}
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void toggle(item)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg border text-left",
                focus ? "gap-3 px-3 py-3" : "px-2 py-1.5",
                item.completed
                  ? "border-ink/8 bg-ink/[0.03] opacity-55"
                  : "border-ink/10 bg-ink/[0.04]"
              )}
            >
              {item.completed ? (
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
                    item.completed && "line-through text-ink/45"
                  )}
                >
                  {item.title}
                </p>
                {focus && (
                  <p className="mt-0.5 text-xs capitalize text-ink/40">
                    {item.category}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>

      {(editMode || focus) && (
        <form
          className={cn("mt-1.5 flex gap-1.5", focus && "mt-3 gap-2")}
          onSubmit={(e) => {
            e.preventDefault();
            void addNeed();
          }}
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={focus ? "Add a house need…" : "Add…"}
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
