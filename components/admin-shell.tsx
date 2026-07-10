"use client";

import type { ComponentProps, ReactNode } from "react";
import type { AdminIconName } from "@/components/admin-icons";

import { Avatar, Button, Tooltip } from "@heroui/react";
import { AppLayout, Navbar, Sidebar } from "@heroui-pro/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useCallback, useMemo, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { useAuth } from "@/components/auth-provider";
import { siteConfig } from "@/config/site";

type NavItem = {
  key: string;
  href: string;
  icon: AdminIconName;
  label: string;
};

type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

type AdminPageActionsContextValue = {
  setActions: (actions: ReactNode) => void;
  setNavigation: (navigation: ReactNode) => void;
};

const AdminPageActionsContext =
  createContext<AdminPageActionsContextValue | null>(null);

const PLATFORM_ITEMS: readonly NavItem[] = [
  { href: "/", icon: "dashboard", key: "overview", label: "概览" },
  { href: "/users", icon: "users", key: "users", label: "用户" },
  {
    href: "/subscriptions",
    icon: "database",
    key: "subscriptions",
    label: "订阅套餐",
  },
  { href: "/models", icon: "model", key: "models", label: "模型" },
  { href: "/agents", icon: "agent", key: "agents", label: "Agent 编排" },
] as const;

const OPS_ITEMS: readonly NavItem[] = [
  { href: "/usage", icon: "activity", key: "usage", label: "用量统计" },
  {
    href: "/conversations",
    icon: "database",
    key: "conversations",
    label: "会话记录",
  },
  {
    href: "/knowledge-bases",
    icon: "knowledge",
    key: "knowledge-bases",
    label: "知识库",
  },
  { href: "/skills", icon: "skill", key: "skills", label: "Skill 管理" },
  { href: "/mcp", icon: "mcp", key: "mcp", label: "OpenClaw MCP" },
  { href: "/plugins", icon: "skill", key: "plugins", label: "插件管理" },
  { href: "/tools", icon: "tool", key: "tools", label: "工具与权限" },
  { href: "/audit", icon: "audit", key: "audit", label: "审计日志" },
] as const;

const SYSTEM_ITEMS: readonly NavItem[] = [
  { href: "/settings", icon: "settings", key: "settings", label: "系统设置" },
  { href: "/security", icon: "shield", key: "security", label: "安全策略" },
] as const;

const NAV_GROUPS: readonly NavGroup[] = [
  { items: PLATFORM_ITEMS, label: "平台管理" },
  { items: OPS_ITEMS, label: "运维治理" },
  { items: SYSTEM_ITEMS, label: "系统" },
] as const;

const ALL_NAV_ITEMS: readonly NavItem[] = [
  ...PLATFORM_ITEMS,
  ...OPS_ITEMS,
  ...SYSTEM_ITEMS,
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pageActions, setPageActions] = useState<ReactNode>(null);
  const [pageNavigation, setPageNavigation] = useState<ReactNode>(null);
  const navigate = useCallback((href: string) => router.push(href), [router]);
  const pageActionsContext = useMemo(
    () => ({ setActions: setPageActions, setNavigation: setPageNavigation }),
    [],
  );

  const title = useMemo(() => {
    if (pathname === "/") return "概览";

    const matched = ALL_NAV_ITEMS.find(
      (item) => item.href !== "/" && pathname.startsWith(item.href),
    );

    return matched?.label ?? siteConfig.name;
  }, [pathname]);
  const navbar = useMemo(
    () => (
      <AdminNavbar
        actions={pageActions}
        navigation={pageNavigation}
        title={title}
      />
    ),
    [pageActions, pageNavigation, title],
  );
  const sidebar = useMemo(
    () => <AdminSidebar pathname={pathname} />,
    [pathname],
  );

  return (
    <AppLayout
      navbar={navbar}
      navigate={navigate}
      scrollMode="content"
      sidebar={sidebar}
      sidebarCollapsible="offcanvas"
      sidebarVariant="inset"
    >
      <AdminPageActionsContext.Provider value={pageActionsContext}>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </AdminPageActionsContext.Provider>
    </AppLayout>
  );
}

function AdminNavbar({
  actions,
  navigation,
  title,
}: {
  actions: ReactNode;
  navigation: ReactNode;
  title: string;
}) {
  return (
    <Navbar maxWidth="full">
      <Navbar.Header>
        <AppLayout.MenuToggle />
        <Sidebar.Trigger />
        <h1 className="text-foreground truncate text-xl font-semibold">
          {title}
        </h1>
        {navigation ? (
          <div className="flex min-w-0 flex-1 justify-center px-3">
            <div className="max-w-full overflow-x-auto">{navigation}</div>
          </div>
        ) : (
          <Navbar.Spacer />
        )}
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </Navbar.Header>
    </Navbar>
  );
}

export function useAdminPageActions() {
  return use(AdminPageActionsContext);
}

function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <>
      <Sidebar>
        <SidebarContents pathname={pathname} />
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Mobile>
        <SidebarContents pathname={pathname} />
      </Sidebar.Mobile>
    </>
  );
}

function SidebarContents({ pathname }: { pathname: string }) {
  const { logout, session } = useAuth();
  const username = session?.user?.username ?? siteConfig.name;
  const avatarUrl = session?.user?.avatarUrl?.trim() ?? "";

  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center px-1 py-1" data-sidebar="label">
          <Image
            priority
            unoptimized
            alt="ClawBridge"
            className="h-9 w-auto"
            height={68}
            src="/sidebar-logo.svg"
            width={306}
          />
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.Menu aria-label="后台导航">
            {NAV_GROUPS.map((group) => (
              <Sidebar.MenuSection key={group.label}>
                <Sidebar.MenuHeader>{group.label}</Sidebar.MenuHeader>
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    pathname={pathname}
                  />
                ))}
              </Sidebar.MenuSection>
            ))}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-8">
            {avatarUrl ? (
              <Avatar.Image alt={`${username} 头像`} src={avatarUrl} />
            ) : null}
            <Avatar.Fallback>{getUserInitials(username)}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1" data-sidebar="label">
            <span className="text-muted block text-xs">平台管理员</span>
            <span className="block truncate text-sm font-semibold">
              {username}
            </span>
          </div>
          <IconButton
            label="退出"
            size="sm"
            variant="tertiary"
            onPress={logout}
          >
            <AdminIcon className="size-4" name="logout" />
          </IconButton>
        </div>
      </Sidebar.Footer>
    </>
  );
}

function SidebarNavItem({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const isCurrent =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Sidebar.MenuItem
      href={item.href}
      id={`nav-${item.key}`}
      isCurrent={isCurrent}
      textValue={item.label}
      tooltip={item.label}
    >
      <Sidebar.MenuIcon>
        <AdminIcon className="size-4" name={item.icon} />
      </Sidebar.MenuIcon>
      <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
    </Sidebar.MenuItem>
  );
}

function IconButton({
  children,
  label,
  ...buttonProps
}: {
  children: ReactNode;
  label: string;
} & Omit<ComponentProps<typeof Button>, "children" | "isIconOnly">) {
  return (
    <Tooltip delay={0}>
      <Button isIconOnly aria-label={label} {...buttonProps}>
        {children}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

function getUserInitials(value: string) {
  return Array.from(value.trim() || "CB")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
