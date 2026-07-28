"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ModuleConfigFormProps } from "@/modules/types";
import type { WeatherConfig } from "@/modules/weather/types";

export function WeatherConfigForm({
  value,
  onChange,
}: ModuleConfigFormProps<WeatherConfig>) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="city">City label</Label>
        <Input
          id="city"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          placeholder="Clifton Park, NY"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={value.latitude}
            onChange={(e) =>
              onChange({ ...value, latitude: Number(e.target.value) })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lon">Longitude</Label>
          <Input
            id="lon"
            type="number"
            step="any"
            value={value.longitude}
            onChange={(e) =>
              onChange({ ...value, longitude: Number(e.target.value) })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Units</Label>
        <Select
          value={value.units}
          onValueChange={(units) =>
            onChange({
              ...value,
              units: units as WeatherConfig["units"],
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
            <SelectItem value="celsius">Celsius</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="refresh">Refresh (minutes)</Label>
        <Input
          id="refresh"
          type="number"
          min={5}
          value={value.refreshMinutes}
          onChange={(e) =>
            onChange({ ...value, refreshMinutes: Number(e.target.value) || 15 })
          }
        />
      </div>
    </div>
  );
}
