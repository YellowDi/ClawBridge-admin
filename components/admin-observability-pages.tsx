"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type {
  BridgeConversation,
  BridgeMessage,
  ContextSnapshot,
  TokenUsageStatsConversation,
  TokenUsageStatsModel,
  TokenUsageStatsTime,
  TokenUsageStatsUsers,
} from "@/lib/api";

import {
  Button,
  Chip,
  Modal,
  SearchField,
  Tabs,
  useOverlayState,
} from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import {
  archiveConversation,
  getConversationContext,
  getConversationDetail,
  getTokenUsageStatsByConversation,
  getTokenUsageStatsByTime,
  getTokenUsageStatsByUsers,
  listConversations,
  listMessages,
  unarchiveConversation,
} from "@/lib/api";

type UsageLoadState = {
  error: string | null;
  isLoading: boolean;
  timeStats?: TokenUsageStatsTime;
  userStats?: TokenUsageStatsUsers;
};

type UsageTimeRow = {
  bucketStartAt: string;
  id: string;
  modelCount: number;
  totalCostAmount: number;
  totalTokens: number;
  usageCount: number;
};

type UsageUserRow = {
  currency: string;
  id: string;
  modelKey: string;
  totalCostAmount: number;
  totalTokens: number;
  usageCount: number;
  userId: number | string;
  username: string;
};

type UsageView = "time" | "users";

type ConversationFilter = "active" | "all" | "archived";

type ConversationLoadState = {
  conversations: BridgeConversation[];
  error: string | null;
  isLoading: boolean;
};

type ConversationDetailState = {
  context?: ContextSnapshot;
  conversation?: BridgeConversation;
  error: string | null;
  isLoading: boolean;
  messages: BridgeMessage[];
  usage?: TokenUsageStatsConversation;
};

const USAGE_TIME_COLUMNS: DataGridColumn<UsageTimeRow>[] = [
  {
    accessorKey: "bucketStartAt",
    allowsSorting: true,
    cellClassName: "whitespace-nowrap",
    header: "日期",
    headerClassName: "whitespace-nowrap",
    id: "bucketStartAt",
    isRowHeader: true,
    width: 140,
  },
  {
    align: "end",
    accessorKey: "totalTokens",
    allowsSorting: true,
    cellClassName: "whitespace-nowrap",
    header: "Tokens",
    headerClassName: "whitespace-nowrap",
    id: "totalTokens",
    width: 110,
  },
  {
    align: "end",
    cell: (item) => formatAmount(item.totalCostAmount),
    cellClassName: "whitespace-nowrap",
    header: "费用",
    headerClassName: "whitespace-nowrap",
    id: "totalCostAmount",
    width: 110,
  },
  {
    align: "end",
    accessorKey: "usageCount",
    cellClassName: "whitespace-nowrap",
    header: "调用次数",
    headerClassName: "whitespace-nowrap",
    id: "usageCount",
    width: 96,
  },
  {
    align: "end",
    accessorKey: "modelCount",
    cellClassName: "whitespace-nowrap",
    header: "模型数",
    headerClassName: "whitespace-nowrap",
    id: "modelCount",
    width: 88,
  },
];

const USAGE_USER_COLUMNS: DataGridColumn<UsageUserRow>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.username}</span>
        <span className="text-muted truncate text-xs">ID {item.userId}</span>
      </div>
    ),
    header: "用户",
    headerClassName: "whitespace-nowrap",
    id: "username",
    isRowHeader: true,
    width: 180,
  },
  {
    accessorKey: "modelKey",
    cellClassName: "whitespace-nowrap",
    header: "模型",
    headerClassName: "whitespace-nowrap",
    id: "modelKey",
    minWidth: 240,
  },
  {
    align: "end",
    accessorKey: "totalTokens",
    allowsSorting: true,
    cellClassName: "whitespace-nowrap",
    header: "Tokens",
    headerClassName: "whitespace-nowrap",
    id: "totalTokens",
    width: 110,
  },
  {
    align: "end",
    cell: (item) => `${formatAmount(item.totalCostAmount)} ${item.currency}`,
    cellClassName: "whitespace-nowrap",
    header: "费用",
    headerClassName: "whitespace-nowrap",
    id: "totalCostAmount",
    width: 140,
  },
  {
    align: "end",
    accessorKey: "usageCount",
    cellClassName: "whitespace-nowrap",
    header: "调用次数",
    headerClassName: "whitespace-nowrap",
    id: "usageCount",
    width: 96,
  },
];

