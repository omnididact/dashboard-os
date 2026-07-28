"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getModule } from "@/modules/registry";

type ModuleConfigSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceId: string | null;
  moduleId: string | null;
  config: Record<string, unknown> | null;
  onSave: (instanceId: string, config: Record<string, unknown>) => Promise<void>;
};

export function ModuleConfigSheet({
  open,
  onOpenChange,
  instanceId,
  moduleId,
  config,
  onSave,
}: ModuleConfigSheetProps) {
  const mod = moduleId ? getModule(moduleId) : null;
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setDraft(config);
  }, [config, instanceId]);

  if (!mod || !instanceId) return null;

  const ConfigForm = mod.ConfigForm;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-ink/12 bg-card text-ink sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Configure {mod.name}</SheetTitle>
          <SheetDescription>{mod.description}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <ConfigForm
            value={draft}
            onChange={(value) => setDraft(value as Record<string, unknown>)}
          />
        </div>
        <SheetFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(instanceId, draft);
                onOpenChange(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
