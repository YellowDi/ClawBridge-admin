"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type {
  AgentSkill,
  AgentSkillActionResult,
  OpenClawAgentConfigSnapshot,
  OpenClawRPCInstance,
  PrivateSkill,
  PublicSkillSearchItem,
  PublicSkillSource,
  SkillCatalogItem,
  SkillSource,
} from "@/lib/api";

import { DataGrid, DropZone } from "@heroui-pro/react";
import {
  Button,
  Chip,
  Dropdown,
  Input,
  Label,
  ListBox,
  Modal,
  Pagination,
  SearchField,
  Select,
  Switch,
  Tabs,
  TextField,
  Tooltip,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminPage, SectionCard, StatGrid } from "@/components/admin-page-kit";
import { AdminIcon } from "@/components/admin-icons";
import {
  applyAgentSkill,
  deletePrivateSkill,
  disableAgentSkill,
  enableAgentSkill,
  getOpenClawConfigSnapshot,
  getPublicSkillDetail,
  listAgentSkills,
  listOpenClawRPCInstances,
  listPublicSkillSources,
  listSkillCatalog,
  removeAgentSkill,
  searchPublicSkills,
  uploadPrivateSkill,
} from "@/lib/api";

type SkillTab = "agent" | "private" | "public";
type SkillPageState = Record<SkillTab, number>;

type SkillRow = {
  description: string;
  displayName: string;
  eligible?: boolean;
  enabled?: boolean;
  id: string;
  installed?: boolean;
  privateSkillId?: number;
  readonly?: boolean;
  skillKey: string;
  slug: string;
  source: SkillSource;
  sourceId: string;
  sourceType: string;
  tags: string[];
  version: string;
  visibleToAgent?: boolean;
  warnings: string[];
};

type PublicSkillRow = PublicSkillSearchItem & {
  id: string;
};

type LoadState = {
  agentSkills: AgentSkill[];
  agents: OpenClawAgentConfigSnapshot[];
  catalogWarnings: string[];
  error: string | null;
  instances: OpenClawRPCInstance[];
  isActionRunning: boolean;
  isLoadingCatalog: boolean;
  isLoadingContext: boolean;
  lastResult: AgentSkillActionResult | null;
  privateItems: PrivateSkill[];
  publicCatalogItems: SkillCatalogItem[];
  publicSearchItems: PublicSkillRow[];
  publicSearchWarnings: string[];
  publicSources: PublicSkillSource[];
  systemItems: SkillCatalogItem[];
};

const EMPTY_STATE: LoadState = {
  agentSkills: [],
  agents: [],
  catalogWarnings: [],
  error: null,
  instances: [],
  isActionRunning: false,
  isLoadingCatalog: true,
  isLoadingContext: true,
  lastResult: null,
  privateItems: [],
  publicCatalogItems: [],
  publicSearchItems: [],
  publicSearchWarnings: [],
  publicSources: [],
  systemItems: [],
};

const SOURCE_LABELS: Record<string, string> = {
  private: "私有",
  public: "公共",
  system: "系统",
  unknown: "未知",
  workspace: "工作区",
};

const SKILL_UPLOAD_ACCEPT = ".zip,.skill";
const ALL_SOURCE_ID = "__all";
const SKILL_TABLE_PAGE_SIZE = 10;
const INITIAL_PAGE_STATE: SkillPageState = {
  agent: 1,
  private: 1,
  public: 1,
};

