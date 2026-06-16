"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { AdminIconName } from "@/components/admin-icons";
import type { Agent, Model, User } from "@/lib/api";

import { Button, Card, Chip } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { listAgents, listModels, listUsers } from "@/lib/api";

type DashboardTone = "accent" | "danger" | "secondary" | "success" | "warning";

type DashboardLoadState = {
  agents: Agent[];
  agentsError: string | null;
  isLoading: boolean;
  models: Model[];
  modelsError: string | null;
  users: User[];
  usersError: string | null;
};

type EntityStats = {
  agents: {
    defaultModels: number;
    disabled: number;
    enabled: number;
    total: number;
    withDefaultModel: number;
  };
  models: {
    disabled: number;
    enabled: number;
    providers: number;
    total: number;
  };
  users: {
    admin: number;
    disabled: number;
    enabled: number;
    total: number;
  };
};

type DashboardMetric = {
  error: string | null;
  helper: string;
  label: string;
  tone?: DashboardTone;
  value: string;
};

type ManagementArea = {
  description: string;
  href: string;
  icon: AdminIconName;
  items: string[];
  metric: string;
  metricLabel: string;
  status: string;
  statusColor: "danger" | "success" | "warning";
  title: string;
};

type RecentItem = {
  id: string;
  name: string;
  status: string;
  statusColor: "danger" | "success";
  timestamp: number;
  type: "Agent" | "模型" | "用户";
  updatedAt: string;
};

const INITIAL_DASHBOARD_STATE: DashboardLoadState = {
  agents: [],
  agentsError: null,
  isLoading: true,
  models: [],
  modelsError: null,
  users: [],
  usersError: null,
};

const COUNT_FORMATTER = new Intl.NumberFormat("zh-CN");

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const RECENT_COLUMNS: DataGridColumn<RecentItem>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.name}</span>
        <span className="text-muted truncate text-xs">{item.id}</span>
      </div>
    ),
    header: "对象",
    id: "name",
    isRowHeader: true,
    minWidth: 220,
  },
  {
    accessorKey: "type",
    allowsSorting: true,
    header: "类型",
    id: "type",
    minWidth: 100,
  },
  {
    cell: (item) => (
      <Chip color={item.statusColor} size="sm" variant="soft">
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
    minWidth: 150,
  },
];

