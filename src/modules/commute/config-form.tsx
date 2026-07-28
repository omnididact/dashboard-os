"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ModuleConfigFormProps } from "@/modules/types";
import type { CommuteConfig } from "@/modules/commute/types";

export function CommuteConfigForm({
  value,
  onChange,
}: ModuleConfigFormProps<CommuteConfig>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Home label</Label>
        <Input
          value={value.homeLabel}
          onChange={(e) => onChange({ ...value, homeLabel: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Home lat</Label>
          <Input
            type="number"
            step="any"
            value={value.homeLat}
            onChange={(e) =>
              onChange({ ...value, homeLat: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Home lon</Label>
          <Input
            type="number"
            step="any"
            value={value.homeLon}
            onChange={(e) =>
              onChange({ ...value, homeLon: Number(e.target.value) })
            }
          />
        </div>
      </div>

      {value.people.map((person, index) => (
        <div
          key={person.id}
          className="space-y-2 rounded-lg border border-ink/12 bg-ink/[0.04] p-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-600 dark:text-cyan-700/80 dark:text-cyan-300/80">
            Person {index + 1}
          </p>
          <Input
            value={person.name}
            onChange={(e) => {
              const people = [...value.people];
              people[index] = { ...person, name: e.target.value };
              onChange({ ...value, people });
            }}
            placeholder="Name"
          />
          <Input
            value={person.destLabel}
            onChange={(e) => {
              const people = [...value.people];
              people[index] = { ...person, destLabel: e.target.value };
              onChange({ ...value, people });
            }}
            placeholder="Workplace label"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="any"
              value={person.destLat}
              onChange={(e) => {
                const people = [...value.people];
                people[index] = {
                  ...person,
                  destLat: Number(e.target.value),
                };
                onChange({ ...value, people });
              }}
              placeholder="Lat"
            />
            <Input
              type="number"
              step="any"
              value={person.destLon}
              onChange={(e) => {
                const people = [...value.people];
                people[index] = {
                  ...person,
                  destLon: Number(e.target.value),
                };
                onChange({ ...value, people });
              }}
              placeholder="Lon"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-ink/50">Work start</Label>
              <Input
                type="time"
                value={person.workStart ?? "08:00"}
                onChange={(e) => {
                  const people = [...value.people];
                  people[index] = { ...person, workStart: e.target.value };
                  onChange({ ...value, people });
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-ink/50">Buffer (min)</Label>
              <Input
                type="number"
                min={0}
                value={person.bufferMinutes ?? 10}
                onChange={(e) => {
                  const people = [...value.people];
                  people[index] = {
                    ...person,
                    bufferMinutes: Number(e.target.value) || 0,
                  };
                  onChange({ ...value, people });
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="space-y-2">
        <Label>Refresh (minutes)</Label>
        <Input
          type="number"
          min={5}
          value={value.refreshMinutes}
          onChange={(e) =>
            onChange({
              ...value,
              refreshMinutes: Number(e.target.value) || 10,
            })
          }
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Free OpenStreetMap routing (OSRM). Shows typical drive times, not paid
        live traffic feeds.
      </p>
    </div>
  );
}
