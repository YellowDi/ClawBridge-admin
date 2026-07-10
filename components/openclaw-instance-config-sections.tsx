"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type {
  OpenClawInstanceChannel,
  OpenClawInstanceModel,
  OpenClawInstancePlugin,
  OpenClawInstanceSkill,
  OpenClawInstanceToolConfig,
} from "@/lib/api";
import type { ReactNode } from "react";

import { Chip } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";

const NUMBER_FORMATTER = new Intl.NumberFormat("zh-CN");
const COST_FORMATTER = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 6,
});

const MODEL_COLUMNS: DataGridColumn<OpenClawInstanceModel>[] = [
  {
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium" title={item.displayName}>
          {item.displayName || item.modelId || "未命名模型"}
        </span>
        <span className="text-muted truncate text-xs" title={item.modelRef}>
          {item.modelRef ||
            [item.providerId, item.modelId].filter(Boolean).join("/") ||
            "-"}
        </span>
      </div>
    ),
    header: "模型",
    headerClassName: "whitespace-nowrap",
    id: "modelRef",
    isRowHeader: true,
    minWidth: 230,
  },
  {
    cell: (item) => (
      <div className="flex items-center gap-1">
        <BooleanChip value={item.allowed} />
        <Chip size="sm" variant="soft">
          {item.source === "provider_catalog"
            ? "Provider"
            : item.source === "allowlist"
              ? "Allowlist"
              : item.source || "未知来源"}
        </Chip>
      </div>
    ),
    cellClassName: "whitespace-nowrap",
    header: "可用状态",
    headerClassName: "whitespace-nowrap",
    id: "allowed",
    width: 170,
  },
  {
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs">{item.providerId || "-"}</span>
        <span className="text-muted truncate text-xs">
          {[item.api, item.auth].filter(Boolean).join(" · ") || "-"}
        </span>
      </div>
    ),
    header: "Provider / API",
    headerClassName: "whitespace-nowrap",
    id: "providerId",
    minWidth: 180,
  },
  {
    cell: (item) => (
      <span className="block max-w-64 truncate" title={item.baseUrl}>
        {item.baseUrl || "-"}
      </span>
    ),
    header: "Base URL",
    headerClassName: "whitespace-nowrap",
    id: "baseUrl",
    minWidth: 210,
  },
  {
    cell: (item) => item.input?.join(", ") || "-",
    cellClassName: "whitespace-nowrap",
    header: "输入",
    headerClassName: "whitespace-nowrap",
    id: "input",
    width: 120,
  },
  {
    align: "end",
    cell: (item) => (
      <div className="flex flex-col whitespace-nowrap text-xs tabular-nums">
        <span>{formatNumber(item.contextTokens)} 有效</span>
        <span className="text-muted">
          {formatNumber(item.contextWindow)} 原生
        </span>
      </div>
    ),
    header: "上下文",
    headerClassName: "whitespace-nowrap",
    id: "contextTokens",
    width: 130,
  },
  {
    align: "end",
    cell: (item) => formatNumber(item.maxTokens),
    cellClassName: "whitespace-nowrap tabular-nums",
    header: "最大输出",
    headerClassName: "whitespace-nowrap",
    id: "maxTokens",
    width: 100,
  },
  {
    cell: (item) => (
      <div className="flex items-center gap-1">
        {item.alias ? (
          <Chip size="sm" variant="soft">
            {item.alias}
          </Chip>
        ) : null}
        {item.reasoning ? (
          <Chip color="accent" size="sm" variant="soft">
            推理
          </Chip>
        ) : null}
        {item.hasApiKey ? (
          <Chip color="success" size="sm" variant="soft">
            已鉴权
          </Chip>
        ) : null}
        {!item.alias && !item.reasoning && !item.hasApiKey ? "-" : null}
      </div>
    ),
    cellClassName: "whitespace-nowrap",
    header: "能力",
    headerClassName: "whitespace-nowrap",
    id: "capabilities",
    minWidth: 150,
  },
  {
    align: "end",
    cell: (item) => (
      <div
        className="flex flex-col whitespace-nowrap text-xs tabular-nums"
        title={`输入 ${formatCost(item.inputCost)}；输出 ${formatCost(item.outputCost)}；缓存读 ${formatCost(item.cacheReadCost)}；缓存写 ${formatCost(item.cacheWriteCost)}`}
      >
        <span>
          {formatCost(item.inputCost)} / {formatCost(item.outputCost)}
        </span>
        <span className="text-muted">
          缓存 {formatCost(item.cacheReadCost)} /{" "}
          {formatCost(item.cacheWriteCost)}
        </span>
      </div>
    ),
    header: "成本 / 百万 Token",
    headerClassName: "whitespace-nowrap",
    id: "costs",
    width: 160,
  },
];

