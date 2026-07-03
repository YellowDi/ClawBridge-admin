export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "ClawCore",
  description: "ClawBridge 管理后台，用于用户、模型、Agent 与系统配置管理。",
  navItems: [
    {
      label: "总览",
      href: "/",
    },
    {
      label: "用户管理",
      href: "/users",
    },
    {
      label: "模型配置",
      href: "/models",
    },
    {
      label: "Agent 编排",
      href: "/agents",
    },
    {
      label: "审计日志",
      href: "/audit",
    },
  ],
  navMenuItems: [
    {
      label: "总览",
      href: "/",
    },
    {
      label: "用户管理",
      href: "/users",
    },
    {
      label: "模型配置",
      href: "/models",
    },
    {
      label: "Agent 编排",
      href: "/agents",
    },
    {
      label: "工具与权限",
      href: "/tools",
    },
    {
      label: "审计日志",
      href: "/audit",
    },
    {
      label: "系统设置",
      href: "/settings",
    },
    {
      label: "退出登录",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://heroui.com",
  },
};
