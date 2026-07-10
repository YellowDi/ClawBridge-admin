"use client";

import type { Key } from "react";
import type { KnowledgeBase } from "@/lib/api";

import {
  Button,
  Card,
  Chip,
  Label,
  ListBox,
  Select,
  toast,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import {
  AdminPage,
  CardCollection,
  CollectionToolbar,
  StatGrid,
} from "@/components/admin-page-kit";
import { CreateKnowledgeBaseDialog } from "@/components/create-knowledge-base-dialog";
import { KnowledgeFormError } from "@/components/knowledge-form-error";
import { listKnowledgeBases, retryKnowledgeBase } from "@/lib/api";

type KnowledgeStatus =
  | "chunking"
  | "embedding"
  | "extracting"
  | "failed"
  | "indexed"
  | "pending"
  | string;

type KnowledgeRow = {
  chunkCount: number | null;
  description: string;
  id: string;
  knowledgeBaseId: number | null;
  name: string;
  size: number;
  sourceAddress: string;
  sourceType: string;
  status: KnowledgeStatus;
  updatedAt: string;
  updatedAtValue: string;
};

type KnowledgeLoadState = {
  error: string | null;
  isLoading: boolean;
  rows: KnowledgeRow[];
};

type KnowledgeSort =
  | "chunks-asc"
  | "chunks-desc"
  | "name-asc"
  | "name-desc"
  | "updated-asc"
  | "updated-desc";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const STATUS_LABELS: Record<string, string> = {
  chunking: "切片中",
  embedding: "向量化",
  extracting: "抽取中",
  failed: "失败",
  indexed: "已入库",
  pending: "待处理",
};
const KNOWLEDGE_SKELETON_IDS = [
  "knowledge-skeleton-1",
  "knowledge-skeleton-2",
  "knowledge-skeleton-3",
  "knowledge-skeleton-4",
  "knowledge-skeleton-5",
  "knowledge-skeleton-6",
] as const;

export function KnowledgeBasesPage() {
  const isMountedRef = useRef(false);
  const loadRequestRef = useRef(0);
  const [loadState, setLoadState] = useState<KnowledgeLoadState>({
    error: null,
    isLoading: true,
    rows: [],
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [sort, setSort] = useState<KnowledgeSort>("updated-desc");
  const { error, isLoading, rows } = loadState;

  const loadKnowledgeBases = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setLoadState((state) => ({
      ...state,
      error: null,
      isLoading: true,
    }));

    try {
      const response = await listKnowledgeBases();

      if (isMountedRef.current && loadRequestRef.current === requestId) {
        setLoadState({
          error: null,
          isLoading: false,
          rows: response.map(toKnowledgeRow),
        });
      }
    } catch (error) {
      if (isMountedRef.current && loadRequestRef.current === requestId) {
        const message = getKnowledgeError(error, "知识库列表加载失败。");

        setLoadState((current) => ({
          ...current,
          error: message,
          isLoading: false,
        }));
        toast.danger(message);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadKnowledgeBases();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadKnowledgeBases]);

  const refreshKnowledgeBases = useCallback(
    () => void loadKnowledgeBases(),
    [loadKnowledgeBases],
  );

  const handleRetry = useCallback(
    async (knowledgeBaseId: number) => {
      setActionError(null);
      setRetryingId(knowledgeBaseId);

      try {
        await retryKnowledgeBase(knowledgeBaseId);

        if (isMountedRef.current) {
          setRetryingId(null);
          void loadKnowledgeBases();
          toast.success("知识库重试已提交。");
        }
      } catch (error) {
        if (isMountedRef.current) {
          const message = getKnowledgeError(error, "知识库重试失败。");

          setActionError(message);
          setRetryingId(null);
          toast.danger(message);
        }
      }
    },
    [loadKnowledgeBases],
  );

  const stats = useMemo(() => getKnowledgeStats(rows), [rows]);
  const sortedRows = useMemo(() => sortKnowledgeRows(rows, sort), [rows, sort]);

  return (
    <AdminPage
      actions={
        <>
          <Button
            aria-label="刷新知识库"
            isDisabled={isLoading}
            size="sm"
            variant="tertiary"
            onPress={refreshKnowledgeBases}
          >
            <AdminIcon className="size-4" name="refresh" />
            <span className="hidden sm:inline">刷新</span>
          </Button>
          <CreateKnowledgeBaseDialog onCreated={refreshKnowledgeBases} />
        </>
      }
      description="管理可用于检索增强的知识库，查看入库状态和切片结果。"
      eyebrow="Knowledge"
      title="知识库"
    >
      <StatGrid
        stats={[
          {
            helper: "当前列表总数",
            label: "知识库总数",
            value: formatCount(stats.total, isLoading),
          },
          {
            helper: "可用于检索增强",
            label: "已入库",
            tone: "success",
            value: formatCount(stats.indexed, isLoading),
          },
          {
            helper: "正在抽取、切片或向量化",
            label: "处理中",
            tone: "warning",
            value: formatCount(stats.processing, isLoading),
          },
          {
            helper: `失败 ${formatCount(stats.failed, isLoading)}`,
            label: "文件体积",
            tone: stats.failed > 0 ? "danger" : "accent",
            value: isLoading ? "-" : formatBytes(stats.totalSize),
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-4">
        <CollectionToolbar>
          <Select
            aria-label="知识库排序方式"
            className="w-full sm:ml-auto sm:w-52"
            selectedKey={sort}
            variant="secondary"
            onSelectionChange={(key) => setSort(toKnowledgeSort(key))}
          >
            <Label className="sr-only">排序方式</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="updated-desc" textValue="最近更新优先">
                  最近更新优先
                </ListBox.Item>
                <ListBox.Item id="updated-asc" textValue="最早更新优先">
                  最早更新优先
                </ListBox.Item>
                <ListBox.Item id="name-asc" textValue="名称 A-Z">
                  名称 A-Z
                </ListBox.Item>
                <ListBox.Item id="name-desc" textValue="名称 Z-A">
                  名称 Z-A
                </ListBox.Item>
                <ListBox.Item id="chunks-desc" textValue="片段数从多到少">
                  片段数从多到少
                </ListBox.Item>
                <ListBox.Item id="chunks-asc" textValue="片段数从少到多">
                  片段数从少到多
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </CollectionToolbar>
        {actionError ? (
          <KnowledgeFormError>{actionError}</KnowledgeFormError>
        ) : null}
        {error ? <KnowledgeFormError>{error}</KnowledgeFormError> : null}
        {isLoading && rows.length === 0 ? (
          <KnowledgeGridSkeleton />
        ) : sortedRows.length > 0 ? (
          <CardCollection>
            {sortedRows.map((row) => (
              <KnowledgeCard
                key={row.id}
                isRetrying={retryingId === row.knowledgeBaseId}
                retryDisabled={retryingId != null}
                row={row}
                onRetry={handleRetry}
              />
            ))}
          </CardCollection>
        ) : error ? null : (
          <KnowledgeEmptyState />
        )}
      </section>
    </AdminPage>
  );
}

function KnowledgeCard({
  isRetrying,
  onRetry,
  retryDisabled,
  row,
}: {
  isRetrying: boolean;
  onRetry: (knowledgeBaseId: number) => Promise<void>;
  retryDisabled: boolean;
  row: KnowledgeRow;
}) {
  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="bg-default-100 text-muted flex size-10 shrink-0 items-center justify-center rounded-md">
              <AdminIcon className="size-5" name="knowledge" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <Card.Title className="truncate text-base">
                  {row.name}
                </Card.Title>
                <Chip
                  className="shrink-0 whitespace-nowrap"
                  color={getStatusColor(row.status)}
                  size="sm"
                  variant="soft"
                >
                  {getStatusLabel(row.status)}
                </Chip>
              </div>
              <Card.Description className="truncate text-xs">
                {row.sourceType}
              </Card.Description>
            </div>
          </div>
          {row.status === "failed" && row.knowledgeBaseId != null ? (
            <Button
              isDisabled={retryDisabled}
              size="sm"
              variant="tertiary"
              onPress={() => void onRetry(row.knowledgeBaseId!)}
            >
              {isRetrying ? "重试中..." : "重试"}
            </Button>
          ) : null}
        </div>
      </Card.Header>
      <Card.Content className="flex h-full flex-col gap-4">
        <p className="text-muted line-clamp-3 min-h-14 text-sm">
          {row.description || "暂无说明"}
        </p>
        <div className="min-w-0 rounded-md bg-default-50 px-3 py-2">
          <div className="text-muted text-xs">来源地址</div>
          <div
            className="text-foreground mt-1 truncate text-xs font-medium"
            title={row.sourceAddress}
          >
            {formatCompactSourceAddress(row.sourceAddress)}
          </div>
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-3 text-xs">
          <KnowledgeMeta label="来源" value={row.sourceType} />
          <KnowledgeMeta
            label="片段数"
            value={row.chunkCount == null ? "-" : String(row.chunkCount)}
          />
          <KnowledgeMeta label="大小" value={formatBytes(row.size)} />
          <KnowledgeMeta label="更新时间" value={row.updatedAt} />
        </dl>
      </Card.Content>
    </Card>
  );
}

function KnowledgeMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

function KnowledgeGridSkeleton() {
  return (
    <CardCollection>
      {KNOWLEDGE_SKELETON_IDS.map((id) => (
        <Card key={id}>
          <Card.Content className="flex min-h-64 flex-col gap-4 p-5">
            <div className="bg-default-200 h-5 w-2/3 animate-pulse rounded" />
            <div className="bg-default-100 h-14 animate-pulse rounded" />
            <div className="bg-default-100 h-12 animate-pulse rounded" />
            <div className="mt-auto grid grid-cols-2 gap-3">
              <div className="bg-default-100 h-10 animate-pulse rounded" />
              <div className="bg-default-100 h-10 animate-pulse rounded" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </CardCollection>
  );
}

function KnowledgeEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-default-300 px-6 py-12 text-center">
      <AdminIcon className="text-muted size-9" name="knowledge" />
      <h2 className="text-foreground mt-4 text-base font-semibold">
        还没有知识库
      </h2>
      <p className="text-muted mt-2 max-w-md text-sm">
        创建知识库后会在这里显示入库状态和来源信息。
      </p>
    </div>
  );
}

function toKnowledgeRow(
  knowledgeBase: KnowledgeBase,
  index: number,
): KnowledgeRow {
  const name =
    knowledgeBase.name?.trim() || `知识库 ${knowledgeBase.id ?? index + 1}`;
  const status = knowledgeBase.status?.trim().toLowerCase() || "pending";

  return {
    chunkCount: knowledgeBase.chunkCount ?? null,
    description: knowledgeBase.description?.trim() ?? "",
    id:
      knowledgeBase.id == null
        ? `${knowledgeBase.name?.trim() || "knowledge"}-${index}`
        : String(knowledgeBase.id),
    knowledgeBaseId: knowledgeBase.id ?? null,
    name,
    size: knowledgeBase.size ?? 0,
    sourceAddress:
      knowledgeBase.path?.trim() || knowledgeBase.filename?.trim() || "-",
    sourceType: getSourceTypeLabel(knowledgeBase.storageType),
    status,
    updatedAt: formatDateTime(knowledgeBase.updatedAt),
    updatedAtValue: knowledgeBase.updatedAt ?? "",
  };
}

function sortKnowledgeRows(rows: KnowledgeRow[], sort: KnowledgeSort) {
  return [...rows].sort((left, right) => {
    if (sort === "name-asc")
      return left.name.localeCompare(right.name, "zh-CN");
    if (sort === "name-desc")
      return right.name.localeCompare(left.name, "zh-CN");
    if (sort === "chunks-asc") {
      return (left.chunkCount ?? 0) - (right.chunkCount ?? 0);
    }
    if (sort === "chunks-desc") {
      return (right.chunkCount ?? 0) - (left.chunkCount ?? 0);
    }

    const leftTime = Date.parse(left.updatedAtValue) || 0;
    const rightTime = Date.parse(right.updatedAtValue) || 0;

    return sort === "updated-asc" ? leftTime - rightTime : rightTime - leftTime;
  });
}

function toKnowledgeSort(key: Key | null): KnowledgeSort {
  const value = String(key ?? "updated-desc");

  if (
    value === "chunks-asc" ||
    value === "chunks-desc" ||
    value === "name-asc" ||
    value === "name-desc" ||
    value === "updated-asc"
  ) {
    return value;
  }

  return "updated-desc";
}

function getKnowledgeStats(rows: KnowledgeRow[]) {
  return {
    failed: rows.filter((row) => row.status === "failed").length,
    indexed: rows.filter((row) => row.status === "indexed").length,
    processing: rows.filter((row) => isProcessingStatus(row.status)).length,
    total: rows.length,
    totalSize: rows.reduce((sum, row) => sum + row.size, 0),
  };
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function formatCompactSourceAddress(value: string) {
  if (value.length <= 40) return value;

  return `${value.slice(0, 20)}...${value.slice(-16)}`;
}

function formatBytes(value?: number) {
  if (value == null) return "-";
  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getStatusLabel(status: KnowledgeStatus) {
  return STATUS_LABELS[status] ?? status;
}

function getStatusColor(status: KnowledgeStatus) {
  if (status === "failed") return "danger";
  if (status === "indexed") return "success";
  if (isProcessingStatus(status)) return "warning";

  return "default";
}

function getKnowledgeError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}

function formatCount(value: number, isLoading: boolean) {
  return isLoading ? "-" : String(value);
}

function getSourceTypeLabel(value?: string) {
  const sourceType = value?.trim().toLowerCase();

  if (!sourceType) return "-";
  if (sourceType === "url") return "URL";
  if (sourceType === "remote") return "URL";
  if (sourceType === "file") return "文件";
  if (sourceType === "local") return "文件";

  return value?.trim() || "-";
}

function isProcessingStatus(status: KnowledgeStatus) {
  return (
    status === "chunking" ||
    status === "embedding" ||
    status === "extracting" ||
    status === "pending"
  );
}
