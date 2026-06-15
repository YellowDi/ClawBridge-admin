"use client";

import type { SVGProps } from "react";
import type { DataGridColumn } from "@heroui-pro/react";

import {
  Avatar,
  Button,
  Card,
  Chip,
  SearchField,
  Tooltip,
} from "@heroui/react";
import { AppLayout, DataGrid, KPI, Navbar, Sidebar } from "@heroui-pro/react";

type IconName =
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

const ICON_PATHS: Record<IconName, string[]> = {
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

type NavItem = {
  key: string;
  href: string;
  icon: IconName;
  label: string;
  badge?: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "#overview", icon: "dashboard", key: "overview", label: "总览" },
  {
    badge: "12",
    href: "#users",
    icon: "users",
    key: "users",
    label: "用户管理",
  },
  { href: "#models", icon: "model", key: "models", label: "模型配置" },
  { href: "#agents", icon: "agent", key: "agents", label: "Agent 编排" },
  { href: "#tools", icon: "tool", key: "tools", label: "工具与权限" },
  { href: "#audit", icon: "audit", key: "audit", label: "审计日志" },
] as const;

const FOOTER_ITEMS: readonly NavItem[] = [
  { href: "#tools", icon: "settings", key: "settings", label: "系统设置" },
  { href: "#security", icon: "shield", key: "security", label: "安全策略" },
] as const;

const KPI_CARDS = [
  { label: "用户总数", trend: "up", trendValue: "+36 本周", value: 1284 },
  { label: "启用模型", trend: "up", trendValue: "+2 已发布", value: 7 },
  { label: "在线 Agent", trend: "up", trendValue: "18 运行中", value: 23 },
  { label: "待处理变更", trend: "down", trendValue: "-3 今日", value: 4 },
] as const;

const MANAGEMENT_AREAS = [
  {
    description: "账号、角色、组织空间与访问策略的统一入口。",
    icon: "users",
    id: "users",
    items: ["企业用户审核", "角色与权限组", "成员状态与封禁"],
    metric: "1,284",
    metricLabel: "总账号",
    status: "可配置",
    statusColor: "success",
    title: "用户与权限",
  },
  {
    description: "维护可用模型、供应商、默认路由和降级策略。",
    icon: "model",
    id: "models",
    items: ["默认模型路由", "供应商密钥占位", "调用限额策略"],
    metric: "7",
    metricLabel: "已启用模型",
    status: "接口待接入",
    statusColor: "warning",
    title: "模型配置",
  },
  {
    description: "管理 Agent 模板、工具授权、触发条件与发布状态。",
    icon: "agent",
    id: "agents",
    items: ["Agent 模板库", "工具权限矩阵", "发布前检查"],
    metric: "23",
    metricLabel: "Agent 模板",
    status: "前端就绪",
    statusColor: "success",
    title: "Agent 编排",
  },
] as const;

type ChangeStatus = "已发布" | "待审核" | "草稿";

type ChangeLog = {
  id: string;
  target: string;
  type: string;
  owner: string;
  status: ChangeStatus;
  updatedAt: string;
};

const CHANGE_LOGS: ChangeLog[] = [
  {
    id: "chg-1042",
    owner: "Rolly",
    status: "已发布",
    target: "默认模型路由",
    type: "模型配置",
    updatedAt: "今天 14:20",
  },
  {
    id: "chg-1041",
    owner: "Ops",
    status: "待审核",
    target: "企业管理员权限组",
    type: "用户权限",
    updatedAt: "今天 11:05",
  },
  {
    id: "chg-1040",
    owner: "Agent Team",
    status: "草稿",
    target: "采购分析 Agent",
    type: "Agent 模板",
    updatedAt: "昨天 18:42",
  },
  {
    id: "chg-1039",
    owner: "Security",
    status: "已发布",
    target: "工具调用白名单",
    type: "工具权限",
    updatedAt: "昨天 10:16",
  },
];

const STATUS_COLOR: Record<ChangeStatus, "default" | "success" | "warning"> = {
  已发布: "success",
  待审核: "warning",
  草稿: "default",
};

