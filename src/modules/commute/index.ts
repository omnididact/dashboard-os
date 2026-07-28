import { Car } from "lucide-react";
import type { DashboardModuleDef } from "@/modules/types";
import { CommuteConfigForm } from "@/modules/commute/config-form";
import type { CommuteConfig } from "@/modules/commute/types";
import { CommuteWidget } from "@/modules/commute/widget";

export const commuteModule: DashboardModuleDef<CommuteConfig> = {
  id: "commute",
  name: "Commute",
  description: "Household drive times and map for Mike & Emily",
  icon: Car,
  category: "info",
  defaultSize: { w: 6, h: 7, minW: 3, minH: 5 },
  defaultConfig: {
    homeLabel: "Home · Clifton Park",
    homeLat: 42.8630374,
    homeLon: -73.7747623,
    refreshMinutes: 10,
    people: [
      {
        id: "mike",
        name: "Mike",
        destLabel: "5 Enterprise Ave, Clifton Park",
        destLat: 42.8674015,
        destLon: -73.7449753,
        color: "#22d3ee",
        workStart: "08:00",
        bufferMinutes: 10,
      },
      {
        id: "emily",
        name: "Emily",
        destLabel: "Richard Pastrana DDS, Albany",
        destLat: 42.6782962,
        destLon: -73.8445738,
        color: "#a78bfa",
        workStart: "08:00",
        bufferMinutes: 10,
      },
    ],
  },
  Widget: CommuteWidget,
  ConfigForm: CommuteConfigForm,
};
