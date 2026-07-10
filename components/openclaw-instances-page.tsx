"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type {
  OpenClawInstanceAgent,
  OpenClawInstanceDetail,
  OpenClawInstanceMCPServer,
  OpenClawInstanceSummary,
} from "@/lib/api";
import type { ReactNode } from "react";

import { Button, Chip, Tooltip } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage } from "@/components/admin-page-kit";
import { OpenClawJsonTree } from "@/components/openclaw-json-tree";
import {
  RestartButton,
  RestartInstanceDialog,
} from "@/components/openclaw-restart-dialog";
import {
  ApiError,
  getOpenClawInstanceDetail,
  listOpenClawInstanceSummaries,
} from "@/lib/api";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  year: "numeric",
});

type LoadState = {
  error: string | null;
  instances: OpenClawInstanceSummary[];
  isLoading: boolean;
};

export function OpenClawInstancesPage() {
  const router = useRouter();
  const isMountedRef = useRef(false);
  const [state, setState] = useState<LoadState>({
    error: null,
    instances: [],
    isLoading: true,
  });
  const [restartTarget, setRestartTarget] =
    useState<OpenClawInstanceSummary | null>(null);
  const [pendingPluginId, setPendingPluginId] = useState<string | null>(null);

  const loadInstances = useCallback(async () => {
    setState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const instances = await listOpenClawInstanceSummaries({
        skillMode: "summary",
      });

      if (!isMountedRef.current) return;

      setState({ error: null, instances, isLoading: false });
    } catch (error) {
      if (!isMountedRef.current) return;

      setState((current) => ({
        ...current,
        error: getActionError(error, "OpenClaw 实例加载失败。"),
        isLoading: false,
      }));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadInstances();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadInstances]);

  const actions = useMemo(
    () => (
      <Button
        isPending={state.isLoading}
        size="sm"
        variant="secondary"
        onPress={() => void loadInstances()}
      >
        <AdminIcon className="size-4" name="refresh" />
        刷新
      </Button>
    ),
    [loadInstances, state.isLoading],
  );
  const columns = useMemo<DataGridColumn<OpenClawInstanceSummary>[]>(
    () => [
      {
        cell: (item) => (
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-xs font-medium"
              title={item.pluginId}
            >
              {item.pluginId || "未命名实例"}
            </span>
            <span
              className="text-muted truncate text-xs"
              title={item.runtime?.hostname}
            >
              {item.runtime?.hostname || "主机名未知"}
            </span>
          </div>
        ),
        header: "实例",
        headerClassName: "whitespace-nowrap",
        id: "pluginId",
        isRowHeader: true,
        minWidth: 210,
        width: 230,
      },
      {
        cell: (item) => <InstanceStatus status={item.status} />,
        cellClassName: "whitespace-nowrap",
        header: "状态",
        headerClassName: "whitespace-nowrap",
        id: "status",
        width: 92,
      },
      {
        cell: (item) => (
          <div className="flex flex-col whitespace-nowrap text-xs">
            <span>OpenClaw {item.runtime?.openclawVersion || "-"}</span>
            <span className="text-muted">
              RPC {item.runtime?.pluginVersion || "-"}
            </span>
          </div>
        ),
        header: "版本",
        headerClassName: "whitespace-nowrap",
        id: "versions",
        width: 150,
      },
      {
        cell: (item) =>
          [item.runtime?.platform, item.runtime?.arch]
            .filter(Boolean)
            .join(" / ") || "-",
        cellClassName: "whitespace-nowrap",
        header: "运行环境",
        headerClassName: "whitespace-nowrap",
        id: "platform",
        width: 120,
      },
      {
        cell: (item) => formatDuration(item.runtime?.uptimeSeconds),
        cellClassName: "whitespace-nowrap tabular-nums",
        header: "运行时长",
        headerClassName: "whitespace-nowrap",
        id: "uptimeSeconds",
        width: 104,
      },
      {
        cell: (item) => (
          <span className="whitespace-nowrap tabular-nums">
            Agent {item.agents?.length ?? 0} · MCP{" "}
            {item.mcpServers?.length ?? 0}
          </span>
        ),
        header: "资源",
        headerClassName: "whitespace-nowrap",
        id: "resources",
        width: 130,
      },
      {
        align: "end",
        cell: (item) => formatLatency(item.latencyMs),
        cellClassName: "whitespace-nowrap tabular-nums",
        header: "延迟",
        headerClassName: "whitespace-nowrap",
        id: "latencyMs",
        width: 80,
      },
      {
        cell: (item) => formatDateTime(item.lastSeenAt),
        cellClassName: "whitespace-nowrap",
        header: "最近心跳",
        headerClassName: "whitespace-nowrap",
        id: "lastSeenAt",
        width: 168,
      },
      {
        cell: (item) => <WarningSummary warnings={item.warnings} />,
        header: "告警",
        headerClassName: "whitespace-nowrap",
        id: "warnings",
        width: 180,
      },
      {
        align: "end",
        cell: (item) => (
          <InstanceActions
            instance={item}
            isAnyRestartPending={Boolean(pendingPluginId)}
            isRestartPending={pendingPluginId === item.pluginId}
            onDetail={() =>
              router.push(
                `/openclaw-instances/detail?pluginId=${encodeURIComponent(item.pluginId ?? "")}`,
              )
            }
            onRestart={() => setRestartTarget(item)}
          />
        ),
        cellClassName: "whitespace-nowrap",
        header: "操作",
        headerClassName: "whitespace-nowrap",
        id: "actions",
        pinned: "end",
        width: 176,
      },
    ],
    [pendingPluginId, router],
  );

  return (
    <AdminPage
      actions={actions}
      description="查看当前连接的 OpenClaw 实例并执行运维操作。"
      title="OpenClaw 实例管理"
    >
      {state.error ? <PageError>{state.error}</PageError> : null}
      <section className="min-w-0">
        <DataGrid
          aria-label="OpenClaw 实例列表"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={columns}
          contentClassName="min-w-[1460px]"
          data={state.instances}
          getRowId={(item) => item.pluginId || JSON.stringify(item)}
          renderEmptyState={() =>
            state.isLoading
              ? "正在加载 OpenClaw 实例..."
              : "暂无已连接的 OpenClaw 实例"
          }
        />
      </section>
      <RestartInstanceDialog
        target={restartTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRestartTarget(null);
        }}
        onPendingChange={setPendingPluginId}
        onRecovered={(detail) => {
          setState((current) => ({
            ...current,
            instances: current.instances.map((item) =>
              item.pluginId === detail.pluginId ? detail : item,
            ),
          }));
        }}
      />
    </AdminPage>
  );
}

