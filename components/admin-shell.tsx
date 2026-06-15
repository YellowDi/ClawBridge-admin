"use client";

import type { ReactNode } from "react";
import type { AdminIconName } from "@/components/admin-icons";

import { Avatar, Button, Chip, SearchField, Tooltip } from "@heroui/react";
import { AppLayout, Navbar, Sidebar } from "@heroui-pro/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { useAuth } from "@/components/auth-provider";

type NavItem = {
  key: string;
  href: string;
  icon: AdminIconName;
  label: string;
  badge?: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", icon: "dashboard", key: "overview", label: "总览" },
  {
    badge: "12",
    href: "/users",
    icon: "users",
    key: "users",
    label: "用户管理",
  },
  { href: "/models", icon: "model", key: "models", label: "模型配置" },
  { href: "/agents", icon: "agent", key: "agents", label: "Agent 编排" },
  { href: "/tools", icon: "tool", key: "tools", label: "工具与权限" },
  { href: "/audit", icon: "audit", key: "audit", label: "审计日志" },
] as const;

const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "/settings", icon: "settings", key: "settings", label: "系统设置" },
  { href: "/security", icon: "shield", key: "security", label: "安全策略" },
] as const;

const ALL_NAV_ITEMS: readonly NavItem[] = [...NAV_ITEMS, ...FOOTER_ITEMS];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = useCallback((href: string) => router.push(href), [router]);

  const title = useMemo(() => {
    if (pathname === "/") return "总览";

    const matched = ALL_NAV_ITEMS.find(
      (item) => item.href !== "/" && pathname.startsWith(item.href),
    );

    return matched?.label ?? "ClawBridge Admin";
  }, [pathname]);
  const navbar = useMemo(() => <AdminNavbar title={title} />, [title]);
  const sidebar = useMemo(
    () => <AdminSidebar pathname={pathname} />,
    [pathname],
  );

  return (
    <AppLayout
      navbar={navbar}
      navigate={navigate}
      scrollMode="page"
      sidebar={sidebar}
      sidebarCollapsible="offcanvas"
      sidebarVariant="inset"
    >
      {children}
    </AppLayout>
  );
}

function AdminNavbar({ title }: { title: string }) {
  const { logout, session } = useAuth();
  const username = session?.user?.username ?? "已登录";

  return (
    <Navbar maxWidth="full">
      <Navbar.Header>
        <AppLayout.MenuToggle />
        <Sidebar.Trigger />
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-semibold sm:text-base">
            {title}
          </span>
          <span className="text-muted hidden text-xs sm:block">
            ClawBridge Admin
          </span>
        </div>
        <Navbar.Spacer />
        <SearchField
          aria-label="搜索后台资源"
          className="hidden w-[260px] md:block"
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="搜索用户、模型、Agent" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <Chip
          className="hidden sm:inline-flex"
          color="success"
          size="sm"
          variant="soft"
        >
          {username}
        </Chip>
        <IconButton label="通知">
          <AdminIcon className="size-4" name="bell" />
        </IconButton>
        <Button className="hidden sm:inline-flex" size="sm">
          <AdminIcon className="size-4" name="plus" />
          新增配置
        </Button>
        <Button size="sm" variant="tertiary" onPress={logout}>
          退出
        </Button>
      </Navbar.Header>
    </Navbar>
  );
}

function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <>
      <Sidebar>
        <SidebarContents pathname={pathname} />
      </Sidebar>
      <Sidebar.Mobile>
        <SidebarContents pathname={pathname} />
      </Sidebar.Mobile>
    </>
  );
}

function SidebarContents({ pathname }: { pathname: string }) {
  return (
    <>
      <Sidebar.Header>
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar className="size-9">
            <Avatar.Fallback>CB</Avatar.Fallback>
          </Avatar>
          <div className="flex min-w-0 flex-col" data-sidebar="label">
            <span className="text-foreground truncate text-sm font-medium leading-tight">
              ClawBridge
            </span>
            <span className="text-muted truncate text-xs font-medium leading-tight">
              Admin Console
            </span>
          </div>
        </div>
      </Sidebar.Header>
      <Sidebar.Content>
        <Sidebar.Group>
          <Sidebar.Menu aria-label="后台导航">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem key={item.key} item={item} pathname={pathname} />
            ))}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Menu aria-label="后台设置">
          {FOOTER_ITEMS.map((item) => (
            <SidebarNavItem key={item.key} item={item} pathname={pathname} />
          ))}
        </Sidebar.Menu>
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
    >
      <Sidebar.MenuIcon>
        <AdminIcon className="size-4" name={item.icon} />
      </Sidebar.MenuIcon>
      <Sidebar.MenuLabel>{item.label}</Sidebar.MenuLabel>
      {item.badge ? (
        <Sidebar.MenuChip>
          <Chip color="warning" size="sm" variant="soft">
            {item.badge}
          </Chip>
        </Sidebar.MenuChip>
      ) : null}
    </Sidebar.MenuItem>
  );
}

function IconButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Tooltip delay={0}>
      <Button isIconOnly aria-label={label} size="sm" variant="tertiary">
        {children}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}
