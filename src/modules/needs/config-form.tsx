"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ModuleConfigFormProps } from "@/modules/types";
import type { NeedsConfig } from "@/modules/needs/types";

export function NeedsConfigForm({
  value,
  onChange,
}: ModuleConfigFormProps<NeedsConfig>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/12 bg-ink/[0.04] px-3 py-2.5">
        <div>
          <Label htmlFor="needsShowCompleted">Show completed</Label>
          <p className="text-xs text-muted-foreground">
            Keep bought/done items visible
          </p>
        </div>
        <Switch
          id="needsShowCompleted"
          checked={value.showCompleted}
          onCheckedChange={(showCompleted) =>
            onChange({ ...value, showCompleted })
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Household shopping and supply needs. Stored locally in SQLite — manage
        from the wall or phone companion later.
      </p>
    </div>
  );
}