export function UsagePage() {
  const isMountedRef = useRef(false);
  const [usageView, setUsageView] = useState<UsageView>("time");
  const [loadState, setLoadState] = useState<UsageLoadState>({
    error: null,
    isLoading: true,
  });
  const { error, isLoading, timeStats, userStats } = loadState;

  const loadUsage = useCallback(async () => {
    const range = getDefaultUsageRange();

    setLoadState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const [timeStats, userStats] = await Promise.all([
        getTokenUsageStatsByTime({
          bucket: "day",
          endDate: range.endDate,
          startDate: range.startDate,
        }),
        getTokenUsageStatsByUsers({
          endDate: range.endDate,
          startDate: range.startDate,
        }),
      ]);

      if (isMountedRef.current) {
        setLoadState({
          error: null,
          isLoading: false,
          timeStats,
          userStats,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setLoadState({
          error: getPageError(error, "用量统计加载失败。"),
          isLoading: false,
        });
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadUsage();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadUsage]);

  const timeRows = useMemo(() => toUsageTimeRows(timeStats), [timeStats]);
  const userRows = useMemo(() => toUsageUserRows(userStats), [userStats]);
  const summary = useMemo(() => summarizeUsage(userRows), [userRows]);

  return (
    <AdminPage
      actions={
        <Button
          isPending={isLoading}
          size="sm"
          onPress={() => void loadUsage()}
        >
          <AdminIcon className="size-4" name="refresh" />
          刷新
        </Button>
      }
      description="查看 ClawCore 记录的模型 token 用量、调用次数和费用聚合。"
      eyebrow="Usage"
      title="用量统计"
    >
      <StatGrid
        stats={[
          {
            helper: "当前筛选窗口",
            label: "总 Tokens",
            value: isLoading ? "-" : formatNumber(summary.totalTokens),
          },
          {
            helper: "按模型计费聚合",
            label: "总费用",
            tone: "accent",
            value: isLoading ? "-" : formatAmount(summary.totalCostAmount),
          },
          {
            helper: "usage 事件数",
            label: "调用次数",
            value: isLoading ? "-" : formatNumber(summary.usageCount),
          },
          {
            helper: "参与统计用户",
            label: "用户数",
            tone: "warning",
            value: isLoading ? "-" : formatNumber(summary.userCount),
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            selectedKey={usageView}
            onSelectionChange={(key) => setUsageView(toUsageView(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="用量视图">
                <Tabs.Tab className="whitespace-nowrap" id="time">
                  按日用量
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="users">
                  按用户用量
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
        {usageView === "time" ? (
          <UsageTable
            columns={USAGE_TIME_COLUMNS}
            data={timeRows}
            emptyText={getUsageEmptyText(error, isLoading)}
            label="按日用量"
            rowId={(item) => item.id}
          />
        ) : (
          <UsageTable
            columns={USAGE_USER_COLUMNS}
            data={userRows}
            emptyText={getUsageEmptyText(error, isLoading)}
            label="按用户用量"
            rowId={(item) => item.id}
          />
        )}
      </section>
    </AdminPage>
  );
}

export function ConversationsPage() {
  const isMountedRef = useRef(false);
  const [filter, setFilter] = useState<ConversationFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadState, setLoadState] = useState<ConversationLoadState>({
    conversations: [],
    error: null,
    isLoading: true,
  });
  const { conversations, error, isLoading } = loadState;

  const loadConversationList = useCallback(async () => {
    setLoadState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const conversations = await listConversations({
        archiveStatus: toArchiveStatus(filter),
        pageSize: 100,
      });

      if (isMountedRef.current) {
        setLoadState({
          conversations,
          error: null,
          isLoading: false,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setLoadState({
          conversations: [],
          error: getPageError(error, "会话列表加载失败。"),
          isLoading: false,
        });
      }
    }
  }, [filter]);

  useEffect(() => {
    isMountedRef.current = true;

    void loadConversationList();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadConversationList]);

  const filteredConversations = useMemo(
    () => filterConversations(conversations, searchQuery),
    [conversations, searchQuery],
  );
  const refresh = useCallback(
    () => void loadConversationList(),
    [loadConversationList],
  );
  const archiveAction = useCallback(
    async (conversation: BridgeConversation) => {
      const conversationId = conversation.conversationId?.trim();

      if (!conversationId) return;

      if (conversation.isArchived === 2) {
        await unarchiveConversation(conversationId);
      } else {
        await archiveConversation(conversationId);
      }

      refresh();
    },
    [refresh],
  );
  const columns = useMemo<DataGridColumn<BridgeConversation>[]>(
    () => [
      ...CONVERSATION_COLUMNS,
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <ConversationDetailDialog conversation={item} />
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => void archiveAction(item)}
            >
              {item.isArchived === 2 ? "取消归档" : "归档"}
            </Button>
          </div>
        ),
        cellClassName: "w-[176px] min-w-[176px] max-w-[176px] pl-4 pr-4",
        header: "操作",
        headerClassName:
          "w-[176px] min-w-[176px] max-w-[176px] whitespace-nowrap pl-4 pr-4",
        id: "actions",
        pinned: "end",
        width: 176,
      },
    ],
    [archiveAction],
  );
  const stats = useMemo(
    () => getConversationStats(conversations),
    [conversations],
  );

  return (
    <AdminPage
      actions={
        <Button isPending={isLoading} size="sm" onPress={refresh}>
          <AdminIcon className="size-4" name="refresh" />
          刷新
        </Button>
      }
      description="查看 Bridge 会话、消息、上下文快照和会话级 token 用量。"
      eyebrow="Conversations"
      title="会话记录"
    >
      <StatGrid
        stats={[
          {
            helper: "当前筛选结果",
            label: "会话总数",
            value: isLoading ? "-" : formatNumber(stats.total),
          },
          {
            helper: "未归档会话",
            label: "活跃会话",
            tone: "accent",
            value: isLoading ? "-" : formatNumber(stats.active),
          },
          {
            helper: "已归档会话",
            label: "归档会话",
            value: isLoading ? "-" : formatNumber(stats.archived),
          },
          {
            helper: "出现过的用户数",
            label: "用户数",
            tone: "warning",
            value: isLoading ? "-" : formatNumber(stats.userCount),
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            selectedKey={filter}
            onSelectionChange={(key) => setFilter(toConversationFilter(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="会话筛选">
                <Tabs.Tab className="whitespace-nowrap" id="active">
                  活跃
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="archived">
                  已归档
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="all">
                  全部
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <SearchField
            aria-label="搜索会话"
            className="w-full sm:w-[280px]"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索标题、会话或模型" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="会话列表"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={columns}
          contentClassName="min-w-[1120px]"
          data={filteredConversations}
          defaultSortDescriptor={{
            column: "lastMessageAt",
            direction: "descending",
          }}
          getRowId={(item) => item.conversationId ?? String(item.id)}
          renderEmptyState={() => getConversationEmptyText(error, isLoading)}
        />
      </section>
    </AdminPage>
  );
}

const CONVERSATION_COLUMNS: DataGridColumn<BridgeConversation>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">
          {item.title?.trim() || "未命名会话"}
        </span>
        <span className="text-muted truncate text-xs">
          {item.conversationId || "-"}
        </span>
      </div>
    ),
    header: "会话",
    headerClassName: "whitespace-nowrap",
    id: "title",
    isRowHeader: true,
    minWidth: 240,
    width: 260,
  },
  {
    accessorKey: "userId",
    allowsSorting: true,
    cellClassName: "whitespace-nowrap",
    header: "用户",
    headerClassName: "whitespace-nowrap",
    id: "userId",
    width: 80,
  },
  {
    accessorKey: "agentId",
    cellClassName: "whitespace-nowrap",
    header: "Agent",
    headerClassName: "whitespace-nowrap",
    id: "agentId",
    width: 120,
  },
  {
    cell: (item) => (
      <span className="text-muted block max-w-[220px] truncate text-xs">
        {item.lastModelid || item.defaultModelid || "-"}
      </span>
    ),
    header: "模型",
    headerClassName: "whitespace-nowrap",
    id: "lastModelid",
    minWidth: 220,
  },
  {
    cellClassName: "whitespace-nowrap",
    cell: (item) => (
      <Chip
        className="whitespace-nowrap"
        color={item.isArchived === 2 ? "default" : "success"}
        size="sm"
        variant="soft"
      >
        {item.isArchived === 2 ? "已归档" : "活跃"}
      </Chip>
    ),
    header: "状态",
    headerClassName: "whitespace-nowrap",
    id: "isArchived",
    width: 88,
  },
  {
    align: "end",
    cell: (item) => formatDateTime(item.lastMessageAt),
    cellClassName: "whitespace-nowrap",
    header: "最后消息",
    headerClassName: "whitespace-nowrap",
    id: "lastMessageAt",
    width: 140,
  },
];

function ConversationDetailDialog({
  conversation,
}: {
  conversation: BridgeConversation;
}) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<ConversationDetailState>({
    error: null,
    isLoading: false,
    messages: [],
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) {
        loadRequestRef.current += 1;

        return;
      }

      void loadDetail();
    },
  });

  async function loadDetail() {
    const conversationId = conversation.conversationId?.trim();

    if (!conversationId) return;

    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState({
      error: null,
      isLoading: true,
      messages: [],
    });

    try {
      const [detail, messages, context, usage] = await Promise.all([
        getConversationDetail(conversationId),
        listMessages({ conversationId, pageSize: 50 }),
        getConversationContext({
          conversationId,
          pluginId: conversation.pluginId,
        }),
        getTokenUsageStatsByConversation(conversationId),
      ]);

      if (loadRequestRef.current !== requestId) return;

      setState({
        context,
        conversation: detail,
        error: null,
        isLoading: false,
        messages,
        usage,
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      setState({
        error: getPageError(error, "会话详情加载失败。"),
        isLoading: false,
        messages: [],
      });
    }
  }

  const detail = state.conversation ?? conversation;
  const usageSummary = summarizeModels(state.usage?.items ?? []);

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          详情
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop isDismissable={!state.isLoading}>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{detail.title || "会话详情"}</Modal.Heading>
              <p className="text-muted text-sm">{detail.conversationId}</p>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              {state.isLoading ? (
                <div className="text-muted text-sm">正在加载会话详情...</div>
              ) : null}
              {state.error ? (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {state.error}
                </div>
              ) : null}

              <section className="grid gap-3 sm:grid-cols-3">
                <DetailMetric
                  label="上下文占用"
                  value={formatContext(state.context)}
                />
                <DetailMetric
                  label="会话 Tokens"
                  value={formatNumber(usageSummary.totalTokens)}
                />
                <DetailMetric
                  label="会话费用"
                  value={formatAmount(usageSummary.totalCostAmount)}
                />
              </section>

              <section className="rounded-lg border border-border p-4">
                <h3 className="text-sm font-semibold">消息</h3>
                <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-auto pr-1">
                  {state.messages.length === 0 ? (
                    <span className="text-muted text-sm">暂无消息。</span>
                  ) : null}
                  {state.messages.map((message) => (
                    <div
                      key={message.id ?? message.messageId}
                      className="rounded-md bg-surface px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold">
                          {message.role || "-"}
                        </span>
                        <span className="text-muted text-xs">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs">
                        {message.text}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={() => modal.close()}>
                关闭
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function UsageTable<T extends object>({
  columns,
  data,
  emptyText,
  label,
  rowId,
}: {
  columns: DataGridColumn<T>[];
  data: T[];
  emptyText: string;
  label: string;
  rowId: (item: T) => string;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-sm font-semibold">{label}</h2>
      <DataGrid
        aria-label={label}
        className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
        columns={columns}
        contentClassName="min-w-[720px]"
        data={data}
        getRowId={rowId}
        renderEmptyState={() => emptyText}
      />
    </section>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-3 py-2">
      <div className="text-muted text-xs">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function getDefaultUsageRange() {
  const end = new Date();
  const start = new Date(end);

  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return {
    endDate: end.toISOString(),
    startDate: start.toISOString(),
  };
}

function toUsageTimeRows(stats?: TokenUsageStatsTime) {
  return (stats?.items ?? []).map((bucket, index) => {
    const summary = summarizeModels(bucket.models ?? []);
    const bucketStartAt = formatDate(bucket.bucketStartAt);

    return {
      bucketStartAt,
      id: bucket.bucketStartAt ?? String(index),
      modelCount: bucket.models?.length ?? 0,
      totalCostAmount: summary.totalCostAmount,
      totalTokens: summary.totalTokens,
      usageCount: summary.usageCount,
    };
  });
}

function toUsageUserRows(stats?: TokenUsageStatsUsers) {
  return (stats?.items ?? []).map((item, index) => ({
    currency: item.currency ?? "CNY",
    id: `${item.userId ?? "user"}-${item.modelKey ?? index}`,
    modelKey: item.modelKey ?? "-",
    totalCostAmount: amountNumber(item.totalCostAmount),
    totalTokens: item.totalTokens ?? 0,
    usageCount: item.usageCount ?? 0,
    userId: item.userId ?? "-",
    username: item.username ?? "未知用户",
  }));
}

function summarizeUsage(rows: UsageUserRow[]) {
  return {
    totalCostAmount: rows.reduce((sum, item) => sum + item.totalCostAmount, 0),
    totalTokens: rows.reduce((sum, item) => sum + item.totalTokens, 0),
    usageCount: rows.reduce((sum, item) => sum + item.usageCount, 0),
    userCount: new Set(rows.map((item) => item.userId)).size,
  };
}

function summarizeModels(items: TokenUsageStatsModel[]) {
  return {
    totalCostAmount: items.reduce(
      (sum, item) => sum + amountNumber(item.totalCostAmount),
      0,
    ),
    totalTokens: items.reduce((sum, item) => sum + (item.totalTokens ?? 0), 0),
    usageCount: items.reduce((sum, item) => sum + (item.usageCount ?? 0), 0),
  };
}

function filterConversations(
  conversations: BridgeConversation[],
  searchQuery: string,
) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) return conversations;

  return conversations.filter((item) =>
    [
      item.agentId,
      item.conversationId,
      item.defaultModelid,
      item.lastModelid,
      item.pluginId,
      item.title,
      String(item.userId ?? ""),
    ].some((value) => value?.toLowerCase().includes(query)),
  );
}

function getConversationStats(conversations: BridgeConversation[]) {
  return {
    active: conversations.filter((item) => item.isArchived !== 2).length,
    archived: conversations.filter((item) => item.isArchived === 2).length,
    total: conversations.length,
    userCount: new Set(conversations.map((item) => item.userId)).size,
  };
}

function toArchiveStatus(filter: ConversationFilter) {
  if (filter === "archived") return 2;
  if (filter === "all") return 3;

  return 1;
}

function toConversationFilter(key: unknown): ConversationFilter {
  if (key === "all" || key === "archived") return key;

  return "active";
}

function toUsageView(key: unknown): UsageView {
  return key === "users" ? "users" : "time";
}

function getUsageEmptyText(error: string | null, isLoading: boolean) {
  if (isLoading) return "正在加载用量统计...";
  if (error) return error;

  return "暂无用量数据。";
}

function getConversationEmptyText(error: string | null, isLoading: boolean) {
  if (isLoading) return "正在加载会话...";
  if (error) return error;

  return "暂无会话数据。";
}

function formatContext(context?: ContextSnapshot) {
  if (!context) return "-";

  const used = context.contextUsedTokens ?? 0;
  const budget = context.contextBudgetTokens ?? 0;

  return `${context.contextUsedPercent ?? 0}% · ${formatNumber(used)} / ${formatNumber(budget)}`;
}

function amountNumber(value?: string) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatAmount(value: number) {
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: 6,
    minimumFractionDigits: 0,
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("zh-CN");
}

function getPageError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