export function OpenClawInstanceDetailPage({ pluginId }: { pluginId: string }) {
  const router = useRouter();
  const isMountedRef = useRef(false);
  const [detail, setDetail] = useState<OpenClawInstanceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [restartTarget, setRestartTarget] =
    useState<OpenClawInstanceSummary | null>(null);
  const [pendingPluginId, setPendingPluginId] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const nextDetail = await getOpenClawInstanceDetail({
        includeSkills: false,
        pluginId,
        skillMode: "summary",
      });

      if (!isMountedRef.current) return;

      if (!nextDetail) {
        setDetail(null);
        setError("OpenClaw 实例不存在或已断开连接。");
      } else {
        setDetail(nextDetail);
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      setError(getActionError(error, "OpenClaw 实例详情加载失败。"));
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [pluginId]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadDetail();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDetail]);

  const actions = useMemo(
    () => (
      <>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => router.push("/openclaw-instances")}
        >
          返回列表
        </Button>
        <Button
          isPending={isLoading}
          size="sm"
          variant="secondary"
          onPress={() => void loadDetail()}
        >
          <AdminIcon className="size-4" name="refresh" />
          刷新
        </Button>
        {detail ? (
          <RestartButton
            instance={detail}
            isAnyRestartPending={Boolean(pendingPluginId)}
            isRestartPending={pendingPluginId === detail.pluginId}
            onPress={() => setRestartTarget(detail)}
          />
        ) : null}
      </>
    ),
    [detail, isLoading, loadDetail, pendingPluginId, router],
  );

  return (
    <AdminPage
      actions={actions}
      description="查看 OpenClaw 实例运行状态和完整脱敏配置。"
      title="OpenClaw 实例管理"
    >
      {error ? <PageError>{error}</PageError> : null}
      {isLoading && !detail ? (
        <div className="text-muted py-12 text-center text-sm">
          正在加载实例详情...
        </div>
      ) : null}
      {!isLoading && !detail ? (
        <div className="text-muted py-12 text-center text-sm">
          当前没有可展示的实例详情。
        </div>
      ) : null}
      {detail ? <InstanceDetail detail={detail} /> : null}
      <RestartInstanceDialog
        target={restartTarget}
        onOpenChange={(isOpen) => {
          if (!isOpen) setRestartTarget(null);
        }}
        onPendingChange={setPendingPluginId}
        onRecovered={setDetail}
      />
    </AdminPage>
  );
}

