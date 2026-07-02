"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { FormEvent } from "react";
import type { KnowledgeBase } from "@/lib/api";

import { DataGrid } from "@heroui-pro/react";
import {
  Button,
  Chip,
  Input,
  Label,
  Modal,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import {
  createKnowledgeBaseFromUrl,
  listKnowledgeBases,
  retryKnowledgeBase,
} from "@/lib/api";

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
};

type KnowledgeLoadState = {
  error: string | null;
  isLoading: boolean;
  rows: KnowledgeRow[];
};

type KnowledgeForm = {
  description: string;
  name: string;
  url: string;
};

type CreateKnowledgeState = {
  error: string | null;
  form: KnowledgeForm;
  isCreating: boolean;
};

const DEFAULT_KNOWLEDGE_FORM: KnowledgeForm = {
  description: "",
  name: "",
  url: "",
};

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

const KNOWLEDGE_COLUMNS: DataGridColumn<KnowledgeRow>[] = [
  {
    accessorKey: "name",
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.name}</span>
        {item.description ? (
          <span className="text-muted line-clamp-1 text-xs">
            {item.description}
          </span>
        ) : null}
      </div>
    ),
    header: "名称",
    id: "name",
    isRowHeader: true,
    minWidth: 220,
  },
  {
    cell: (item) => (
      <Chip color={getStatusColor(item.status)} size="sm" variant="soft">
        {getStatusLabel(item.status)}
      </Chip>
    ),
    header: "状态",
    id: "status",
    minWidth: 120,
  },
  {
    accessorKey: "sourceType",
    header: "来源类型",
    id: "sourceType",
    minWidth: 120,
  },
  {
    accessorKey: "chunkCount",
    align: "end",
    allowsSorting: true,
    cell: (item) => item.chunkCount ?? "-",
    header: "片段数",
    id: "chunkCount",
    minWidth: 100,
  },
  {
    cell: (item) => (
      <span className="text-muted line-clamp-2 break-all text-xs">
        {item.sourceAddress}
      </span>
    ),
    header: "来源地址",
    id: "sourceAddress",
    minWidth: 280,
  },
  {
    accessorKey: "updatedAt",
    align: "end",
    allowsSorting: true,
    header: "更新时间",
    id: "updatedAt",
    minWidth: 150,
  },
];

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
        setLoadState({
          error: getKnowledgeError(error, "知识库列表加载失败。"),
          isLoading: false,
          rows: [],
        });
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
        }
      } catch (error) {
        if (isMountedRef.current) {
          setActionError(getKnowledgeError(error, "知识库重试失败。"));
          setRetryingId(null);
        }
      }
    },
    [loadKnowledgeBases],
  );

  const columns = useMemo<DataGridColumn<KnowledgeRow>[]>(
    () => [
      ...KNOWLEDGE_COLUMNS,
      {
        align: "end",
        cell: (item) => {
          if (item.status !== "failed" || item.knowledgeBaseId == null) {
            return <span className="text-muted text-xs">-</span>;
          }

          const knowledgeBaseId = item.knowledgeBaseId;

          return (
            <Button
              isDisabled={retryingId != null}
              size="sm"
              variant="tertiary"
              onPress={() => void handleRetry(knowledgeBaseId)}
            >
              {retryingId === knowledgeBaseId ? "重试中..." : "重试"}
            </Button>
          );
        },
        cellClassName: "w-[120px] min-w-[120px] max-w-[120px] pl-4 pr-4",
        header: "操作",
        headerClassName: "w-[120px] min-w-[120px] max-w-[120px] pl-4 pr-4",
        id: "actions",
        pinned: "end",
        width: 120,
      },
    ],
    [handleRetry, retryingId],
  );
  const stats = useMemo(() => getKnowledgeStats(rows), [rows]);
  const emptyState = getKnowledgeEmptyState({ error, isLoading });

  return (
    <AdminPage
      actions={<CreateKnowledgeBaseDialog onCreated={refreshKnowledgeBases} />}
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

      <section className="flex min-w-0 flex-col gap-3">
        {actionError ? (
          <KnowledgeFormError>{actionError}</KnowledgeFormError>
        ) : null}
        <DataGrid
          aria-label="知识库列表"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={columns}
          contentClassName="min-w-[1120px]"
          data={rows}
          defaultSortDescriptor={{
            column: "updatedAt",
            direction: "descending",
          }}
          getRowId={(item) => item.id}
          renderEmptyState={() => emptyState}
        />
      </section>
    </AdminPage>
  );
}

function CreateKnowledgeBaseDialog({ onCreated }: { onCreated: () => void }) {
  const [state, setState] = useState<CreateKnowledgeState>({
    error: null,
    form: DEFAULT_KNOWLEDGE_FORM,
    isCreating: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: DEFAULT_KNOWLEDGE_FORM,
        isCreating: false,
      });
    },
  });
  const { error, form, isCreating } = state;

  function closeDialog() {
    if (isCreating) return;

    modal.close();
  }

  function updateForm(patch: Partial<KnowledgeForm>) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        ...patch,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const request = {
      description: form.description.trim() || undefined,
      name: form.name.trim(),
      url: form.url.trim(),
    };

    if (!request.name || !request.url) {
      setState((current) => ({
        ...current,
        error: "请输入名称和 URL。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isCreating: true,
    }));

    try {
      await createKnowledgeBaseFromUrl(request);
      modal.close();
      setState({
        error: null,
        form: DEFAULT_KNOWLEDGE_FORM,
        isCreating: false,
      });
      onCreated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getKnowledgeError(error, "知识库创建失败。"),
        isCreating: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">
          <AdminIcon className="size-4" name="plus" />
          新增知识库
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isCreating}
        isKeyboardDismissDisabled={isCreating}
      >
        <Modal.Container placement="center" scroll="outside" size="lg">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>新增 URL 知识库</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                <TextField
                  fullWidth
                  className="flex min-w-0 flex-col gap-2"
                  isDisabled={isCreating}
                  variant="secondary"
                >
                  <Label>名称</Label>
                  <Input
                    fullWidth
                    value={form.name}
                    onChange={(event) =>
                      updateForm({ name: event.target.value })
                    }
                  />
                </TextField>
                <TextField
                  fullWidth
                  className="flex min-w-0 flex-col gap-2"
                  isDisabled={isCreating}
                  variant="secondary"
                >
                  <Label>描述</Label>
                  <Input
                    fullWidth
                    value={form.description}
                    onChange={(event) =>
                      updateForm({ description: event.target.value })
                    }
                  />
                </TextField>
                <TextField
                  fullWidth
                  className="flex min-w-0 flex-col gap-2"
                  isDisabled={isCreating}
                  variant="secondary"
                >
                  <Label>URL</Label>
                  <Input
                    fullWidth
                    type="url"
                    value={form.url}
                    onChange={(event) =>
                      updateForm({ url: event.target.value })
                    }
                  />
                </TextField>

                {error ? (
                  <KnowledgeFormError>{error}</KnowledgeFormError>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isCreating}
                  type="button"
                  variant="tertiary"
                  onPress={closeDialog}
                >
                  取消
                </Button>
                <Button isDisabled={isCreating} type="submit">
                  {isCreating ? "创建中..." : "创建知识库"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
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
  };
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

function getKnowledgeEmptyState({
  error,
  isLoading,
}: {
  error: string | null;
  isLoading: boolean;
}) {
  if (isLoading) return "正在加载知识库...";
  if (error) return error;

  return "暂无知识库数据。";
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

function KnowledgeFormError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}
