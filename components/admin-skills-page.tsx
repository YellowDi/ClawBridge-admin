"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { Agent, AgentSkill, PrivateSkill } from "@/lib/api";

import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Chip,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  Tooltip,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage } from "@/components/admin-page-kit";
import {
  ApiError,
  applyAgentSkill,
  listAgentSkills,
  listAgents,
  listOpenClawRPCInstances,
  listPrivateSkillGroups,
  listPrivateSkills,
  removeAgentSkill,
  updatePrivateSkill,
  uploadPrivateSkill,
} from "@/lib/api";

type SkillsLoadState = {
  error: string | null;
  isLoading: boolean;
  items: PrivateSkill[];
  page: number;
  pageSize: number;
  total: number;
};

type AssignmentLoadState = {
  agents: Agent[];
  error: string | null;
  failedAgentIds: string[];
  initialAgentIds: string[];
  isLoading: boolean;
  isSaving: boolean;
  pluginId: string;
  selectedAgentIds: string[];
};

const PAGE_SIZE = 12;
const SKILL_UPLOAD_ACCEPT = ".zip";
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function AdminSkillsPage() {
  const isMountedRef = useRef(false);
  const activeQueryRef = useRef("");
  const requestRef = useRef(0);
  const [activeQuery, setActiveQuery] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [state, setState] = useState<SkillsLoadState>({
    error: null,
    isLoading: true,
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const { error, isLoading, items, page, pageSize, total } = state;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasNextPage = page < totalPages;

  const loadSkills = useCallback(
    async (nextPage: number, nextQuery?: string) => {
      const requestId = requestRef.current + 1;
      const query = nextQuery ?? activeQueryRef.current;

      activeQueryRef.current = query;
      requestRef.current = requestId;
      setActiveQuery(query);
      setState((current) => ({
        ...current,
        error: null,
        isLoading: true,
        page: nextPage,
      }));

      try {
        const response = await listPrivateSkills({
          page: nextPage,
          pageSize: PAGE_SIZE,
          query: query || undefined,
        });

        if (!isMountedRef.current || requestRef.current !== requestId) return;

        setState({
          error: null,
          isLoading: false,
          items: response.items ?? [],
          page: response.pagination?.page ?? nextPage,
          pageSize: response.pagination?.pageSize ?? PAGE_SIZE,
          total: response.pagination?.total ?? response.items?.length ?? 0,
        });
      } catch (error) {
        if (!isMountedRef.current || requestRef.current !== requestId) return;

        setState((current) => ({
          ...current,
          error: getSkillError(error, "私有 Skill 加载失败。"),
          isLoading: false,
          items: [],
        }));
      }
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;
    void loadSkills(1);

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSkills]);

  const actions = useMemo(
    () => <UploadPrivateSkillDialog onUploaded={() => void loadSkills(page)} />,
    [loadSkills, page],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadSkills(1, queryInput.trim());
  }

  function handleClearSearch() {
    setQueryInput("");
    void loadSkills(1, "");
  }

  return (
    <AdminPage
      actions={actions}
      description="管理员上传的私有 Skill 归档库。"
      eyebrow="Skills"
      title="Skill 管理"
    >
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-foreground text-lg font-semibold">技能广场</h2>
            <p className="text-muted text-sm">
              当前只展示私有 Skill，可按名称、详情、分组搜索。
            </p>
          </div>
          <Button
            isDisabled={isLoading}
            size="sm"
            variant="secondary"
            onPress={() => void loadSkills(page)}
          >
            <AdminIcon className="size-4" name="refresh" />
            刷新
          </Button>
        </div>

        <form
          className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end"
          onSubmit={handleSearch}
        >
          <TextField
            fullWidth
            isDisabled={isLoading}
            value={queryInput}
            variant="secondary"
            onChange={setQueryInput}
          >
            <Label>搜索</Label>
            <Input
              fullWidth
              placeholder="搜索名称、描述、标签或分组"
              variant="secondary"
            />
          </TextField>
          <Button isDisabled={isLoading} type="submit" variant="secondary">
            <AdminIcon className="size-4" name="search" />
            搜索
          </Button>
          <Button
            isDisabled={isLoading || (!activeQuery && !queryInput)}
            type="button"
            variant="tertiary"
            onPress={handleClearSearch}
          >
            清空
          </Button>
        </form>

        {error ? (
          <InlineError action={() => void loadSkills(page)}>
            {error}
          </InlineError>
        ) : null}

        {isLoading ? (
          <SkillGridSkeleton />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((skill) => (
              <PrivateSkillCard
                key={skill.id ?? rowKey(skill)}
                skill={skill}
                onUpdated={() => void loadSkills(page)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description={
              activeQuery
                ? "换个关键词或清空搜索后再试。"
                : "上传 ZIP 归档后会出现在这里。"
            }
            title={activeQuery ? "没有匹配的 Skill" : "还没有私有 Skill"}
          />
        )}

        <div className="flex flex-col gap-3 border-t border-default-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted text-sm">
            第 {page} / {totalPages} 页，共 {total} 条
          </span>
          <div className="flex items-center gap-2">
            <Button
              isDisabled={isLoading || page <= 1}
              size="sm"
              variant="secondary"
              onPress={() => void loadSkills(page - 1)}
            >
              上一页
            </Button>
            <Button
              isDisabled={isLoading || !hasNextPage}
              size="sm"
              variant="secondary"
              onPress={() => void loadSkills(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </section>
    </AdminPage>
  );
}

function PrivateSkillCard({
  onUpdated,
  skill,
}: {
  onUpdated: () => void;
  skill: PrivateSkill;
}) {
  const title = getSkillTitle(skill);
  const tags = skill.tags ?? [];

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <Card.Title className="truncate text-base">{title}</Card.Title>
            <Card.Description className="truncate text-xs">
              {skill.slug || "无 slug"}
            </Card.Description>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <EditPrivateSkillDialog skill={skill} onUpdated={onUpdated} />
            <AssignSkillDialog skill={skill} />
          </div>
        </div>
      </Card.Header>
      <Card.Content className="flex h-full flex-col gap-4">
        <p className="text-muted line-clamp-3 min-h-14 text-sm">
          {skill.description || "暂无说明"}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.slice(0, 4).map((tag) => (
              <Chip key={tag} size="sm" variant="soft">
                {tag}
              </Chip>
            ))
          ) : (
            <span className="text-muted text-xs">无标签</span>
          )}
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-3 text-xs">
          {skill.groupName ? (
            <SkillMeta label="分组" value={skill.groupName} />
          ) : null}
          <SkillMeta label="版本" value={skill.version || "-"} />
          <SkillMeta label="存储" value={skill.storageType || "-"} />
          <SkillMeta label="大小" value={formatBytes(skill.sizeBytes)} />
          <SkillMeta label="更新时间" value={formatDate(skill.updatedAt)} />
        </dl>
      </Card.Content>
    </Card>
  );
}

function SkillMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

function EditPrivateSkillDialog({
  onUpdated,
  skill,
}: {
  onUpdated: () => void;
  skill: PrivateSkill;
}) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) {
        reset();
        void loadGroups();
      } else {
        setError(null);
      }
    },
  });
  const [description, setDescription] = useState(skill.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState(skill.groupName ?? "");
  const [groups, setGroups] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleName, setVisibleName] = useState(skill.visibleName ?? "");
  const canEdit = typeof skill.id === "number" && skill.id > 0;

  function reset() {
    setDescription(skill.description ?? "");
    setError(null);
    setGroupName(skill.groupName ?? "");
    setIsSaving(false);
    setVisibleName(skill.visibleName ?? "");
  }

  async function loadGroups() {
    try {
      const response = await listPrivateSkillGroups();

      setGroups(response.groups?.filter(Boolean) ?? []);
    } catch {
      setGroups([]);
    }
  }

  async function handleSave() {
    const skillId = skill.id;

    if (typeof skillId !== "number" || skillId <= 0 || isSaving) return;

    setError(null);
    setIsSaving(true);

    try {
      await updatePrivateSkill({
        description,
        groupName,
        id: skillId,
        visibleName,
      });
      toast.success("私有 Skill 信息已更新。");
      modal.close();
      onUpdated();
    } catch (error) {
      setError(getSkillError(error, "私有 Skill 更新失败。"));
      setIsSaving(false);
    }
  }

  return (
    <Modal state={modal}>
      <Tooltip delay={0}>
        <Modal.Trigger>
          <Button
            isIconOnly
            aria-label="编辑"
            isDisabled={!canEdit}
            size="sm"
            variant="tertiary"
          >
            <AdminIcon className="size-4" name="edit" />
          </Button>
        </Modal.Trigger>
        <Tooltip.Content>
          {canEdit ? "编辑" : "缺少 ID，无法编辑"}
        </Tooltip.Content>
      </Tooltip>
      <Modal.Backdrop
        isDismissable={!isSaving}
        isKeyboardDismissDisabled={isSaving}
      >
        <Modal.Container placement="center" scroll="outside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>编辑 {getSkillTitle(skill)}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <LabeledInput
                isDisabled={isSaving}
                label="外显名"
                placeholder={
                  skill.displayName || skill.slug || "管理端展示名称"
                }
                value={visibleName}
                onChange={setVisibleName}
              />
              <LabeledTextarea
                isDisabled={isSaving}
                label="描述"
                placeholder="管理端展示的说明"
                value={description}
                onChange={setDescription}
              />
              <LabeledInput
                isDisabled={isSaving}
                label="分组"
                placeholder="例如：代码评审"
                value={groupName}
                onChange={setGroupName}
              />
              <GroupSuggestions groups={groups} onSelect={setGroupName} />
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isSaving}
                type="button"
                variant="tertiary"
                onPress={modal.close}
              >
                取消
              </Button>
              <Button
                isDisabled={!canEdit || isSaving}
                type="button"
                onPress={() => void handleSave()}
              >
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function AssignSkillDialog({ skill }: { skill: PrivateSkill }) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) {
        void loadAssignments();
      } else {
        reset();
      }
    },
  });
  const [state, setState] = useState<AssignmentLoadState>({
    agents: [],
    error: null,
    failedAgentIds: [],
    initialAgentIds: [],
    isLoading: false,
    isSaving: false,
    pluginId: "",
    selectedAgentIds: [],
  });
  const skillId = skill.id;
  const skillKey = skill.slug?.trim() ?? "";
  const canAssign = Boolean(skillId && skillKey);
  const addedAgentIds = state.selectedAgentIds.filter(
    (agentId) => !state.initialAgentIds.includes(agentId),
  );
  const removedAgentIds = state.initialAgentIds.filter(
    (agentId) => !state.selectedAgentIds.includes(agentId),
  );
  const hasChanges = addedAgentIds.length > 0 || removedAgentIds.length > 0;

  function reset() {
    setState({
      agents: [],
      error: null,
      failedAgentIds: [],
      initialAgentIds: [],
      isLoading: false,
      isSaving: false,
      pluginId: "",
      selectedAgentIds: [],
    });
  }

  async function loadAssignments() {
    if (!canAssign) {
      setState((current) => ({
        ...current,
        error: "该 Skill 缺少分配所需的 ID 或 slug。",
        isLoading: false,
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const [instances, agents] = await Promise.all([
        listOpenClawRPCInstances(),
        listAgents({ pageSize: 500 }),
      ]);
      const pluginId =
        instances.find((instance) => instance.pluginId)?.pluginId ?? "";
      const assignableAgents = agents.filter((agent) => agent.agentId?.trim());

      if (!pluginId) {
        setState((current) => ({
          ...current,
          agents: assignableAgents,
          error: "当前没有可用的 OpenClaw RPC 实例。",
          isLoading: false,
          pluginId: "",
        }));

        return;
      }

      const results = await Promise.all(
        assignableAgents.map(async (agent) => {
          const agentId = agent.agentId?.trim() ?? "";

          try {
            const response = await listAgentSkills({ agentId, pluginId });
            const assigned = (response.items ?? []).some((item) =>
              isAssignedSkill(item, skillKey),
            );

            return { agentId, assigned, failed: false };
          } catch {
            return { agentId, assigned: false, failed: true };
          }
        }),
      );
      const initialAgentIds = results
        .filter((result) => result.assigned)
        .map((result) => result.agentId);

      setState({
        agents: assignableAgents,
        error: null,
        failedAgentIds: results
          .filter((result) => result.failed)
          .map((result) => result.agentId),
        initialAgentIds,
        isLoading: false,
        isSaving: false,
        pluginId,
        selectedAgentIds: initialAgentIds,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getSkillError(error, "Skill 分配状态加载失败。"),
        isLoading: false,
      }));
    }
  }

  async function handleSave() {
    if (!canAssign || state.isSaving) return;

    setState((current) => ({ ...current, error: null, isSaving: true }));

    try {
      for (const agentId of addedAgentIds) {
        await applyAgentSkill({
          agentId,
          dryRun: false,
          pluginId: state.pluginId,
          privateSkillId: skillId,
          skillKey,
          source: "private",
          version: skill.version,
        });
      }

      for (const agentId of removedAgentIds) {
        await removeAgentSkill({
          agentId,
          dryRun: false,
          pluginId: state.pluginId,
          skillKey,
        });
      }

      toast.success(
        `Skill 分配已更新，新增 ${addedAgentIds.length} 个，移除 ${removedAgentIds.length} 个。`,
      );
      modal.close();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getSkillError(error, "Skill 分配保存失败。"),
        isSaving: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Tooltip delay={0}>
        <Modal.Trigger>
          <Button
            isIconOnly
            aria-label="分配"
            isDisabled={!canAssign}
            size="sm"
            variant="tertiary"
          >
            <AdminIcon className="size-4" name="plus" />
          </Button>
        </Modal.Trigger>
        <Tooltip.Content>
          {canAssign ? "分配" : "缺少 ID 或 slug，无法分配"}
        </Tooltip.Content>
      </Tooltip>
      <Modal.Backdrop
        isDismissable={!state.isSaving}
        isKeyboardDismissDisabled={state.isSaving}
      >
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>分配 {getSkillTitle(skill)}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Chip size="sm" variant="soft">
                  {state.pluginId || "未连接 RPC"}
                </Chip>
                <Chip size="sm" variant="soft">
                  {skillKey || "无 slug"}
                </Chip>
              </div>
              {state.error ? <InlineError>{state.error}</InlineError> : null}
              {state.failedAgentIds.length > 0 ? (
                <InlineError>
                  {`${state.failedAgentIds.length} 个 Agent 状态读取失败，已禁用对应选项。`}
                </InlineError>
              ) : null}
              {state.isLoading ? (
                <p className="text-muted text-sm">正在读取 Agent 分配状态...</p>
              ) : state.agents.length === 0 ? (
                <p className="text-muted text-sm">暂无可分配 Agent。</p>
              ) : (
                <CheckboxGroup
                  aria-label="选择要分配的 Agent"
                  className="grid max-h-96 gap-2 overflow-auto pr-1"
                  isDisabled={state.isSaving || !state.pluginId}
                  value={state.selectedAgentIds}
                  variant="secondary"
                  onChange={(value) =>
                    setState((current) => ({
                      ...current,
                      selectedAgentIds: value,
                    }))
                  }
                >
                  {state.agents.map((agent) => {
                    const agentId = agent.agentId?.trim() ?? "";
                    const isFailed = state.failedAgentIds.includes(agentId);

                    return (
                      <Checkbox
                        key={agentId}
                        className="w-full"
                        isDisabled={isFailed}
                        value={agentId}
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content className="min-w-0">
                          <span className="min-w-0 truncate text-sm font-medium">
                            {agent.displayName || agentId}
                          </span>
                        </Checkbox.Content>
                      </Checkbox>
                    );
                  })}
                </CheckboxGroup>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={state.isSaving}
                type="button"
                variant="tertiary"
                onPress={modal.close}
              >
                取消
              </Button>
              <Button
                isDisabled={
                  !canAssign ||
                  state.isLoading ||
                  state.isSaving ||
                  !state.pluginId ||
                  !hasChanges
                }
                type="button"
                onPress={() => void handleSave()}
              >
                {state.isSaving ? "保存中..." : "保存分配"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function UploadPrivateSkillDialog({ onUploaded }: { onUploaded: () => void }) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) {
        reset();
        void loadGroups();
      }
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [visibleName, setVisibleName] = useState("");

  function reset() {
    setError(null);
    setGroupName("");
    setIsUploading(false);
    setSelectedFile(null);
    setVersion("");
    setVisibleName("");
  }

  async function loadGroups() {
    try {
      const response = await listPrivateSkillGroups();

      setGroups(response.groups?.filter(Boolean) ?? []);
    } catch {
      setGroups([]);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (file && !file.name.toLowerCase().endsWith(".zip")) {
      setError("仅支持 .zip 归档。");
      setSelectedFile(null);
      event.target.value = "";

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
      await uploadPrivateSkill(selectedFile, version, groupName, visibleName);
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
          上传 Skill
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
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <LabeledInput
                isDisabled={isUploading}
                label="外显名（可选）"
                placeholder="管理端展示名称"
                value={visibleName}
                onChange={setVisibleName}
              />
              <LabeledInput
                isDisabled={isUploading}
                label="分组（可选）"
                placeholder="例如：代码评审"
                value={groupName}
                onChange={setGroupName}
              />
              <GroupSuggestions groups={groups} onSelect={setGroupName} />
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
                  variant="secondary"
                  onChange={(event) => setVersion(event.target.value)}
                />
              </TextField>
              <label className="flex cursor-pointer flex-col gap-3 rounded-md border border-dashed border-default-300 bg-content1 p-5 text-center">
                <AdminIcon
                  className="text-muted mx-auto size-8"
                  name="upload"
                />
                <span className="text-sm font-medium">选择 ZIP 归档</span>
                <span className="text-muted text-xs">
                  {selectedFile
                    ? `${selectedFile.name} · ${formatBytes(selectedFile.size)}`
                    : "后台会校验并保存到本地或 COS 私有库"}
                </span>
                <input
                  accept={SKILL_UPLOAD_ACCEPT}
                  className="sr-only"
                  disabled={isUploading}
                  type="file"
                  onChange={handleFileChange}
                />
              </label>
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

function LabeledInput({
  isDisabled,
  label,
  onChange,
  placeholder,
  value,
}: {
  isDisabled: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <TextField
      fullWidth
      isDisabled={isDisabled}
      value={value}
      variant="secondary"
      onChange={onChange}
    >
      <Label>{label}</Label>
      <Input fullWidth placeholder={placeholder} variant="secondary" />
    </TextField>
  );
}

function LabeledTextarea({
  isDisabled,
  label,
  onChange,
  placeholder,
  value,
}: {
  isDisabled: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <TextField
      fullWidth
      isDisabled={isDisabled}
      value={value}
      variant="secondary"
      onChange={onChange}
    >
      <Label>{label}</Label>
      <TextArea placeholder={placeholder} rows={3} variant="secondary" />
    </TextField>
  );
}

function GroupSuggestions({
  groups,
  onSelect,
}: {
  groups: string[];
  onSelect: (group: string) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted text-xs">已有分组</span>
      {groups.slice(0, 8).map((group) => (
        <Button
          key={group}
          size="sm"
          type="button"
          variant="tertiary"
          onPress={() => onSelect(group)}
        >
          {group}
        </Button>
      ))}
    </div>
  );
}

function SkillGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <Card.Content className="flex flex-col gap-4 p-5">
            <div className="bg-default-200 h-5 w-2/3 animate-pulse rounded" />
            <div className="bg-default-100 h-14 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-default-200 h-6 w-16 animate-pulse rounded" />
              <div className="bg-default-200 h-6 w-20 animate-pulse rounded" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-default-300 px-6 py-12 text-center">
      <AdminIcon className="text-muted size-9" name="skill" />
      <h2 className="text-foreground mt-4 text-base font-semibold">{title}</h2>
      <p className="text-muted mt-2 max-w-md text-sm">{description}</p>
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

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function formatBytes(value?: number) {
  if (!value || value <= 0) return "-";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function rowKey(skill: PrivateSkill) {
  return `${skill.slug ?? "skill"}:${skill.version ?? "unknown"}`;
}

function getSkillTitle(skill: PrivateSkill) {
  return skill.visibleName || skill.displayName || skill.slug || "未命名 Skill";
}

function isAssignedSkill(item: AgentSkill, skillKey: string) {
  return (
    item.visibleToAgent === true &&
    [item.skillKey, item.name].some((value) => value?.trim() === skillKey)
  );
}

function getSkillError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
