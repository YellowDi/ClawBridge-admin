"use client";

import type { Key } from "react";
import type {
  Agent,
  AgentDeployment,
  AgentExport,
  AgentMarkdownFile,
  AgentSkill,
  Model,
  OpenClawRPCInstance,
  PrivateSkill,
  SkillCatalogItem,
} from "@/lib/api";

import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  SearchField,
  Select,
  Tabs,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, SectionCard, StatGrid } from "@/components/admin-page-kit";
import { DeleteAgentDialog, EditAgentDialog } from "@/components/agent-dialog";
import { KnowledgeAvailabilityDialog } from "@/components/knowledge-availability-dialog";
import {
  applyAgentSkill,
  createAgentExport,
  deployAgentExport,
  getAgentDetail,
  initDevAgent,
  listAgentDeployments,
  listAgentExports,
  listAgentSkills,
  listModels,
  listOpenClawRPCInstances,
  listSkillCatalog,
  readAgentMarkdown,
  removeAgentSkill,
  saveAgentMarkdown,
} from "@/lib/api";

type DetailState = {
  agent: Agent | null;
  deployments: AgentDeployment[];
  error: string | null;
  exports: AgentExport[];
  isLoading: boolean;
  models: Model[];
};

type DetailTab = "knowledge" | "markdown" | "overview" | "skills" | "versions";

