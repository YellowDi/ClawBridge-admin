import type { SVGProps } from "react";

export type AdminIconName =
  | "activity"
  | "agent"
  | "audit"
  | "bell"
  | "dashboard"
  | "database"
  | "model"
  | "plus"
  | "settings"
  | "shield"
  | "tool"
  | "users";

const ICON_PATHS: Record<AdminIconName, string[]> = {
  activity: ["M3 12h4l3 7 4-14 3 7h4"],
  agent: [
    "M12 3v3",
    "M7 8h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z",
    "M9 13h.01",
    "M15 13h.01",
    "M9 17h6",
  ],
  audit: ["M8 4h8l3 3v13H5V4h3Z", "M15 4v4h4", "M8 12h8", "M8 16h5"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9", "M10 21h4"],
  dashboard: ["M4 13h7V4H4v9Z", "M13 20h7V4h-7v16Z", "M4 20h7v-5H4v5Z"],
  database: [
    "M4 6c0-2 16-2 16 0s-16 2-16 0Z",
    "M4 6v6c0 2 16 2 16 0V6",
    "M4 12v6c0 2 16 2 16 0v-6",
  ],
  model: ["M12 3 4 7v10l8 4 8-4V7l-8-4Z", "M4 7l8 4 8-4", "M12 11v10"],
  plus: ["M12 5v14", "M5 12h14"],
  settings: [
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2.1-1.2L14 3h-4l-.4 2.7a7 7 0 0 0-2.1 1.2l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2.1 1.2L10 21h4l.4-2.7a7 7 0 0 0 2.1-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  ],
  shield: [
    "M12 3 20 6v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6l8-3Z",
    "M9 12l2 2 4-5",
  ],
  tool: ["M14.7 6.3a4 4 0 0 0 5 5L11 20l-5-5 8.7-8.7Z", "M6 15l3 3"],
  users: [
    "M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1",
    "M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
    "M21 19v-1a3.5 3.5 0 0 0-3-3.45",
    "M16 3.2a3.5 3.5 0 0 1 0 6.6",
  ],
};

export function AdminIcon({
  className,
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: AdminIconName }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      {...props}
    >
      {ICON_PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