const PLUGIN_COLUMNS: DataGridColumn<OpenClawInstancePlugin>[] = [
  {
    cell: (item) => (
      <span className="block max-w-64 truncate" title={item.pluginId}>
        {item.pluginId}
      </span>
    ),
    header: "插件",
    headerClassName: "whitespace-nowrap",
    id: "pluginId",
    isRowHeader: true,
    minWidth: 180,
  },
  statusColumn("enabled", "启用"),
  statusColumn("configured", "已配置"),
  statusColumn("allowed", "Allow"),
  statusColumn("denied", "Deny", true),
  {
    cell: (item) => item.slots?.join(", ") || "-",
    cellClassName: "whitespace-nowrap",
    header: "Slots",
    headerClassName: "whitespace-nowrap",
    id: "slots",
    minWidth: 130,
  },
  {
    cell: (item) => (
      <ConfigFlags
        config={item.config}
        hasConfig={item.hasConfig}
        hasSecret={item.hasSecret}
      />
    ),
    cellClassName: "whitespace-nowrap",
    header: "配置",
    headerClassName: "whitespace-nowrap",
    id: "config",
    width: 180,
  },
];

const CHANNEL_COLUMNS: DataGridColumn<OpenClawInstanceChannel>[] = [
  {
    cell: (item) => (
      <span className="block max-w-64 truncate" title={item.channelId}>
        {item.channelId}
      </span>
    ),
    header: "Channel",
    headerClassName: "whitespace-nowrap",
    id: "channelId",
    isRowHeader: true,
    minWidth: 180,
  },
  statusColumn("enabled", "启用"),
  {
    align: "end",
    accessorKey: "accountCount",
    cellClassName: "whitespace-nowrap tabular-nums",
    header: "账号数",
    headerClassName: "whitespace-nowrap",
    id: "accountCount",
    width: 88,
  },
  {
    cell: (item) => (
      <ConfigFlags config={item.config} hasSecret={item.hasSecret} />
    ),
    cellClassName: "whitespace-nowrap",
    header: "配置",
    headerClassName: "whitespace-nowrap",
    id: "config",
    width: 180,
  },
];

const SKILL_COLUMNS: DataGridColumn<OpenClawInstanceSkill>[] = [
  {
    cell: (item) => (
      <span className="block max-w-72 truncate" title={item.skillKey}>
        {item.skillKey}
      </span>
    ),
    header: "Skill",
    headerClassName: "whitespace-nowrap",
    id: "skillKey",
    isRowHeader: true,
    minWidth: 200,
  },
  statusColumn("enabled", "启用"),
  statusColumn("configured", "已配置"),
  statusColumn("bundledAllowed", "Bundled Allow"),
  statusColumn("hasConfig", "结构化配置"),
  statusColumn("hasEnv", "环境变量"),
  statusColumn("hasApiKey", "API Key"),
];

export function OpenClawInstanceConfigSections({
  channels,
  models,
  plugins,
  skills,
  toolConfig,
}: {
  channels: OpenClawInstanceChannel[];
  models: OpenClawInstanceModel[];
  plugins: OpenClawInstancePlugin[];
  skills: OpenClawInstanceSkill[];
  toolConfig?: OpenClawInstanceToolConfig;
}) {
  return (
    <>
      <DetailSection title="模型配置">
        <ConfigTable
          columns={MODEL_COLUMNS}
          data={models}
          emptyText="当前实例没有结构化模型配置"
          label="模型配置"
          minWidth="min-w-[1500px]"
          rowId={(item) =>
            item.modelRef || `${item.providerId}/${item.modelId}`
          }
        />
      </DetailSection>

      <DetailSection title="插件配置">
        <div className="flex flex-col gap-3">
          <ConfigTable
            columns={PLUGIN_COLUMNS}
            data={plugins}
            emptyText="当前实例没有结构化插件配置"
            label="插件配置"
            minWidth="min-w-[920px]"
            rowId={(item) => item.pluginId}
          />
          <StructuredConfigList
            items={plugins.map((item) => ({
              config: item.config,
              id: item.pluginId,
            }))}
            label="插件结构化配置"
          />
        </div>
      </DetailSection>

      <DetailSection title="Channel 配置">
        <div className="flex flex-col gap-3">
          <ConfigTable
            columns={CHANNEL_COLUMNS}
            data={channels}
            emptyText="当前实例没有结构化 Channel 配置"
            label="Channel 配置"
            minWidth="min-w-[620px]"
            rowId={(item) => item.channelId}
          />
          <StructuredConfigList
            items={channels.map((item) => ({
              config: item.config,
              id: item.channelId,
            }))}
            label="Channel 结构化配置"
          />
        </div>
      </DetailSection>

      <DetailSection title="实例级 Skill 配置">
        <ConfigTable
          columns={SKILL_COLUMNS}
          data={skills}
          emptyText="当前实例没有实例级 Skill 配置"
          label="实例级 Skill 配置"
          minWidth="min-w-[900px]"
          rowId={(item) => item.skillKey}
        />
      </DetailSection>

      <DetailSection title="实例级工具策略">
        <ToolConfigSummary value={toolConfig} />
      </DetailSection>
    </>
  );
}

