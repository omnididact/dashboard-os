"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ModuleConfigFormProps } from "@/modules/types";
import type { TasksConfig } from "@/modules/tasks/types";

export function TasksConfigForm({
  value,
  onChange,
}: ModuleConfigFormProps<TasksConfig>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/12 bg-ink/[0.04] px-3 py-2.5">
        <div>
          <Label htmlFor="showCompleted">Show completed</Label>
          <p className="text-xs text-muted-foreground">
            Keep finished tasks visible in the list
          </p>
        </div>
        <Switch
          id="showCompleted"
          checked={value.showCompleted}
          onCheckedChange={(showCompleted) =>
            onChange({ ...value, showCompleted })
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Sort by</Label>
        <Select
          value={value.sortBy}
          onValueChange={(sortBy) =>
            onChange({ ...value, sortBy: sortBy as TasksConfig["sortBy"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="due">Due time</SelectItem>
            <SelectItem value="created">Recently added</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Tasks are stored locally in SQLite. External integrations (Todoist,
        Reminders, etc.) can hook into the same{" "}
        <code className="text-cyan-600 dark:text-cyan-300">/api/tasks</code> endpoints later.
      </p>
    </div>
  );
}
