"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getModules } from "@/modules/registry";

type AddModuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (moduleId: string) => Promise<void>;
};

export function AddModuleDialog({
  open,
  onOpenChange,
  onAdd,
}: AddModuleDialogProps) {
  const modules = getModules();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-ink/12 bg-card text-ink sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add module</DialogTitle>
          <DialogDescription>
            Choose a module to place on the dashboard grid.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                type="button"
                className="flex items-start gap-3 rounded-xl border border-ink/12 bg-ink/[0.04] px-3 py-3 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/5"
                onClick={async () => {
                  await onAdd(mod.id);
                  onOpenChange(false);
                }}
              >
                <div className="rounded-lg border border-ink/12 bg-ink/5 p-2">
                  <Icon className="size-4 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{mod.name}</p>
                  <p className="mt-0.5 text-xs text-ink/50">
                    {mod.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onOpenChange(false)}
        >
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
