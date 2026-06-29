"use client";

import type { FormEvent, Key } from "react";
import type { Agent, Model, ReqAgentCreate, ReqAgentUpdate } from "@/lib/api";

import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import {
  createAgent,
  deleteAgent,
  getAgentDetail,
  updateAgent,
} from "@/lib/api";

type AgentForm = {
  agentId: string;
  defaultImageGenerationModelid: string;
  defaultImageModelid: string;
  defaultMusicGenerationModelid: string;
  defaultModelid: string;
  defaultPdfModelid: string;
  defaultVideoGenerationModelid: string;
  description: string;
  displayName: string;
  enabled: boolean;
  reasoningLevel: string;
  thinkingLevel: string;
  verboseLevel: string;
};

type CreateAgentState = {
  error: string | null;
  form: AgentForm;
  isCreating: boolean;
};

type EditAgentState = {
  error: string | null;
  form: AgentForm;
  isLoading: boolean;
  isSaving: boolean;
  loadedAgentId: number | null;
};

type DeleteAgentState = {
  error: string | null;
  isDeleting: boolean;
};

export type EditableAgentSummary = Pick<
  Agent,
  | "agentId"
  | "defaultImageGenerationModelid"
  | "defaultImageModelid"
  | "defaultMusicGenerationModelid"
  | "defaultModelid"
  | "defaultPdfModelid"
  | "defaultVideoGenerationModelid"
  | "description"
  | "displayName"
  | "enabled"
  | "id"
  | "reasoningLevel"
  | "thinkingLevel"
  | "verboseLevel"
> & {
  id: number;
};

type AgentDialogProps = {
  modelOptions?: Model[];
};

const UNSET_LEVEL = "__unset";
const UNSET_MODEL = "__unset";

const DEFAULT_AGENT_FORM: AgentForm = {
  agentId: "",
  defaultImageGenerationModelid: "",
  defaultImageModelid: "",
  defaultMusicGenerationModelid: "",
  defaultModelid: "",
  defaultPdfModelid: "",
  defaultVideoGenerationModelid: "",
  description: "",
  displayName: "",
  enabled: true,
  reasoningLevel: "",
  thinkingLevel: "",
  verboseLevel: "",
};

const REASONING_LEVELS = [
  { id: UNSET_LEVEL, label: "不设置" },
  { id: "off", label: "off" },
  { id: "on", label: "on" },
  { id: "stream", label: "stream" },
] as const;

const THINKING_LEVELS = [
  { id: UNSET_LEVEL, label: "不设置" },
  { id: "off", label: "off" },
  { id: "minimal", label: "minimal" },
  { id: "low", label: "low" },
  { id: "medium", label: "medium" },
  { id: "high", label: "high" },
  { id: "xhigh", label: "xhigh" },
  { id: "adaptive", label: "adaptive" },
  { id: "max", label: "max" },
] as const;

const VERBOSE_LEVELS = [
  { id: UNSET_LEVEL, label: "不设置" },
  { id: "off", label: "off" },
  { id: "on", label: "on" },
  { id: "full", label: "full" },
] as const;

