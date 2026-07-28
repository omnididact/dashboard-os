import { ShoppingBasket } from "lucide-react";
import type { DashboardModuleDef } from "@/modules/types";
import { NeedsConfigForm } from "@/modules/needs/config-form";
import type { NeedsConfig } from "@/modules/needs/types";
import { NeedsWidget } from "@/modules/needs/widget";

export const needsModule: DashboardModuleDef<NeedsConfig> = {
  id: "needs",
  name: "House Needs",
  description: "Household shopping and supply checklist",
  icon: ShoppingBasket,
  category: "productivity",
  defaultSize: { w: 3, h: 8, minW: 2, minH: 4 },
  defaultConfig: {
    showCompleted: false,
  },
  Widget: NeedsWidget,
  ConfigForm: NeedsConfigForm,
};
