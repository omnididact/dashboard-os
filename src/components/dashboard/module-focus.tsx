"use client";

import { ModuleFrame } from "@/components/dashboard/module-frame";
import type { ModuleInstance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getModule } from "@/modules/registry";
import { VIEW_MODE_LABELS, type ViewMode } from "@/lib/view-modes";
import { TasksWidget } from "@/modules/tasks/widget";
import { NeedsWidget } from "@/modules/needs/widget";
import type { TasksConfig } from "@/modules/tasks/types";
import type { NeedsConfig } from "@/modules/needs/types";

type ModuleFocusProps = {
  instance: ModuleInstance | null;
  instances: ModuleInstance[];
  performanceMode: boolean;
  viewMode: ViewMode;
  onConfigure?: (instance: ModuleInstance) => void;
};

export function ModuleFocus({
  instance,
  instances,
  performanceMode,
  viewMode,
  onConfigure,
}: ModuleFocusProps) {
  // Combined Tasks | Needs
  if (viewMode === "lists") {
    const tasksInst = instances.find((i) => i.moduleId === "tasks");
    const needsInst = instances.find((i) => i.moduleId === "needs");
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col p-2 md:p-3">
        <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
          {tasksInst && (
            <ModuleFrame
              title="Tasks"
              performanceMode={performanceMode}
              onConfigure={() => onConfigure?.(tasksInst)}
              className="min-h-0"
            >
              <TasksWidget
                config={tasksInst.config as TasksConfig}
                instanceId={tasksInst.i}
                density="focus"
              />
            </ModuleFrame>
          )}
          {needsInst && (
            <ModuleFrame
              title="House Needs"
              performanceMode={performanceMode}
              onConfigure={() => onConfigure?.(needsInst)}
              className="min-h-0"
            >
              <NeedsWidget
                config={needsInst.config as NeedsConfig}
                instanceId={needsInst.i}
                density="focus"
              />
            </ModuleFrame>
          )}
          {!tasksInst && !needsInst && (
            <div className="col-span-full flex items-center justify-center text-sm text-ink/50">
              Add Tasks or House Needs modules to the board
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink/50">
        Module not found
      </div>
    );
  }

  const mod = getModule(instance.moduleId);
  if (!mod) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink/50">
        Module not found
      </div>
    );
  }

  const Icon = mod.icon;
  const Widget = mod.Widget;
  const title =
    VIEW_MODE_LABELS[viewMode] !== "Board"
      ? VIEW_MODE_LABELS[viewMode]
      : mod.name;

  const isCalendar = viewMode === "events";
  const isWeather = viewMode === "weather";
  const isCommute = viewMode === "commute";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col",
        isCalendar || isWeather || isCommute ? "p-1.5 sm:p-2" : "p-2 md:p-3"
      )}
    >
      <ModuleFrame
        title={title}
        icon={<Icon className="size-4 text-cyan-600 dark:text-cyan-300" />}
        editMode={false}
        performanceMode={performanceMode}
        onConfigure={() => onConfigure?.(instance)}
        className="min-h-0 flex-1 rounded-2xl"
      >
        <div
          className={cn(
            "h-full min-h-0",
            isCalendar || isWeather || isCommute ? "p-0.5 sm:p-1" : "p-1"
          )}
        >
          <Widget
            config={instance.config as never}
            instanceId={instance.i}
            editMode={false}
            density="focus"
          />
        </div>
      </ModuleFrame>
    </div>
  );
}