export function CreateAgentDialog({
  modelOptions = [],
  onCreated,
}: AgentDialogProps & { onCreated: () => void }) {
  const [state, setState] = useState<CreateAgentState>({
    error: null,
    form: DEFAULT_AGENT_FORM,
    isCreating: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: DEFAULT_AGENT_FORM,
        isCreating: false,
      });
    },
  });
  const { error, form, isCreating } = state;

  function closeDialog() {
    if (isCreating) return;

    modal.close();
  }

  function updateForm(patch: Partial<AgentForm>) {
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

    const request = toCreateAgentRequest(form);

    if (!request.agentId) {
      setState((current) => ({
        ...current,
        error: "请输入 Agent ID。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isCreating: true,
    }));

    try {
      await createAgent(request);
      modal.close();
      setState({
        error: null,
        form: DEFAULT_AGENT_FORM,
        isCreating: false,
      });
      onCreated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getAgentActionError(error, "创建 Agent 失败。"),
        isCreating: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">
          <AdminIcon className="size-4" name="plus" />
          新建 Agent
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
                <Modal.Heading>新建 Agent</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                <AgentFormFields
                  form={form}
                  isDisabled={isCreating}
                  modelOptions={modelOptions}
                  onChange={updateForm}
                />

                {error ? <AgentFormError>{error}</AgentFormError> : null}
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
                  {isCreating ? "创建中..." : "创建 Agent"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function EditAgentDialog({
  agent,
  modelOptions = [],
  onUpdated,
}: {
  agent: EditableAgentSummary;
  onUpdated: () => void;
} & AgentDialogProps) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<EditAgentState>({
    error: null,
    form: toAgentForm(agent),
    isLoading: false,
    isSaving: false,
    loadedAgentId: null,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) {
        loadRequestRef.current += 1;

        return;
      }

      loadAgent();
    },
  });
  const { error, form, isLoading, isSaving, loadedAgentId } = state;
  const isBusy = isLoading || isSaving;

  function loadAgent() {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState({
      error: null,
      form: toAgentForm(agent),
      isLoading: true,
      isSaving: false,
      loadedAgentId: null,
    });

    void getAgentDetail(agent.id)
      .then((detail) => {
        if (loadRequestRef.current !== requestId) return;

        setState({
          error: null,
          form: toLoadedAgentForm(agent, detail),
          isLoading: false,
          isSaving: false,
          loadedAgentId: agent.id,
        });
      })
      .catch((error: unknown) => {
        if (loadRequestRef.current !== requestId) return;

        setState((current) => ({
          ...current,
          error: getAgentActionError(error, "Agent 详情加载失败。"),
          isLoading: false,
          loadedAgentId: null,
        }));
      });
  }

  function closeDialog() {
    if (isBusy) return;

    modal.close();
  }

  function updateForm(patch: Partial<AgentForm>) {
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

    if (isLoading || loadedAgentId == null) return;

    const request = toUpdateAgentRequest(form, loadedAgentId);

    if (!request.agentId) {
      setState((current) => ({
        ...current,
        error: "请输入 Agent ID。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
    }));

    try {
      await updateAgent(request);
      modal.close();
      setState({
        error: null,
        form,
        isLoading: false,
        isSaving: false,
        loadedAgentId: null,
      });
      onUpdated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getAgentActionError(error, "更新 Agent 失败。"),
        isSaving: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          编辑
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isBusy}
        isKeyboardDismissDisabled={isBusy}
      >
        <Modal.Container placement="center" scroll="outside" size="lg">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>编辑 Agent</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                {isLoading ? (
                  <div className="text-muted text-sm">
                    正在加载 Agent 详情...
                  </div>
                ) : null}
                <AgentFormFields
                  form={form}
                  isDisabled={isBusy || loadedAgentId == null}
                  modelOptions={modelOptions}
                  onChange={updateForm}
                />
                {error ? <AgentFormError>{error}</AgentFormError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isBusy}
                  type="button"
                  variant="tertiary"
                  onPress={closeDialog}
                >
                  取消
                </Button>
                <Button
                  isDisabled={isBusy || loadedAgentId == null}
                  type="submit"
                >
                  {isSaving ? "保存中..." : "保存修改"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function DeleteAgentDialog({
  agent,
  onDeleted,
}: {
  agent: EditableAgentSummary;
  onDeleted: () => void;
}) {
  const [state, setState] = useState<DeleteAgentState>({
    error: null,
    isDeleting: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        isDeleting: false,
      });
    },
  });
  const { error, isDeleting } = state;
  const agentName = getAgentLabel(agent);

  function closeDialog() {
    if (isDeleting) return;

    modal.close();
  }

  async function handleDelete() {
    setState({
      error: null,
      isDeleting: true,
    });

    try {
      await deleteAgent(agent.id);
      modal.close();
      setState({
        error: null,
        isDeleting: false,
      });
      onDeleted();
    } catch (error) {
      setState({
        error: getAgentActionError(error, "删除 Agent 失败。"),
        isDeleting: false,
      });
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
              <Modal.Heading>删除 Agent</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-3">
              <p className="text-muted text-sm">
                {"确认删除 Agent「"}
                <span className="break-all">{agentName}</span>
                {"」？删除后该 Agent 将无法继续被授权或使用。"}
              </p>
              {error ? <AgentFormError>{error}</AgentFormError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="tertiary"
                onPress={closeDialog}
              >
                取消
              </Button>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="danger"
                onPress={handleDelete}
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

function AgentFormFields({
  form,
  isDisabled,
  modelOptions,
  onChange,
}: {
  form: AgentForm;
  isDisabled: boolean;
  modelOptions: Model[];
  onChange: (patch: Partial<AgentForm>) => void;
}) {
  return (
    <>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          fullWidth
          className="flex min-w-0 flex-col gap-2"
          isDisabled={isDisabled}
          variant="secondary"
        >
          <Label>Agent ID</Label>
          <Input
            fullWidth
            value={form.agentId}
            onChange={(event) => onChange({ agentId: event.target.value })}
          />
        </TextField>

        <TextField
          fullWidth
          className="flex min-w-0 flex-col gap-2"
          isDisabled={isDisabled}
          variant="secondary"
        >
          <Label>展示名称</Label>
          <Input
            fullWidth
            value={form.displayName}
            onChange={(event) => onChange({ displayName: event.target.value })}
          />
        </TextField>

        <ModelSelectField
          isDisabled={isDisabled}
          label="默认模型"
          modelOptions={modelOptions}
          value={form.defaultModelid}
          onChange={(defaultModelid) => onChange({ defaultModelid })}
        />

        <Select
          fullWidth
          className="min-w-0"
          isDisabled={isDisabled}
          selectedKey={form.enabled ? "enabled" : "disabled"}
          variant="secondary"
          onSelectionChange={(key) => onChange({ enabled: key === "enabled" })}
        >
          <Label>状态</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="enabled">启用</ListBox.Item>
              <ListBox.Item id="disabled">停用</ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>

        <LevelSelect
          isDisabled={isDisabled}
          label="Reasoning 等级"
          levels={REASONING_LEVELS}
          value={form.reasoningLevel}
          onChange={(reasoningLevel) => onChange({ reasoningLevel })}
        />

        <LevelSelect
          isDisabled={isDisabled}
          label="思考等级"
          levels={THINKING_LEVELS}
          value={form.thinkingLevel}
          onChange={(thinkingLevel) => onChange({ thinkingLevel })}
        />

        <LevelSelect
          isDisabled={isDisabled}
          label="详细度"
          levels={VERBOSE_LEVELS}
          value={form.verboseLevel}
          onChange={(verboseLevel) => onChange({ verboseLevel })}
        />

        <ModelSelectField
          isDisabled={isDisabled}
          label="图像生成模型"
          modelOptions={modelOptions}
          value={form.defaultImageGenerationModelid}
          onChange={(defaultImageGenerationModelid) =>
            onChange({ defaultImageGenerationModelid })
          }
        />

        <ModelSelectField
          isDisabled={isDisabled}
          label="视频生成模型"
          modelOptions={modelOptions}
          value={form.defaultVideoGenerationModelid}
          onChange={(defaultVideoGenerationModelid) =>
            onChange({ defaultVideoGenerationModelid })
          }
        />

        <ModelSelectField
          isDisabled={isDisabled}
          label="音乐生成模型"
          modelOptions={modelOptions}
          value={form.defaultMusicGenerationModelid}
          onChange={(defaultMusicGenerationModelid) =>
            onChange({ defaultMusicGenerationModelid })
          }
        />

        <ModelSelectField
          isDisabled={isDisabled}
          label="图像理解模型"
          modelOptions={modelOptions}
          value={form.defaultImageModelid}
          onChange={(defaultImageModelid) => onChange({ defaultImageModelid })}
        />

        <ModelSelectField
          isDisabled={isDisabled}
          label="PDF 理解模型"
          modelOptions={modelOptions}
          value={form.defaultPdfModelid}
          onChange={(defaultPdfModelid) => onChange({ defaultPdfModelid })}
        />

        <TextField
          fullWidth
          className="flex min-w-0 flex-col gap-2"
          isDisabled={isDisabled}
          variant="secondary"
        >
          <Label>说明</Label>
          <Input
            fullWidth
            value={form.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </TextField>
      </div>
    </>
  );
}

function ModelSelectField({
  isDisabled,
  label,
  modelOptions,
  onChange,
  value,
}: {
  isDisabled: boolean;
  label: string;
  modelOptions: Model[];
  onChange: (value: string) => void;
  value: string;
}) {
  const options = getModelSelectOptions(modelOptions, value);

  if (options.length === 0) {
    return (
      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Label>{label}</Label>
        <Input
          fullWidth
          placeholder="provider/modelid"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </TextField>
    );
  }

  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={value || UNSET_MODEL}
      variant="secondary"
      onSelectionChange={(key) => onChange(toModelValue(key))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={UNSET_MODEL}>不设置</ListBox.Item>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function LevelSelect({
  isDisabled,
  label,
  levels,
  onChange,
  value,
}: {
  isDisabled: boolean;
  label: string;
  levels: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={toSelectedLevelKey(value)}
      variant="secondary"
      onSelectionChange={(key) => onChange(toLevelValue(key))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {levels.map((level) => (
            <ListBox.Item key={level.id} id={level.id}>
              {level.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function AgentFormError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function toCreateAgentRequest(form: AgentForm): ReqAgentCreate {
  return {
    agentId: form.agentId.trim(),
    defaultImageGenerationModelid: toOptionalString(
      form.defaultImageGenerationModelid,
    ),
    defaultImageModelid: toOptionalString(form.defaultImageModelid),
    defaultMusicGenerationModelid: toOptionalString(
      form.defaultMusicGenerationModelid,
    ),
    defaultModelid: toOptionalString(form.defaultModelid),
    defaultPdfModelid: toOptionalString(form.defaultPdfModelid),
    defaultVideoGenerationModelid: toOptionalString(
      form.defaultVideoGenerationModelid,
    ),
    description: toOptionalString(form.description),
    displayName: toOptionalString(form.displayName),
    enabled: form.enabled,
    reasoningLevel: toOptionalString(form.reasoningLevel),
    thinkingLevel: toOptionalString(form.thinkingLevel),
    verboseLevel: toOptionalString(form.verboseLevel),
  };
}

function toUpdateAgentRequest(form: AgentForm, id: number): ReqAgentUpdate {
  return {
    ...toCreateAgentRequest(form),
    id,
  };
}

function toAgentForm(agent: EditableAgentSummary): AgentForm {
  return {
    agentId: agent.agentId?.trim() ?? "",
    defaultImageGenerationModelid:
      agent.defaultImageGenerationModelid?.trim() ?? "",
    defaultImageModelid: agent.defaultImageModelid?.trim() ?? "",
    defaultMusicGenerationModelid:
      agent.defaultMusicGenerationModelid?.trim() ?? "",
    defaultModelid: agent.defaultModelid?.trim() ?? "",
    defaultPdfModelid: agent.defaultPdfModelid?.trim() ?? "",
    defaultVideoGenerationModelid:
      agent.defaultVideoGenerationModelid?.trim() ?? "",
    description: agent.description?.trim() ?? "",
    displayName: agent.displayName?.trim() ?? "",
    enabled: agent.enabled !== false,
    reasoningLevel: agent.reasoningLevel?.trim() ?? "",
    thinkingLevel: agent.thinkingLevel?.trim() ?? "",
    verboseLevel: agent.verboseLevel?.trim() ?? "",
  };
}

function toLoadedAgentForm(
  summary: EditableAgentSummary,
  detail?: Agent,
): AgentForm {
  if (!detail) return toAgentForm(summary);

  return toAgentForm({
    ...summary,
    ...detail,
    id: summary.id,
  });
}

function getAgentLabel(agent: Pick<Agent, "agentId" | "displayName">) {
  return agent.displayName?.trim() || agent.agentId?.trim() || "未命名 Agent";
}

function toOptionalString(value: string) {
  return value.trim() || undefined;
}

function toSelectedLevelKey(value: string) {
  return value || UNSET_LEVEL;
}

function getModelSelectOptions(models: Model[], currentValue: string) {
  const options = models
    .map((model) => {
      const value = getModelReference(model);

      if (!value) return null;

      return {
        label: getModelOptionLabel(model, value),
        value,
      };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
  const current = currentValue.trim();

  if (current && !options.some((option) => option.value === current)) {
    return [{ label: current, value: current }, ...options];
  }

  return options;
}

function getModelReference(model: Model) {
  const provider = model.provider?.trim();
  const modelid = model.modelid?.trim();

  if (!modelid) return "";
  if (!provider || modelid.includes("/")) return modelid;

  return `${provider}/${modelid}`;
}

function getModelOptionLabel(model: Model, value: string) {
  const displayName = model.displayName?.trim();

  if (!displayName || displayName === value) return value;

  return `${displayName} · ${value}`;
}

function toModelValue(key: Key | null) {
  const value = String(key ?? UNSET_MODEL);

  return value === UNSET_MODEL ? "" : value;
}

function toLevelValue(key: Key | null) {
  const value = String(key ?? UNSET_LEVEL);

  return value === UNSET_LEVEL ? "" : value;
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
