"use client";

import type { Key } from "react";
import type { EditableAgentSummary } from "@/components/agent-dialog-types";
import type {
  Agent,
  AgentDeployment,
  AgentExport,
  AgentMarkdownFile,
  Model,
  OpenClawRPCInstance,
} from "@/lib/api";

import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Chip,
  Dropdown,
  Input,
  Label,
  ListBox,
  Modal,
  ScrollShadow,
  Select,
  Tabs,
  TextField,
  Tooltip,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, SectionCard } from "@/components/admin-page-kit";
import { DeleteAgentDialog, EditAgentDialog } from "@/components/agent-dialog";
import { KnowledgeAvailabilityDialog } from "@/components/knowledge-availability-dialog";
import {
  createAgentExport,
  deployAgentExport,
  getAgentDetail,
  initDevAgent,
  listAgentDeployments,
  listAgentExports,
  listModels,
  listOpenClawRPCInstances,
  readAgentMarkdown,
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

type DetailTab = "knowledge" | "markdown" | "versions";

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
  const [tab, setTab] = useState<DetailTab>("markdown");
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
        const message = "Agent 不存在或已删除。";

        setState({
          agent: null,
          deployments: EMPTY_DEPLOYMENTS,
          error: message,
          exports: EMPTY_AGENT_EXPORTS,
          isLoading: false,
          models: modelList,
        });
        toast.danger(message);

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

      const message = getAgentActionError(error, "Agent 详情加载失败。");

      setState((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }));
      toast.danger(message);
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
        <AgentDetailActions
          agentRecordId={agentRecordId}
          editableAgent={editableAgent}
          models={models}
          onChanged={() => void loadDetail()}
        />
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
  const navigation = useMemo(
    () =>
      agent ? (
        <AgentDetailTabs
          selectedKey={tab}
          onSelectionChange={(key) => setTab(toDetailTab(key))}
        />
      ) : null,
    [agent, tab],
  );

  return (
    <AdminPage
      actions={actions}
      description="编辑 Agent 配置、工作区 Markdown、知识库和版本分发。"
      eyebrow="Agent Detail"
      navigation={navigation}
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
            latestDeployment={latestDeployment}
            latestExport={latestExport}
          />

          {tab === "markdown" ? (
            <AgentMarkdownPanel agentRecordId={agentRecordId} />
          ) : null}
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

function AgentDetailTabs({
  onSelectionChange,
  selectedKey,
}: {
  onSelectionChange: (key: Key) => void;
  selectedKey: DetailTab;
}) {
  return (
    <Tabs selectedKey={selectedKey} onSelectionChange={onSelectionChange}>
      <Tabs.ListContainer className="w-auto">
        <Tabs.List aria-label="Agent 详情页签" className="w-auto">
          <Tabs.Tab className="whitespace-nowrap" id="markdown">
            Markdown
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab className="whitespace-nowrap" id="knowledge">
            知识库
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab className="whitespace-nowrap" id="versions">
            版本与分发
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}

function AgentDetailActions({
  agentRecordId,
  editableAgent,
  models,
  onChanged,
}: {
  agentRecordId: number;
  editableAgent: EditableAgentSummary | null;
  models: Model[];
  onChanged: () => void;
}) {
  const router = useRouter();

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onPress={() => router.push("/agents")}
      >
        返回列表
      </Button>
      <InitDevAgentButton agentRecordId={agentRecordId} onDone={onChanged} />
      {editableAgent ? (
        <EditAgentDialog
          agent={editableAgent}
          modelOptions={models}
          onUpdated={onChanged}
        />
      ) : null}
      <AgentDetailMoreActions
        agentRecordId={agentRecordId}
        editableAgent={editableAgent}
        onChanged={onChanged}
      />
    </>
  );
}

function AgentDetailMoreActions({
  agentRecordId,
  editableAgent,
  onChanged,
}: {
  agentRecordId: number;
  editableAgent: EditableAgentSummary | null;
  onChanged: () => void;
}) {
  const router = useRouter();
  const deleteModal = useOverlayState();
  const [isExporting, setIsExporting] = useState(false);

  async function runExport() {
    if (isExporting) return;

    setIsExporting(true);

    try {
      await createAgentExport({ agentId: agentRecordId });
      toast.success("Agent 版本已导出。");
      onChanged();
    } catch (error) {
      toast.danger(getAgentActionError(error, "Agent 版本导出失败。"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
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
            aria-label="Agent 更多操作"
            onAction={(key) => {
              if (key === "export") void runExport();
              if (key === "delete") deleteModal.open();
            }}
          >
            <Dropdown.Item id="export">
              {isExporting ? "导出中..." : "导出版本"}
            </Dropdown.Item>
            {editableAgent ? (
              <Dropdown.Item id="delete" variant="danger">
                删除
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {editableAgent ? (
        <DeleteAgentDialog
          hideTrigger
          agent={editableAgent}
          state={deleteModal}
          onDeleted={() => router.push("/agents")}
        />
      ) : null}
    </>
  );
}

function AgentHero({
  agent,
  latestDeployment,
  latestExport,
}: {
  agent: Agent;
  latestDeployment?: AgentDeployment;
  latestExport?: AgentExport;
}) {
  return (
    <section className="flex flex-col gap-4">
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
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:min-w-[440px]">
          <DetailMeta label="默认模型" value={getDefaultModelLabel(agent)} />
          <DetailMeta label="Reasoning" value={agent.reasoningLevel || "-"} />
          <DetailMeta label="Thinking" value={agent.thinkingLevel || "-"} />
          <DetailMeta label="Verbose" value={agent.verboseLevel || "-"} />
          <DetailMeta
            label="最新导出"
            value={
              latestExport?.version == null ? "-" : `v${latestExport.version}`
            }
          />
          <DetailMeta
            label="最近下发"
            value={latestDeployment?.status || "-"}
          />
          <DetailMeta
            label="更新时间"
            value={formatDateTime(agent.updatedAt)}
          />
          <DetailMeta
            label="工作区"
            value={latestExport?.workspaceName || "dev 工作区"}
          />
        </dl>
      </div>
    </section>
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
  const [mode, setMode] = useState<"edit" | "preview">("preview");
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
      setMode("preview");
    } catch (error) {
      const message = getAgentActionError(error, "Markdown 文件加载失败。");

      setError(message);
      setFiles([]);
      setSelectedPath("");
      setDraft("");
      setMode("preview");
      toast.danger(message);
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
    setMode("preview");
  }

  async function saveCurrentFile() {
    const pathError = validateMarkdownPath(selectedPath);

    if (pathError) {
      setError(pathError);
      toast.danger(pathError);

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
      setMode("preview");
      toast.success("Markdown 已保存。");
    } catch (error) {
      const message = getAgentActionError(error, "Markdown 保存失败。");

      setError(message);
      toast.danger(message);
    } finally {
      setIsSaving(false);
    }
  }

  function addFile() {
    const path = newPath.trim();
    const pathError = validateMarkdownPath(path);

    if (pathError) {
      setError(pathError);
      toast.danger(pathError);

      return;
    }

    if (files.some((file) => file.path === path)) {
      const message = "该 Markdown 文件已存在。";

      setError(message);
      toast.danger(message);

      return;
    }

    setFiles((current) => [...current, { content: "", path }]);
    setSelectedPath(path);
    setDraft("");
    setMode("preview");
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
      <div className="flex min-h-[560px] flex-col gap-4 lg:h-[calc(100dvh-25rem)]">
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

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-md border border-default-200 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-b border-default-200 bg-content2 p-3 lg:border-b-0 lg:border-r">
            <div className="text-muted mb-3 text-xs">
              {isLoading ? "正在读取..." : `${files.length} 个 Markdown 文件`}
            </div>
            <ScrollShadow className="flex min-h-0 flex-1 flex-col gap-1">
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
            </ScrollShadow>
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
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
                {mode === "preview" ? (
                  <>
                    <Button
                      isDisabled={!selectedPath || isSaving || isLoading}
                      size="sm"
                      onPress={() => setMode("edit")}
                    >
                      编辑
                    </Button>
                    {isDirty ? (
                      <Button
                        isDisabled={!selectedPath || isSaving || isLoading}
                        size="sm"
                        onPress={() => void saveCurrentFile()}
                      >
                        {isSaving ? "保存中..." : "保存"}
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Button
                      isDisabled={isSaving}
                      size="sm"
                      variant="secondary"
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
                  </>
                )}
              </div>
            </div>
            <ScrollShadow className="min-h-0 flex-1">
              {mode === "edit" ? (
                <textarea
                  className="h-full min-h-full w-full resize-none bg-transparent p-4 font-mono text-sm outline-none"
                  disabled={!selectedPath || isSaving}
                  spellCheck={false}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              ) : (
                <div className="prose prose-sm max-w-none p-4 text-foreground [&_code]:rounded [&_code]:bg-content2 [&_code]:px-1 [&_h1]:text-xl [&_h2]:text-lg [&_li]:my-1 [&_p]:my-2 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-content2 [&_pre]:p-3">
                  <ReactMarkdown>{draft || " "}</ReactMarkdown>
                </div>
              )}
            </ScrollShadow>
          </div>
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
      description={`当前绑定 ${getKnowledgeBaseIds(agent.knowledgeBases).length} 个知识库，修改会覆盖完整列表。`}
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
      .catch((error: unknown) => {
        setInstances([]);
        toast.warning(
          getAgentActionError(error, "OpenClaw RPC 实例加载失败。"),
        );
      });
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
      const message = getAgentActionError(error, "Agent 版本分发失败。");

      setError(message);
      toast.danger(message);
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
        description={`导出固定从 dev OpenClaw 生成，当前 ${exports.length} 个版本。`}
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

      <SectionCard
        description={`当前 ${deployments.length} 条下发记录。`}
        title="下发状态"
      >
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
        toast.info("dev OpenClaw 已存在冲突，请确认后强制覆盖。");
      } else if (deployment?.status === "failed") {
        const message =
          deployment.errorMessage || "初始化到 dev OpenClaw 失败。";

        setError(message);
        toast.danger(message);
      } else {
        toast.success("Agent 已初始化到 dev OpenClaw。");
        modal.close();
        setConflict(null);
        onDone();
      }
    } catch (error) {
      const message = getAgentActionError(
        error,
        "初始化到 dev OpenClaw 失败。",
      );

      setError(message);
      toast.danger(message);
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
      const message = getAgentActionError(error, "Agent 版本导出失败。");

      setError(message);
      toast.danger(message);
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
  if (key === "knowledge" || key === "markdown" || key === "versions") {
    return key;
  }

  return "markdown";
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