export function AdminDashboard() {
  const router = useRouter();
  const isMountedRef = useRef(false);
  const [loadState, setLoadState] = useState<DashboardLoadState>(
    INITIAL_DASHBOARD_STATE,
  );

  const loadDashboardData = useCallback(async () => {
    setLoadState((state) => ({
      ...state,
      agentsError: null,
      isLoading: true,
      modelsError: null,
      usersError: null,
    }));

    const [usersResult, modelsResult, agentsResult] = await Promise.allSettled([
      listUsers(),
      listModels(),
      listAgents(),
    ]);

    if (!isMountedRef.current) return;

    setLoadState({
      agents: getSettledData(agentsResult),
      agentsError: getSettledError(agentsResult, "Agent 数据加载失败。"),
      isLoading: false,
      models: getSettledData(modelsResult),
      modelsError: getSettledError(modelsResult, "模型数据加载失败。"),
      users: getSettledData(usersResult),
      usersError: getSettledError(usersResult, "用户数据加载失败。"),
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadDashboardData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDashboardData]);

  const stats = useMemo(() => getEntityStats(loadState), [loadState]);
  const metrics = useMemo(
    () => getDashboardMetrics(loadState, stats),
    [loadState, stats],
  );
  const managementAreas = useMemo(
    () => getManagementAreas(loadState, stats),
    [loadState, stats],
  );
  const recentItems = useMemo(
    () => getRecentItems(loadState.users, loadState.models, loadState.agents),
    [loadState.agents, loadState.models, loadState.users],
  );
  const hasError = Boolean(
    loadState.usersError || loadState.modelsError || loadState.agentsError,
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Chip
              color={hasError ? "warning" : "success"}
              size="sm"
              variant="soft"
            >
              {hasError ? "部分接口异常" : "实时数据"}
            </Chip>
            <span className="text-muted text-xs">
              用户、模型、Agent 接口统计
            </span>
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-normal sm:text-3xl">
            ClawBridge 管理后台
          </h1>
          <p className="text-muted mt-2 max-w-2xl text-sm">
            总览页现在展示已接入接口的实时数据；审计和系统健康未接入前不再展示模拟指标。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            isDisabled={loadState.isLoading}
            size="sm"
            variant="tertiary"
            onPress={() => void loadDashboardData()}
          >
            <AdminIcon className="size-4" name="activity" />
            {loadState.isLoading ? "同步中..." : "刷新数据"}
          </Button>
          <Button size="sm" onPress={() => router.push("/models")}>
            <AdminIcon className="size-4" name="model" />
            进入模型配置
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <DashboardStatCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {managementAreas.map((area) => (
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
                  实时接口
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
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => router.push(area.href)}
              >
                进入配置
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 className="text-foreground text-base font-semibold">
              最近更新
            </h2>
            <p className="text-muted text-xs">
              来自用户、模型和 Agent 列表接口，按更新时间排序。
            </p>
          </div>
          <DataGrid
            aria-label="最近更新"
            className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
            columns={RECENT_COLUMNS}
            contentClassName="min-w-[620px]"
            data={recentItems}
            defaultSortDescriptor={{
              column: "updatedAt",
              direction: "descending",
            }}
            getRowId={(item) => item.id}
            renderEmptyState={() => getRecentEmptyState(loadState)}
          />
        </div>

        <Card>
          <Card.Header>
            <Card.Title className="text-base">接口同步状态</Card.Title>
            <Card.Description className="text-xs">
              仅展示当前总览页依赖的真实接口。
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-4">
              <HealthRow
                label="用户管理"
                tone={getResourceTone(
                  loadState.isLoading,
                  loadState.usersError,
                )}
                value={getResourceValue(
                  loadState.isLoading,
                  loadState.usersError,
                  `${formatCount(stats.users.total)} 个用户`,
                )}
              />
              <HealthRow
                label="模型配置"
                tone={getResourceTone(
                  loadState.isLoading,
                  loadState.modelsError,
                )}
                value={getResourceValue(
                  loadState.isLoading,
                  loadState.modelsError,
                  `${formatCount(stats.models.total)} 个模型`,
                )}
              />
              <HealthRow
                label="Agent 编排"
                tone={getResourceTone(
                  loadState.isLoading,
                  loadState.agentsError,
                )}
                value={getResourceValue(
                  loadState.isLoading,
                  loadState.agentsError,
                  `${formatCount(stats.agents.total)} 个 Agent`,
                )}
              />
              <HealthRow label="审计记录" tone="secondary" value="未接入" />
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

function DashboardStatCard({ metric }: { metric: DashboardMetric }) {
  return (
    <Card>
      <Card.Header>
        <div className="flex w-full items-center justify-between gap-3">
          <Card.Title className="text-sm">{metric.label}</Card.Title>
          {metric.error ? (
            <Chip color="danger" size="sm" variant="soft">
              异常
            </Chip>
          ) : null}
        </div>
      </Card.Header>
      <Card.Content>
        <div className="text-foreground text-2xl font-semibold tabular-nums">
          {metric.value}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`${getToneDotClass(metric.error ? "danger" : metric.tone)} size-1.5 shrink-0 rounded-full`}
          />
          <span className="text-muted text-xs">{metric.helper}</span>
        </div>
      </Card.Content>
    </Card>
  );
}

function HealthRow({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "secondary" | "success" | "warning";
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`${getToneDotClass(tone)} size-2 shrink-0 rounded-full`}
        />
        <span className="text-foreground truncate text-sm">{label}</span>
      </div>
      <span className="text-muted shrink-0 text-xs">{value}</span>
    </div>
  );
}

function getEntityStats({
  agents,
  models,
  users,
}: DashboardLoadState): EntityStats {
  const providers = Array.from(
    new Set(
      models
        .map((model) => model.provider?.trim())
        .filter((provider): provider is string => Boolean(provider)),
    ),
  );
  const defaultModels = Array.from(
    new Set(
      agents
        .map((agent) => agent.defaultModelid?.trim())
        .filter((modelId): modelId is string => Boolean(modelId)),
    ),
  );

  return {
    agents: {
      defaultModels: defaultModels.length,
      disabled: agents.filter((agent) => agent.enabled === false).length,
      enabled: agents.filter((agent) => agent.enabled !== false).length,
      total: agents.length,
      withDefaultModel: agents.filter((agent) => agent.defaultModelid?.trim())
        .length,
    },
    models: {
      disabled: models.filter((model) => model.enabled === false).length,
      enabled: models.filter((model) => model.enabled !== false).length,
      providers: providers.length,
      total: models.length,
    },
    users: {
      admin: users.filter((user) => user.isAdmin === true).length,
      disabled: users.filter((user) => user.enabled === false).length,
      enabled: users.filter((user) => user.enabled !== false).length,
      total: users.length,
    },
  };
}

function getDashboardMetrics(
  loadState: DashboardLoadState,
  stats: EntityStats,
): DashboardMetric[] {
  return [
    {
      error: loadState.usersError,
      helper: getMetricHelper(
        loadState.isLoading,
        loadState.usersError,
        `启用 ${formatCount(stats.users.enabled)} / 停用 ${formatCount(
          stats.users.disabled,
        )}`,
      ),
      label: "用户总数",
      value: formatMetricValue(
        stats.users.total,
        loadState.isLoading,
        loadState.usersError,
      ),
    },
    {
      error: loadState.modelsError,
      helper: getMetricHelper(
        loadState.isLoading,
        loadState.modelsError,
        `总模型 ${formatCount(stats.models.total)} / 供应商 ${formatCount(
          stats.models.providers,
        )}`,
      ),
      label: "启用模型",
      tone: "accent",
      value: formatMetricValue(
        stats.models.enabled,
        loadState.isLoading,
        loadState.modelsError,
      ),
    },
    {
      error: loadState.agentsError,
      helper: getMetricHelper(
        loadState.isLoading,
        loadState.agentsError,
        `总数 ${formatCount(stats.agents.total)} / 停用 ${formatCount(
          stats.agents.disabled,
        )}`,
      ),
      label: "启用 Agent",
      tone: "accent",
      value: formatMetricValue(
        stats.agents.enabled,
        loadState.isLoading,
        loadState.agentsError,
      ),
    },
    {
      error: loadState.agentsError,
      helper: getMetricHelper(
        loadState.isLoading,
        loadState.agentsError,
        `覆盖 ${formatCount(stats.agents.withDefaultModel)} / ${formatCount(
          stats.agents.total,
        )} 个 Agent`,
      ),
      label: "默认模型绑定",
      tone: "warning",
      value: formatMetricValue(
        stats.agents.defaultModels,
        loadState.isLoading,
        loadState.agentsError,
      ),
    },
  ];
}

function getManagementAreas(
  loadState: DashboardLoadState,
  stats: EntityStats,
): ManagementArea[] {
  return [
    {
      description: "账号、管理员身份和账号启停状态的统一入口。",
      href: "/users",
      icon: "users",
      items: [
        `启用账号：${formatInlineCount(
          stats.users.enabled,
          loadState.isLoading,
          loadState.usersError,
        )}`,
        `管理员：${formatInlineCount(
          stats.users.admin,
          loadState.isLoading,
          loadState.usersError,
        )}`,
        `已停用：${formatInlineCount(
          stats.users.disabled,
          loadState.isLoading,
          loadState.usersError,
        )}`,
      ],
      metric: formatMetricValue(
        stats.users.total,
        loadState.isLoading,
        loadState.usersError,
      ),
      metricLabel: "总账号",
      status: getAreaStatus(loadState.isLoading, loadState.usersError),
      statusColor: getAreaStatusColor(
        loadState.isLoading,
        loadState.usersError,
      ),
      title: "用户与权限",
    },
    {
      description: "维护可用模型、供应商、价格和启用状态。",
      href: "/models",
      icon: "model",
      items: [
        `总模型：${formatInlineCount(
          stats.models.total,
          loadState.isLoading,
          loadState.modelsError,
        )}`,
        `供应商：${formatInlineCount(
          stats.models.providers,
          loadState.isLoading,
          loadState.modelsError,
        )}`,
        `已停用：${formatInlineCount(
          stats.models.disabled,
          loadState.isLoading,
          loadState.modelsError,
        )}`,
      ],
      metric: formatMetricValue(
        stats.models.enabled,
        loadState.isLoading,
        loadState.modelsError,
      ),
      metricLabel: "已启用模型",
      status: getAreaStatus(loadState.isLoading, loadState.modelsError),
      statusColor: getAreaStatusColor(
        loadState.isLoading,
        loadState.modelsError,
      ),
      title: "模型配置",
    },
    {
      description: "管理 Agent 标识、默认模型、推理配置和启用状态。",
      href: "/agents",
      icon: "agent",
      items: [
        `启用 Agent：${formatInlineCount(
          stats.agents.enabled,
          loadState.isLoading,
          loadState.agentsError,
        )}`,
        `默认模型：${formatInlineCount(
          stats.agents.defaultModels,
          loadState.isLoading,
          loadState.agentsError,
        )}`,
        `已停用：${formatInlineCount(
          stats.agents.disabled,
          loadState.isLoading,
          loadState.agentsError,
        )}`,
      ],
      metric: formatMetricValue(
        stats.agents.total,
        loadState.isLoading,
        loadState.agentsError,
      ),
      metricLabel: "Agent 总数",
      status: getAreaStatus(loadState.isLoading, loadState.agentsError),
      statusColor: getAreaStatusColor(
        loadState.isLoading,
        loadState.agentsError,
      ),
      title: "Agent 编排",
    },
  ];
}

function getRecentItems(
  users: User[],
  models: Model[],
  agents: Agent[],
): RecentItem[] {
  return [
    ...users.map((user, index): RecentItem => {
      const id = user.id == null ? `user-${index}` : `user-${user.id}`;
      const timestamp = getTimestamp(user.updatedAt ?? user.createdAt);

      return {
        id,
        name: user.username?.trim() || `用户 ${user.id ?? index + 1}`,
        status: user.enabled === false ? "已停用" : "正常",
        statusColor: user.enabled === false ? "danger" : "success",
        timestamp,
        type: "用户" as const,
        updatedAt: formatDateTime(user.updatedAt ?? user.createdAt),
      };
    }),
    ...models.map((model, index): RecentItem => {
      const id = model.id == null ? `model-${index}` : `model-${model.id}`;
      const timestamp = getTimestamp(model.updatedAt ?? model.createdAt);

      return {
        id,
        name:
          model.displayName?.trim() ||
          model.modelid?.trim() ||
          `模型 ${model.id ?? index + 1}`,
        status: model.enabled === false ? "停用" : "启用",
        statusColor: model.enabled === false ? "danger" : "success",
        timestamp,
        type: "模型" as const,
        updatedAt: formatDateTime(model.updatedAt ?? model.createdAt),
      };
    }),
    ...agents.map((agent, index): RecentItem => {
      const agentId = agent.agentId?.trim() || `agent-${agent.id ?? index + 1}`;
      const id = agent.id == null ? `agent-${agentId}` : `agent-${agent.id}`;
      const timestamp = getTimestamp(agent.updatedAt ?? agent.createdAt);

      return {
        id,
        name: agent.displayName?.trim() || agentId,
        status: agent.enabled === false ? "停用" : "启用",
        statusColor: agent.enabled === false ? "danger" : "success",
        timestamp,
        type: "Agent" as const,
        updatedAt: formatDateTime(agent.updatedAt ?? agent.createdAt),
      };
    }),
  ]
    .sort((left, right) => {
      if (right.timestamp !== left.timestamp) {
        return right.timestamp - left.timestamp;
      }

      return left.name.localeCompare(right.name, "zh-CN");
    })
    .slice(0, 6);
}

function getSettledData<T>(result: PromiseSettledResult<T[]>): T[] {
  return result.status === "fulfilled" ? result.value : [];
}

function getSettledError<T>(
  result: PromiseSettledResult<T[]>,
  fallback: string,
) {
  return result.status === "rejected"
    ? getDashboardListError(result.reason, fallback)
    : null;
}

function getDashboardListError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}

function getMetricHelper(
  isLoading: boolean,
  error: string | null,
  helper: string,
) {
  if (isLoading) return "正在加载...";
  if (error) return error;

  return helper;
}

function formatMetricValue(
  value: number,
  isLoading: boolean,
  error: string | null,
) {
  if (isLoading || error) return "-";

  return formatCount(value);
}

function formatInlineCount(
  value: number,
  isLoading: boolean,
  error: string | null,
) {
  if (isLoading || error) return "-";

  return formatCount(value);
}

function formatCount(value: number) {
  return COUNT_FORMATTER.format(value);
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function getTimestamp(value?: string) {
  if (!value) return 0;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getRecentEmptyState(loadState: DashboardLoadState) {
  if (loadState.isLoading) return "正在加载最近更新...";

  if (loadState.usersError && loadState.modelsError && loadState.agentsError) {
    return "用户、模型和 Agent 数据均加载失败。";
  }

  return "暂无最近更新。";
}

function getAreaStatus(isLoading: boolean, error: string | null) {
  if (isLoading) return "同步中";
  if (error) return "异常";

  return "已接入";
}

function getAreaStatusColor(
  isLoading: boolean,
  error: string | null,
): "danger" | "success" | "warning" {
  if (isLoading) return "warning";
  if (error) return "danger";

  return "success";
}

function getResourceTone(
  isLoading: boolean,
  error: string | null,
): "danger" | "success" | "warning" {
  if (isLoading) return "warning";
  if (error) return "danger";

  return "success";
}

function getResourceValue(
  isLoading: boolean,
  error: string | null,
  successValue: string,
) {
  if (isLoading) return "加载中";
  if (error) return "加载失败";

  return successValue;
}

function getToneDotClass(tone: DashboardTone | undefined) {
  if (tone === "danger") return "bg-danger";
  if (tone === "warning") return "bg-warning";
  if (tone === "accent") return "bg-accent";
  if (tone === "secondary") return "bg-muted";

  return "bg-success";
}
