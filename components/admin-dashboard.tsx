"use client";

import type { DataGridColumn } from "@heroui-pro/react";

import { Avatar, Button, Card, Chip, SearchField } from "@heroui/react";
import { DataGrid, KPI } from "@heroui-pro/react";
import { useRouter } from "next/navigation";

import { AdminIcon } from "@/components/admin-icons";

const KPI_CARDS = [
  { label: "用户总数", trend: "up", trendValue: "+36 本周", value: 1284 },
  { label: "启用模型", trend: "up", trendValue: "+2 已发布", value: 7 },
  { label: "在线 Agent", trend: "up", trendValue: "18 运行中", value: 23 },
  { label: "待处理变更", trend: "down", trendValue: "-3 今日", value: 4 },
] as const;

const MANAGEMENT_AREAS = [
  {
    description: "账号、角色、组织空间与访问策略的统一入口。",
    href: "/users",
    icon: "users",
    items: ["企业用户审核", "角色与权限组", "成员状态与封禁"],
    metric: "1,284",
    metricLabel: "总账号",
    status: "可配置",
    statusColor: "success",
    title: "用户与权限",
  },
  {
    description: "维护可用模型、供应商、默认路由和降级策略。",
    href: "/models",
    icon: "model",
    items: ["默认模型路由", "供应商密钥占位", "调用限额策略"],
    metric: "7",
    metricLabel: "已启用模型",
    status: "接口待接入",
    statusColor: "warning",
    title: "模型配置",
  },
  {
    description: "管理 Agent 模板、工具授权、触发条件与发布状态。",
    href: "/agents",
    icon: "agent",
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

export function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
            <AdminIcon className="size-4" name="activity" />
            同步状态
          </Button>
          <Button size="sm">
            <AdminIcon className="size-4" name="plus" />
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
          <Card key={area.href}>
            <Card.Header>
              <div className="flex w-full items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <AdminIcon className="size-5" name={area.icon} />
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
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => router.push(area.href)}
                >
                  进入配置
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => router.push("/audit")}
                >
                  查看审计
                </Button>
              </div>
            </Card.Footer>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-3">
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

        <Card>
          <Card.Header>
            <Card.Title className="text-base">系统运行概览</Card.Title>
            <Card.Description className="text-xs">
              先展示管理员最常看的运行面板占位。
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-4">
              <HealthRow label="API 网关" tone="success" value="正常" />
              <HealthRow label="模型供应商" tone="warning" value="2 项待配置" />
              <HealthRow label="Agent 调度器" tone="success" value="运行中" />
              <HealthRow label="审计归档" tone="secondary" value="未接入" />
            </div>
          </Card.Content>
          <Card.Footer>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => router.push("/settings")}
            >
              查看系统设置
            </Button>
          </Card.Footer>
        </Card>
      </section>
    </div>
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