const CHANGE_COLUMNS: DataGridColumn<ChangeLog>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.target}</span>
        <span className="text-muted truncate text-xs">{item.id}</span>
      </div>
    ),
    header: "对象",
    id: "target",
    isRowHeader: true,
    minWidth: 210,
  },
  {
    accessorKey: "type",
    allowsSorting: true,
    header: "类型",
    id: "type",
    minWidth: 120,
  },
  {
    cell: (item) => (
      <div className="flex items-center gap-2">
        <Avatar className="size-7">
          <Avatar.Fallback>
            {item.owner.slice(0, 2).toUpperCase()}
          </Avatar.Fallback>
        </Avatar>
        <span className="text-xs">{item.owner}</span>
      </div>
    ),
    header: "负责人",
    id: "owner",
    minWidth: 140,
  },
  {
    cell: (item) => (
      <Chip color={STATUS_COLOR[item.status]} size="sm" variant="soft">
        {item.status}
      </Chip>
    ),
    header: "状态",
    id: "status",
    minWidth: 110,
  },
  {
    accessorKey: "updatedAt",
    align: "end",
    allowsSorting: true,
    cell: (item) => (
      <span className="text-muted text-xs tabular-nums">{item.updatedAt}</span>
    ),
    header: "更新时间",
    id: "updatedAt",
    minWidth: 130,
  },
];

const CHECKLIST = [
  { label: "基础导航与响应式布局", state: "完成" },
  { label: "用户、模型、Agent 管理入口", state: "完成" },
  { label: "真实接口与权限校验", state: "待接入" },
  { label: "审计日志筛选与导出", state: "待接入" },
] as const;

