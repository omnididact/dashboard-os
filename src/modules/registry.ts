import type { DashboardModuleDef } from "@/modules/types";
import { commuteModule } from "@/modules/commute";
import { eventsModule } from "@/modules/events";
import { needsModule } from "@/modules/needs";
import { quoteModule } from "@/modules/quote";
import { tasksModule } from "@/modules/tasks";
import { weatherModule } from "@/modules/weather";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modules: DashboardModuleDef<any>[] = [
  weatherModule,
  tasksModule,
  commuteModule,
  needsModule,
  eventsModule,
  quoteModule,
];

export function getModules() {
  return modules;
}

export function getModule(id: string) {
  return modules.find((m) => m.id === id);
}

export function getModuleMeta() {
  return modules.map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    category: m.category,
    defaultSize: m.defaultSize,
    defaultConfig: m.defaultConfig,
  }));
}
