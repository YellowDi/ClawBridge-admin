"use client";

import type { FormEvent, Key } from "react";
import type {
  Agent as ApiAgent,
  AgentDeployment,
  Model as ApiModel,
  ReqAgentImport,
} from "@/lib/api";

import {
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  SearchField,
  Tabs,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import { CreateAgentDialog } from "@/components/agent-dialog";
import { importAgent, initDevAgent, listAgents, listModels } from "@/lib/api";

type AgentFilter = "all" | "disabled" | "enabled";
type AgentStatus = "停用" | "启用";

type AdminAgent = {
  agentId: string;
  agentRecordId: number | null;
  avatarUrl: string;
  capabilityModelSummary: string;
  defaultImageGenerationModelid: string;
  defaultImageModelid: string;
  defaultMusicGenerationModelid: string;
  defaultModelLabel: string;
  defaultModelid: string;
  defaultPdfModelid: string;
  defaultVideoGenerationModelid: string;
  description: string;
  displayLabel: string;
  displayName: string;
  enabled: boolean;
  id: string;
  knowledgeBaseIds: number[];
  reasoningLevel: string;
  status: AgentStatus;
  thinkingLevel: string;
  updatedAt: string;
  verboseLevel: string;
};

type AgentsLoadState = {
  agents: AdminAgent[];
  error: string | null;
  isLoading: boolean;
};

const AGENT_STATUS_COLOR: Record<AgentStatus, "danger" | "success"> = {
  停用: "danger",
  启用: "success",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function AgentsPage() {
  const isMountedRef = useRef(false);
  const [loadState, setLoadState] = useState<AgentsLoadState>({
    agents: [],
    error: null,
    isLoading: true,
  });
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [agentModelOptions, setAgentModelOptions] = useState<ApiModel[]>([]);
  const [createdAgent, setCreatedAgent] = useState<AdminAgent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { agents, error, isLoading } = loadState;

  const loadAgents = useCallback(async () => {
    setLoadState((state) => ({
      ...state,
      error: null,
      isLoading: true,
    }));

    try {
      const response = await listAgents({ pageSize: 500 });

      if (isMountedRef.current) {
        setLoadState({
          agents: response.map(toAdminAgent),
          error: null,
          isLoading: false,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        const message = getAgentListError(error);

        setLoadState({
          agents: [],
          error: message,
          isLoading: false,
        });
        toast.danger(message);
      }
    }
  }, []);

  const loadAgentModelOptions = useCallback(async () => {
    try {
      const response = await listModels({ pageSize: 500 });

      if (isMountedRef.current) {
        setAgentModelOptions(response);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setAgentModelOptions([]);
        toast.warning(getAgentActionError(error, "Agent 模型选项加载失败。"));
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadAgents();
    void loadAgentModelOptions();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadAgentModelOptions, loadAgents]);

  const filteredAgents = useMemo(
    () => filterAgents(agents, searchQuery, agentFilter),
    [agentFilter, agents, searchQuery],
  );
  const refreshAgents = useCallback(() => void loadAgents(), [loadAgents]);
  const agentStats = useMemo(() => getAgentStats(agents), [agents]);
  const emptyState = getAgentsEmptyState({
    error,
    hasFilter: Boolean(searchQuery.trim()) || agentFilter !== "all",
    isLoading,
  });

  const actions = useMemo(
    () => (
      <>
        <ImportAgentDialog onImported={refreshAgents} />
        <CreateAgentDialog
          modelOptions={agentModelOptions}
          onCreated={(agent) => {
            void loadAgents();
            if (agent?.id != null) setCreatedAgent(toAdminAgent(agent, 0));
          }}
        />
      </>
    ),
    [agentModelOptions, loadAgents, refreshAgents],
  );

  return (
    <AdminPage
      actions={actions}
      description="维护 Agent 标识、默认模型、推理配置和启用状态。"
      eyebrow="Agent Studio"
      title="Agent 编排"
    >
      <StatGrid
        stats={[
          {
            helper: "当前列表总数",
            label: "Agent 总数",
            value: formatCount(agentStats.total, isLoading),
          },
          {
            helper: "可被授权和使用",
            label: "启用 Agent",
            tone: "accent",
            value: formatCount(agentStats.enabled, isLoading),
          },
          {
            helper: "不可授权或使用",
            label: "停用 Agent",
            tone: "danger",
            value: formatCount(agentStats.disabled, isLoading),
          },
          {
            helper: agentStats.defaultModelHelper,
            label: "默认模型",
            value: formatCount(agentStats.defaultModels, isLoading),
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            selectedKey={agentFilter}
            onSelectionChange={(key) => setAgentFilter(toAgentFilter(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Agent 筛选">
                <Tabs.Tab className="whitespace-nowrap" id="all">
                  全部
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="enabled">
                  启用
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="disabled">
                  停用
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <SearchField
              aria-label="搜索 Agent"
              className="w-full sm:w-[280px]"
              value={searchQuery}
              variant="secondary"
              onChange={setSearchQuery}
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="搜索 Agent、模型或说明" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <Button
              isDisabled={isLoading}
              size="sm"
              variant="secondary"
              onPress={refreshAgents}
            >
              <AdminIcon className="size-4" name="refresh" />
              刷新
            </Button>
          </div>
        </div>

        {error ? (
          <InlineError action={refreshAgents}>{error}</InlineError>
        ) : null}

        {isLoading ? (
          <AgentGridSkeleton />
        ) : filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : (
          <EmptyState>{emptyState}</EmptyState>
        )}
      </section>

      <CreatedAgentInitPrompt
        agent={createdAgent}
        onClose={() => setCreatedAgent(null)}
        onDone={refreshAgents}
      />
    </AdminPage>
  );
}

function AgentCard({ agent }: { agent: AdminAgent }) {
  const content = (
    <Card className="h-full transition-colors hover:border-accent/60">
      <Card.Header>
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 shrink-0">
              {agent.avatarUrl ? (
                <Avatar.Image
                  alt={`${agent.displayLabel} 头像`}
                  src={agent.avatarUrl}
                />
              ) : null}
              <Avatar.Fallback>
                {getAgentInitials(agent.displayLabel)}
              </Avatar.Fallback>
            </Avatar>
            <div className="min-w-0">
              <Card.Title className="truncate text-base">
                {agent.displayLabel}
              </Card.Title>
              <Card.Description className="truncate text-xs">
                {agent.agentId}
              </Card.Description>
            </div>
          </div>
          <Chip
            className="shrink-0 whitespace-nowrap"
            color={AGENT_STATUS_COLOR[agent.status]}
            size="sm"
            variant="soft"
          >
            {agent.status}
          </Chip>
        </div>
      </Card.Header>
      <Card.Content className="flex h-full flex-col gap-4">
        <p className="text-muted line-clamp-3 min-h-14 text-sm">
          {agent.description || "暂无说明"}
        </p>

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <AgentMeta label="默认模型" value={agent.defaultModelLabel} />
          <AgentMeta
            label="知识库"
            value={`${agent.knowledgeBaseIds.length} 个`}
          />
          <AgentMeta
            label="能力模型"
            value={agent.capabilityModelSummary || "-"}
          />
          <AgentMeta label="更新时间" value={agent.updatedAt} />
        </dl>
      </Card.Content>
    </Card>
  );

  if (agent.agentRecordId == null) return content;

  return (
    <Link
      className="block h-full rounded-md no-underline outline-none focus-visible:ring-2 focus-visible:ring-accent"
      href={`/agents/${agent.agentRecordId}`}
    >
      {content}
    </Link>
  );
}

function CreatedAgentInitPrompt({
  agent,
  onClose,
  onDone,
}: {
  agent: AdminAgent | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const modal = useOverlayState();
  const [conflict, setConflict] = useState<AgentDeployment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (agent) modal.open();
  }, [agent, modal]);

  async function runInit(force: boolean) {
    if (!agent?.agentRecordId || isInitializing) return;

    setError(null);
    setIsInitializing(true);

    try {
      const deployment = await initDevAgent({
        agentId: agent.agentRecordId,
        force,
      });

      if (deployment?.status === "conflict" && !force) {
        setConflict(deployment);
        toast.info("dev OpenClaw 已存在冲突，请确认后强制覆盖。");
      } else if (deployment?.status === "failed") {
        const message =
          deployment.errorMessage || "初始化到 dev OpenClaw 失败。";

        setError(message);
        toast.danger(message);
      } else {
        toast.success("Agent 已初始化到 dev OpenClaw。");
        close();
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

  function close() {
    modal.close();
    setConflict(null);
    setError(null);
    onClose();
  }

  if (!agent) return null;

  return (
    <Modal state={modal}>
      <Modal.Backdrop
        isDismissable={!isInitializing}
        isKeyboardDismissDisabled={isInitializing}
      >
        <Modal.Container placement="center" scroll="inside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>初始化到 dev OpenClaw</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <p className="text-muted text-sm">
                Agent「{agent.displayLabel}」已在后台创建。需要现在创建 dev
                工作区并写入默认 Markdown 吗？
              </p>
              {conflict ? <RemoteAgentJson deployment={conflict} /> : null}
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isInitializing}
                type="button"
                variant="tertiary"
                onPress={close}
              >
                暂不初始化
              </Button>
              {conflict ? (
                <Button
                  isDisabled={isInitializing}
                  type="button"
                  variant="danger-soft"
                  onPress={() => void runInit(true)}
                >
                  {isInitializing ? "覆盖中..." : "强制覆盖"}
                </Button>
              ) : (
                <Button
                  isDisabled={isInitializing}
                  type="button"
                  onPress={() => void runInit(false)}
                >
                  {isInitializing ? "初始化中..." : "初始化到 dev OpenClaw"}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ImportAgentDialog({ onImported }: { onImported: () => void }) {
  const router = useRouter();
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) reset();
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ReqAgentImport>({});
  const [isImporting, setIsImporting] = useState(false);

  function reset() {
    setError(null);
    setForm({});
    setIsImporting(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isImporting) return;

    const request = normalizeImportRequest(form);

    if (!request.agentId) {
      const message = "请输入 Agent ID。";

      setError(message);
      toast.danger(message);

      return;
    }

    if (!request.artifactUrl && !request.artifactPath) {
      const message = "artifactUrl 和 artifactPath 至少填写一个。";

      setError(message);
      toast.danger(message);

      return;
    }

    setError(null);
    setIsImporting(true);

    try {
      const result = await importAgent(request);

      toast.success("Agent 已导入。");
      modal.close();
      onImported();

      if (result?.agent?.id != null) {
        router.push(`/agents/${result.agent.id}`);
      }
    } catch (error) {
      const message = getAgentActionError(error, "导入 Agent 失败。");

      setError(message);
      toast.danger(message);
      setIsImporting(false);
    }
  }

  function updateForm(patch: Partial<ReqAgentImport>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="secondary">
          <AdminIcon className="size-4" name="upload" />
          导入 Agent
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isImporting}
        isKeyboardDismissDisabled={isImporting}
      >
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>导入 Agent</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
                <ImportTextField
                  isDisabled={isImporting}
                  label="Agent ID"
                  value={form.agentId}
                  onChange={(agentId) => updateForm({ agentId })}
                />
                <ImportTextField
                  isDisabled={isImporting}
                  label="展示名称"
                  value={form.displayName}
                  onChange={(displayName) => updateForm({ displayName })}
                />
                <ImportTextField
                  isDisabled={isImporting}
                  label="默认模型"
                  value={form.defaultModelid}
                  onChange={(defaultModelid) => updateForm({ defaultModelid })}
                />
                <ImportTextField
                  isDisabled={isImporting}
                  label="SHA256"
                  value={form.sha256}
                  onChange={(sha256) => updateForm({ sha256 })}
                />
                <ImportTextField
                  isDisabled={isImporting}
                  label="artifactUrl"
                  value={form.artifactUrl}
                  onChange={(artifactUrl) => updateForm({ artifactUrl })}
                />
                <ImportTextField
                  isDisabled={isImporting}
                  label="artifactPath"
                  value={form.artifactPath}
                  onChange={(artifactPath) => updateForm({ artifactPath })}
                />
                <ImportTextField
                  isDisabled={isImporting}
                  label="sizeBytes"
                  value={form.sizeBytes == null ? "" : String(form.sizeBytes)}
                  onChange={(sizeBytes) =>
                    updateForm({ sizeBytes: Number(sizeBytes) || undefined })
                  }
                />
                <ImportTextField
                  isDisabled={isImporting}
                  label="说明"
                  value={form.description}
                  onChange={(description) => updateForm({ description })}
                />
                <div className="sm:col-span-2">
                  <ImportTextField
                    isDisabled={isImporting}
                    label="manifestJson"
                    value={form.manifestJson}
                    onChange={(manifestJson) => updateForm({ manifestJson })}
                  />
                </div>
                {error ? (
                  <div className="sm:col-span-2">
                    <InlineError>{error}</InlineError>
                  </div>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isImporting}
                  type="button"
                  variant="tertiary"
                  onPress={modal.close}
                >
                  取消
                </Button>
                <Button isDisabled={isImporting} type="submit">
                  {isImporting ? "导入中..." : "导入"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ImportTextField({
  isDisabled,
  label,
  onChange,
  value,
}: {
  isDisabled: boolean;
  label: string;
  onChange: (value: string) => void;
  value?: string;
}) {
  return (
    <TextField fullWidth isDisabled={isDisabled} variant="secondary">
      <Label>{label}</Label>
      <Input
        fullWidth
        value={value ?? ""}
        variant="secondary"
        onChange={(event) => onChange(event.target.value)}
      />
    </TextField>
  );
}

function AgentMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
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
        <span>{deployment.targetPluginId || "dev OpenClaw"}</span>
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
      <h2 className="text-foreground mt-4 text-base font-semibold">
        没有 Agent
      </h2>
      <p className="text-muted mt-2 max-w-md text-sm">{children}</p>
    </div>
  );
}

function AgentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <Card.Content className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-default-200 size-10 animate-pulse rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="bg-default-200 h-4 w-2/3 animate-pulse rounded" />
                <div className="bg-default-100 h-3 w-1/2 animate-pulse rounded" />
              </div>
            </div>
            <div className="bg-default-100 h-14 animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-default-100 h-10 animate-pulse rounded" />
              <div className="bg-default-100 h-10 animate-pulse rounded" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function toAdminAgent(agent: ApiAgent, index: number): AdminAgent {
  const agentId = agent.agentId?.trim() || `agent-${agent.id ?? index + 1}`;
  const displayName = agent.displayName?.trim() ?? "";
  const displayLabel = displayName || agentId;
  const defaultModelid = agent.defaultModelid?.trim() ?? "";
  const defaultImageGenerationModelid =
    agent.defaultImageGenerationModelid?.trim() ?? "";
  const defaultVideoGenerationModelid =
    agent.defaultVideoGenerationModelid?.trim() ?? "";
  const defaultMusicGenerationModelid =
    agent.defaultMusicGenerationModelid?.trim() ?? "";
  const defaultImageModelid = agent.defaultImageModelid?.trim() ?? "";
  const defaultPdfModelid = agent.defaultPdfModelid?.trim() ?? "";

  return {
    agentId,
    agentRecordId: agent.id ?? null,
    avatarUrl: agent.avatarUrl?.trim() ?? "",
    capabilityModelSummary: formatCapabilityModelSummary({
      defaultImageGenerationModelid,
      defaultImageModelid,
      defaultMusicGenerationModelid,
      defaultPdfModelid,
      defaultVideoGenerationModelid,
    }),
    defaultImageGenerationModelid,
    defaultImageModelid,
    defaultMusicGenerationModelid,
    defaultModelLabel: getDefaultModelLabel(agent),
    defaultModelid: defaultModelid || "-",
    defaultPdfModelid,
    defaultVideoGenerationModelid,
    description: agent.description?.trim() ?? "",
    displayLabel,
    displayName,
    enabled: agent.enabled !== false,
    id: agent.id == null ? agentId : String(agent.id),
    knowledgeBaseIds: getKnowledgeBaseIds(agent.knowledgeBases),
    reasoningLevel: agent.reasoningLevel?.trim() ?? "",
    status: agent.enabled === false ? "停用" : "启用",
    thinkingLevel: agent.thinkingLevel?.trim() ?? "",
    updatedAt: formatDateTime(agent.updatedAt),
    verboseLevel: agent.verboseLevel?.trim() ?? "",
  };
}

function filterAgents(
  agents: AdminAgent[],
  searchQuery: string,
  agentFilter: AgentFilter,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return agents.filter((agent) => {
    if (agentFilter === "enabled" && agent.status !== "启用") return false;
    if (agentFilter === "disabled" && agent.status !== "停用") return false;
    if (!normalizedQuery) return true;

    return [
      agent.agentId,
      agent.avatarUrl,
      agent.capabilityModelSummary,
      agent.defaultImageGenerationModelid,
      agent.defaultImageModelid,
      agent.defaultMusicGenerationModelid,
      agent.defaultModelid,
      agent.defaultModelLabel,
      agent.defaultPdfModelid,
      agent.defaultVideoGenerationModelid,
      agent.description,
      agent.displayLabel,
      agent.reasoningLevel,
      agent.status,
      agent.thinkingLevel,
      agent.verboseLevel,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

function formatCapabilityModelSummary({
  defaultImageGenerationModelid,
  defaultImageModelid,
  defaultMusicGenerationModelid,
  defaultPdfModelid,
  defaultVideoGenerationModelid,
}: Pick<
  AdminAgent,
  | "defaultImageGenerationModelid"
  | "defaultImageModelid"
  | "defaultMusicGenerationModelid"
  | "defaultPdfModelid"
  | "defaultVideoGenerationModelid"
>) {
  return [
    defaultImageGenerationModelid
      ? `图像生成 ${defaultImageGenerationModelid}`
      : null,
    defaultVideoGenerationModelid
      ? `视频 ${defaultVideoGenerationModelid}`
      : null,
    defaultMusicGenerationModelid
      ? `音乐 ${defaultMusicGenerationModelid}`
      : null,
    defaultImageModelid ? `图像理解 ${defaultImageModelid}` : null,
    defaultPdfModelid ? `PDF ${defaultPdfModelid}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}

function getAgentStats(agents: AdminAgent[]) {
  const defaultModels = Array.from(
    new Set(
      agents.flatMap((agent) =>
        agent.defaultModelid && agent.defaultModelid !== "-"
          ? [agent.defaultModelid]
          : [],
      ),
    ),
  );

  return {
    defaultModelHelper: defaultModels.length
      ? defaultModels.slice(0, 3).join(" / ")
      : "暂无默认模型",
    defaultModels: defaultModels.length,
    disabled: agents.filter((agent) => agent.status === "停用").length,
    enabled: agents.filter((agent) => agent.status === "启用").length,
    total: agents.length,
  };
}

function getKnowledgeBaseIds(
  knowledgeBases?: Array<{
    id?: number;
  }>,
) {
  return Array.from(
    new Set(
      (knowledgeBases ?? []).flatMap((knowledgeBase) => {
        const id = knowledgeBase.id;

        return typeof id === "number" && Number.isFinite(id) ? [id] : [];
      }),
    ),
  );
}

function getDefaultModelLabel(agent: ApiAgent) {
  const displayName = agent.defaultModel?.displayName?.trim();
  const provider = agent.defaultModel?.provider?.trim();
  const modelid = agent.defaultModel?.modelid?.trim();
  const defaultModelid = agent.defaultModelid?.trim();

  if (displayName) return displayName;
  if (provider && modelid) return `${provider}/${modelid}`;
  if (defaultModelid) return defaultModelid;

  return "-";
}

function getAgentInitials(value: string) {
  const normalized = value.trim();

  if (!normalized) return "A";

  return normalized.slice(0, 2).toUpperCase();
}

function toAgentFilter(key: Key): AgentFilter {
  if (key === "enabled" || key === "disabled") return key;

  return "all";
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function formatCount(value: number, isLoading: boolean) {
  return isLoading ? "-" : String(value);
}

function getAgentsEmptyState({
  error,
  hasFilter,
  isLoading,
}: {
  error: string | null;
  hasFilter: boolean;
  isLoading: boolean;
}) {
  if (isLoading) return "正在加载 Agent...";
  if (error) return error;
  if (hasFilter) return "没有匹配的 Agent。";

  return "暂无 Agent 数据。";
}

function normalizeImportRequest(form: ReqAgentImport): ReqAgentImport {
  return {
    agentId: form.agentId?.trim() || undefined,
    artifactPath: form.artifactPath?.trim() || undefined,
    artifactUrl: form.artifactUrl?.trim() || undefined,
    defaultModelid: form.defaultModelid?.trim() || undefined,
    description: form.description?.trim() || undefined,
    displayName: form.displayName?.trim() || undefined,
    manifestJson: form.manifestJson?.trim() || undefined,
    sha256: form.sha256?.trim() || undefined,
    sizeBytes:
      typeof form.sizeBytes === "number" && Number.isFinite(form.sizeBytes)
        ? form.sizeBytes
        : undefined,
  };
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

function getAgentListError(error: unknown) {
  return getAgentActionError(error, "Agent 列表加载失败。");
}
