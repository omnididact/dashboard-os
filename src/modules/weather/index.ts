import { CloudSun } from "lucide-react";
import type { DashboardModuleDef } from "@/modules/types";
import { WeatherConfigForm } from "@/modules/weather/config-form";
import type { WeatherConfig } from "@/modules/weather/types";
import { WeatherWidget } from "@/modules/weather/widget";

export const weatherModule: DashboardModuleDef<WeatherConfig> = {
  id: "weather",
  name: "Weather",
  description: "Current conditions, hourly chart, and 7-day forecast",
  icon: CloudSun,
  category: "info",
  defaultSize: { w: 5, h: 8, minW: 3, minH: 5 },
  defaultConfig: {
    latitude: 42.84552,
    longitude: -73.818871,
    city: "Clifton Park, NY",
    units: "fahrenheit",
    refreshMinutes: 15,
  },
  Widget: WeatherWidget,
  ConfigForm: WeatherConfigForm,
};