function InstanceDetail({ detail }: { detail: OpenClawInstanceDetail }) {
  const runtime = detail.runtime;

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <DetailSection title="实例基本信息">
        <DefinitionGrid
          items={[
            ["实例标识", detail.pluginId || "-"],
            ["状态", <InstanceStatus key="status" status={detail.status} />],
            ["主机名", runtime?.hostname || "-"],
            ["最近心跳", formatDateTime(detail.lastSeenAt)],
            ["连接时间", formatDateTime(detail.connectedAt)],
            ["接口延迟", formatLatency(detail.latencyMs)],
            ["配置哈希", detail.configHash || "-"],
            ["配置来源", runtime?.configSource || "-"],
          ]}
        />
      </DetailSection>

      <DetailSection title="运行时信息">
        <DefinitionGrid
          items={[
            ["OpenClaw 版本", runtime?.openclawVersion || "-"],
            ["RPC 插件版本", runtime?.pluginVersion || "-"],
            ["运行平台", runtime?.platform || "-"],
            ["运行架构", runtime?.arch || "-"],
            ["启动时间", formatDateTime(runtime?.startedAt)],
            ["运行时长", formatDuration(runtime?.uptimeSeconds)],
            ["配置更新时间", formatDateTime(runtime?.configUpdatedAt)],
            ["最近错误", runtime?.lastError || "-"],
          ]}
        />
        {runtime?.pendingFollowUp ? (
          <div className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
            待处理：{runtime.pendingFollowUpMode || "follow-up"}
            {runtime.pendingFollowUpReason
              ? ` · ${runtime.pendingFollowUpReason}`
              : ""}
          </div>
        ) : null}
      </DetailSection>

      <DetailSection title="健康检查">
        <HealthChecks checks={runtime?.healthChecks ?? []} />
      </DetailSection>

      <DetailSection title="Agent 摘要">
        <AgentSummaryTable agents={detail.agents ?? []} />
      </DetailSection>

      <DetailSection title="MCP Server 摘要">
        <MCPServerSummaryTable servers={detail.mcpServers ?? []} />
      </DetailSection>

      <DetailSection title="告警信息">
        <Warnings warnings={detail.warnings ?? []} />
      </DetailSection>

      <DetailSection title="最近一次控制记录">
        <LastControl control={runtime?.lastControl} />
      </DetailSection>

      <DetailSection title="openclaw.json">
        <OpenClawJsonTree
          config={detail.config}
          pluginVersion={runtime?.pluginVersion}
        />
      </DetailSection>
    </div>
  );
}

function InstanceActions({
  instance,
  isAnyRestartPending,
  isRestartPending,
  onDetail,
  onRestart,
}: {
  instance: OpenClawInstanceSummary;
  isAnyRestartPending: boolean;
  isRestartPending: boolean;
  onDetail: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm" variant="tertiary" onPress={onDetail}>
        查看详情
      </Button>
      <RestartButton
        instance={instance}
        isAnyRestartPending={isAnyRestartPending}
        isRestartPending={isRestartPending}
        onPress={onRestart}
      />
    </div>
  );
}

