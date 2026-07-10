"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type {
  OpenClawInstanceAgent,
  OpenClawInstanceSummary,
  OpenClawPlugin,
  OpenClawPluginInstall,
  OpenClawPluginInstallResult,
  OpenClawPluginScopeType,
} from "@/lib/api";
import type { FormEvent } from "react";

import { DataGrid } from "@heroui-pro/react";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  Description,
  Drawer,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Tabs,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage } from "@/components/admin-page-kit";
import {
  deleteOpenClawPluginLibrary,
  disableOpenClawPlugin,
  enableOpenClawPlugin,
  getOpenClawInstanceDetail,
  getOpenClawPluginLibraryDetail,
  importOpenClawPluginPackage,
  installOpenClawPlugin,
  listOpenClawInstanceSummaries,
  listOpenClawPluginInstalls,
  listOpenClawPluginLibrary,
  replaceOpenClawPluginAgents,
  uninstallOpenClawPlugin,
  updateOpenClawPluginLibrary,
  uploadOpenClawPluginPackage,
} from "@/lib/api";

const PAGE_SIZE = 100;
const MAX_PLUGIN_FILE_SIZE = 100 * 1024 * 1024;
const PLUGIN_UPLOAD_ACCEPT = ".zip,.tgz";
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type TabKey = "library" | "installs";

type InstallTarget = {
  install?: OpenClawPluginInstall;
  lockInstance?: boolean;
  plugin: OpenClawPlugin;
};

type PluginLibraryState = {
  error: string | null;
  includeDeleted: boolean;
  isLoading: boolean;
  items: OpenClawPlugin[];
  page: number;
  pageSize: number;
  query: string;
  total: number;
};

type PluginInstallsState = {
  error: string | null;
  isLoading: boolean;
  items: OpenClawPluginInstall[];
};

export function OpenClawPluginsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("library");
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [installTarget, setInstallTarget] = useState<InstallTarget | null>(
    null,
  );
  const [latestPlugins, setLatestPlugins] = useState<
    Map<string, OpenClawPlugin>
  >(new Map());

  const refreshLatestPlugins = useCallback(async () => {
    try {
      const firstPage = await listOpenClawPluginLibrary({
        includeDeleted: false,
        page: 1,
        pageSize: PAGE_SIZE,
      });
      const firstItems = firstPage.items ?? [];
      const total = firstPage.pagination?.total ?? firstItems.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
          listOpenClawPluginLibrary({
            includeDeleted: false,
            page: index + 2,
            pageSize: PAGE_SIZE,
          }),
        ),
      );
      const records = [
        ...firstItems,
        ...remainingPages.flatMap((response) => response.items ?? []),
      ];
      const nextLatest = new Map<string, OpenClawPlugin>();

      records.forEach((record) => {
        const pluginId = record.pluginId?.trim();

        if (pluginId && record.latest === true) {
          nextLatest.set(pluginId, record);
        }
      });

      setLatestPlugins(nextLatest);
    } catch (error) {
      toast.warning(getActionError(error, "最新插件版本加载失败。"));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "installs") void refreshLatestPlugins();
  }, [activeTab, refreshKey, refreshLatestPlugins]);

  const refreshAll = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary" onPress={refreshAll}>
            <AdminIcon className="size-4" name="refresh" />
            刷新
          </Button>
          <Button size="sm" onPress={() => setUploadOpen(true)}>
            <AdminIcon className="size-4" name="upload" />
            上传插件
          </Button>
        </>
      }
      description="维护已入库的 OpenClaw 插件包及其在实例上的安装关系。"
      eyebrow="OpenClaw"
      navigation={
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as TabKey)}
        >
          <Tabs.ListContainer className="w-auto">
            <Tabs.List aria-label="插件管理视图" className="w-auto">
              <Tabs.Tab className="whitespace-nowrap" id="library">
                插件广场
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab className="whitespace-nowrap" id="installs">
                实例插件
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      }
      title="插件管理"
    >
      {activeTab === "library" ? (
        <PluginLibraryTab
          refreshKey={refreshKey}
          onInstall={(plugin) => setInstallTarget({ plugin })}
          onLibraryChanged={refreshAll}
        />
      ) : (
        <PluginInstallsTab
          latestPlugins={latestPlugins}
          refreshKey={refreshKey}
          onInstall={(target) => setInstallTarget(target)}
        />
      )}

      <PluginUploadDialog
        isOpen={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={refreshAll}
      />
      <PluginInstallDialog
        target={installTarget}
        onCompleted={refreshAll}
        onOpenChange={(isOpen) => {
          if (!isOpen) setInstallTarget(null);
        }}
      />
    </AdminPage>
  );
}