function ConfigTable<T extends object>({
  columns,
  data,
  emptyText,
  label,
  minWidth,
  rowId,
}: {
  columns: DataGridColumn<T>[];
  data: T[];
  emptyText: string;
  label: string;
  minWidth: string;
  rowId: (item: T) => string;
}) {
  return (
    <DataGrid
      aria-label={label}
      className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
      columns={columns}
      contentClassName={minWidth}
      data={data}
      getRowId={rowId}
      renderEmptyState={() => emptyText}
    />
  );
}

function ToolConfigSummary({ value }: { value?: OpenClawInstanceToolConfig }) {
  if (!value) return <LocalEmpty>当前实例没有实例级工具策略</LocalEmpty>;

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
        <Definition label="Profile" value={value.profile || "未配置"} />
        <Definition
          label="Allow"
          value={<PolicyValues values={value.allow} />}
        />
        <Definition
          label="Also Allow"
          value={<PolicyValues values={value.alsoAllow} />}
        />
        <Definition label="Deny" value={<PolicyValues values={value.deny} />} />
      </dl>
      {value.config && Object.keys(value.config).length > 0 ? (
        <details className="rounded-lg border border-default bg-surface">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
            工具结构化配置
          </summary>
          <pre className="max-h-96 overflow-auto border-t border-default p-3 font-mono text-xs leading-5">
            {JSON.stringify(value.config, null, 2)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}

function StructuredConfigList({
  items,
  label,
}: {
  items: { config: Record<string, unknown>; id: string }[];
  label: string;
}) {
  const configuredItems = items.filter(
    (item) => Object.keys(item.config).length > 0,
  );

  if (!configuredItems.length) return null;

  return (
    <div aria-label={label} className="flex flex-col gap-2">
      {configuredItems.map((item) => (
        <details
          key={item.id}
          className="rounded-lg border border-default bg-surface"
        >
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium break-all">
            {item.id}
          </summary>
          <pre className="max-h-80 overflow-auto border-t border-default p-3 font-mono text-xs leading-5">
            {JSON.stringify(item.config, null, 2)}
          </pre>
        </details>
      ))}
    </div>
  );
}

function Definition({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="mt-2 text-sm">{value}</dd>
    </div>
  );
}

function PolicyValues({ values }: { values?: string[] }) {
  if (!values?.length) return <span className="text-muted">无</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(new Set(values)).map((value) => (
        <Chip key={value} size="sm" variant="soft">
          {value}
        </Chip>
      ))}
    </div>
  );
}

function ConfigFlags({
  config,
  hasConfig,
  hasSecret,
}: {
  config?: Record<string, unknown>;
  hasConfig?: boolean;
  hasSecret?: boolean;
}) {
  const configCount = Object.keys(config ?? {}).length;

  return (
    <div className="flex items-center gap-1">
      <Chip
        className="whitespace-nowrap"
        color={hasConfig || configCount > 0 ? "success" : "default"}
        size="sm"
        variant="soft"
      >
        {configCount > 0
          ? `${configCount} 项`
          : hasConfig
            ? "已配置"
            : "无配置"}
      </Chip>
      {hasSecret ? (
        <Chip
          className="whitespace-nowrap"
          color="warning"
          size="sm"
          variant="soft"
        >
          含脱敏值
        </Chip>
      ) : null}
    </div>
  );
}

function BooleanChip({
  dangerWhenTrue = false,
  value,
}: {
  dangerWhenTrue?: boolean;
  value?: boolean;
}) {
  return (
    <Chip
      className="whitespace-nowrap"
      color={value ? (dangerWhenTrue ? "danger" : "success") : "default"}
      size="sm"
      variant="soft"
    >
      {value ? "是" : "否"}
    </Chip>
  );
}

function statusColumn<T extends object>(
  id: keyof T & string,
  header: string,
  dangerWhenTrue = false,
): DataGridColumn<T> {
  return {
    cell: (item) => (
      <BooleanChip dangerWhenTrue={dangerWhenTrue} value={Boolean(item[id])} />
    ),
    cellClassName: "whitespace-nowrap",
    header,
    headerClassName: "whitespace-nowrap",
    id,
    width: 104,
  };
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

function LocalEmpty({ children }: { children: ReactNode }) {
  return <div className="text-muted py-6 text-center text-sm">{children}</div>;
}

function formatNumber(value?: number) {
  return Number.isFinite(value)
    ? NUMBER_FORMATTER.format(value as number)
    : "-";
}

function formatCost(value?: number) {
  return Number.isFinite(value) ? COST_FORMATTER.format(value as number) : "-";
}