const EMPTY_AGENT_EXPORTS: AgentExport[] = [];
const EMPTY_DEPLOYMENTS: AgentDeployment[] = [];
const EMPTY_MODELS: Model[] = [];
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function AgentDetailPage({ agentRecordId }: { agentRecordId: number }) {
  const router = useRouter();
  const isMountedRef = useRef(false);
  const [state, setState] = useState<DetailState>({
    agent: null,
    deployments: EMPTY_DEPLOYMENTS,
    error: null,
    exports: EMPTY_AGENT_EXPORTS,
    isLoading: true,
    models: EMPTY_MODELS,
  });
  const [tab, setTab] = useState<DetailTab>("overview");
  const { agent, deployments, error, exports, isLoading, models } = state;

  const loadDetail = useCallback(async () => {
    setState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const [agentDetail, modelList, exportList, deploymentList] =
        await Promise.all([
          getAgentDetail(agentRecordId),
          listModels({ pageSize: 500 }),
          listAgentExports({
            agentId: agentRecordId,
            page: 1,
            pageSize: 50,
          }),
          listAgentDeployments({ agentId: agentRecordId }),
        ]);

      if (!isMountedRef.current) return;

      if (!agentDetail) {
        setState({
          agent: null,
          deployments: EMPTY_DEPLOYMENTS,
          error: "Agent 不存在或已删除。",
          exports: EMPTY_AGENT_EXPORTS,
          isLoading: false,
          models: modelList,
        });

        return;
      }

      setState({
        agent: agentDetail,
        deployments: deploymentList,
        error: null,
        exports: exportList.items ?? [],
        isLoading: false,
        models: modelList,
      });
    } catch (error) {
      if (!isMountedRef.current) return;

      setState((current) => ({
        ...current,
        error: getAgentActionError(error, "Agent 详情加载失败。"),
        isLoading: false,
      }));
    }
  }, [agentRecordId]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadDetail();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDetail]);

  const latestExport = getLatestExport(exports);
  const latestDeployment = getLatestDeployment(deployments);
  const agentLabel = getAgentLabel(agent);
  const editableAgent =
    agent?.id == null
      ? null
      : {
          agentId: agent.agentId ?? "",
          avatarUrl: agent.avatarUrl ?? "",
          defaultImageGenerationModelid:
            agent.defaultImageGenerationModelid ?? "",
          defaultImageModelid: agent.defaultImageModelid ?? "",
          defaultMusicGenerationModelid:
            agent.defaultMusicGenerationModelid ?? "",
          defaultModelid: agent.defaultModelid ?? "",
          defaultPdfModelid: agent.defaultPdfModelid ?? "",
          defaultVideoGenerationModelid:
            agent.defaultVideoGenerationModelid ?? "",
          description: agent.description ?? "",
          displayName: agent.displayName ?? "",
          enabled: agent.enabled !== false,
          id: agent.id,
          reasoningLevel: agent.reasoningLevel ?? "",
          thinkingLevel: agent.thinkingLevel ?? "",
          verboseLevel: agent.verboseLevel ?? "",
        };

  const actions = useMemo(
    () =>
      agent ? (
        <>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => router.push("/agents")}
          >
            返回列表
          </Button>
          {editableAgent ? (
            <>
              <EditAgentDialog
                agent={editableAgent}
                modelOptions={models}
                onUpdated={() => void loadDetail()}
              />
              <DeleteAgentDialog
                agent={editableAgent}
                onDeleted={() => router.push("/agents")}
              />
            </>
          ) : null}
          <InitDevAgentButton
            agentRecordId={agentRecordId}
            onDone={() => void loadDetail()}
          />
          <CreateAgentExportButton
            agentRecordId={agentRecordId}
            onDone={() => void loadDetail()}
          />
        </>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          onPress={() => router.push("/agents")}
        >
          返回列表
        </Button>
      ),
    [agent, agentRecordId, editableAgent, loadDetail, models, router],
  );

  return (
    <AdminPage
      actions={actions}
      description="编辑 Agent 配置、工作区 Markdown、Skill、知识库和版本分发。"
      eyebrow="Agent Detail"
      title={agentLabel}
    >
      {error ? (
        <InlineError action={() => void loadDetail()}>{error}</InlineError>
      ) : null}

      {isLoading ? (
        <DetailSkeleton />
      ) : agent ? (
        <>
          <AgentHero
            agent={agent}
            deployments={deployments}
            latestDeployment={latestDeployment}
            latestExport={latestExport}
          />

          <Tabs
            selectedKey={tab}
            onSelectionChange={(key) => setTab(toDetailTab(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Agent 详情页签">
                <Tabs.Tab id="overview">
                  概览
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="markdown">
                  Markdown
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="skills">
                  Skills
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="knowledge">
                  知识库
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="versions">
                  版本与分发
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>

          {tab === "overview" ? (
            <AgentOverview
              agent={agent}
              deployments={deployments}
              exports={exports}
            />
          ) : null}
          {tab === "markdown" ? (
            <AgentMarkdownPanel agentRecordId={agentRecordId} />
          ) : null}
          {tab === "skills" ? <AgentSkillsPanel agent={agent} /> : null}
          {tab === "knowledge" ? (
            <AgentKnowledgePanel
              agent={agent}
              onSaved={() => void loadDetail()}
            />
          ) : null}
          {tab === "versions" ? (
            <AgentVersionsPanel
              agentRecordId={agentRecordId}
              deployments={deployments}
              exports={exports}
              onChanged={() => void loadDetail()}
            />
          ) : null}
        </>
      ) : (
        <EmptyState>没有找到这个 Agent。</EmptyState>
      )}
    </AdminPage>
  );
}

function AgentHero({
  agent,
  deployments,
  latestDeployment,
  latestExport,
}: {
  agent: Agent;
  deployments: AgentDeployment[];
  latestDeployment?: AgentDeployment;
  latestExport?: AgentExport;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-md border border-default-200 bg-content1 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="size-14 shrink-0">
            {agent.avatarUrl ? (
              <Avatar.Image
                alt={`${getAgentLabel(agent)} 头像`}
                src={agent.avatarUrl}
              />
            ) : null}
            <Avatar.Fallback>
              {getAgentInitials(getAgentLabel(agent))}
            </Avatar.Fallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-foreground truncate text-xl font-semibold">
                {getAgentLabel(agent)}
              </h2>
              <Chip
                color={agent.enabled === false ? "danger" : "success"}
                size="sm"
                variant="soft"
              >
                {agent.enabled === false ? "停用" : "启用"}
              </Chip>
            </div>
            <p className="text-muted mt-1 break-all text-sm">
              {agent.agentId || "-"}
            </p>
            <p className="text-muted mt-3 max-w-3xl text-sm">
              {agent.description || "暂无说明"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs md:min-w-72">
          <MetaBox label="默认模型" value={getDefaultModelLabel(agent)} />
          <MetaBox
            label="知识库"
            value={`${getKnowledgeBaseIds(agent.knowledgeBases).length} 个`}
          />
          <MetaBox
            label="最新导出"
            value={
              latestExport?.version == null ? "-" : `v${latestExport.version}`
            }
          />
          <MetaBox label="下发目标" value={`${deployments.length} 个`} />
        </div>
      </div>
      <StatGrid
        stats={[
          {
            helper: latestExport?.status || "暂无导出",
            label: "最新版本",
            value:
              latestExport?.version == null ? "-" : `v${latestExport.version}`,
          },
          {
            helper: latestExport?.workspaceName || "dev 工作区",
            label: "工作区",
            value: latestExport?.workspaceName ? "已记录" : "-",
          },
          {
            helper: latestDeployment?.targetPluginId || "暂无目标",
            label: "最近下发",
            value: latestDeployment?.status || "-",
          },
          {
            helper: formatDateTime(agent.updatedAt),
            label: "更新时间",
            value: agent.enabled === false ? "停用" : "启用",
          },
        ]}
      />
    </section>
  );
}

function AgentOverview({
  agent,
  deployments,
  exports,
}: {
  agent: Agent;
  deployments: AgentDeployment[];
  exports: AgentExport[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <SectionCard title="基础配置">
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <DetailMeta label="Agent ID" value={agent.agentId || "-"} />
          <DetailMeta label="默认模型" value={getDefaultModelLabel(agent)} />
          <DetailMeta label="Reasoning" value={agent.reasoningLevel || "-"} />
          <DetailMeta label="Thinking" value={agent.thinkingLevel || "-"} />
          <DetailMeta label="Verbose" value={agent.verboseLevel || "-"} />
          <DetailMeta
            label="更新时间"
            value={formatDateTime(agent.updatedAt)}
          />
        </dl>
      </SectionCard>
      <SectionCard title="生命周期">
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <DetailMeta label="导出版本数" value={`${exports.length}`} />
          <DetailMeta label="下发记录数" value={`${deployments.length}`} />
          <DetailMeta
            label="最新导出"
            value={
              getLatestExport(exports)?.version == null
                ? "-"
                : `v${getLatestExport(exports)?.version}`
            }
          />
          <DetailMeta
            label="最近下发状态"
            value={getLatestDeployment(deployments)?.status || "-"}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function AgentMarkdownPanel({ agentRecordId }: { agentRecordId: number }) {
  const [instances, setInstances] = useState<OpenClawRPCInstance[]>([]);
  const [pluginKey, setPluginKey] = useState("__dev");
  const [files, setFiles] = useState<AgentMarkdownFile[]>([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [newPath, setNewPath] = useState("");
  const pluginId = pluginKey === "__dev" ? "" : pluginKey;
  const selectedFile = files.find((file) => file.path === selectedPath);
  const isDirty = (selectedFile?.content ?? "") !== draft;

  const loadMarkdown = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const [instanceList, response] = await Promise.all([
        listOpenClawRPCInstances(),
        readAgentMarkdown({ agentId: agentRecordId, paths: [], pluginId }),
      ]);
      const nextFiles = response.files ?? [];

      setInstances(instanceList);
      setFiles(nextFiles);
      setSelectedPath(nextFiles[0]?.path ?? "");
      setDraft(nextFiles[0]?.content ?? "");
    } catch (error) {
      setError(getAgentActionError(error, "Markdown 文件加载失败。"));
      setFiles([]);
      setSelectedPath("");
      setDraft("");
    } finally {
      setIsLoading(false);
    }
  }, [agentRecordId, pluginId]);

  useEffect(() => {
    void loadMarkdown();
  }, [loadMarkdown]);

  function selectFile(path?: string) {
    const file = files.find((item) => item.path === path);

    setSelectedPath(file?.path ?? "");
    setDraft(file?.content ?? "");
  }

  async function saveCurrentFile() {
    const pathError = validateMarkdownPath(selectedPath);

    if (pathError) {
      setError(pathError);

      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await saveAgentMarkdown({
        agentId: agentRecordId,
        files: [{ content: draft, path: selectedPath }],
        pluginId,
      });
      setFiles((current) =>
        current.map((file) =>
          file.path === selectedPath ? { ...file, content: draft } : file,
        ),
      );
      toast.success("Markdown 已保存。");
    } catch (error) {
      setError(getAgentActionError(error, "Markdown 保存失败。"));
    } finally {
      setIsSaving(false);
    }
  }

  function addFile() {
    const path = newPath.trim();
    const pathError = validateMarkdownPath(path);

    if (pathError) {
      setError(pathError);

      return;
    }

    if (files.some((file) => file.path === path)) {
      setError("该 Markdown 文件已存在。");

      return;
    }

    setFiles((current) => [...current, { content: "", path }]);
    setSelectedPath(path);
    setDraft("");
    setNewPath("");
    setError(null);
  }

  return (
    <SectionCard
      action={
        <Button
          isDisabled={isLoading}
          size="sm"
          variant="secondary"
          onPress={() => void loadMarkdown()}
        >
          <AdminIcon className="size-4" name="refresh" />
          刷新
        </Button>
      }
      description="默认读取 dev OpenClaw；保存只覆盖当前文件。"
      title="Markdown 工作区"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Select
            fullWidth
            selectedKey={pluginKey}
            variant="secondary"
            onSelectionChange={(key) => setPluginKey(String(key))}
          >
            <Label>编辑实例</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="__dev" textValue="dev OpenClaw">
                  dev OpenClaw
                </ListBox.Item>
                {instances.map((instance) =>
                  instance.pluginId ? (
                    <ListBox.Item
                      key={instance.pluginId}
                      id={instance.pluginId}
                      textValue={instance.pluginId}
                    >
                      {instance.pluginId}
                    </ListBox.Item>
                  ) : null,
                )}
              </ListBox>
            </Select.Popover>
          </Select>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <TextField fullWidth variant="secondary">
              <Label>新增 Markdown 文件</Label>
              <Input
                fullWidth
                placeholder="notes/rules.md"
                value={newPath}
                variant="secondary"
                onChange={(event) => setNewPath(event.target.value)}
              />
            </TextField>
            <Button
              className="self-end"
              size="sm"
              variant="secondary"
              onPress={addFile}
            >
              新增
            </Button>
          </div>
        </div>

        {error ? <InlineError>{error}</InlineError> : null}

        <div className="grid min-h-[520px] grid-cols-1 overflow-hidden rounded-md border border-default-200 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="border-b border-default-200 bg-content2 p-3 lg:border-b-0 lg:border-r">
            <div className="text-muted mb-3 text-xs">
              {isLoading ? "正在读取..." : `${files.length} 个 Markdown 文件`}
            </div>
            <div className="flex max-h-72 flex-col gap-1 overflow-auto lg:max-h-[460px]">
              {files.length === 0 && !isLoading ? (
                <span className="text-muted text-sm">暂无 Markdown 文件。</span>
              ) : null}
              {files.map((file) => (
                <Button
                  key={file.path}
                  className="justify-start"
                  size="sm"
                  variant={
                    file.path === selectedPath ? "secondary" : "tertiary"
                  }
                  onPress={() => selectFile(file.path)}
                >
                  <span className="truncate">{file.path}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-col gap-2 border-b border-default-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-foreground truncate text-sm font-medium">
                  {selectedPath || "未选择文件"}
                </div>
                <div className="text-muted text-xs">
                  {isDirty ? "有未保存修改" : "已同步"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={mode === "edit" ? "secondary" : "tertiary"}
                  onPress={() => setMode("edit")}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant={mode === "preview" ? "secondary" : "tertiary"}
                  onPress={() => setMode("preview")}
                >
                  预览
                </Button>
                <Button
                  isDisabled={
                    !selectedPath || isSaving || isLoading || !isDirty
                  }
                  size="sm"
                  onPress={() => void saveCurrentFile()}
                >
                  {isSaving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
            {mode === "edit" ? (
              <textarea
                className="min-h-[460px] w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm outline-none"
                disabled={!selectedPath || isSaving}
                spellCheck={false}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            ) : (
              <div className="min-h-[460px] overflow-auto p-4">
                <div className="prose prose-sm max-w-none text-foreground [&_code]:rounded [&_code]:bg-content2 [&_code]:px-1 [&_h1]:text-xl [&_h2]:text-lg [&_li]:my-1 [&_p]:my-2 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-content2 [&_pre]:p-3">
                  <ReactMarkdown>{draft || " "}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function AgentSkillsPanel({ agent }: { agent: Agent }) {
  const [instances, setInstances] = useState<OpenClawRPCInstance[]>([]);
  const [pluginId, setPluginId] = useState("");
  const [items, setItems] = useState<SkillAssignmentItem[]>([]);
  const [initialKeys, setInitialKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const agentCode = agent.agentId?.trim() ?? "";

  const loadSkills = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const instanceList = await listOpenClawRPCInstances();
      const nextPluginId =
        pluginId ||
        instanceList.find((instance) => instance.pluginId)?.pluginId ||
        "";

      setInstances(instanceList);
      setPluginId(nextPluginId);

      if (!nextPluginId) {
        setItems([]);
        setInitialKeys([]);
        setSelectedKeys([]);
        setError("当前没有可用的 OpenClaw RPC 实例。");

        return;
      }

      const [catalog, current] = await Promise.all([
        listSkillCatalog({
          agentId: agentCode,
          page: 1,
          pageSize: 500,
          pluginId: nextPluginId,
        }),
        listAgentSkills({ agentId: agentCode, pluginId: nextPluginId }),
      ]);
      const assignedKeys = getAssignedSkillKeys(current.items ?? []);
      const mergedItems = mergeSkillItems(
        catalog.systemItems ?? [],
        catalog.privateItems ?? [],
      );

      setItems(mergedItems);
      setInitialKeys(assignedKeys);
      setSelectedKeys(assignedKeys);
    } catch (error) {
      setError(getAgentActionError(error, "Skill 分配状态加载失败。"));
    } finally {
      setIsLoading(false);
    }
  }, [agentCode, pluginId]);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [
        item.displayName,
        item.key,
        item.source,
        item.groupName,
        item.description,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [items, search]);
  const addedKeys = selectedKeys.filter((key) => !initialKeys.includes(key));
  const removedKeys = initialKeys.filter((key) => !selectedKeys.includes(key));
  const hasChanges = addedKeys.length > 0 || removedKeys.length > 0;

  async function saveSkills() {
    if (!pluginId || !agentCode || isSaving) return;

    setError(null);
    setIsSaving(true);

    try {
      for (const key of addedKeys) {
        const item = items.find((candidate) => candidate.key === key);

        if (!item) continue;

        await applyAgentSkill({
          agentId: agentCode,
          dryRun: false,
          pluginId,
          privateSkillId: item.source === "private" ? item.id : undefined,
          skillKey: item.key,
          source: item.source,
          version: item.version,
        });
      }

      for (const key of removedKeys) {
        await removeAgentSkill({
          agentId: agentCode,
          dryRun: false,
          pluginId,
          skillKey: key,
        });
      }

      toast.success(
        `Skill 分配已更新，新增 ${addedKeys.length} 个，移除 ${removedKeys.length} 个。`,
      );
      await loadSkills();
    } catch (error) {
      setError(getAgentActionError(error, "Skill 分配保存失败。"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SectionCard
      action={
        <Button
          isDisabled={isLoading}
          size="sm"
          variant="secondary"
          onPress={() => void loadSkills()}
        >
          <AdminIcon className="size-4" name="refresh" />
          刷新
        </Button>
      }
      description="选择目标 OpenClaw 实例后，调整当前 Agent 可见的 Skill。"
      title="Skill 分配"
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_minmax(0,1fr)_auto] md:items-end">
          <Select
            fullWidth
            isDisabled={isSaving}
            selectedKey={pluginId}
            variant="secondary"
            onSelectionChange={(key) => setPluginId(String(key))}
          >
            <Label>OpenClaw 实例</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {instances.map((instance) =>
                  instance.pluginId ? (
                    <ListBox.Item
                      key={instance.pluginId}
                      id={instance.pluginId}
                      textValue={instance.pluginId}
                    >
                      {instance.pluginId}
                    </ListBox.Item>
                  ) : null,
                )}
              </ListBox>
            </Select.Popover>
          </Select>
          <SearchField
            fullWidth
            aria-label="搜索 Skill"
            value={search}
            variant="secondary"
            onChange={setSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索 Skill 名称、来源或分组" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Button
            isDisabled={!hasChanges || isSaving || isLoading || !pluginId}
            onPress={() => void saveSkills()}
          >
            {isSaving ? "保存中..." : "保存分配"}
          </Button>
        </div>

        {error ? <InlineError>{error}</InlineError> : null}

        <div className="grid max-h-[560px] gap-2 overflow-auto pr-1">
          {isLoading ? (
            <p className="text-muted text-sm">正在加载 Skill...</p>
          ) : null}
          {!isLoading && filteredItems.length === 0 ? (
            <p className="text-muted text-sm">没有可分配的 Skill。</p>
          ) : null}
          {filteredItems.map((item) => {
            const selected = selectedKeys.includes(item.key);

            return (
              <Checkbox
                key={`${item.source}:${item.key}`}
                className="w-full rounded-md border border-default-200 p-3"
                isDisabled={isSaving || item.readonly === true}
                isSelected={selected}
                onChange={(isSelected) =>
                  setSelectedKeys((current) =>
                    toggleString(current, item.key, isSelected),
                  )
                }
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content className="min-w-0">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.displayName}
                      </span>
                      <span className="text-muted block truncate text-xs">
                        {item.key}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Chip size="sm" variant="soft">
                        {item.source}
                      </Chip>
                      {item.version ? (
                        <Chip size="sm" variant="soft">
                          {item.version}
                        </Chip>
                      ) : null}
                    </div>
                  </div>
                  {item.description ? (
                    <p className="text-muted mt-2 line-clamp-2 text-xs">
                      {item.description}
                    </p>
                  ) : null}
                </Checkbox.Content>
              </Checkbox>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}

function AgentKnowledgePanel({
  agent,
  onSaved,
}: {
  agent: Agent;
  onSaved: () => void;
}) {
  const agentRecordId = agent.id;

  return (
    <SectionCard
      action={
        agentRecordId == null ? null : (
          <KnowledgeAvailabilityDialog
            selectedKnowledgeBaseIds={getKnowledgeBaseIds(agent.knowledgeBases)}
            subjectId={agentRecordId}
            subjectLabel={getAgentLabel(agent)}
            subjectType="agent"
            onSaved={onSaved}
          />
        )
      }
      description="这里展示当前 Agent 已绑定的知识库，修改会覆盖完整列表。"
      title="可用知识库"
    >
      <div className="flex flex-wrap gap-2">
        {(agent.knowledgeBases ?? []).length > 0 ? (
          (agent.knowledgeBases ?? []).map((knowledgeBase) => (
            <Chip
              key={knowledgeBase.id ?? knowledgeBase.name}
              size="sm"
              variant="soft"
            >
              {knowledgeBase.name ||
                knowledgeBase.filename ||
                `知识库 ${knowledgeBase.id}`}
            </Chip>
          ))
        ) : (
          <span className="text-muted text-sm">暂无绑定知识库。</span>
        )}
      </div>
    </SectionCard>
  );
}

function AgentVersionsPanel({
  agentRecordId,
  deployments,
  exports,
  onChanged,
}: {
  agentRecordId: number;
  deployments: AgentDeployment[];
  exports: AgentExport[];
  onChanged: () => void;
}) {
  const [instances, setInstances] = useState<OpenClawRPCInstance[]>([]);
  const [selectedExportId, setSelectedExportId] = useState("");
  const [selectedPluginIds, setSelectedPluginIds] = useState<string[]>([]);
  const [deployResult, setDeployResult] = useState<AgentDeployment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const conflictDeployments = deployResult.filter(
    (item) => item.status === "conflict",
  );

  useEffect(() => {
    void listOpenClawRPCInstances()
      .then(setInstances)
      .catch(() => setInstances([]));
  }, []);

  useEffect(() => {
    if (!selectedExportId && exports[0]?.id != null) {
      setSelectedExportId(String(exports[0].id));
    }
  }, [exports, selectedExportId]);

  async function deploy(force: boolean, targetPluginIds = selectedPluginIds) {
    const exportId = Number(selectedExportId);

    if (!exportId || targetPluginIds.length === 0 || isDeploying) return;

    setError(null);
    setIsDeploying(true);

    try {
      const response = await deployAgentExport({
        exportId,
        force,
        targetPluginIds,
      });
      const nextItems = response.items ?? [];

      setDeployResult(nextItems);
      if (nextItems.some((item) => item.status === "conflict")) {
        toast.info("部分目标存在冲突，请确认后强制覆盖。");
      } else {
        toast.success("Agent 版本已分发。");
      }
      onChanged();
    } catch (error) {
      setError(getAgentActionError(error, "Agent 版本分发失败。"));
    } finally {
      setIsDeploying(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        action={
          <CreateAgentExportButton
            agentRecordId={agentRecordId}
            onDone={onChanged}
          />
        }
        description="导出固定从 dev OpenClaw 生成。"
        title="导出版本"
      >
        <div className="grid grid-cols-1 gap-3">
          {exports.length === 0 ? (
            <p className="text-muted text-sm">暂无导出版本。</p>
          ) : (
            exports.map((item) => (
              <ExportRow key={item.id ?? item.version} item={item} />
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard
        description="选择导出版本和目标 OpenClaw 实例。"
        title="分发版本"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_minmax(0,1fr)_auto] md:items-end">
            <Select
              fullWidth
              selectedKey={selectedExportId}
              variant="secondary"
              onSelectionChange={(key) => setSelectedExportId(String(key))}
            >
              <Label>导出版本</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {exports.map((item) =>
                    item.id == null ? null : (
                      <ListBox.Item
                        key={item.id}
                        id={String(item.id)}
                        textValue={`v${item.version}`}
                      >
                        v{item.version} · {item.status || "-"}
                      </ListBox.Item>
                    ),
                  )}
                </ListBox>
              </Select.Popover>
            </Select>
            <div className="grid gap-2">
              <span className="text-muted text-xs">目标实例</span>
              <div className="flex flex-wrap gap-2">
                {instances.map((instance) =>
                  instance.pluginId ? (
                    <Checkbox
                      key={instance.pluginId}
                      isSelected={selectedPluginIds.includes(instance.pluginId)}
                      onChange={(selected) =>
                        setSelectedPluginIds((current) =>
                          toggleString(
                            current,
                            instance.pluginId ?? "",
                            selected,
                          ),
                        )
                      }
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Content>{instance.pluginId}</Checkbox.Content>
                    </Checkbox>
                  ) : null,
                )}
              </div>
            </div>
            <Button
              isDisabled={
                !selectedExportId ||
                selectedPluginIds.length === 0 ||
                isDeploying
              }
              onPress={() => void deploy(false)}
            >
              {isDeploying ? "分发中..." : "分发"}
            </Button>
          </div>

          {error ? <InlineError>{error}</InlineError> : null}
          {conflictDeployments.length > 0 ? (
            <div className="rounded-md border border-warning-200 bg-warning-50 p-3">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-warning-700">
                  {conflictDeployments.length} 个目标存在冲突
                </span>
                <Button
                  isDisabled={isDeploying}
                  size="sm"
                  variant="danger-soft"
                  onPress={() =>
                    void deploy(
                      true,
                      conflictDeployments.flatMap((item) =>
                        item.targetPluginId ? [item.targetPluginId] : [],
                      ),
                    )
                  }
                >
                  强制覆盖冲突目标
                </Button>
              </div>
              <div className="grid gap-3">
                {conflictDeployments.map((item) => (
                  <RemoteAgentJson
                    key={item.id ?? item.targetPluginId}
                    deployment={item}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="下发状态">
        <div className="grid grid-cols-1 gap-3">
          {deployments.length === 0 ? (
            <p className="text-muted text-sm">暂无下发记录。</p>
          ) : (
            deployments.map((item) => (
              <DeploymentRow key={item.id ?? item.targetPluginId} item={item} />
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function InitDevAgentButton({
  agentRecordId,
  onDone,
}: {
  agentRecordId: number;
  onDone: () => void;
}) {
  const modal = useOverlayState();
  const [conflict, setConflict] = useState<AgentDeployment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  async function runInit(force: boolean) {
    if (isInitializing) return;

    setError(null);
    setIsInitializing(true);

    try {
      const deployment = await initDevAgent({ agentId: agentRecordId, force });

      if (deployment?.status === "conflict" && !force) {
        setConflict(deployment);
        modal.open();
      } else if (deployment?.status === "failed") {
        setError(deployment.errorMessage || "初始化到 dev OpenClaw 失败。");
      } else {
        toast.success("Agent 已初始化到 dev OpenClaw。");
        modal.close();
        setConflict(null);
        onDone();
      }
    } catch (error) {
      setError(getAgentActionError(error, "初始化到 dev OpenClaw 失败。"));
    } finally {
      setIsInitializing(false);
    }
  }

  return (
    <>
      <Button
        isDisabled={isInitializing}
        size="sm"
        variant="secondary"
        onPress={() => void runInit(false)}
      >
        {isInitializing ? "初始化中..." : "初始化到 dev"}
      </Button>
      {error ? <span className="text-danger text-xs">{error}</span> : null}
      <Modal state={modal}>
        <Modal.Backdrop
          isDismissable={!isInitializing}
          isKeyboardDismissDisabled={isInitializing}
        >
          <Modal.Container placement="center" scroll="inside" size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>dev OpenClaw 已存在同名 Agent</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex min-w-0 flex-col gap-4">
                {conflict ? <RemoteAgentJson deployment={conflict} /> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isInitializing}
                  variant="tertiary"
                  onPress={modal.close}
                >
                  取消
                </Button>
                <Button
                  isDisabled={isInitializing}
                  variant="danger-soft"
                  onPress={() => void runInit(true)}
                >
                  {isInitializing ? "覆盖中..." : "强制覆盖"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

function CreateAgentExportButton({
  agentRecordId,
  onDone,
}: {
  agentRecordId: number;
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function runExport() {
    if (isExporting) return;

    setError(null);
    setIsExporting(true);

    try {
      await createAgentExport({ agentId: agentRecordId });
      toast.success("Agent 版本已导出。");
      onDone();
    } catch (error) {
      setError(getAgentActionError(error, "Agent 版本导出失败。"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <Button
        isDisabled={isExporting}
        size="sm"
        onPress={() => void runExport()}
      >
        {isExporting ? "导出中..." : "导出版本"}
      </Button>
      {error ? <span className="text-danger text-xs">{error}</span> : null}
    </>
  );
}

function ExportRow({ item }: { item: AgentExport }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border border-default-200 p-3 md:grid-cols-[120px_minmax(0,1fr)_160px] md:items-center">
      <div>
        <div className="text-foreground text-sm font-semibold">
          v{item.version ?? "-"}
        </div>
        <Chip size="sm" variant="soft">
          {item.status || "-"}
        </Chip>
      </div>
      <div className="min-w-0 text-xs">
        <div
          className="truncate"
          title={item.artifactUrl || item.artifactPath || ""}
        >
          {item.artifactUrl || item.artifactPath || "无归档路径"}
        </div>
        <div className="text-muted mt-1 truncate">
          {item.sha256 || "无 SHA256"}
        </div>
      </div>
      <div className="text-muted text-xs">{formatDateTime(item.createdAt)}</div>
    </div>
  );
}

function DeploymentRow({ item }: { item: AgentDeployment }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border border-default-200 p-3 md:grid-cols-[minmax(0,1fr)_120px_160px] md:items-center">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">
          {item.targetPluginId || "-"}
        </div>
        <div className="text-muted truncate text-xs">
          {item.workspaceName || "-"}
        </div>
      </div>
      <Chip
        className="w-fit"
        color={
          item.status === "failed"
            ? "danger"
            : item.status === "conflict"
              ? "warning"
              : "success"
        }
        size="sm"
        variant="soft"
      >
        {item.status || "-"}
      </Chip>
      <div className="text-muted text-xs">{formatDateTime(item.updatedAt)}</div>
      {item.errorMessage ? (
        <div className="text-danger text-xs md:col-span-3">
          {item.errorMessage}
        </div>
      ) : null}
    </div>
  );
}

type SkillAssignmentItem = {
  description: string;
  displayName: string;
  groupName: string;
  id?: number;
  key: string;
  readonly?: boolean;
  source: string;
  version?: string;
};

function mergeSkillItems(
  systemItems: SkillCatalogItem[],
  privateItems: PrivateSkill[],
) {
  const items = [
    ...systemItems.map((item) => toSkillAssignmentItem(item, "system")),
    ...privateItems.map((item) => toPrivateSkillAssignmentItem(item)),
  ].filter((item): item is SkillAssignmentItem => Boolean(item));
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.source}:${item.key}`;

    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}

function toSkillAssignmentItem(
  item: SkillCatalogItem,
  fallbackSource: string,
): SkillAssignmentItem | null {
  const key = item.skillKey?.trim() || item.slug?.trim() || "";

  if (!key) return null;

  return {
    description: item.description?.trim() ?? "",
    displayName: item.visibleName?.trim() || item.displayName?.trim() || key,
    groupName: item.groupName?.trim() ?? "",
    id: item.id,
    key,
    readonly: item.readonly,
    source: item.source?.trim() || fallbackSource,
    version: item.version?.trim() || undefined,
  };
}

function toPrivateSkillAssignmentItem(
  item: PrivateSkill,
): SkillAssignmentItem | null {
  const key = item.slug?.trim() ?? "";

  if (!key) return null;

  return {
    description: item.description?.trim() ?? "",
    displayName: item.visibleName?.trim() || item.displayName?.trim() || key,
    groupName: item.groupName?.trim() ?? "",
    id: item.id,
    key,
    readonly: false,
    source: "private",
    version: item.version?.trim() || undefined,
  };
}

function getAssignedSkillKeys(items: AgentSkill[]) {
  return Array.from(
    new Set(
      items.flatMap((item) =>
        item.visibleToAgent === true
          ? [item.skillKey?.trim(), item.name?.trim()].filter(
              (value): value is string => Boolean(value),
            )
          : [],
      ),
    ),
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-default-200 bg-content2 px-3 py-2">
      <div className="text-muted text-xs">{label}</div>
      <div className="truncate text-sm font-medium" title={value}>
        {value}
      </div>
    </div>
  );
}

function DetailMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-foreground truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

function RemoteAgentJson({ deployment }: { deployment: AgentDeployment }) {
  return (
    <div className="min-w-0 rounded-md border border-default-200 bg-content2 p-3">
      <div className="text-muted mb-2 flex flex-wrap gap-2 text-xs">
        <span>{deployment.targetPluginId || "OpenClaw"}</span>
        <span>{deployment.status || "conflict"}</span>
      </div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">
        {formatJson(deployment.remoteAgentJson)}
      </pre>
    </div>
  );
}

function InlineError({
  action,
  children,
}: {
  action?: () => void;
  children: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{children}</span>
      {action ? (
        <Button size="sm" variant="danger-soft" onPress={action}>
          重试
        </Button>
      ) : null}
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-default-300 px-6 py-12 text-center">
      <AdminIcon className="text-muted size-9" name="agent" />
      <h2 className="text-foreground mt-4 text-base font-semibold">没有数据</h2>
      <p className="text-muted mt-2 max-w-md text-sm">{children}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4">
      <Card>
        <Card.Content className="flex flex-col gap-4 p-5">
          <div className="bg-default-200 h-6 w-1/3 animate-pulse rounded" />
          <div className="bg-default-100 h-20 animate-pulse rounded" />
        </Card.Content>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-default-100 h-40 animate-pulse rounded-md" />
        <div className="bg-default-100 h-40 animate-pulse rounded-md" />
      </div>
    </div>
  );
}

function toDetailTab(key: Key): DetailTab {
  if (
    key === "knowledge" ||
    key === "markdown" ||
    key === "overview" ||
    key === "skills" ||
    key === "versions"
  ) {
    return key;
  }

  return "overview";
}

function getAgentLabel(agent?: Pick<Agent, "agentId" | "displayName"> | null) {
  return agent?.displayName?.trim() || agent?.agentId?.trim() || "Agent 详情";
}

function getDefaultModelLabel(agent: Agent) {
  const displayName = agent.defaultModel?.displayName?.trim();
  const provider = agent.defaultModel?.provider?.trim();
  const modelid = agent.defaultModel?.modelid?.trim();
  const defaultModelid = agent.defaultModelid?.trim();

  if (displayName) return displayName;
  if (provider && modelid) return `${provider}/${modelid}`;
  if (defaultModelid) return defaultModelid;

  return "-";
}

function getKnowledgeBaseIds(knowledgeBases?: Array<{ id?: number }>) {
  return Array.from(
    new Set(
      (knowledgeBases ?? []).flatMap((knowledgeBase) => {
        const id = knowledgeBase.id;

        return typeof id === "number" && Number.isFinite(id) ? [id] : [];
      }),
    ),
  );
}

function getLatestExport(exports: AgentExport[]) {
  return [...exports].sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
}

function getLatestDeployment(deployments: AgentDeployment[]) {
  return [...deployments].sort(
    (a, b) =>
      new Date(b.updatedAt ?? "").getTime() -
      new Date(a.updatedAt ?? "").getTime(),
  )[0];
}

function getAgentInitials(value: string) {
  const normalized = value.trim();

  if (!normalized) return "A";

  return normalized.slice(0, 2).toUpperCase();
}

function validateMarkdownPath(path: string) {
  const normalized = path.trim();

  if (!normalized) return "请输入 Markdown 文件路径。";
  if (!normalized.toLowerCase().endsWith(".md")) return "只能编辑 .md 文件。";
  if (normalized.startsWith("/") || normalized.startsWith("\\"))
    return "路径必须是相对路径。";
  if (normalized.split(/[\\/]+/).includes("..")) return "路径不能包含 ..。";

  return null;
}

function toggleString(values: string[], value: string, selected: boolean) {
  if (!value) return values;
  if (selected) return values.includes(value) ? values : [...values, value];

  return values.filter((item) => item !== value);
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function formatJson(value?: string) {
  if (!value) return "无远端配置。";

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function getAgentActionError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