function PluginLibraryTab({
  onInstall,
  onLibraryChanged,
  refreshKey,
}: {
  onInstall: (plugin: OpenClawPlugin) => void;
  onLibraryChanged: () => void;
  refreshKey: number;
}) {
  const detailDrawer = useOverlayState();
  const requestIdRef = useRef(0);
  const [state, setState] = useState<PluginLibraryState>({
    error: null,
    includeDeleted: false,
    isLoading: true,
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    query: "",
    total: 0,
  });
  const [queryInput, setQueryInput] = useState("");
  const [expandedPluginIds, setExpandedPluginIds] = useState<Set<string>>(
    new Set(),
  );
  const [detailRecord, setDetailRecord] = useState<OpenClawPlugin | null>(null);
  const [detail, setDetail] = useState<OpenClawPlugin | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OpenClawPlugin | null>(
    null,
  );
  const [deletingRecord, setDeletingRecord] = useState<OpenClawPlugin | null>(
    null,
  );

  const loadLibrary = useCallback(
    async (
      page: number,
      query = state.query,
      includeDeleted = state.includeDeleted,
    ) => {
      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;
      setState((current) => ({ ...current, error: null, isLoading: true }));

      try {
        const response = await listOpenClawPluginLibrary({
          includeDeleted,
          page,
          pageSize: PAGE_SIZE,
          query: query.trim() || undefined,
        });

        if (requestId !== requestIdRef.current) return;

        setState({
          error: null,
          includeDeleted,
          isLoading: false,
          items: response.items ?? [],
          page: response.pagination?.page ?? page,
          pageSize: response.pagination?.pageSize ?? PAGE_SIZE,
          query,
          total: response.pagination?.total ?? response.items?.length ?? 0,
        });
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        const message = getActionError(error, "插件广场加载失败。");

        setState((current) => ({
          ...current,
          error: message,
          isLoading: false,
        }));
        toast.danger(message);
      }
    },
    [state.includeDeleted, state.query],
  );

  useEffect(() => {
    void loadLibrary(1, state.query, state.includeDeleted);
  }, [refreshKey]);

  const groups = useMemo(() => groupPluginVersions(state.items), [state.items]);
  const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize));

  const openDetail = useCallback(
    async (record: OpenClawPlugin) => {
      const id = record.id;

      if (typeof id !== "number") {
        toast.danger("插件记录缺少 ID，无法读取详情。");

        return;
      }

      setDetailRecord(record);
      setDetail(null);
      setIsLoadingDetail(true);
      detailDrawer.open();

      try {
        const response = await getOpenClawPluginLibraryDetail(id);

        setDetail(response ?? record);
      } catch (error) {
        const message = getActionError(error, "插件详情加载失败。");

        setDetail(record);
        toast.danger(message);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [detailDrawer],
  );

  const columns = useMemo<DataGridColumn<OpenClawPlugin>[]>(
    () => [
      {
        cell: (item) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-xs font-medium" title={item.name}>
              {item.name?.trim() || item.pluginId || "未命名插件"}
            </span>
            <span className="text-muted truncate text-xs" title={item.pluginId}>
              {item.pluginId || "-"}
            </span>
          </div>
        ),
        header: "插件",
        headerClassName: "whitespace-nowrap",
        id: "plugin",
        isRowHeader: true,
        minWidth: 190,
      },
      {
        cell: (item) => (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span>{item.version || "-"}</span>
            {item.latest ? (
              <Chip
                className="whitespace-nowrap"
                color="accent"
                size="sm"
                variant="soft"
              >
                最新版本
              </Chip>
            ) : null}
          </div>
        ),
        cellClassName: "whitespace-nowrap",
        header: "版本",
        headerClassName: "whitespace-nowrap",
        id: "version",
        width: 138,
      },
      {
        cell: (item) => <CapabilityTypes capabilities={item.capabilities} />,
        header: "能力",
        headerClassName: "whitespace-nowrap",
        id: "capabilities",
        minWidth: 190,
      },
      {
        cell: (item) => getSourceLabel(item.sourceType),
        cellClassName: "whitespace-nowrap",
        header: "来源",
        headerClassName: "whitespace-nowrap",
        id: "sourceType",
        width: 96,
      },
      {
        align: "end",
        cell: (item) => formatBytes(item.sizeBytes),
        cellClassName: "whitespace-nowrap tabular-nums",
        header: "大小",
        headerClassName: "whitespace-nowrap",
        id: "sizeBytes",
        width: 92,
      },
      {
        cell: (item) => <PluginStatusChip plugin={item} />,
        cellClassName: "whitespace-nowrap",
        header: "状态",
        headerClassName: "whitespace-nowrap",
        id: "status",
        width: 96,
      },
      {
        cell: (item) => formatDateTime(item.updatedAt || item.createdAt),
        cellClassName: "whitespace-nowrap",
        header: "更新时间",
        headerClassName: "whitespace-nowrap",
        id: "updatedAt",
        width: 140,
      },
      {
        align: "end",
        cell: (item) => (
          <LibraryActions
            plugin={item}
            onDelete={setDeletingRecord}
            onDetail={openDetail}
            onEdit={setEditingRecord}
            onInstall={onInstall}
          />
        ),
        cellClassName: "whitespace-nowrap",
        header: "操作",
        headerClassName: "whitespace-nowrap",
        id: "actions",
        minWidth: 232,
      },
    ],
    [onInstall, openDetail],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadLibrary(1, queryInput, state.includeDeleted);
  }

  function handleDeletedChange(includeDeleted: boolean) {
    void loadLibrary(1, state.query, includeDeleted);
  }

  function toggleGroup(pluginId: string) {
    setExpandedPluginIds((current) => {
      const next = new Set(current);

      if (next.has(pluginId)) next.delete(pluginId);
      else next.add(pluginId);

      return next;
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-balance text-base font-semibold">插件广场</h2>
          <p className="text-muted text-pretty mt-1 text-sm">
            同一稳定 ID 可保留多个版本；默认突出当前最新版本。
          </p>
        </div>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={handleSearch}
        >
          <TextField fullWidth variant="secondary">
            <Label className="sr-only">搜索插件</Label>
            <Input
              placeholder="搜索名称、插件 ID、描述或版本"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
            />
          </TextField>
          <Button type="submit" variant="secondary">
            <AdminIcon className="size-4" name="search" />
            搜索
          </Button>
        </form>
        <Checkbox
          className="w-fit"
          isSelected={state.includeDeleted}
          onChange={handleDeletedChange}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            显示已删除
          </Checkbox.Content>
        </Checkbox>
        {state.error ? <InlineError>{state.error}</InlineError> : null}
        {groups.length > 0 ? (
          <div className="flex flex-col">
            {groups.map((group, index) => {
              const isExpanded = expandedPluginIds.has(group.pluginId);
              const visibleItems = isExpanded
                ? group.items
                : [group.defaultItem];

              return (
                <section
                  key={group.pluginId}
                  className={
                    index === 0
                      ? "flex flex-col gap-3 pb-5"
                      : "flex flex-col gap-3 border-t border-divider py-5"
                  }
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-balance truncate text-sm font-semibold">
                        {group.pluginId}
                      </h3>
                      <p className="text-muted text-xs">
                        {group.items.length} 个版本
                      </p>
                    </div>
                    {group.items.length > 1 ? (
                      <Button
                        size="sm"
                        variant="tertiary"
                        onPress={() => toggleGroup(group.pluginId)}
                      >
                        {isExpanded
                          ? "收起历史版本"
                          : `查看 ${group.items.length - 1} 个历史版本`}
                      </Button>
                    ) : null}
                  </div>
                  <DataGrid
                    aria-label={`${group.pluginId} 插件版本`}
                    className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
                    columns={columns}
                    contentClassName="min-w-[1120px]"
                    data={visibleItems}
                    getRowId={(item) => String(item.id ?? item.version)}
                  />
                </section>
              );
            })}
          </div>
        ) : (
          <p className="text-muted rounded-md border border-dashed border-divider px-3 py-8 text-center text-sm">
            {state.isLoading ? "加载中..." : "暂无插件记录"}
          </p>
        )}
        <PaginationControls
          currentPage={state.page}
          isDisabled={state.isLoading}
          totalPages={totalPages}
          onPageChange={(page) =>
            void loadLibrary(page, state.query, state.includeDeleted)
          }
        />
      </div>

      <PluginEditDialog
        plugin={editingRecord}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingRecord(null);
        }}
        onSaved={() => {
          onLibraryChanged();
          void loadLibrary(state.page, state.query, state.includeDeleted);
        }}
      />
      <PluginDeleteDialog
        plugin={deletingRecord}
        onDeleted={() => {
          onLibraryChanged();
          void loadLibrary(state.page, state.query, state.includeDeleted);
        }}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingRecord(null);
        }}
      />
      <PluginDetailDrawer
        detail={detail}
        drawer={detailDrawer}
        fallback={detailRecord}
        isLoading={isLoadingDetail}
        onDelete={setDeletingRecord}
        onEdit={setEditingRecord}
        onInstall={onInstall}
      />
    </div>
  );
}

