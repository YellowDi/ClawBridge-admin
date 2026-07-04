import type { ComponentType, SVGProps } from "react";

import {
  ArrowRightFromSquare,
  ArrowsRotateLeft,
  Bell,
  Bulb,
  ChartColumn,
  ChartPie,
  CirclePlus,
  Database,
  EllipsisVertical,
  FaceRobot,
  FileArrowUp,
  FileText,
  Gear,
  LogoMcp,
  Magnifier,
  Pencil,
  Persons,
  PlugWire,
  Server,
  Shield,
  TrashBin,
  Wrench,
} from "@gravity-ui/icons";

export type AdminIconName =
  | "activity"
  | "agent"
  | "audit"
  | "bell"
  | "dashboard"
  | "database"
  | "edit"
  | "knowledge"
  | "logout"
  | "mcp"
  | "model"
  | "more"
  | "plus"
  | "refresh"
  | "search"
  | "settings"
  | "shield"
  | "skill"
  | "trash"
  | "tool"
  | "upload"
  | "users";

const ICONS: Record<AdminIconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  activity: ChartColumn,
  agent: FaceRobot,
  audit: FileText,
  bell: Bell,
  dashboard: ChartPie,
  database: Database,
  edit: Pencil,
  knowledge: Bulb,
  logout: ArrowRightFromSquare,
  mcp: LogoMcp,
  model: Server,
  more: EllipsisVertical,
  plus: CirclePlus,
  refresh: ArrowsRotateLeft,
  search: Magnifier,
  settings: Gear,
  shield: Shield,
  skill: PlugWire,
  trash: TrashBin,
  tool: Wrench,
  upload: FileArrowUp,
  users: Persons,
};

export function AdminIcon({
  className,
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: AdminIconName }) {
  const Icon = ICONS[name];

  return <Icon aria-hidden="true" className={className} {...props} />;
}
