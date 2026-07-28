"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModuleConfigFormProps } from "@/modules/types";
import type { QuoteConfig } from "@/modules/quote/types";

export function QuoteConfigForm({
  value,
  onChange,
}: ModuleConfigFormProps<QuoteConfig>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quoteRefresh">Refresh interval (hours)</Label>
        <Input
          id="quoteRefresh"
          type="number"
          min={1}
          value={value.refreshHours}
          onChange={(e) =>
            onChange({
              ...value,
              refreshHours: Number(e.target.value) || 12,
            })
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Free daily quote via ZenQuotes, with local fallbacks if offline.
      </p>
    </div>
  );
}
