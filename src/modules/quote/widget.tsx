"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModuleWidgetProps } from "@/modules/types";
import type { QuoteConfig } from "@/modules/quote/types";

type QuotePayload = {
  text: string;
  author: string;
  source: string;
};

export function QuoteWidget({ config }: ModuleWidgetProps<QuoteConfig>) {
  const [data, setData] = useState<QuotePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/quote");
        if (!res.ok) throw new Error("Quote unavailable");
        const json = (await res.json()) as QuotePayload;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load quote");
        }
      }
    }
    load();
    const interval = setInterval(
      load,
      Math.max(config.refreshHours, 1) * 60 * 60 * 1000
    );
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [config.refreshHours]);

  if (!data && !error) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 p-2">
        <Skeleton className="h-4 w-1/3 bg-ink/10" />
        <Skeleton className="h-16 w-full bg-ink/10" />
        <Skeleton className="h-4 w-1/4 bg-ink/10" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink/50">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-full min-h-0 flex-col justify-center gap-4 p-1">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/80">
        <Quote className="size-3.5" />
        Quote of the day
      </div>
      <blockquote className="text-lg font-medium leading-relaxed text-ink md:text-xl">
        “{data.text}”
      </blockquote>
      <p className="text-sm text-ink/50">— {data.author}</p>
    </div>
  );
}
