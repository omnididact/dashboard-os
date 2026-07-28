import { Quote } from "lucide-react";
import type { DashboardModuleDef } from "@/modules/types";
import { QuoteConfigForm } from "@/modules/quote/config-form";
import type { QuoteConfig } from "@/modules/quote/types";
import { QuoteWidget } from "@/modules/quote/widget";

export const quoteModule: DashboardModuleDef<QuoteConfig> = {
  id: "quote",
  name: "Quote of the Day",
  description: "A daily quote for the household wall",
  icon: Quote,
  category: "media",
  defaultSize: { w: 6, h: 5, minW: 3, minH: 3 },
  defaultConfig: {
    refreshHours: 12,
  },
  Widget: QuoteWidget,
  ConfigForm: QuoteConfigForm,
};