function PluginInstallsTab({
  latestPlugins,
  onInstall,
  refreshKey,
}: {
  latestPlugins: Map<string, OpenClawPlugin>;
  onInstall: (target: InstallTarget) => void;
  refreshKey: number;
}) {
  const [state, setState] = useState<PluginInstallsState>({
    error: null,
    isLoading: true,
    items: [],
  });
  const [actionId, setActionId] = useState<number | null>(null);
  const [scopeRecord, setScopeRecord] = useState<OpenClawPluginInstall | null>(
    null,
  );
  const [uninstallRecord, setUninstallRecord] =
    useState<OpenClawPluginInstall | null>(null);

  const loadInstalls = useCallback(async () => {
    setState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const items = await listOpenClawPluginInstalls();

      setState({ error: null, isLoading: false, items });
    } catch (error) {
      const message = getActionError(error, "实例插件加载失败。");

      setState({ error: message, isLoading: false, items: [] });
      toast.danger(message);
    }
  }, []);

  useEffect(() => {
    void loadInstalls();
  }, [loadInstalls, refreshKey]);

  const applyActionResult = useCallback(
    (result: OpenClawPluginInstallResult | undefined, fallback: string) => {
      if (result?.success !== true) {
        const message = getOperationResultMessage(result, fallback);

        toast.danger(message);

        return false;
      }

      setState((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === result.id ? { ...item, ...result } : item,
        ),
      }));
      toast.success(result.message || "操作已完成。");

      if (result.warnings?.length) toast.warning(result.warnings.join("\n"));
      if (result.restartRequired) {
        toast.warning("插件已安装，OpenClaw 实例需要重启后完全生效。");
      }

      return true;
    },
    [],
  );

  const runAction = useCallback(
    async (
      record: OpenClawPluginInstall,
      fallback: string,
      action: (
        installId: number,
      ) => Promise<OpenClawPluginInstallResult | undefined>,
    ) => {
      const installId = record.id;

      if (typeof installId !== "number") {
        toast.danger("安装关系缺少 ID，无法执行操作。");

        return;
      }

      setActionId(installId);

      try {
        applyActionResult(await action(installId), fallback);
        void loadInstalls();
      } catch (error) {
        toast.danger(getActionError(error, fallback));
      } finally {
        setActionId(null);
      }
    },
    [applyActionResult, loadInstalls],
  );

  const columns = useMemo<DataGridColumn<OpenClawPluginInstall>[]>(
    () => [
      {
        cell: (item) => (
          <span
            className="block max-w-40 truncate text-xs"
            title={item.openclawPluginId}
          >
            {item.openclawPluginId || "-"}
          </span>
        ),
        header: "OpenClaw 实例 ID",
        headerClassName: "whitespace-nowrap",
        id: "instance",
        isRowHeader: true,
        minWidth: 160,
      },
      {
        cell: (item) => (
          <span
            className="block max-w-40 truncate text-xs"
            title={item.pluginId}
          >
            {item.pluginId || "-"}
          </span>
        ),
        header: "插件 ID",
        headerClassName: "whitespace-nowrap",
        id: "pluginId",
        minWidth: 148,
      },
      {
        cell: (item) => item.pluginVersion || "-",
        cellClassName: "whitespace-nowrap",
        header: "版本",
        headerClassName: "whitespace-nowrap",
        id: "pluginVersion",
        width: 100,
      },
      {
        cell: (item) => <InstallStatusChip status={item.installStatus} />,
        cellClassName: "whitespace-nowrap",
        header: "安装状态",
        headerClassName: "whitespace-nowrap",
        id: "installStatus",
        width: 100,
      },
      {
        cell: (item) => (
          <Chip
            className="whitespace-nowrap"
            color={item.enabled === false ? "default" : "success"}
            size="sm"
            variant="soft"
          >
            {item.enabled === false ? "已禁用" : "已启用"}
          </Chip>
        ),
        cellClassName: "whitespace-nowrap",
        header: "启用状态",
        headerClassName: "whitespace-nowrap",
        id: "enabled",
        width: 94,
      },
      {
        cell: (item) => (item.scopeType === "agents" ? "指定 Agent" : "全局"),
        cellClassName: "whitespace-nowrap",
        header: "生效范围",
        headerClassName: "whitespace-nowrap",
        id: "scopeType",
        width: 104,
      },
      {
        cell: (item) => (
          <span
            className="block max-w-44 truncate text-xs"
            title={item.agentIds?.join(", ")}
          >
            {item.scopeType === "agents"
              ? item.agentIds?.join(", ") || "-"
              : "全部"}
          </span>
        ),
        header: "Agent",
        headerClassName: "whitespace-nowrap",
        id: "agentIds",
        minWidth: 144,
      },
      {
        cell: (item) => formatDateTime(item.installedAt),
        cellClassName: "whitespace-nowrap",
        header: "安装时间",
        headerClassName: "whitespace-nowrap",
        id: "installedAt",
        width: 140,
      },
      {
        cell: (item) => (
          <span
            className="block max-w-56 truncate text-xs"
            title={item.lastError}
          >
            {item.lastError || "-"}
          </span>
        ),
        header: "最近错误",
        headerClassName: "whitespace-nowrap",
        id: "lastError",
        minWidth: 180,
      },
      {
        align: "end",
        cell: (item) => {
          const latest = item.pluginId
            ? latestPlugins.get(item.pluginId)
            : undefined;
          const canUpdate =
            Boolean(latest?.id) &&
            latest?.id !== item.pluginRecordId &&
            latest?.version !== item.pluginVersion;
          const isPending = item.installStatus === "pending";
          const isActionPending = actionId === item.id;
          const record = toPluginRecord(item, latest);

          return (
            <div className="flex items-center justify-end gap-2">
              {canUpdate ? (
                <Button
                  isDisabled={isPending || isActionPending}
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    onInstall({
                      install: item,
                      lockInstance: true,
                      plugin: latest!,
                    })
                  }
                >
                  更新
                </Button>
              ) : null}
              {item.installStatus === "installed" ? (
                <>
                  <Button
                    isDisabled={isPending || isActionPending}
                    size="sm"
                    variant="tertiary"
                    onPress={() =>
                      void runAction(
                        item,
                        item.enabled === false
                          ? "启用插件失败。"
                          : "禁用插件失败。",
                        (installId) =>
                          item.enabled === false
                            ? enableOpenClawPlugin({ installId })
                            : disableOpenClawPlugin({ installId }),
                      )
                    }
                  >
                    {isActionPending
                      ? "处理中..."
                      : item.enabled === false
                        ? "启用"
                        : "禁用"}
                  </Button>
                  <Button
                    isDisabled={isPending || isActionPending}
                    size="sm"
                    variant="tertiary"
                    onPress={() => setScopeRecord(item)}
                  >
                    修改 Agent
                  </Button>
                  <Button
                    isDisabled={isPending || isActionPending}
                    size="sm"
                    variant="danger-soft"
                    onPress={() => setUninstallRecord(item)}
                  >
                    卸载
                  </Button>
                </>
              ) : item.installStatus === "failed" ||
                item.installStatus === "removed" ? (
                <Button
                  isDisabled={isActionPending || !record.id}
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    onInstall({
                      install: item,
                      lockInstance: true,
                      plugin: record,
                    })
                  }
                >
                  重新安装
                </Button>
              ) : null}
            </div>
          );
        },
        cellClassName: "whitespace-nowrap",
        header: "操作",
        headerClassName: "whitespace-nowrap",
        id: "actions",
        minWidth: 286,
      },
    ],
    [actionId, latestPlugins, onInstall, runAction],
  );

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div>
        <h2 className="text-balance text-base font-semibold">实例插件</h2>
        <p className="text-muted text-pretty mt-1 text-sm">
          记录插件版本与目标 OpenClaw RPC 实例之间的安装关系。
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {state.error ? <InlineError>{state.error}</InlineError> : null}
        <DataGrid
          aria-label="OpenClaw 实例插件安装关系"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={columns}
          contentClassName="min-w-[1600px]"
          data={state.items}
          defaultSortDescriptor={{
            column: "installedAt",
            direction: "descending",
          }}
          getRowId={(item) =>
            String(item.id ?? `${item.openclawPluginId}-${item.pluginId}`)
          }
          renderEmptyState={() =>
            state.isLoading ? "加载中..." : "暂无实例插件安装关系"
          }
        />
      </div>
      <PluginScopeDialog
        install={scopeRecord}
        onOpenChange={(isOpen) => {
          if (!isOpen) setScopeRecord(null);
        }}
        onSaved={(result) => {
          applyActionResult(result, "修改 Agent 失败。");
          void loadInstalls();
        }}
      />
      <PluginUninstallDialog
        install={uninstallRecord}
        onDeleted={(result) => {
          applyActionResult(result, "卸载插件失败。");
          void loadInstalls();
        }}
        onOpenChange={(isOpen) => {
          if (!isOpen) setUninstallRecord(null);
        }}
      />
    </div>
  );
}

