"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModuleConfigFormProps } from "@/modules/types";
import type { EventsConfig } from "@/modules/events/types";

export function EventsConfigForm({
  value,
  onChange,
}: ModuleConfigFormProps<EventsConfig>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Family events</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange({
              ...value,
              events: [
                ...value.events,
                {
                  id: crypto.randomUUID().slice(0, 8),
                  title: "New event",
                  date: new Date().toISOString().slice(0, 10),
                  location: "",
                },
              ],
            })
          }
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>
      <div className="space-y-3">
        {value.events.map((event, index) => (
          <div
            key={event.id}
            className="space-y-2 rounded-lg border border-ink/12 bg-ink/[0.04] p-3"
          >
            <div className="flex gap-2">
              <Input
                value={event.title}
                onChange={(e) => {
                  const events = [...value.events];
                  events[index] = { ...event, title: e.target.value };
                  onChange({ ...value, events });
                }}
                placeholder="Title"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() =>
                  onChange({
                    ...value,
                    events: value.events.filter((_, i) => i !== index),
                  })
                }
              >
                <Trash2 className="size-4 text-rose-300" />
              </Button>
            </div>
            <Input
              type="date"
              value={event.date}
              onChange={(e) => {
                const events = [...value.events];
                events[index] = { ...event, date: e.target.value };
                onChange({ ...value, events });
              }}
            />
            <Input
              value={event.location ?? ""}
              onChange={(e) => {
                const events = [...value.events];
                events[index] = { ...event, location: e.target.value };
                onChange({ ...value, events });
              }}
              placeholder="Location (optional)"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
