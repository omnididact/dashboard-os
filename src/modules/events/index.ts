import { CalendarDays } from "lucide-react";
import type { DashboardModuleDef } from "@/modules/types";
import { EventsConfigForm } from "@/modules/events/config-form";
import type { EventsConfig } from "@/modules/events/types";
import { EventsWidget } from "@/modules/events/widget";

export const eventsModule: DashboardModuleDef<EventsConfig> = {
  id: "events",
  name: "Family Events",
  description: "Upcoming household milestones with countdown",
  icon: CalendarDays,
  category: "info",
  defaultSize: { w: 6, h: 6, minW: 3, minH: 4 },
  defaultConfig: {
    events: [
      {
        id: "baby-shower",
        title: "Emily & Jack’s Baby Shower",
        date: "2026-08-02",
        location: "Forno Bistro, Saratoga",
      },
      {
        id: "carmine-grad",
        title: "Carmine’s Graduation",
        date: "2026-12-18",
        location: "",
      },
    ],
  },
  Widget: EventsWidget,
  ConfigForm: EventsConfigForm,
};
