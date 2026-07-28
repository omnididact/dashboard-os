"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Moon,
  Smartphone,
  Sun,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import {
  VIEW_MODE_LABELS,
  type ViewMode,
} from "@/lib/view-modes";

type ClockBarProps = {
  editMode: boolean;
  onToggleEdit: () => void;
  kioskMode?: boolean;
  isFullscreen?: boolean;
  chromeVisible?: boolean;
  onToggleFullscreen?: () => void;
  compact?: boolean;
  showQuote?: boolean;
  viewMode: ViewMode;
  modes: ViewMode[];
  onViewModeChange: (mode: ViewMode) => void;
};

type QuotePayload = {
  text: string;
  author: string;
};

export function ClockBar({
  editMode,
  onToggleEdit,
  kioskMode = false,
  isFullscreen = false,
  chromeVisible = true,
  onToggleFullscreen,
  compact = false,
  showQuote = true,
  viewMode,
  modes,
  onViewModeChange,
}: ClockBarProps) {
  const [now, setNow] = useState(() => new Date());
  const [quote, setQuote] = useState<QuotePayload | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!showQuote) return;
    let cancelled = false;
    async function loadQuote() {
      try {
        const res = await fetch("/api/quote");
        if (!res.ok) return;
        const json = (await res.json()) as QuotePayload;
        if (!cancelled) setQuote(json);
      } catch {
        // ignore
      }
    }
    void loadQuote();
    const id = setInterval(() => void loadQuote(), 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [showQuote]);

  // Header is always visible (never auto-hide)
  const hideChrome = false;
  const modeIndex = Math.max(0, modes.indexOf(viewMode));

  function cycle(delta: number) {
    if (modes.length === 0) return;
    const next = modes[(modeIndex + delta + modes.length) % modes.length];
    onViewModeChange(next);
  }

  return (
    <header
      className={cn(
        "relative shrink-0 border-b border-ink/8 transition-all duration-300",
        compact ? "px-3 py-2" : "px-4 py-2.5 md:px-6",
        hideChrome &&
          "pointer-events-none absolute inset-x-0 top-0 z-40 -translate-y-full opacity-0"
      )}
    >
      {/* 3-column header: date | time | controls */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="min-w-0 justify-self-start">
          <p
            className={cn(
              "truncate font-medium text-ink/55",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {now.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          {viewMode !== "board" && (
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-cyan-600 dark:text-cyan-700/75 dark:text-cyan-300/70">
              {VIEW_MODE_LABELS[viewMode]}
            </p>
          )}
        </div>

        <div className="justify-self-center text-center">
          <time
            className={cn(
              "block font-semibold tracking-tight text-ink tabular-nums",
              compact ? "text-3xl" : "text-4xl md:text-5xl"
            )}
          >
            {now.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </time>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center justify-end gap-1",
            hideChrome && "pointer-events-none"
          )}
        >
          {/* View mode cycle */}
          <div className="mr-0.5 flex items-center rounded-lg border border-ink/12 bg-ink/5">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-ink/70"
              onClick={() => cycle(-1)}
              aria-label="Previous view"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <button
              type="button"
              onClick={() => onViewModeChange("board")}
              className={cn(
                "flex items-center gap-1 px-1.5 py-1 text-[10px] font-medium",
                viewMode === "board" ? "text-cyan-700 dark:text-cyan-200" : "text-ink/60"
              )}
              title="Board view"
            >
              <LayoutGrid className="size-3" />
              <span className="hidden max-w-[4.5rem] truncate sm:inline">
                {VIEW_MODE_LABELS[viewMode]}
              </span>
            </button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-ink/70"
              onClick={() => cycle(1)}
              aria-label="Next view"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            onClick={toggleTheme}
            className="border border-ink/12 bg-ink/5 text-ink hover:bg-ink/10"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="size-3.5" />
            ) : (
              <Moon className="size-3.5" />
            )}
          </Button>
          {!isFullscreen && (
            <Button
              type="button"
              size="sm"
              variant={editMode ? "default" : "secondary"}
              onClick={onToggleEdit}
              className={
                editMode
                  ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                  : "border border-ink/12 bg-ink/5 text-ink hover:bg-ink/10"
              }
            >
              {editMode ? "Done" : "Edit"}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onToggleFullscreen}
            className={cn(
              "border border-ink/12 bg-ink/5 text-ink hover:bg-ink/10",
              isFullscreen && "bg-cyan-400/15 text-cyan-700 dark:text-cyan-800 dark:text-cyan-100"
            )}
            title={
              isFullscreen
                ? "Exit kiosk (Esc)"
                : "Enter kiosk fullscreen (Esc to exit)"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </Button>
          {!isFullscreen && (
            <Link
              href="/companion"
              aria-label="Open mobile companion"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "text-ink/70 hover:bg-ink/10 hover:text-ink"
              )}
            >
              <Smartphone className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {showQuote && quote && viewMode === "board" && (
        <p
          className="mt-1.5 line-clamp-1 min-w-0 text-center text-[10px] leading-snug text-ink/35"
          title={`“${quote.text}” — ${quote.author}`}
        >
          <span className="text-ink/50">“{quote.text}”</span>
          <span className="text-ink/25"> — {quote.author}</span>
        </p>
      )}
    </header>
  );
}