export function AdminDashboard() {
  return (
    <AppLayout
      aside={<AdminAside />}
      navbar={<AdminNavbar />}
      scrollMode="page"
      sidebar={<AdminSidebar />}
      sidebarCollapsible="offcanvas"
      sidebarVariant="inset"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          id="overview"
        >
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Chip color="success" size="sm" variant="soft">
                Admin Preview
              </Chip>
              <span className="text-muted text-xs">前端静态阶段</span>
            </div>
            <h1 className="text-foreground text-2xl font-semibold tracking-normal sm:text-3xl">
              ClawBridge 管理后台
            </h1>
            <p className="text-muted mt-2 max-w-2xl text-sm">
              面向运营和技术管理员的统一控制台，先覆盖用户、模型、Agent
              与审计的核心工作区。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="tertiary">
              <Icon className="size-4" name="activity" />
              同步状态
            </Button>
            <Button size="sm">
              <Icon className="size-4" name="plus" />
              新增配置
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_CARDS.map((item) => (
            <KPI key={item.label}>
              <KPI.Header>
                <KPI.Title>{item.label}</KPI.Title>
              </KPI.Header>
              <KPI.Content>
                <KPI.Value
                  maximumFractionDigits={0}
                  style="decimal"
                  value={item.value}
                />
                <KPI.Trend trend={item.trend}>{item.trendValue}</KPI.Trend>
              </KPI.Content>
            </KPI>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {MANAGEMENT_AREAS.map((area) => (
            <Card key={area.id} id={area.id}>
              <Card.Header>
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <Icon className="size-5" name={area.icon} />
                    </div>
                    <div className="min-w-0">
                      <Card.Title className="truncate text-base">
                        {area.title}
                      </Card.Title>
                      <Card.Description className="line-clamp-2 text-xs">
                        {area.description}
                      </Card.Description>
                    </div>
                  </div>
                  <Chip color={area.statusColor} size="sm" variant="soft">
                    {area.status}
                  </Chip>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-foreground text-2xl font-semibold tabular-nums">
                      {area.metric}
                    </div>
                    <div className="text-muted text-xs">{area.metricLabel}</div>
                  </div>
                  <span className="bg-surface-secondary text-muted rounded-lg px-2 py-1 text-xs">
                    配置中心
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {area.items.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <span className="bg-success size-1.5 shrink-0 rounded-full" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </Card.Content>
              <Card.Footer>
                <div className="flex w-full flex-wrap items-center gap-2">
                  <Button size="sm" variant="tertiary">
                    进入配置
                  </Button>
                  <Button size="sm" variant="ghost">
                    查看审计
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-3" id="audit">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-foreground text-base font-semibold">
                  近期配置变更
                </h2>
                <p className="text-muted text-xs">
                  后续接入接口后可切换为真实审计记录。
                </p>
              </div>
              <SearchField
                aria-label="搜索配置变更"
                className="w-full sm:w-[260px]"
              >
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="搜索对象、类型或负责人" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </div>
            <DataGrid
              aria-label="近期配置变更"
              className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
              columns={CHANGE_COLUMNS}
              contentClassName="min-w-[720px]"
              data={CHANGE_LOGS}
              defaultSortDescriptor={{
                column: "updatedAt",
                direction: "descending",
              }}
              getRowId={(item) => item.id}
            />
          </div>

          <Card id="tools">
            <Card.Header>
              <Card.Title className="text-base">系统运行概览</Card.Title>
              <Card.Description className="text-xs">
                先展示管理员最常看的运行面板占位。
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-col gap-4">
                <HealthRow label="API 网关" tone="success" value="正常" />
                <HealthRow
                  label="模型供应商"
                  tone="warning"
                  value="2 项待配置"
                />
                <HealthRow label="Agent 调度器" tone="success" value="运行中" />
                <HealthRow label="审计归档" tone="secondary" value="未接入" />
              </div>
            </Card.Content>
            <Card.Footer>
              <Button size="sm" variant="tertiary">
                查看系统设置
              </Button>
            </Card.Footer>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

function AdminNavbar() {
  return (
    <Navbar maxWidth="full">
      <Navbar.Header>
        <AppLayout.MenuToggle />
        <Sidebar.Trigger />
        <div className="flex min-w-0 flex-col">
          <span className="text-foreground truncate text-sm font-semibold sm:text-base">
            ClawBridge Admin
          </span>
          <span className="text-muted hidden text-xs sm:block">管理控制台</span>
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
          生产环境
        </Chip>
        <IconButton label="通知">
          <Icon className="size-4" name="bell" />
        </IconButton>
        <AppLayout.AsideTrigger />
        <Button className="hidden sm:inline-flex" size="sm">
          <Icon className="size-4" name="plus" />
          新增配置
        </Button>
      </Navbar.Header>
    </Navbar>
  );
}

function AdminSidebar() {
  return (
    <>
      <Sidebar>
        <SidebarContents />
      </Sidebar>
      <Sidebar.Mobile>
        <SidebarContents />
      </Sidebar.Mobile>
    </>
  );
}

function SidebarContents() {
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
              <SidebarNavItem key={item.key} item={item} />
            ))}
          </Sidebar.Menu>
        </Sidebar.Group>
      </Sidebar.Content>
      <Sidebar.Footer>
        <Sidebar.Menu aria-label="后台设置">
          {FOOTER_ITEMS.map((item) => (
            <SidebarNavItem key={item.key} item={item} />
          ))}
        </Sidebar.Menu>
      </Sidebar.Footer>
    </>
  );
}

function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <Sidebar.MenuItem
      href={item.href}
      id={`nav-${item.key}`}
      isCurrent={item.key === "overview"}
      textValue={item.label}
    >
      <Sidebar.MenuIcon>
        <Icon className="size-4" name={item.icon} />
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

function AdminAside() {
  return (
    <aside className="flex h-full w-[320px] flex-col gap-4 p-4" id="security">
      <div>
        <h2 className="text-foreground text-sm font-semibold">上线检查</h2>
        <p className="text-muted mt-1 text-xs">
          跟踪后台首版页面与后续接口接入状态。
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {CHECKLIST.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-3"
          >
            <div className="flex min-w-0 items-start gap-2">
              <span
                className={
                  item.state === "完成"
                    ? "bg-success mt-1.5 size-2 shrink-0 rounded-full"
                    : "bg-warning mt-1.5 size-2 shrink-0 rounded-full"
                }
              />
              <span className="text-foreground text-sm leading-5">
                {item.label}
              </span>
            </div>
            <Chip
              color={item.state === "完成" ? "success" : "warning"}
              size="sm"
              variant="soft"
            >
              {item.state}
            </Chip>
          </div>
        ))}
      </div>
      <div className="bg-surface-secondary mt-2 rounded-2xl p-4">
        <div className="text-foreground text-sm font-medium">下一步优先级</div>
        <p className="text-muted mt-2 text-xs leading-5">
          接口完成后，优先替换用户列表、模型路由和 Agent
          模板三块数据源，再补充权限拦截。
        </p>
      </div>
    </aside>
  );
}

function HealthRow({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "secondary" | "success" | "warning";
  value: string;
}) {
  const dotClass =
    tone === "success"
      ? "bg-success"
      : tone === "warning"
        ? "bg-warning"
        : "bg-muted";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className={`${dotClass} size-2 shrink-0 rounded-full`} />
        <span className="text-foreground truncate text-sm">{label}</span>
      </div>
      <span className="text-muted shrink-0 text-xs">{value}</span>
    </div>
  );
}

function IconButton({
  children,
  label,
}: {
  children: React.ReactNode;
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

function Icon({
  className,
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
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