function HealthChecks({
  checks,
}: {
  checks: NonNullable<OpenClawInstanceSummary["runtime"]>["healthChecks"];
}) {
  if (!checks?.length) return <LocalEmpty>暂无健康检查信息</LocalEmpty>;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {checks.map((check, index) => (
        <div
          key={`${check.name}-${index}`}
          className="rounded-lg border border-default bg-surface p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">
              {check.name || "未命名检查"}
            </span>
            <Chip color={getHealthTone(check.status)} size="sm" variant="soft">
              {check.status || (check.available ? "ok" : "unavailable")}
            </Chip>
          </div>
          {check.message ? (
            <p className="text-muted mt-2 text-xs">{check.message}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AgentSummaryTable({ agents }: { agents: OpenClawInstanceAgent[] }) {
  const columns = useMemo<DataGridColumn<OpenClawInstanceAgent>[]>(
    () => [
      {
        cell: (item) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium">
              {item.displayName || item.agentId || "未命名 Agent"}
            </span>
            <span className="text-muted truncate text-xs">
              {item.agentId || "-"}
            </span>
          </div>
        ),
        header: "Agent",
        headerClassName: "whitespace-nowrap",
        id: "agentId",
        isRowHeader: true,
        minWidth: 180,
      },
      {
        cell: (item) => (
          <Chip
            color={item.enabled === false ? "default" : "success"}
            size="sm"
            variant="soft"
          >
            {item.enabled === false ? "已禁用" : "已启用"}
          </Chip>
        ),
        cellClassName: "whitespace-nowrap",
        header: "状态",
        headerClassName: "whitespace-nowrap",
        id: "enabled",
        width: 92,
      },
      {
        cell: (item) => (
          <span className="block max-w-64 truncate" title={item.defaultModelId}>
            {item.defaultModelId || "-"}
          </span>
        ),
        header: "默认模型",
        headerClassName: "whitespace-nowrap",
        id: "defaultModelId",
        minWidth: 190,
      },
      ...["skillCount", "enabledToolCount", "activeSessionCount"].map(
        (id) =>
          ({
            align: "end",
            accessorKey: id,
            cellClassName: "whitespace-nowrap tabular-nums",
            header:
              id === "skillCount"
                ? "Skill"
                : id === "enabledToolCount"
                  ? "工具"
                  : "活跃会话",
            headerClassName: "whitespace-nowrap",
            id,
            width: id === "activeSessionCount" ? 96 : 72,
          }) satisfies DataGridColumn<OpenClawInstanceAgent>,
      ),
      {
        cell: (item) => (
          <span className="block max-w-56 truncate" title={item.skillError}>
            {item.skillError || "-"}
          </span>
        ),
        header: "读取告警",
        headerClassName: "whitespace-nowrap",
        id: "skillError",
        width: 220,
      },
    ],
    [],
  );

  return (
    <DataGrid
      aria-label="Agent 摘要"
      className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
      columns={columns}
      contentClassName="min-w-[980px]"
      data={agents}
      getRowId={(item) => item.agentId || JSON.stringify(item)}
      renderEmptyState={() => "当前实例没有 Agent 摘要"}
    />
  );
}

function MCPServerSummaryTable({
  servers,
}: {
  servers: OpenClawInstanceMCPServer[];
}) {
  const columns = useMemo<DataGridColumn<OpenClawInstanceMCPServer>[]>(
    () => [
      {
        accessorKey: "serverName",
        header: "MCP Server",
        headerClassName: "whitespace-nowrap",
        id: "serverName",
        isRowHeader: true,
        minWidth: 180,
      },
      {
        cell: (item) => (
          <Chip
            color={item.enabled === false ? "default" : "success"}
            size="sm"
            variant="soft"
          >
            {item.enabled === false ? "已禁用" : "已启用"}
          </Chip>
        ),
        cellClassName: "whitespace-nowrap",
        header: "状态",
        headerClassName: "whitespace-nowrap",
        id: "enabled",
        width: 92,
      },
      ...[
        ["transport", "连接方式", 100],
        ["toolCount", "工具数", 80],
        ["authType", "鉴权", 100],
        ["lastProbeStatus", "探测状态", 112],
      ].map(
        ([id, header, width]) =>
          ({
            accessorKey: id as string,
            cellClassName: "whitespace-nowrap",
            header: header as string,
            headerClassName: "whitespace-nowrap",
            id: id as string,
            width: width as number,
          }) satisfies DataGridColumn<OpenClawInstanceMCPServer>,
      ),
      {
        cell: (item) => (
          <span
            className="block max-w-72 truncate"
            title={item.envRefMissing?.join(", ")}
          >
            {item.envRefMissing?.length ? item.envRefMissing.join(", ") : "-"}
          </span>
        ),
        header: "缺失环境变量",
        headerClassName: "whitespace-nowrap",
        id: "envRefMissing",
        minWidth: 190,
      },
    ],
    [],
  );

  return (
    <DataGrid
      aria-label="MCP Server 摘要"
      className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
      columns={columns}
      contentClassName="min-w-[860px]"
      data={servers}
      getRowId={(item) => item.serverName || JSON.stringify(item)}
      renderEmptyState={() => "当前实例没有 MCP Server 摘要"}
    />
  );
}

function Warnings({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return <LocalEmpty>当前实例没有告警</LocalEmpty>;

  return (
    <ul className="flex flex-col gap-2">
      {warnings.map((warning, index) => (
        <li
          key={`${warning}-${index}`}
          className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
        >
          {warning}
        </li>
      ))}
    </ul>
  );
}

function LastControl({
  control,
}: {
  control: NonNullable<OpenClawInstanceSummary["runtime"]>["lastControl"];
}) {
  if (!control) return <LocalEmpty>暂无控制记录</LocalEmpty>;

  return (
    <DefinitionGrid
      items={[
        ["动作", control.action || "-"],
        ["受理状态", control.success ? "已受理" : "未受理"],
        ["受理时间", formatDateTime(control.at)],
        ["原因", control.reason || "-"],
        ["后续动作", control.followUpMode || "-"],
        ["后续说明", control.followUpReason || "-"],
      ]}
    />
  );
}

function DetailSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="min-w-0 border-b border-default pb-8 last:border-b-0 last:pb-0">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function DefinitionGrid({
  items,
}: {
  items: readonly (readonly [string, ReactNode])[];
}) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-muted text-xs">{label}</dt>
          <dd
            className="mt-1 truncate text-sm"
            title={typeof value === "string" ? value : undefined}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function InstanceStatus({ status }: { status?: string }) {
  const normalized = status?.toLowerCase();
  const label =
    normalized === "online"
      ? "在线"
      : normalized === "degraded"
        ? "异常"
        : normalized === "offline"
          ? "离线"
          : status || "未知";

  return (
    <Chip
      className="whitespace-nowrap"
      color={
        normalized === "online"
          ? "success"
          : normalized === "degraded"
            ? "warning"
            : normalized === "offline"
              ? "danger"
              : "default"
      }
      size="sm"
      variant="soft"
    >
      {label}
    </Chip>
  );
}

function WarningSummary({ warnings }: { warnings?: string[] }) {
  if (!warnings?.length) return <span className="text-muted">-</span>;

  const summary = warnings[0];

  return (
    <Tooltip delay={0}>
      <span className="block max-w-44 cursor-help truncate text-warning">
        {warnings.length > 1
          ? `${summary}（+${warnings.length - 1}）`
          : summary}
      </span>
      <Tooltip.Content className="max-w-sm whitespace-pre-wrap">
        {warnings.join("\n")}
      </Tooltip.Content>
    </Tooltip>
  );
}

function PageError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function LocalEmpty({ children }: { children: ReactNode }) {
  return <div className="text-muted py-6 text-center text-sm">{children}</div>;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : DATE_TIME_FORMATTER.format(date);
}

function formatDuration(value?: number) {
  if (!Number.isFinite(value)) return "-";

  const seconds = Math.max(0, Math.floor(value as number));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);

  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟`;

  return `${seconds}秒`;
}

function formatLatency(value?: number) {
  return Number.isFinite(value) ? `${value} ms` : "-";
}

function getHealthTone(
  status?: string,
): "success" | "warning" | "danger" | "default" {
  if (status === "ok") return "success";
  if (status === "degraded") return "warning";
  if (status === "unavailable") return "danger";

  return "default";
}

function getActionError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