export function AdminSkillsPage() {
  const isMountedRef = useRef(false);
  const catalogRequestRef = useRef(0);
  const contextRequestRef = useRef(0);
  const [state, setState] = useState<LoadState>(EMPTY_STATE);
  const [activeTab, setActiveTab] = useState<SkillTab>("agent");
  const [catalogQuery, setCatalogQuery] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [pluginId, setPluginId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [publicQuery, setPublicQuery] = useState("");
  const [publicSourceId, setPublicSourceId] = useState(ALL_SOURCE_ID);
  const [pageByTab, setPageByTab] =
    useState<SkillPageState>(INITIAL_PAGE_STATE);

  const loadContext = useCallback(async () => {
    const requestId = contextRequestRef.current + 1;

    contextRequestRef.current = requestId;
    setState((current) => ({
      ...current,
      error: null,
      isLoadingContext: true,
    }));

    try {
      const [instances, publicSources] = await Promise.all([
        listOpenClawRPCInstances(),
        listPublicSkillSources({ onlyEnabled: false }),
      ]);
      const nextPluginId =
        pluginId || instances.find((item) => item.pluginId)?.pluginId || "";
      let nextAgents: OpenClawAgentConfigSnapshot[] = [];
      let nextAgentId = agentId;

      if (nextPluginId) {
        const snapshot = await getOpenClawConfigSnapshot({
          pluginId: nextPluginId,
        });

        nextAgents = snapshot?.agents ?? [];
        if (
          !nextAgentId ||
          !nextAgents.some((agent) => agent.agentId === nextAgentId)
        ) {
          nextAgentId =
            nextAgents.find((agent) => agent.agentId)?.agentId ?? "";
        }
      } else {
        nextAgentId = "";
      }

      if (!isMountedRef.current || contextRequestRef.current !== requestId) {
        return;
      }

      setState((current) => ({
        ...current,
        agents: nextAgents,
        error: null,
        instances,
        isLoadingContext: false,
        publicSources,
      }));
      setPluginId(nextPluginId);
      setAgentId(nextAgentId);
    } catch (error) {
      if (!isMountedRef.current || contextRequestRef.current !== requestId) {
        return;
      }

      setState((current) => ({
        ...current,
        error: getSkillError(error, "Skill 上下文加载失败。"),
        isLoadingContext: false,
      }));
    }
  }, [agentId, pluginId]);

  const loadCatalog = useCallback(async () => {
    const requestId = catalogRequestRef.current + 1;

    catalogRequestRef.current = requestId;
    setState((current) => ({
      ...current,
      error: null,
      isLoadingCatalog: true,
    }));

    try {
      const [catalog, agentSkills] = await Promise.all([
        listSkillCatalog({
          agentId: agentId || undefined,
          pageSize: 100,
          pluginId: pluginId || undefined,
          query: catalogQuery.trim() || undefined,
        }),
        pluginId
          ? listAgentSkills({
              agentId: agentId || undefined,
              pluginId,
            })
          : Promise.resolve({ items: [], warnings: [] }),
      ]);

      if (!isMountedRef.current || catalogRequestRef.current !== requestId) {
        return;
      }

      setState((current) => ({
        ...current,
        agentSkills: agentSkills.items ?? [],
        catalogWarnings: [
          ...(catalog.warnings ?? []),
          ...(agentSkills.warnings ?? []),
        ],
        error: null,
        isLoadingCatalog: false,
        privateItems: catalog.privateItems ?? [],
        publicCatalogItems: catalog.publicItems ?? [],
        systemItems: catalog.systemItems ?? [],
      }));
    } catch (error) {
      if (!isMountedRef.current || catalogRequestRef.current !== requestId) {
        return;
      }

      setState((current) => ({
        ...current,
        error: getSkillError(error, "Skill 目录加载失败。"),
        isLoadingCatalog: false,
      }));
    }
  }, [agentId, catalogQuery, pluginId]);

  useEffect(() => {
    isMountedRef.current = true;

    void loadContext();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadContext]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const refreshAll = useCallback(() => {
    void loadContext();
    void loadCatalog();
  }, [loadCatalog, loadContext]);
  const setTabPage = useCallback((tab: SkillTab, page: number) => {
    setPageByTab((current) => ({ ...current, [tab]: page }));
  }, []);
  const handleCatalogQueryChange = useCallback(
    (query: string) => {
      setCatalogQuery(query);
      setTabPage("agent", 1);
    },
    [setTabPage],
  );
  const handlePublicQueryChange = useCallback(
    (query: string) => {
      setPublicQuery(query);
      setTabPage("public", 1);
    },
    [setTabPage],
  );
  const handlePublicSourceChange = useCallback(
    (sourceId: string) => {
      setPublicSourceId(sourceId);
      setTabPage("public", 1);
    },
    [setTabPage],
  );

  const skillRows = useMemo(
    () =>
      buildSkillRows(
        state.systemItems,
        state.publicCatalogItems,
        state.privateItems,
        state.agentSkills,
      ),
    [
      state.agentSkills,
      state.privateItems,
      state.publicCatalogItems,
      state.systemItems,
    ],
  );
  const privateRows = useMemo(
    () => state.privateItems.map(toPrivateSkillRow),
    [state.privateItems],
  );
  const publicRows = state.publicSearchItems.length
    ? state.publicSearchItems
    : state.publicCatalogItems.map(toPublicSkillRow);
  const stats = useMemo(() => getSkillStats(skillRows), [skillRows]);
  const hasTargetAgent = Boolean(pluginId && agentId);
  const isBusy =
    state.isActionRunning || state.isLoadingCatalog || state.isLoadingContext;

  const runSkillAction = useCallback(
    async (
      action: () => Promise<AgentSkillActionResult | undefined>,
      successMessage: string,
    ) => {
      setState((current) => ({
        ...current,
        error: null,
        isActionRunning: true,
      }));

      try {
        const result = await action();

        if (!isMountedRef.current) return;

        setState((current) => ({
          ...current,
          isActionRunning: false,
          lastResult: result ?? null,
        }));
        toast.success(successMessage);
        void loadCatalog();
      } catch (error) {
        if (!isMountedRef.current) return;

        const message = getSkillError(error, "Skill 操作失败。");

        setState((current) => ({
          ...current,
          error: message,
          isActionRunning: false,
        }));
        toast.danger(message);
      }
    },
    [loadCatalog],
  );

  const applyRow = useCallback(
    (row: SkillRow | PublicSkillRow) => {
      if (!hasTargetAgent) {
        toast.danger("请先选择 RPC 实例和 Agent。");

        return;
      }

      void runSkillAction(
        () =>
          applyAgentSkill({
            ...toApplyRequest(row),
            agentId,
            dryRun,
            pluginId,
          }),
        dryRun ? "Skill 分配预演完成。" : "Skill 已分配到 Agent。",
      );
    },
    [agentId, dryRun, hasTargetAgent, pluginId, runSkillAction],
  );

  const setRowEnabled = useCallback(
    (row: SkillRow, enabled: boolean) => {
      if (!hasTargetAgent || !row.skillKey) {
        toast.danger("请先选择 RPC 实例、Agent 和 Skill。");

        return;
      }

      void runSkillAction(
        () =>
          enabled
            ? enableAgentSkill({
                agentId,
                dryRun,
                pluginId,
                skillKey: row.skillKey,
              })
            : disableAgentSkill({
                agentId,
                dryRun,
                pluginId,
                skillKey: row.skillKey,
              }),
        enabled ? "Skill 启用请求已提交。" : "Skill 禁用请求已提交。",
      );
    },
    [agentId, dryRun, hasTargetAgent, pluginId, runSkillAction],
  );

  const removeRow = useCallback(
    (row: SkillRow) => {
      if (!hasTargetAgent || !row.skillKey) {
        toast.danger("请先选择 RPC 实例、Agent 和 Skill。");

        return;
      }

      void runSkillAction(
        () =>
          removeAgentSkill({
            agentId,
            dryRun,
            pluginId,
            skillKey: row.skillKey,
          }),
        dryRun ? "Skill 移除预演完成。" : "Skill 已从 Agent 可见列表移除。",
      );
    },
    [agentId, dryRun, hasTargetAgent, pluginId, runSkillAction],
  );

  async function searchPublic() {
    setState((current) => ({
      ...current,
      error: null,
      isActionRunning: true,
    }));

    try {
      const result = await searchPublicSkills({
        limit: 50,
        pluginId: pluginId || undefined,
        query: publicQuery.trim() || undefined,
        sourceId: publicSourceId === ALL_SOURCE_ID ? undefined : publicSourceId,
      });

      if (!isMountedRef.current) return;

      setState((current) => ({
        ...current,
        isActionRunning: false,
        publicSearchItems: (result.items ?? []).map(toPublicSkillRow),
        publicSearchWarnings: result.warnings ?? [],
      }));
    } catch (error) {
      if (!isMountedRef.current) return;

      const message = getSkillError(error, "公共 Skill 搜索失败。");

      setState((current) => ({
        ...current,
        error: message,
        isActionRunning: false,
      }));
      toast.danger(message);
    }
  }

  const skillColumns = useMemo<DataGridColumn<SkillRow>[]>(
    () => [
      ...SKILL_COLUMNS,
      {
        align: "end",
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              isDisabled={!hasTargetAgent || state.isActionRunning}
              size="sm"
              variant="tertiary"
              onPress={() => setRowEnabled(item, item.enabled === false)}
            >
              {item.enabled === false ? "启用" : "禁用"}
            </Button>
            <Dropdown>
              <Tooltip delay={0}>
                <Dropdown.Trigger
                  aria-label="更多操作"
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  <AdminIcon className="size-4" name="more" />
                </Dropdown.Trigger>
                <Tooltip.Content>更多操作</Tooltip.Content>
              </Tooltip>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu
                  aria-label={`${item.displayName || item.slug || item.skillKey} 更多操作`}
                  onAction={(key) => {
                    if (key === "apply") applyRow(item);
                    if (key === "remove") removeRow(item);
                  }}
                >
                  <Dropdown.Item
                    id="apply"
                    isDisabled={!hasTargetAgent || state.isActionRunning}
                  >
                    分配
                  </Dropdown.Item>
                  <Dropdown.Item
                    id="remove"
                    isDisabled={
                      !hasTargetAgent ||
                      state.isActionRunning ||
                      item.visibleToAgent === false
                    }
                    variant="danger"
                  >
                    移除
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        ),
        cellClassName: "w-[132px] min-w-[132px] max-w-[132px] pl-4 pr-4",
        header: "操作",
        headerClassName:
          "w-[132px] min-w-[132px] max-w-[132px] whitespace-nowrap pl-4 pr-4",
        id: "actions",
        pinned: "end",
        width: 132,
      },
    ],
    [applyRow, hasTargetAgent, removeRow, setRowEnabled, state.isActionRunning],
  );
  const privateColumns = useMemo<DataGridColumn<SkillRow>[]>(
    () => [
      ...PRIVATE_COLUMNS,
      {
        align: "end",
        cell: (item) => (
          <div className="flex justify-end gap-2">
            <Button
              isDisabled={!hasTargetAgent || state.isActionRunning}
              size="sm"
              variant="tertiary"
              onPress={() => applyRow(item)}
            >
              分配
            </Button>
            {typeof item.privateSkillId === "number" ? (
              <DeletePrivateSkillDialog
                privateSkillId={item.privateSkillId}
                skillName={item.displayName || item.slug}
                onDeleted={loadCatalog}
              />
            ) : null}
          </div>
        ),
        cellClassName: "w-[148px] min-w-[148px] max-w-[148px] pl-4 pr-4",
        header: "操作",
        headerClassName:
          "w-[148px] min-w-[148px] max-w-[148px] whitespace-nowrap pl-4 pr-4",
        id: "actions",
        pinned: "end",
        width: 148,
      },
    ],
    [applyRow, hasTargetAgent, loadCatalog, state.isActionRunning],
  );
  const publicColumns = useMemo<DataGridColumn<PublicSkillRow>[]>(
    () => [
      ...PUBLIC_COLUMNS,
      {
        align: "end",
        cell: (item) => (
          <div className="flex justify-end gap-2">
            <PublicSkillDetailDialog item={item} pluginId={pluginId} />
            <Button
              isDisabled={!hasTargetAgent || state.isActionRunning}
              size="sm"
              variant="tertiary"
              onPress={() => applyRow(item)}
            >
              分配
            </Button>
          </div>
        ),
        cellClassName: "w-[148px] min-w-[148px] max-w-[148px] pl-4 pr-4",
        header: "操作",
        headerClassName:
          "w-[148px] min-w-[148px] max-w-[148px] whitespace-nowrap pl-4 pr-4",
        id: "actions",
        pinned: "end",
        width: 148,
      },
    ],
    [applyRow, hasTargetAgent, pluginId, state.isActionRunning],
  );

  return (
    <AdminPage
      actions={
        <SkillsPageActions
          isLoading={state.isLoadingContext || state.isLoadingCatalog}
          onRefresh={refreshAll}
          onUploaded={loadCatalog}
        />
      }
      description="管理 OpenClaw Agent 可见 Skill、私有 Skill 归档和公共 Skill 源。"
      eyebrow="Skills"
      title="Skill 管理"
    >
      <SkillContextCard
        agentId={agentId}
        agents={state.agents}
        dryRun={dryRun}
        instances={state.instances}
        isBusy={isBusy}
        pluginId={pluginId}
        onAgentChange={setAgentId}
        onDryRunChange={setDryRun}
        onPluginChange={setPluginId}
      />

      <SkillStatsGrid isLoading={state.isLoadingCatalog} stats={stats} />

      <WarningList
        error={state.error}
        warnings={[...state.catalogWarnings, ...state.publicSearchWarnings]}
      />

      {state.lastResult ? <ActionResult result={state.lastResult} /> : null}

      <SkillTabsSection
        activeTab={activeTab}
        catalogQuery={catalogQuery}
        isActionRunning={state.isActionRunning}
        isLoadingCatalog={state.isLoadingCatalog}
        pageByTab={pageByTab}
        privateColumns={privateColumns}
        privateRows={privateRows}
        publicColumns={publicColumns}
        publicQuery={publicQuery}
        publicRows={publicRows}
        publicSourceId={publicSourceId}
        publicSources={state.publicSources}
        skillColumns={skillColumns}
        skillRows={skillRows}
        onCatalogQueryChange={handleCatalogQueryChange}
        onPageChange={setTabPage}
        onPublicQueryChange={handlePublicQueryChange}
        onPublicSearch={searchPublic}
        onPublicSourceChange={handlePublicSourceChange}
        onTabChange={setActiveTab}
      />
    </AdminPage>
  );
}

function SkillsPageActions({
  isLoading,
  onRefresh,
  onUploaded,
}: {
  isLoading: boolean;
  onRefresh: () => void;
  onUploaded: () => void;
}) {
  return (
    <>
      <Button
        isPending={isLoading}
        size="sm"
        variant="tertiary"
        onPress={onRefresh}
      >
        <AdminIcon className="size-4" name="refresh" />
        刷新
      </Button>
      <UploadPrivateSkillDialog onUploaded={onUploaded} />
    </>
  );
}

function SkillContextCard({
  agentId,
  agents,
  dryRun,
  instances,
  isBusy,
  onAgentChange,
  onDryRunChange,
  onPluginChange,
  pluginId,
}: {
  agentId: string;
  agents: OpenClawAgentConfigSnapshot[];
  dryRun: boolean;
  instances: OpenClawRPCInstance[];
  isBusy: boolean;
  onAgentChange: (agentId: string) => void;
  onDryRunChange: (enabled: boolean) => void;
  onPluginChange: (pluginId: string) => void;
  pluginId: string;
}) {
  return (
    <SectionCard
      compactHeader
      action={
        <div className="flex items-center gap-2 whitespace-nowrap text-sm">
          <span>预演模式</span>
          <Switch
            aria-label="预演模式"
            isDisabled={isBusy}
            isSelected={dryRun}
            onChange={onDryRunChange}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Content>
          </Switch>
        </div>
      }
      description="下方的分配、启用、禁用和移除都会作用到这个 Agent。"
      title="分配目标"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <RPCInstanceSelect
          instances={instances}
          isDisabled={isBusy}
          selectedPluginId={pluginId}
          onChange={onPluginChange}
        />
        <AgentSelect
          agents={agents}
          isDisabled={isBusy || !pluginId}
          selectedAgentId={agentId}
          onChange={onAgentChange}
        />

        {!pluginId ? (
          <div className="md:col-span-2">
            <p className="text-muted">
              当前没有已连接的 OpenClaw 实例，分配、启用、禁用和移除操作已禁用。
            </p>
          </div>
        ) : !agentId ? (
          <div className="md:col-span-2">
            <p className="text-muted">
              当前实例没有可选 Agent，Agent 级操作已禁用。
            </p>
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}

function SkillStatsGrid({
  isLoading,
  stats,
}: {
  isLoading: boolean;
  stats: ReturnType<typeof getSkillStats>;
}) {
  return (
    <StatGrid
      stats={[
        {
          helper: "当前目录可见条目",
          label: "Skill 总数",
          value: formatCount(stats.total, isLoading),
        },
        {
          helper: "目标 Agent 已扫描",
          label: "已安装",
          value: formatCount(stats.installed, isLoading),
        },
        {
          helper: "当前 Agent 可使用",
          label: "已启用",
          tone: "success",
          value: formatCount(stats.enabled, isLoading),
        },
        {
          helper: "不可运行或有告警",
          label: "需关注",
          tone: stats.attention > 0 ? "warning" : "success",
          value: formatCount(stats.attention, isLoading),
        },
      ]}
    />
  );
}

function SkillTabsSection({
  activeTab,
  catalogQuery,
  isActionRunning,
  isLoadingCatalog,
  onCatalogQueryChange,
  onPageChange,
  onPublicQueryChange,
  onPublicSearch,
  onPublicSourceChange,
  onTabChange,
  pageByTab,
  privateColumns,
  privateRows,
  publicColumns,
  publicQuery,
  publicRows,
  publicSourceId,
  publicSources,
  skillColumns,
  skillRows,
}: {
  activeTab: SkillTab;
  catalogQuery: string;
  isActionRunning: boolean;
  isLoadingCatalog: boolean;
  onCatalogQueryChange: (query: string) => void;
  onPageChange: (tab: SkillTab, page: number) => void;
  onPublicQueryChange: (query: string) => void;
  onPublicSearch: () => void;
  onPublicSourceChange: (sourceId: string) => void;
  onTabChange: (tab: SkillTab) => void;
  pageByTab: SkillPageState;
  privateColumns: DataGridColumn<SkillRow>[];
  privateRows: SkillRow[];
  publicColumns: DataGridColumn<PublicSkillRow>[];
  publicQuery: string;
  publicRows: PublicSkillRow[];
  publicSourceId: string;
  publicSources: PublicSkillSource[];
  skillColumns: DataGridColumn<SkillRow>[];
  skillRows: SkillRow[];
}) {
  const agentPage = paginateRows(
    skillRows,
    pageByTab.agent,
    SKILL_TABLE_PAGE_SIZE,
  );
  const privatePage = paginateRows(
    privateRows,
    pageByTab.private,
    SKILL_TABLE_PAGE_SIZE,
  );
  const publicPage = paginateRows(
    publicRows,
    pageByTab.public,
    SKILL_TABLE_PAGE_SIZE,
  );

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => onTabChange(String(key) as SkillTab)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Skill 管理视图">
              <Tabs.Tab className="whitespace-nowrap" id="agent">
                Agent 分配
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab className="whitespace-nowrap" id="private">
                私有库
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab className="whitespace-nowrap" id="public">
                公共库
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        {activeTab === "agent" ? (
          <SearchField
            aria-label="搜索目录"
            className="w-full sm:w-[320px]"
            value={catalogQuery}
            variant="secondary"
            onChange={onCatalogQueryChange}
            onSubmit={onCatalogQueryChange}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索 slug、名称、说明或标签" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        ) : null}

        {activeTab === "public" ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <SearchField
              aria-label="搜索公共 Skill"
              className="w-full sm:w-[260px]"
              value={publicQuery}
              variant="secondary"
              onChange={onPublicQueryChange}
              onSubmit={() => onPublicSearch()}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="输入关键词" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <PublicSourceSelect
              selectedSourceId={publicSourceId}
              sources={publicSources}
              onChange={onPublicSourceChange}
            />
            <Button
              isDisabled={isActionRunning}
              isPending={isActionRunning}
              onPress={onPublicSearch}
            >
              搜索
            </Button>
          </div>
        ) : null}
      </div>

      {activeTab === "agent" ? (
        <>
          <DataGrid
            aria-label="Agent Skill 分配"
            columns={skillColumns}
            contentClassName="min-w-[1120px]"
            data={agentPage.rows}
            getRowId={(item) => item.id}
          />
          {skillRows.length === 0 ? (
            <EmptyText
              isLoading={isLoadingCatalog}
              text="没有可分配的 Skill。"
            />
          ) : null}
          <TablePagination
            page={agentPage.page}
            pageSize={SKILL_TABLE_PAGE_SIZE}
            total={agentPage.total}
            totalPages={agentPage.totalPages}
            onPageChange={(page) => onPageChange("agent", page)}
          />
        </>
      ) : null}

      {activeTab === "private" ? (
        <>
          <DataGrid
            aria-label="私有 Skill 库"
            columns={privateColumns}
            contentClassName="min-w-[980px]"
            data={privatePage.rows}
            getRowId={(item) => item.id}
          />
          {privateRows.length === 0 ? (
            <EmptyText
              isLoading={isLoadingCatalog}
              text="私有库还没有 Skill 归档。"
            />
          ) : null}
          <TablePagination
            page={privatePage.page}
            pageSize={SKILL_TABLE_PAGE_SIZE}
            total={privatePage.total}
            totalPages={privatePage.totalPages}
            onPageChange={(page) => onPageChange("private", page)}
          />
        </>
      ) : null}

      {activeTab === "public" ? (
        <>
          <DataGrid
            aria-label="公共 Skill 库"
            columns={publicColumns}
            contentClassName="min-w-[1060px]"
            data={publicPage.rows}
            getRowId={(item) => item.id}
          />
          {publicRows.length === 0 ? (
            <EmptyText
              isLoading={isActionRunning || isLoadingCatalog}
              text="没有公共 Skill 结果。"
            />
          ) : null}
          <TablePagination
            page={publicPage.page}
            pageSize={SKILL_TABLE_PAGE_SIZE}
            total={publicPage.total}
            totalPages={publicPage.totalPages}
            onPageChange={(page) => onPageChange("public", page)}
          />
        </>
      ) : null}
    </section>
  );
}

const SKILL_COLUMNS: DataGridColumn<SkillRow>[] = [
  {
    cell: (item) => <SkillNameCell row={item} />,
    header: "Skill",
    headerClassName: "whitespace-nowrap",
    id: "skill",
    isRowHeader: true,
    minWidth: 240,
    width: 260,
  },
  {
    cell: (item) => <SourceChip source={item.source} />,
    cellClassName: "whitespace-nowrap",
    header: "来源",
    headerClassName: "whitespace-nowrap",
    id: "source",
    width: 80,
  },
  {
    accessorKey: "version",
    cellClassName: "whitespace-nowrap",
    header: "版本",
    headerClassName: "whitespace-nowrap",
    id: "version",
    width: 96,
  },
  {
    cell: (item) => <BoolChip active={item.installed} label="已安装" />,
    cellClassName: "whitespace-nowrap",
    header: "安装",
    headerClassName: "whitespace-nowrap",
    id: "installed",
    width: 80,
  },
  {
    cell: (item) => <BoolChip active={item.visibleToAgent} label="可见" />,
    cellClassName: "whitespace-nowrap",
    header: "可见",
    headerClassName: "whitespace-nowrap",
    id: "visible",
    width: 80,
  },
  {
    cell: (item) => <BoolChip active={item.enabled} label="启用" />,
    cellClassName: "whitespace-nowrap",
    header: "启用",
    headerClassName: "whitespace-nowrap",
    id: "enabled",
    width: 80,
  },
  {
    cell: (item) => <BoolChip active={item.eligible} label="可运行" />,
    cellClassName: "whitespace-nowrap",
    header: "可运行",
    headerClassName: "whitespace-nowrap",
    id: "eligible",
    width: 88,
  },
  {
    cell: (item) => <TagList values={item.tags} />,
    header: "标签",
    headerClassName: "whitespace-nowrap",
    id: "tags",
    minWidth: 160,
  },
  {
    cell: (item) => <WarningCell values={item.warnings} />,
    header: "告警",
    headerClassName: "whitespace-nowrap",
    id: "warnings",
    minWidth: 180,
  },
];

const PRIVATE_COLUMNS: DataGridColumn<SkillRow>[] = [
  SKILL_COLUMNS[0],
  SKILL_COLUMNS[2],
  {
    accessorKey: "sourceId",
    cell: (item) => (
      <span className="text-muted block truncate text-xs" title={item.sourceId}>
        {item.sourceId || "-"}
      </span>
    ),
    header: "存储",
    headerClassName: "whitespace-nowrap",
    id: "storage",
    minWidth: 160,
  },
  SKILL_COLUMNS[7],
  SKILL_COLUMNS[8],
];

const PUBLIC_COLUMNS: DataGridColumn<PublicSkillRow>[] = [
  {
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">
          {item.displayName || item.slug || "未命名 Skill"}
        </span>
        <span className="text-muted truncate text-xs" title={item.slug}>
          {item.slug || "-"}
        </span>
        {item.description ? (
          <span className="text-muted line-clamp-1 text-xs">
            {item.description}
          </span>
        ) : null}
      </div>
    ),
    header: "Skill",
    headerClassName: "whitespace-nowrap",
    id: "skill",
    isRowHeader: true,
    minWidth: 260,
  },
  {
    accessorKey: "version",
    cellClassName: "whitespace-nowrap",
    header: "版本",
    headerClassName: "whitespace-nowrap",
    id: "version",
    width: 96,
  },
  {
    cell: (item) => (
      <span className="text-muted block truncate text-xs" title={item.sourceId}>
        {item.sourceId || "-"}
      </span>
    ),
    header: "来源",
    headerClassName: "whitespace-nowrap",
    id: "sourceId",
    minWidth: 140,
  },
  {
    cell: (item) => <TagList values={item.tags ?? []} />,
    header: "标签",
    headerClassName: "whitespace-nowrap",
    id: "tags",
    minWidth: 160,
  },
  {
    cell: (item) => <SecurityCell value={item.security} />,
    header: "安全摘要",
    headerClassName: "whitespace-nowrap",
    id: "security",
    minWidth: 180,
  },
  {
    cell: (item) => <WarningCell values={item.warnings ?? []} />,
    header: "告警",
    headerClassName: "whitespace-nowrap",
    id: "warnings",
    minWidth: 180,
  },
];

function RPCInstanceSelect({
  instances,
  isDisabled,
  onChange,
  selectedPluginId,
}: {
  instances: OpenClawRPCInstance[];
  isDisabled: boolean;
  onChange: (pluginId: string) => void;
  selectedPluginId: string;
}) {
  return (
    <Select
      fullWidth
      isDisabled={isDisabled || instances.length === 0}
      selectedKey={selectedPluginId}
      variant="secondary"
      onSelectionChange={(key) => onChange(String(key ?? ""))}
    >
      <Label>RPC 实例</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {instances.map((instance) => {
            const id = instance.pluginId?.trim() ?? "";

            return (
              <ListBox.Item key={id} id={id} textValue={id || "未命名实例"}>
                {id || "未命名实例"}
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function AgentSelect({
  agents,
  isDisabled,
  onChange,
  selectedAgentId,
}: {
  agents: OpenClawAgentConfigSnapshot[];
  isDisabled: boolean;
  onChange: (agentId: string) => void;
  selectedAgentId: string;
}) {
  return (
    <Select
      fullWidth
      isDisabled={isDisabled || agents.length === 0}
      selectedKey={selectedAgentId}
      variant="secondary"
      onSelectionChange={(key) => onChange(String(key ?? ""))}
    >
      <Label>目标 Agent</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {agents.map((agent) => {
            const id = agent.agentId?.trim() ?? "";

            return (
              <ListBox.Item
                key={id}
                id={id}
                textValue={agent.displayName || id || "未命名 Agent"}
              >
                {agent.displayName || id || "未命名 Agent"}
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function PublicSourceSelect({
  onChange,
  selectedSourceId,
  sources,
}: {
  onChange: (sourceId: string) => void;
  selectedSourceId: string;
  sources: PublicSkillSource[];
}) {
  return (
    <Select
      fullWidth
      selectedKey={selectedSourceId}
      variant="secondary"
      onSelectionChange={(key) => onChange(String(key ?? ALL_SOURCE_ID))}
    >
      <Label>公共源</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={ALL_SOURCE_ID} textValue="全部来源">
            全部来源
          </ListBox.Item>
          {sources.map((source) => {
            const id = source.id?.trim() ?? "";

            return (
              <ListBox.Item
                key={id}
                id={id}
                textValue={source.displayName || id || "未命名来源"}
              >
                {source.displayName || id || "未命名来源"}
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function UploadPrivateSkillDialog({ onUploaded }: { onUploaded: () => void }) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) reset();
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");

  function reset() {
    setError(null);
    setIsUploading(false);
    setSelectedFile(null);
    setVersion("");
  }

  function handleFileSelect(files: FileList) {
    const file = files[0] ?? null;

    if (file && !isSkillArchive(file)) {
      setError("仅支持 .zip 或 .skill 归档。");
      setSelectedFile(null);

      return;
    }

    setError(null);
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile || isUploading) return;

    setError(null);
    setIsUploading(true);

    try {
      await uploadPrivateSkill(selectedFile, version);
      toast.success("私有 Skill 已上传。");
      modal.close();
      onUploaded();
    } catch (error) {
      setError(getSkillError(error, "私有 Skill 上传失败。"));
      setIsUploading(false);
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">
          <AdminIcon className="size-4" name="upload" />
          上传私有 Skill
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isUploading}
        isKeyboardDismissDisabled={isUploading}
      >
        <Modal.Container placement="center" scroll="outside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>上传私有 Skill</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
              <TextField
                fullWidth
                isDisabled={isUploading}
                value={version}
                variant="secondary"
                onChange={setVersion}
              >
                <Label>版本号（可选）</Label>
                <Input
                  fullWidth
                  placeholder="留空使用归档默认版本"
                  value={version}
                  onChange={(event) => setVersion(event.target.value)}
                />
              </TextField>
              <DropZone className="min-w-0">
                <DropZone.Area className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-default-300 bg-content1/60 p-5 text-center transition-colors hover:bg-default-50">
                  <DropZone.Icon>
                    <AdminIcon className="text-muted size-8" name="upload" />
                  </DropZone.Icon>
                  <DropZone.Label>选择或拖放 Skill 归档</DropZone.Label>
                  <DropZone.Description>
                    支持 {SKILL_UPLOAD_ACCEPT}
                  </DropZone.Description>
                  <DropZone.Trigger
                    className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    isDisabled={isUploading}
                  >
                    选择文件
                  </DropZone.Trigger>
                </DropZone.Area>
                <DropZone.Input
                  accept={SKILL_UPLOAD_ACCEPT}
                  multiple={false}
                  onSelect={handleFileSelect}
                />
                {selectedFile ? (
                  <DropZone.FileList>
                    <DropZone.FileItem
                      status={isUploading ? "uploading" : undefined}
                    >
                      <DropZone.FileFormatIcon
                        color="blue"
                        format={getFileFormatLabel(selectedFile.name)}
                      />
                      <DropZone.FileInfo>
                        <DropZone.FileName>
                          {selectedFile.name}
                        </DropZone.FileName>
                        <DropZone.FileMeta>
                          {formatBytes(selectedFile.size)}
                        </DropZone.FileMeta>
                      </DropZone.FileInfo>
                      <DropZone.FileRemoveTrigger
                        aria-label="移除已选文件"
                        isDisabled={isUploading}
                        onPress={() => setSelectedFile(null)}
                      />
                    </DropZone.FileItem>
                  </DropZone.FileList>
                ) : null}
              </DropZone>
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isUploading}
                type="button"
                variant="tertiary"
                onPress={modal.close}
              >
                取消
              </Button>
              <Button
                isDisabled={!selectedFile || isUploading}
                type="button"
                onPress={() => void handleUpload()}
              >
                {isUploading ? "上传中..." : "上传"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function DeletePrivateSkillDialog({
  onDeleted,
  privateSkillId,
  skillName,
}: {
  onDeleted: () => void;
  privateSkillId: number;
  skillName: string;
}) {
  const modal = useOverlayState({});
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);

    try {
      await deletePrivateSkill(privateSkillId);
      toast.success("私有 Skill 记录已删除。");
      modal.close();
      onDeleted();
    } catch (error) {
      setError(getSkillError(error, "私有 Skill 删除失败。"));
      setIsDeleting(false);
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="danger-soft">
          删除
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isDeleting}
        isKeyboardDismissDisabled={isDeleting}
      >
        <Modal.Container placement="center" scroll="outside" size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>删除私有 Skill</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-3">
              <p className="text-muted text-sm">
                确认删除「{skillName}
                」？该操作只软删除后台私有库记录，不删除已保存归档，也不影响已下发的
                OpenClaw 实例。
              </p>
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDeleting}
                variant="tertiary"
                onPress={modal.close}
              >
                取消
              </Button>
              <Button
                isDisabled={isDeleting}
                variant="danger"
                onPress={() => void handleDelete()}
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function PublicSkillDetailDialog({
  item,
  pluginId,
}: {
  item: PublicSkillRow;
  pluginId: string;
}) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) void loadDetail();
    },
  });
  const [detail, setDetail] = useState<PublicSkillSearchItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadDetail() {
    setDetail(null);
    setError(null);
    setIsLoading(true);

    try {
      const result = await getPublicSkillDetail({
        pluginId: pluginId || undefined,
        slug: item.slug,
        sourceId: item.sourceId,
        version: item.version,
      });

      setDetail(result ?? item);
      setIsLoading(false);
    } catch (error) {
      setError(getSkillError(error, "公共 Skill 详情加载失败。"));
      setIsLoading(false);
    }
  }

  const current = detail ?? item;

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          详情
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {current.displayName || current.slug || "公共 Skill 详情"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              {isLoading ? (
                <p className="text-muted text-sm">正在加载详情...</p>
              ) : null}
              {error ? <InlineError>{error}</InlineError> : null}
              <DetailLine label="Slug" value={current.slug} />
              <DetailLine label="版本" value={current.version} />
              <DetailLine label="来源" value={current.sourceId} />
              <DetailLine label="主页" value={current.homepage} />
              <DetailLine label="归档地址" value={current.archiveUrl} />
              <DetailLine label="SHA256" value={current.sha256} />
              <DetailBlock label="安全摘要" value={current.security} />
              <WarningList error={null} warnings={current.warnings ?? []} />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={modal.close}>
                关闭
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ActionResult({ result }: { result: AgentSkillActionResult }) {
  return (
    <SectionCard title="最近操作结果">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Chip
            color={result.success === false ? "danger" : "success"}
            size="sm"
            variant="soft"
          >
            {result.success === false ? "失败" : "成功"}
          </Chip>
          <Chip size="sm" variant="soft">
            {result.dryRun ? "Dry run" : "已写入"}
          </Chip>
          {result.followUpMode ? (
            <Chip size="sm" variant="soft">
              {result.followUpMode}
            </Chip>
          ) : null}
        </div>
        {result.message ? (
          <p className="text-sm text-foreground">{result.message}</p>
        ) : null}
        <DetailLine label="configHash" value={result.configHash} />
        <DetailLine label="followUpReason" value={result.followUpReason} />
        <SnapshotLine label="changed" values={result.changed ?? []} />
        <WarningList error={null} warnings={result.warnings ?? []} />
      </div>
    </SectionCard>
  );
}

function SkillNameCell({ row }: { row: SkillRow }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-xs font-medium">
        {row.displayName || row.slug || row.skillKey || "未命名 Skill"}
      </span>
      <span
        className="text-muted truncate text-xs"
        title={row.skillKey || row.slug}
      >
        {row.skillKey || row.slug || "-"}
      </span>
      {row.description ? (
        <span className="text-muted line-clamp-1 text-xs">
          {row.description}
        </span>
      ) : null}
    </div>
  );
}

function SourceChip({ source }: { source?: string }) {
  return (
    <Chip size="sm" variant="soft">
      {SOURCE_LABELS[source || "unknown"] ?? source}
    </Chip>
  );
}

function BoolChip({ active, label }: { active?: boolean; label: string }) {
  return (
    <Chip
      className="whitespace-nowrap"
      color={active ? "success" : "default"}
      size="sm"
      variant="soft"
    >
      {active ? label : "否"}
    </Chip>
  );
}

function TagList({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="text-muted text-xs">-</span>;

  return (
    <div className="flex max-w-48 flex-wrap gap-1">
      {values.slice(0, 3).map((value) => (
        <Chip
          key={value}
          className="max-w-24 truncate"
          size="sm"
          variant="soft"
        >
          {value}
        </Chip>
      ))}
      {values.length > 3 ? (
        <span className="text-muted text-xs">+{values.length - 3}</span>
      ) : null}
    </div>
  );
}

function WarningCell({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="text-muted text-xs">-</span>;

  return (
    <span
      className="text-warning block truncate text-xs"
      title={values.join("\n")}
    >
      {values[0]}
      {values.length > 1 ? ` +${values.length - 1}` : ""}
    </span>
  );
}

function SecurityCell({ value }: { value?: Record<string, string> }) {
  const entries = Object.entries(value ?? {});

  if (entries.length === 0)
    return <span className="text-muted text-xs">-</span>;

  return (
    <span
      className="text-muted block truncate text-xs"
      title={entries.map(([key, item]) => `${key}: ${item}`).join("\n")}
    >
      {entries[0][0]}: {entries[0][1]}
    </span>
  );
}

function WarningList({
  error,
  warnings,
}: {
  error: string | null;
  warnings: string[];
}) {
  if (!error && warnings.length === 0) return null;

  return (
    <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
      {error ? <p className="text-danger">{error}</p> : null}
      {warnings.map((warning) => (
        <p key={warning} className="text-warning">
          {warning}
        </p>
      ))}
    </div>
  );
}

function InlineError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function EmptyText({ isLoading, text }: { isLoading: boolean; text: string }) {
  return (
    <p className="text-muted mt-3 rounded-md border border-dashed border-divider px-3 py-3 text-sm">
      {isLoading ? "正在加载..." : text}
    </p>
  );
}

function TablePagination({
  onPageChange,
  page,
  pageSize,
  total,
  totalPages,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  if (total <= pageSize) return null;

  return (
    <Pagination aria-label="表格分页" className="mt-1" size="sm">
      <Pagination.Summary>
        第 {page} / {totalPages} 页，共 {total} 条
      </Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            isDisabled={page <= 1}
            onPress={() => onPageChange(page - 1)}
          >
            <Pagination.PreviousIcon />
            上一页
          </Pagination.Previous>
        </Pagination.Item>
        <Pagination.Item>
          <Pagination.Next
            isDisabled={page >= totalPages}
            onPress={() => onPageChange(page + 1)}
          >
            下一页
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}

function DetailLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
      <span className="text-muted text-xs">{label}</span>
      <span className="truncate text-xs" title={value}>
        {value || "-"}
      </span>
    </div>
  );
}

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value?: Record<string, string>;
}) {
  const entries = Object.entries(value ?? {});

  return (
    <div className="grid min-w-0 gap-1 sm:grid-cols-[120px_minmax(0,1fr)]">
      <span className="text-muted text-xs">{label}</span>
      <div className="flex min-w-0 flex-col gap-1">
        {entries.length > 0 ? (
          entries.map(([key, item]) => (
            <span key={key} className="truncate text-xs" title={item}>
              {key}: {item}
            </span>
          ))
        ) : (
          <span className="text-muted text-xs">-</span>
        )}
      </div>
    </div>
  );
}

function SnapshotLine({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <span className="text-muted text-xs">{label}</span>
      {values.length > 0 ? (
        values.map((value) => (
          <Chip key={value} size="sm" variant="soft">
            {value}
          </Chip>
        ))
      ) : (
        <span className="text-muted text-xs">-</span>
      )}
    </div>
  );
}

function buildSkillRows(
  systemItems: SkillCatalogItem[],
  publicItems: SkillCatalogItem[],
  privateItems: PrivateSkill[],
  agentSkills: AgentSkill[],
) {
  const rows = new Map<string, SkillRow>();

  for (const item of [
    ...systemItems,
    ...publicItems,
    ...privateItems.map(toPrivateCatalogItem),
  ]) {
    const row = toSkillRow(item);

    rows.set(rowKey(row), row);
  }

  for (const skill of agentSkills) {
    const row = toAgentSkillRow(skill);
    const key = rowKey(row);
    const existing = rows.get(key);

    rows.set(key, existing ? { ...existing, ...row } : row);
  }

  return Array.from(rows.values());
}

function toSkillRow(item: SkillCatalogItem): SkillRow {
  return {
    description: item.description ?? "",
    displayName: item.displayName ?? "",
    eligible: item.eligible,
    enabled: item.enabled,
    id: rowKey({
      skillKey: item.skillKey,
      slug: item.slug,
      source: item.source,
    }),
    installed: item.installed,
    privateSkillId: item.source === "private" ? item.id : undefined,
    readonly: item.readonly,
    skillKey: item.skillKey ?? item.slug ?? "",
    slug: item.slug ?? item.skillKey ?? "",
    source: item.source ?? "unknown",
    sourceId: item.sourceId ?? "",
    sourceType: item.sourceType ?? "",
    tags: item.tags ?? [],
    version: item.version ?? "",
    visibleToAgent: item.visibleToAgent,
    warnings: item.warnings ?? [],
  };
}

function toPrivateSkillRow(item: PrivateSkill): SkillRow {
  return toSkillRow(toPrivateCatalogItem(item));
}

function toPrivateCatalogItem(item: PrivateSkill): SkillCatalogItem {
  return {
    description: item.description,
    displayName: item.displayName,
    id: item.id,
    skillKey: item.slug,
    slug: item.slug,
    source: "private",
    sourceId: item.storageType,
    sourceType: item.objectKey,
    tags: item.tags,
    version: item.version,
  };
}

function toAgentSkillRow(item: AgentSkill): SkillRow {
  return {
    description: item.description ?? "",
    displayName: item.displayName ?? item.name ?? "",
    eligible: item.eligible,
    enabled: item.enabled,
    id: rowKey({
      skillKey: item.skillKey ?? item.name,
      slug: item.name ?? item.skillKey,
      source: item.source,
    }),
    installed: item.installed,
    readonly: item.readonly,
    skillKey: item.skillKey ?? item.name ?? "",
    slug: item.name ?? item.skillKey ?? "",
    source: item.source ?? "unknown",
    sourceId: "",
    sourceType: "",
    tags: [],
    version: item.version ?? "",
    visibleToAgent: item.visibleToAgent,
    warnings: item.warnings ?? [],
  };
}

function toPublicSkillRow(item: SkillCatalogItem | PublicSkillSearchItem) {
  return {
    ...item,
    id: `${item.sourceId ?? "public"}:${item.slug ?? item.displayName ?? ""}:${item.version ?? ""}`,
  } satisfies PublicSkillRow;
}

function toApplyRequest(row: SkillRow | PublicSkillRow) {
  if (isSkillRow(row) && row.source === "private") {
    return {
      privateSkillId: row.privateSkillId,
      skillKey: row.skillKey || row.slug,
      slug: row.slug || row.skillKey,
      source: "private",
      version: row.version || undefined,
    };
  }

  if (isSkillRow(row) && row.source === "system") {
    return {
      skillKey: row.skillKey || row.slug,
      slug: row.slug || row.skillKey,
      source: "system",
    };
  }

  return {
    skillKey: isSkillRow(row) ? row.skillKey || row.slug : row.slug,
    slug: row.slug,
    source: "public",
    sourceId: row.sourceId,
    sourceType: row.sourceType,
    version: row.version || undefined,
  };
}

function isSkillRow(row: SkillRow | PublicSkillRow): row is SkillRow {
  return "skillKey" in row;
}

function rowKey(item: { skillKey?: string; slug?: string; source?: string }) {
  return `${item.source ?? "unknown"}:${item.skillKey || item.slug}`;
}

function getSkillStats(rows: SkillRow[]) {
  return {
    attention: rows.filter(
      (row) => row.eligible === false || row.warnings.length > 0,
    ).length,
    enabled: rows.filter((row) => row.enabled).length,
    installed: rows.filter((row) => row.installed).length,
    total: rows.length,
  };
}

function formatCount(value: number, isLoading: boolean) {
  return isLoading ? "-" : String(value);
}

function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    rows: rows.slice(start, start + pageSize),
    total,
    totalPages,
  };
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

function getFileFormatLabel(fileName: string) {
  return fileName.toLowerCase().endsWith(".zip") ? "ZIP" : "SKILL";
}

function isSkillArchive(file: File) {
  const fileName = file.name.trim().toLowerCase();

  return fileName.endsWith(".zip") || fileName.endsWith(".skill");
}

function getSkillError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;

  return fallback;
}
