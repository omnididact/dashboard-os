import { ListTodo } from "lucide-react";
import type { DashboardModuleDef } from "@/modules/types";
import { TasksConfigForm } from "@/modules/tasks/config-form";
import type { TasksConfig } from "@/modules/tasks/types";
import { TasksWidget } from "@/modules/tasks/widget";

export const tasksModule: DashboardModuleDef<TasksConfig> = {
  id: "tasks",
  name: "Tasks",
  description: "Local tasks for the day with priorities and due times",
  icon: ListTodo,
  category: "productivity",
  defaultSize: { w: 3, h: 8, minW: 2, minH: 4 },
  defaultConfig: {
    showCompleted: false,
    sortBy: "priority",
  },
  Widget: TasksWidget,
  ConfigForm: TasksConfigForm,
};