function PluginInstallDialog({
  onCompleted,
  onOpenChange,
  target,
}: {
  onCompleted: () => void;
  onOpenChange: (isOpen: boolean) => void;
  target: InstallTarget | null;
}) {
  const isOpen = Boolean(target);
  const [instances, setInstances] = useState<OpenClawInstanceSummary[]>([]);
  const [agents, setAgents] = useState<OpenClawInstanceAgent[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState("");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [scopeType, setScopeType] = useState<OpenClawPluginScopeType>("global");
  const [enabled, setEnabled] = useState(true);
  const [dryRun, setDryRun] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<OpenClawPluginInstallResult | null>(
    null,
  );

  const loadInstances = useCallback(async () => {
    setIsLoadingInstances(true);
    setError(null);

    try {
      const items = await listOpenClawInstanceSummaries({ skillMode: "none" });

      setInstances(items);
    } catch (error) {
      const message = getActionError(error, "OpenClaw 实例加载失败。");

      setError(message);
      toast.danger(message);
    } finally {
      setIsLoadingInstances(false);
    }
  }, []);

  const loadAgents = useCallback(async (pluginId: string) => {
    if (!pluginId) {
      setAgents([]);

      return;
    }

    setIsLoadingAgents(true);
    setError(null);

    try {
      const detail = await getOpenClawInstanceDetail({
        includeSkills: false,
        pluginId,
        skillMode: "none",
      });

      setAgents(detail?.agents ?? []);
    } catch (error) {
      const message = getActionError(error, "OpenClaw Agent 加载失败。");

      setAgents([]);
      setError(message);
      toast.danger(message);
    } finally {
      setIsLoadingAgents(false);
    }
  }, []);

  useEffect(() => {
    if (!target) return;

    const install = target.install;
    const instanceId = target.lockInstance
      ? install?.openclawPluginId?.trim() || ""
      : "";

    setSelectedInstanceId(instanceId);
    setSelectedAgentIds(install?.agentIds ?? []);
    setScopeType(install?.scopeType === "agents" ? "agents" : "global");
    setEnabled(install?.enabled !== false);
    setDryRun(false);
    setError(null);
    setPreview(null);
    setAgents([]);
    void loadInstances();
  }, [loadInstances, target]);

  useEffect(() => {
    if (!isOpen || !selectedInstanceId) return;

    void loadAgents(selectedInstanceId);
  }, [isOpen, loadAgents, selectedInstanceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const pluginRecordId = target?.plugin.id;

    if (typeof pluginRecordId !== "number") {
      setError("插件记录缺少 ID，无法安装。");

      return;
    }

    if (!selectedInstanceId) {
      setError("请选择 OpenClaw 实例。");

      return;
    }

    if (scopeType === "agents" && selectedAgentIds.length === 0) {
      setError("指定 Agent 模式至少需要选择一个 Agent。");

      return;
    }

    setIsSubmitting(true);
    setError(null);
    setPreview(null);

    try {
      const result = await installOpenClawPlugin({
        agentIds: scopeType === "agents" ? selectedAgentIds : [],
        dryRun,
        enabled,
        openclawPluginId: selectedInstanceId,
        pluginRecordId,
        scopeType,
      });

      if (result?.success !== true) {
        const message = getOperationResultMessage(result, "插件安装失败。");

        setError(message);
        toast.danger(message);

        return;
      }

      if (dryRun) {
        setPreview(result);
        toast.success("预演通过，未安装。");

        return;
      }

      toast.success(result.message || "插件已安装。");
      if (result.warnings?.length) toast.warning(result.warnings.join("\n"));
      if (result.restartRequired) {
        toast.warning("插件已安装，OpenClaw 实例需要重启后完全生效。");
      }
      onCompleted();
      onOpenChange(false);
    } catch (error) {
      const message = getActionError(error, "插件安装失败。");

      setError(message);
      toast.danger(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal.Backdrop
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="center" scroll="inside" size="lg">
        <Modal.Dialog>
          <form onSubmit={handleSubmit}>
            <Modal.Header>
              <Modal.Heading>
                {target?.install ? "重新安装插件" : "安装插件"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <div className="rounded-md border border-divider px-3 py-2 text-sm">
                <span className="font-medium">
                  {target?.plugin.name || target?.plugin.pluginId || "插件"}
                </span>
                <span className="text-muted">
                  {" "}
                  · {target?.plugin.version || "未标注版本"}
                </span>
              </div>
              <InstanceSelect
                instances={instances}
                isDisabled={
                  isLoadingInstances || isSubmitting || target?.lockInstance
                }
                selectedPluginId={selectedInstanceId}
                onChange={(pluginId) => {
                  setSelectedInstanceId(pluginId);
                  setSelectedAgentIds([]);
                }}
              />
              <Button
                isDisabled={isSubmitting || !selectedInstanceId}
                size="sm"
                type="button"
                variant="tertiary"
                onPress={() => void loadAgents(selectedInstanceId)}
              >
                <AdminIcon className="size-4" name="refresh" />
                刷新 Agent
              </Button>
              <ScopeFields
                agents={agents}
                isDisabled={isSubmitting || isLoadingAgents}
                scopeType={scopeType}
                selectedAgentIds={selectedAgentIds}
                onAgentIdsChange={setSelectedAgentIds}
                onScopeTypeChange={setScopeType}
              />
              <Checkbox
                isDisabled={isSubmitting}
                isSelected={enabled}
                variant="secondary"
                onChange={setEnabled}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  安装后启用
                </Checkbox.Content>
              </Checkbox>
              <Checkbox
                isDisabled={isSubmitting}
                isSelected={dryRun}
                variant="secondary"
                onChange={setDryRun}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  预演
                </Checkbox.Content>
                <Description>只校验，不安装、不落库。</Description>
              </Checkbox>
              {isSubmitting ? (
                <div className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground">
                  正在传输并安装插件
                </div>
              ) : null}
              {preview ? (
                <PluginOperationResult preview result={preview} />
              ) : null}
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isSubmitting}
                type="button"
                variant="tertiary"
                onPress={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                isDisabled={
                  isLoadingInstances ||
                  isLoadingAgents ||
                  isSubmitting ||
                  !selectedInstanceId ||
                  (scopeType === "agents" && selectedAgentIds.length === 0)
                }
                type="submit"
              >
                {isSubmitting ? "安装中..." : dryRun ? "开始预演" : "安装插件"}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PluginUploadDialog({
  isOpen,
  onOpenChange,
  onUploaded,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploaded: () => void;
}) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [force, setForce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setMode("file");
    setFile(null);
    setUrl("");
    setForce(false);
    setError(null);
    setIsSubmitting(false);
  }, [isOpen]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);

      return;
    }

    const lowerName = selectedFile.name.toLowerCase();

    if (!lowerName.endsWith(".zip") && !lowerName.endsWith(".tgz")) {
      setError("仅支持 ZIP 或 TGZ 插件包。");
      setFile(null);

      return;
    }

    if (selectedFile.size > MAX_PLUGIN_FILE_SIZE) {
      setError("插件包不能超过 100 MiB。");
      setFile(null);

      return;
    }

    setError(null);
    setFile(selectedFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "file" && !file) {
      setError("请选择插件包。");

      return;
    }

    if (mode === "url") {
      try {
        new URL(url);
      } catch {
        setError("请输入有效的插件包 URL。");

        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === "file" && file) {
        await uploadOpenClawPluginPackage(file, force);
      } else {
        await importOpenClawPluginPackage({ force, url: url.trim() });
      }

      toast.success("插件已入库。");
      onOpenChange(false);
      onUploaded();
    } catch (error) {
      const message = getActionError(error, "插件入库失败。");

      setError(message);
      toast.danger(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal.Backdrop
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="center" scroll="inside" size="md">
        <Modal.Dialog>
          <form onSubmit={handleSubmit}>
            <Modal.Header>
              <Modal.Heading>上传插件</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <Tabs
                selectedKey={mode}
                onSelectionChange={(key) => setMode(key as "file" | "url")}
              >
                <Tabs.ListContainer className="w-full">
                  <Tabs.List aria-label="插件入库方式" className="w-full">
                    <Tabs.Tab className="flex-1" id="file">
                      本地上传
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab className="flex-1" id="url">
                      URL 导入
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
                <Tabs.Panel className="pt-4" id="file">
                  <TextField fullWidth variant="secondary">
                    <Label>插件包</Label>
                    <Input
                      accept={PLUGIN_UPLOAD_ACCEPT}
                      disabled={isSubmitting}
                      type="file"
                      onChange={handleFileChange}
                    />
                  </TextField>
                  <p className="text-muted mt-2 text-xs">
                    支持 ZIP、TGZ，最大 100 MiB。
                  </p>
                  {file ? (
                    <p className="mt-2 truncate text-sm" title={file.name}>
                      已选择：{file.name}（{formatBytes(file.size)}）
                    </p>
                  ) : null}
                </Tabs.Panel>
                <Tabs.Panel className="pt-4" id="url">
                  <TextField fullWidth variant="secondary">
                    <Label>插件包 URL</Label>
                    <Input
                      autoComplete="url"
                      disabled={isSubmitting}
                      placeholder="https://example.com/plugin.tgz"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                    />
                  </TextField>
                </Tabs.Panel>
              </Tabs>
              <Checkbox
                isDisabled={isSubmitting}
                isSelected={force}
                variant="secondary"
                onChange={setForce}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  覆盖同版本
                </Checkbox.Content>
              </Checkbox>
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isSubmitting}
                type="button"
                variant="tertiary"
                onPress={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button isDisabled={isSubmitting} type="submit">
                {isSubmitting ? "入库中..." : "入库"}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PluginEditDialog({
  onOpenChange,
  onSaved,
  plugin,
}: {
  onOpenChange: (isOpen: boolean) => void;
  onSaved: () => void;
  plugin: OpenClawPlugin | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(plugin?.name ?? "");
    setDescription(plugin?.description ?? "");
    setError(null);
    setIsSaving(false);
  }, [plugin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (typeof plugin?.id !== "number") {
      setError("插件记录缺少 ID，无法编辑。");

      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateOpenClawPluginLibrary({
        description: description.trim(),
        id: plugin.id,
        name: name.trim(),
      });
      toast.success("插件展示信息已更新。");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      const message = getActionError(error, "插件展示信息更新失败。");

      setError(message);
      toast.danger(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal.Backdrop
      isDismissable={!isSaving}
      isKeyboardDismissDisabled={isSaving}
      isOpen={Boolean(plugin)}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="center" scroll="outside" size="md">
        <Modal.Dialog>
          <form onSubmit={handleSubmit}>
            <Modal.Header>
              <Modal.Heading>编辑插件</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <TextField fullWidth variant="secondary">
                <Label>名称</Label>
                <Input
                  disabled={isSaving}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </TextField>
              <TextField fullWidth variant="secondary">
                <Label>描述</Label>
                <TextArea
                  disabled={isSaving}
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </TextField>
              <p className="text-muted text-xs">版本更新必须重新上传插件包。</p>
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isSaving}
                type="button"
                variant="tertiary"
                onPress={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button isDisabled={isSaving} type="submit">
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PluginDeleteDialog({
  onDeleted,
  onOpenChange,
  plugin,
}: {
  onDeleted: () => void;
  onOpenChange: (isOpen: boolean) => void;
  plugin: OpenClawPlugin | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setError(null);
    setIsDeleting(false);
  }, [plugin]);

  async function handleDelete() {
    if (typeof plugin?.id !== "number") {
      setError("插件记录缺少 ID，无法删除。");

      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteOpenClawPluginLibrary(plugin.id);
      toast.success("插件版本已删除。");
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      const message = getActionError(error, "插件删除失败。");

      setError(message);
      toast.danger(message);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal.Backdrop
      isDismissable={!isDeleting}
      isKeyboardDismissDisabled={isDeleting}
      isOpen={Boolean(plugin)}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="center" scroll="outside" size="sm">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>删除插件版本</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex min-w-0 flex-col gap-3">
            <p className="text-muted text-sm">
              确认删除「{plugin?.name || plugin?.pluginId || plugin?.id}
              」？仅从插件广场软删除当前版本，不会卸载已经安装到 OpenClaw
              实例中的插件。
            </p>
            {error ? <InlineError>{error}</InlineError> : null}
          </Modal.Body>
          <Modal.Footer>
            <Button
              isDisabled={isDeleting}
              type="button"
              variant="tertiary"
              onPress={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              isDisabled={isDeleting}
              type="button"
              variant="danger"
              onPress={() => void handleDelete()}
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PluginDetailDrawer({
  detail,
  drawer,
  fallback,
  isLoading,
  onDelete,
  onEdit,
  onInstall,
}: {
  detail: OpenClawPlugin | null;
  drawer: ReturnType<typeof useOverlayState>;
  fallback: OpenClawPlugin | null;
  isLoading: boolean;
  onDelete: (plugin: OpenClawPlugin) => void;
  onEdit: (plugin: OpenClawPlugin) => void;
  onInstall: (plugin: OpenClawPlugin) => void;
}) {
  const plugin = detail ?? fallback;
  const isDeleted = plugin?.isDelete === 1;

  return (
    <Drawer state={drawer}>
      <Drawer.Backdrop
        isDismissable={!isLoading}
        isKeyboardDismissDisabled={isLoading}
      >
        <Drawer.Content className="w-full max-w-2xl" placement="right">
          <Drawer.Dialog>
            <Drawer.Header>
              <Drawer.Heading>插件详情</Drawer.Heading>
              <Drawer.CloseTrigger aria-label="关闭插件详情" />
            </Drawer.Header>
            <Drawer.Body className="flex min-w-0 flex-col gap-5 overflow-y-auto">
              {isLoading ? (
                <p className="text-muted text-sm">正在加载详情...</p>
              ) : null}
              {plugin ? (
                <>
                  <DetailSection title="基本信息">
                    <DetailGrid
                      items={[
                        ["名称", plugin.name],
                        ["插件 ID", plugin.pluginId],
                        ["版本", plugin.version],
                        ["描述", plugin.description],
                        ["来源", getSourceLabel(plugin.sourceType)],
                        ["来源地址", plugin.sourceUrl],
                        ["SHA-256", plugin.sha256],
                        ["文件大小", formatBytes(plugin.sizeBytes)],
                        ["创建时间", formatDateTime(plugin.createdAt)],
                        ["更新时间", formatDateTime(plugin.updatedAt)],
                      ]}
                    />
                  </DetailSection>
                  <DetailSection title="能力信息">
                    <CapabilityList
                      label="工具"
                      values={plugin.capabilities?.tools}
                    />
                    <CapabilityList
                      label="Channel"
                      values={plugin.capabilities?.channels}
                    />
                    <CapabilityList
                      label="Provider"
                      values={plugin.capabilities?.providers}
                    />
                    <CapabilityList
                      label="Hook"
                      values={plugin.capabilities?.hooks}
                    />
                    <CapabilityList
                      label="Command"
                      values={plugin.capabilities?.commands}
                    />
                  </DetailSection>
                  <DetailSection title="Manifest">
                    <JsonBlock value={plugin.manifest} />
                  </DetailSection>
                  <DetailSection title="Package">
                    <JsonBlock value={plugin.package} />
                  </DetailSection>
                </>
              ) : null}
            </Drawer.Body>
            <Drawer.Footer>
              {plugin && !isDeleted ? (
                <div className="flex w-full flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="tertiary"
                    onPress={() => {
                      drawer.close();
                      onEdit(plugin);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="danger-soft"
                    onPress={() => {
                      drawer.close();
                      onDelete(plugin);
                    }}
                  >
                    删除
                  </Button>
                  <Button
                    size="sm"
                    onPress={() => {
                      drawer.close();
                      onInstall(plugin);
                    }}
                  >
                    安装
                  </Button>
                </div>
              ) : null}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

function PluginScopeDialog({
  install,
  onOpenChange,
  onSaved,
}: {
  install: OpenClawPluginInstall | null;
  onOpenChange: (isOpen: boolean) => void;
  onSaved: (result: OpenClawPluginInstallResult | undefined) => void;
}) {
  const [agents, setAgents] = useState<OpenClawInstanceAgent[]>([]);
  const [scopeType, setScopeType] = useState<OpenClawPluginScopeType>("global");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadAgents = useCallback(async (pluginId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const detail = await getOpenClawInstanceDetail({
        includeSkills: false,
        pluginId,
        skillMode: "none",
      });

      setAgents(detail?.agents ?? []);
    } catch (error) {
      const message = getActionError(error, "OpenClaw Agent 加载失败。");

      setAgents([]);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const pluginId = install?.openclawPluginId?.trim();

    setScopeType(install?.scopeType === "agents" ? "agents" : "global");
    setSelectedAgentIds(install?.agentIds ?? []);
    setError(null);
    setAgents([]);
    setIsSaving(false);
    if (pluginId) void loadAgents(pluginId);
  }, [install, loadAgents]);

  async function handleSave() {
    if (typeof install?.id !== "number") {
      setError("安装关系缺少 ID，无法修改 Agent。");

      return;
    }

    if (scopeType === "agents" && selectedAgentIds.length === 0) {
      setError("指定 Agent 模式至少需要选择一个 Agent。");

      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await replaceOpenClawPluginAgents({
        agentIds: scopeType === "agents" ? selectedAgentIds : [],
        installId: install.id,
        scopeType,
      });

      if (result?.success !== true) {
        setError(getOperationResultMessage(result, "修改 Agent 失败。"));

        return;
      }

      onOpenChange(false);
      onSaved(result);
    } catch (error) {
      setError(getActionError(error, "修改 Agent 失败。"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal.Backdrop
      isDismissable={!isSaving}
      isKeyboardDismissDisabled={isSaving}
      isOpen={Boolean(install)}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="center" scroll="inside" size="lg">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>修改插件 Agent 范围</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex min-w-0 flex-col gap-4">
            <ScopeFields
              agents={agents}
              isDisabled={isLoading || isSaving}
              scopeType={scopeType}
              selectedAgentIds={selectedAgentIds}
              onAgentIdsChange={setSelectedAgentIds}
              onScopeTypeChange={setScopeType}
            />
            {error ? <InlineError>{error}</InlineError> : null}
          </Modal.Body>
          <Modal.Footer>
            <Button
              isDisabled={isSaving}
              type="button"
              variant="tertiary"
              onPress={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              isDisabled={
                isLoading ||
                isSaving ||
                (scopeType === "agents" && selectedAgentIds.length === 0)
              }
              type="button"
              onPress={() => void handleSave()}
            >
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function PluginUninstallDialog({
  install,
  onDeleted,
  onOpenChange,
}: {
  install: OpenClawPluginInstall | null;
  onDeleted: (result: OpenClawPluginInstallResult | undefined) => void;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setError(null);
    setIsDeleting(false);
  }, [install]);

  async function handleUninstall() {
    if (typeof install?.id !== "number") {
      setError("安装关系缺少 ID，无法卸载。");

      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await uninstallOpenClawPlugin({ installId: install.id });

      if (result?.success !== true) {
        setError(getOperationResultMessage(result, "卸载插件失败。"));

        return;
      }

      onOpenChange(false);
      onDeleted(result);
    } catch (error) {
      setError(getActionError(error, "卸载插件失败。"));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal.Backdrop
      isDismissable={!isDeleting}
      isKeyboardDismissDisabled={isDeleting}
      isOpen={Boolean(install)}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="center" scroll="outside" size="sm">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>卸载插件</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex min-w-0 flex-col gap-3">
            <p className="text-muted text-sm">
              确认从实例「{install?.openclawPluginId}」卸载插件「
              {install?.pluginId}」？卸载后会保留安装记录并标记为已卸载。
            </p>
            {error ? <InlineError>{error}</InlineError> : null}
          </Modal.Body>
          <Modal.Footer>
            <Button
              isDisabled={isDeleting}
              type="button"
              variant="tertiary"
              onPress={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              isDisabled={isDeleting}
              type="button"
              variant="danger"
              onPress={() => void handleUninstall()}
            >
              {isDeleting ? "卸载中..." : "确认卸载"}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function LibraryActions({
  onDelete,
  onDetail,
  onEdit,
  onInstall,
  plugin,
}: {
  onDelete: (plugin: OpenClawPlugin) => void;
  onDetail: (plugin: OpenClawPlugin) => void;
  onEdit: (plugin: OpenClawPlugin) => void;
  onInstall: (plugin: OpenClawPlugin) => void;
  plugin: OpenClawPlugin;
}) {
  const isDeleted = plugin.isDelete === 1;

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="sm"
        variant="tertiary"
        onPress={() => void onDetail(plugin)}
      >
        详情
      </Button>
      {!isDeleted ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => onInstall(plugin)}
          >
            安装
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => onEdit(plugin)}>
            编辑
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => onDelete(plugin)}
          >
            删除
          </Button>
        </>
      ) : null}
    </div>
  );
}

function InstanceSelect({
  instances,
  isDisabled,
  onChange,
  selectedPluginId,
}: {
  instances: OpenClawInstanceSummary[];
  isDisabled?: boolean;
  onChange: (pluginId: string) => void;
  selectedPluginId: string;
}) {
  if (instances.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-divider px-3 py-2 text-sm text-muted">
        当前没有已连接的 OpenClaw RPC 实例。
      </div>
    );
  }

  return (
    <Select
      fullWidth
      isDisabled={isDisabled}
      selectedKey={selectedPluginId}
      variant="secondary"
      onSelectionChange={(key) => onChange(String(key ?? ""))}
    >
      <Label>OpenClaw 实例</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {instances.map((instance) => {
            const pluginId = instance.pluginId?.trim() ?? "";

            return (
              <ListBox.Item
                key={pluginId}
                id={pluginId}
                textValue={pluginId || "未命名实例"}
              >
                {pluginId || "未命名实例"}
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function ScopeFields({
  agents,
  isDisabled,
  onAgentIdsChange,
  onScopeTypeChange,
  scopeType,
  selectedAgentIds,
}: {
  agents: OpenClawInstanceAgent[];
  isDisabled: boolean;
  onAgentIdsChange: (agentIds: string[]) => void;
  onScopeTypeChange: (scopeType: OpenClawPluginScopeType) => void;
  scopeType: OpenClawPluginScopeType;
  selectedAgentIds: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <Select
        fullWidth
        isDisabled={isDisabled}
        selectedKey={scopeType}
        variant="secondary"
        onSelectionChange={(key) => {
          const nextScope = String(key ?? "global") as OpenClawPluginScopeType;

          onScopeTypeChange(nextScope);
          if (nextScope === "global") onAgentIdsChange([]);
        }}
      >
        <Label>生效范围</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="global" textValue="全局">
              全局
            </ListBox.Item>
            <ListBox.Item id="agents" textValue="指定 Agent">
              指定 Agent
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      {scopeType === "agents" ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Agent</span>
          {agents.length === 0 ? (
            <div className="rounded-md border border-dashed border-divider px-3 py-2 text-sm text-muted">
              {isDisabled
                ? "正在读取 Agent..."
                : "当前实例没有可绑定的 Agent。"}
            </div>
          ) : (
            <CheckboxGroup
              aria-label="选择 Agent"
              className="grid max-h-56 gap-2 overflow-auto rounded-md border border-divider p-2"
              isDisabled={isDisabled}
              value={selectedAgentIds}
              variant="secondary"
              onChange={onAgentIdsChange}
            >
              {agents.map((agent) => {
                const agentId = agent.agentId?.trim() ?? "";

                if (!agentId) return null;

                return (
                  <Checkbox key={agentId} className="w-full" value={agentId}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <span className="min-w-0 truncate text-sm">
                        {agent.displayName || agentId}
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CapabilityTypes({
  capabilities,
}: {
  capabilities: OpenClawPlugin["capabilities"];
}) {
  const types = capabilities?.types ?? [];

  return types.length > 0 ? (
    <div className="flex max-w-52 flex-wrap gap-1">
      {types.map((type) => (
        <Chip key={type} className="whitespace-nowrap" size="sm" variant="soft">
          {type}
        </Chip>
      ))}
    </div>
  ) : (
    <span className="text-muted text-xs">-</span>
  );
}

function CapabilityList({
  label,
  values,
}: {
  label: string;
  values?: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted text-xs">{label}</span>
      {values?.length ? (
        <div className="flex flex-wrap gap-1">
          {values.map((value) => (
            <Chip key={value} size="sm" variant="soft">
              {value}
            </Chip>
          ))}
        </div>
      ) : (
        <span className="text-sm">-</span>
      )}
    </div>
  );
}

function PluginStatusChip({ plugin }: { plugin: OpenClawPlugin }) {
  const isDeleted = plugin.isDelete === 1;
  const status = isDeleted
    ? "已删除"
    : plugin.status === "ready"
      ? "可安装"
      : plugin.status || "-";

  return (
    <Chip
      className="whitespace-nowrap"
      color={
        isDeleted
          ? "default"
          : plugin.status === "ready"
            ? "success"
            : plugin.status === "failed"
              ? "danger"
              : "warning"
      }
      size="sm"
      variant="soft"
    >
      {status}
    </Chip>
  );
}

function InstallStatusChip({ status }: { status?: string }) {
  const labels: Record<string, string> = {
    failed: "操作失败",
    installed: "已安装",
    pending: "安装中",
    preview: "预演通过",
    removed: "已卸载",
  };
  const color =
    status === "installed"
      ? "success"
      : status === "failed"
        ? "danger"
        : status === "pending"
          ? "warning"
          : "default";

  return (
    <Chip className="whitespace-nowrap" color={color} size="sm" variant="soft">
      {status ? labels[status] || status : "-"}
    </Chip>
  );
}

function PaginationControls({
  currentPage,
  isDisabled,
  onPageChange,
  totalPages,
}: {
  currentPage: number;
  isDisabled: boolean;
  onPageChange: (page: number) => void;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-3">
      <span className="text-muted text-xs">
        第 {currentPage} / {totalPages} 页
      </span>
      <Button
        isDisabled={isDisabled || currentPage <= 1}
        size="sm"
        variant="tertiary"
        onPress={() => onPageChange(currentPage - 1)}
      >
        上一页
      </Button>
      <Button
        isDisabled={isDisabled || currentPage >= totalPages}
        size="sm"
        variant="tertiary"
        onPress={() => onPageChange(currentPage + 1)}
      >
        下一页
      </Button>
    </div>
  );
}

function PluginOperationResult({
  preview,
  result,
}: {
  preview?: boolean;
  result: OpenClawPluginInstallResult;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm">
      <span className="font-medium">
        {preview ? "预演通过，未安装。" : result.message || "操作完成。"}
      </span>
      {result.message && preview ? <span>{result.message}</span> : null}
      {result.warnings?.map((warning) => (
        <span key={warning} className="text-muted">
          {warning}
        </span>
      ))}
      {result.restartRequired ? (
        <span>插件已安装，OpenClaw 实例需要重启后完全生效。</span>
      ) : null}
    </div>
  );
}

function DetailSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function DetailGrid({ items }: { items: [string, string | undefined][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-5 gap-y-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-muted text-xs">{label}</dt>
          <dd className="mt-1 break-words text-sm">{value || "-"}</dd>
        </div>
      ))}
    </dl>
  );
}

function JsonBlock({ value }: { value?: Record<string, unknown> }) {
  return (
    <pre className="max-h-96 overflow-auto rounded-md border border-divider bg-default-50 p-3 text-xs leading-5">
      {formatJson(value)}
    </pre>
  );
}

function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

function groupPluginVersions(items: OpenClawPlugin[]) {
  const groups = new Map<string, OpenClawPlugin[]>();

  items.forEach((item) => {
    const pluginId =
      item.pluginId?.trim() || `record-${item.id ?? item.version ?? "unknown"}`;
    const records = groups.get(pluginId) ?? [];

    records.push(item);
    groups.set(pluginId, records);
  });

  return Array.from(groups.entries())
    .map(([pluginId, records]) => {
      const sortedItems = [...records].sort((left, right) => {
        if (left.latest !== right.latest) return left.latest ? -1 : 1;

        return (right.updatedAt || right.createdAt || "").localeCompare(
          left.updatedAt || left.createdAt || "",
        );
      });
      const defaultItem =
        sortedItems.find((item) => item.latest) ?? sortedItems[0];

      return { defaultItem, items: sortedItems, pluginId };
    })
    .sort((left, right) => left.pluginId.localeCompare(right.pluginId));
}

function toPluginRecord(
  install: OpenClawPluginInstall,
  latest?: OpenClawPlugin,
): OpenClawPlugin {
  return (
    latest ?? {
      id: install.pluginRecordId,
      name: install.pluginId,
      pluginId: install.pluginId,
      version: install.pluginVersion,
    }
  );
}

function getSourceLabel(sourceType?: string) {
  if (sourceType === "local") return "本地上传";
  if (sourceType === "url") return "URL 导入";

  return sourceType || "-";
}

function formatBytes(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    return "-";
  if (value < 1024) return `${value} B`;

  const units = ["KiB", "MiB", "GiB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)) - 1,
    units.length - 1,
  );

  return `${(value / 1024 ** (index + 1)).toFixed(index === 0 ? 1 : 2)} ${units[index]}`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function formatJson(value?: Record<string, unknown>) {
  if (!value) return "{}";

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function getActionError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;

  return fallback;
}

function getOperationResultMessage(
  result: OpenClawPluginInstallResult | undefined,
  fallback: string,
) {
  const messages = [result?.message, ...(result?.warnings ?? [])].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  return messages.length > 0 ? messages.join("\n") : fallback;
}
