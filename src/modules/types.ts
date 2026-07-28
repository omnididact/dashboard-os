import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { ModuleCategory } from "@/lib/types";

/** Board tiles stay compact; independent view modes use focus layouts. */
export type ModuleDensity = "compact" | "focus";

export type ModuleWidgetProps<TConfig = Record<string, unknown>> = {
  config: TConfig;
  instanceId: string;
  editMode?: boolean;
  density?: ModuleDensity;
};

export type ModuleConfigFormProps<TConfig = Record<string, unknown>> = {
  value: TConfig;
  onChange: (value: TConfig) => void;
};

export type DashboardModuleDef<TConfig = Record<string, unknown>> = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: ModuleCategory;
  defaultSize: { w: number; h: number; minW: number; minH: number };
  defaultConfig: TConfig;
  Widget: ComponentType<ModuleWidgetProps<TConfig>>;
  ConfigForm: ComponentType<ModuleConfigFormProps<TConfig>>;
};
