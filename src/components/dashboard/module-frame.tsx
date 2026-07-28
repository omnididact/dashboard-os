"use client";

import { Settings2, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModuleFrameProps = {
  title: string;
  icon?: ReactNode;
  editMode?: boolean;
  performanceMode?: boolean;
  onConfigure?: () => void;
  onRemove?: () => void;
  children: ReactNode;
  className?: string;
};

export function ModuleFrame({
  title,
  icon,
  editMode,
  performanceMode,
  onConfigure,
  onRemove,
  children,
  className,
}: ModuleFrameProps) {
  return (
    <div
      className={cn(
        "module-frame group relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-ink/12",
        // Background comes from CSS vars (.module-frame / performance solid)
        performanceMode ? "bg-module-solid" : "bg-module",
        className
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b border-ink/10 px-2.5 py-1.5",
          editMode && "cursor-grab active:cursor-grabbing drag-handle"
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-ink/85">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        {editMode && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-ink/60 hover:text-ink"
              onClick={onConfigure}
              aria-label={`Configure ${title}`}
            >
              <Settings2 className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="text-ink/60 hover:text-rose-400"
              onClick={onRemove}
              aria-label={`Remove ${title}`}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-2">{children}</div>
    </div>
  );
}
