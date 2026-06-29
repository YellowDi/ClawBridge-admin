"use client";

import type { FormEvent, ReactNode } from "react";

import {
  Button,
  Checkbox,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  Tooltip,
  toast,
} from "@heroui/react";
import { useCallback, useEffect, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { ModelProviderLogo } from "@/components/model-provider-logo";
import {
  createModel,
  deleteModel,
  listModels,
  type Model,
  type ReqModelCreate,
  type ReqModelUpdate,
  updateModel,
} from "@/lib/api";

type ModelCapabilityId =
  | "chat"
  | "image_generation"
  | "video_generation"
  | "music_generation"
  | "vision"
  | "pdf";

type ModelCapabilityValue = ModelCapabilityId | (string & {});

type ModelProviderPreset = {
  defaultModel: string;
  id: string;
  label: string;
};

type ModelConfiguration = {
  capabilities: ModelCapabilityValue[];
  enabled: boolean;
  id: string;
  model: string;
  models?: string[];
  name: string;
  provider_type: string;
  record?: Model;
  recordId?: number;
};

const modelProviderPresets: ModelProviderPreset[] = [
  {
    defaultModel: "deepseek-v4-flash",
    id: "deepseek",
    label: "DeepSeek",
  },
  {
    defaultModel: "gpt-5.5",
    id: "openai",
    label: "OpenAI",
  },
  {
    defaultModel: "qwen3.7-plus",
    id: "dashscope",
    label: "通义千问",
  },
  {
    defaultModel: "doubao-seed-2-0-pro-260215",
    id: "doubao",
    label: "豆包",
  },
  {
    defaultModel: "kimi-k2.7-code",
    id: "moonshot",
    label: "Kimi",
  },
  {
    defaultModel:
      "glm-5.2\nglm-image\ncogview-4-250304\ncogview-4\ncogview-3-flash",
    id: "zhipu",
    label: "智谱 AI",
  },
  {
    defaultModel: "claude-fable-5",
    id: "anthropic",
    label: "Claude",
  },
  {
    defaultModel: "gemini-2.5-pro\ngemini-3.5-flash",
    id: "google",
    label: "Gemini",
  },
  {
    defaultModel: "ernie-5.1",
    id: "qianfan",
    label: "百度千帆",
  },
  {
    defaultModel: "MiniMax-M3",
    id: "minimax",
    label: "MiniMax",
  },
  {
    defaultModel: "mimo-v2.5-pro\nmimo-v2.5",
    id: "mimo",
    label: "小米 MiMo",
  },
  {
    defaultModel: "qwen/qwen-2.5-vl-72b-instruct:free",
    id: "openrouter",
    label: "OpenRouter",
  },
  {
    defaultModel: "",
    id: "custom",
    label: "自定义 OpenAI 兼容",
  },
];

const defaultModelProviderPreset = modelProviderPresets[0];

const modelCapabilityDefinitions: Array<{
  description: string;
  id: ModelCapabilityId;
  label: string;
}> = [
  {
    description: "基础对话和 Agent 推理",
    id: "chat",
    label: "主模型",
  },
  {
    description: "图像生成技能",
    id: "image_generation",
    label: "图像生成",
  },
  {
    description: "视频生成技能",
    id: "video_generation",
    label: "视频生成",
  },
  {
    description: "音乐生成技能",
    id: "music_generation",
    label: "音乐生成",
  },
  {
    description: "识别图片内容",
    id: "vision",
    label: "图像理解",
  },
  {
    description: "PDF 文档理解",
    id: "pdf",
    label: "PDF 理解",
  },
];

function Typography({
  children,
  className,
  color,
  type,
  weight,
}: {
  children: ReactNode;
  className?: string;
  color?: "muted";
  type?: "body-sm" | "body-xs";
  weight?: "medium" | "semibold";
}) {
  return (
    <span
      className={[
        color === "muted" ? "text-muted" : null,
        type === "body-xs" ? "text-xs" : "text-sm",
        weight === "medium" ? "font-medium" : null,
        weight === "semibold" ? "font-semibold" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

function ProviderPresetOption({ provider }: { provider: ModelProviderPreset }) {
  return (
    <>
      {provider.label}
      <ListBox.ItemIndicator />
    </>
  );
}

export function ModelConfigurationPage() {
  const [modelConfigName, setModelConfigName] = useState("");
  const [providerType, setProviderType] = useState(
    defaultModelProviderPreset.id,
  );
  const [customProvider, setCustomProvider] = useState("");
  const [model, setModel] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    ModelCapabilityValue[]
  >(["chat"]);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [modelConfigurations, setModelConfigurations] = useState<
    ModelConfiguration[]
  >([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingProvider, setIsDeletingProvider] = useState(false);
  const [editingModelConfiguration, setEditingModelConfiguration] =
    useState<ModelConfiguration | null>(null);

  const selectedProvider =
    modelProviderPresets.find((provider) => provider.id === providerType) ??
    defaultModelProviderPreset;
  const usesCustomProvider = selectedProvider.id === "custom";
  const providerDialogTitle = editingModelConfiguration
    ? "编辑模型配置"
    : "添加模型配置";
  const providerSubmitLabel = editingModelConfiguration ? "保存" : "创建模型";
  const suggestedModel = providerPresetModels(selectedProvider)[0];
  const modelPlaceholder = suggestedModel
    ? `例如：${suggestedModel}`
    : "例如：gemini-2.5-pro";

  const loadModelConfigurations = useCallback(async () => {
    setIsLoadingModels(true);
    setLoadError(null);

    try {
      const models = await listModels();

      setModelConfigurations(models.map(toModelConfiguration));
    } catch (error) {
      const message = getActionErrorMessage(error);

      setLoadError(message);
      toast.danger(`模型配置加载失败：${message}`);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    void loadModelConfigurations();
  }, [loadModelConfigurations]);

  function applyProviderPreset(providerId: string) {
    const nextProvider =
      modelProviderPresets.find((provider) => provider.id === providerId) ??
      defaultModelProviderPreset;

    setProviderType(nextProvider.id);
    setModel("");
    setCustomProvider("");
  }

  function resetProviderForm(providerId = defaultModelProviderPreset.id) {
    setEditingModelConfiguration(null);
    setModelConfigName("");
    setCustomProvider("");
    applyProviderPreset(providerId);
    setSelectedCapabilities(["chat"]);
  }

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = modelConfigName.trim();
    const nextProvider = usesCustomProvider
      ? customProvider.trim()
      : selectedProvider.id;
    const nextModel = model.trim();
    const nextCapabilities = selectedCapabilities
      .map((capability) => capability.trim())
      .filter(Boolean);

    if (!nextName) {
      toast.danger("配置名称为必填项。");

      return;
    }

    if (!nextProvider) {
      toast.danger("供应商标识为必填项。");

      return;
    }

    if (!nextModel) {
      toast.danger("模型为必填项。");

      return;
    }

    if (nextCapabilities.length === 0) {
      toast.danger("至少选择一个模型能力。");

      return;
    }

    setIsSubmitting(true);

    try {
      const request = buildModelRequest({
        capabilities: nextCapabilities,
        displayName: nextName,
        modelid: nextModel,
        provider: nextProvider,
        record: editingModelConfiguration?.record,
      });
      const savedModel = editingModelConfiguration?.recordId
        ? await updateModel({
            ...request,
            id: editingModelConfiguration.recordId,
          } satisfies ReqModelUpdate)
        : await createModel(request);

      if (savedModel) {
        const nextModelConfiguration = toModelConfiguration(savedModel);

        setModelConfigurations((items) =>
          editingModelConfiguration
            ? items.map((item) =>
                item.id === editingModelConfiguration.id
                  ? nextModelConfiguration
                  : item,
              )
            : [nextModelConfiguration, ...items],
        );
      } else {
        await loadModelConfigurations();
      }

      toast.success(
        editingModelConfiguration ? "模型配置已更新。" : "模型配置已创建。",
      );
      resetProviderForm();
      setIsProviderDialogOpen(false);
    } catch (error) {
      toast.danger(`模型配置保存失败：${getActionErrorMessage(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateProviderDialog(
    providerId = defaultModelProviderPreset.id,
  ) {
    resetProviderForm(providerId);
    setIsProviderDialogOpen(true);
  }

  function openEditProviderDialog(modelConfiguration: ModelConfiguration) {
    const nextProvider = modelProviderPresets.find(
      (item) => item.id === modelConfiguration.provider_type,
    );
    const nextProviderId = nextProvider?.id ?? "custom";
    const nextProviderModels = nextProvider
      ? providerPresetModels(nextProvider)
      : [];

    setEditingModelConfiguration(modelConfiguration);
    setModelConfigName(modelConfiguration.name);
    setProviderType(nextProviderId);
    setCustomProvider(nextProvider ? "" : modelConfiguration.provider_type);
    setModel(
      modelConfiguration.model ||
        modelConfiguration.models?.[0] ||
        nextProviderModels[0] ||
        "",
    );
    setSelectedCapabilities(modelConfiguration.capabilities);
    setIsProviderDialogOpen(true);
  }

  async function deleteProvider() {
    if (!editingModelConfiguration?.recordId) return;
    if (!window.confirm(`删除“${editingModelConfiguration.name}”模型配置？`)) {
      return;
    }

    setIsDeletingProvider(true);

    try {
      await deleteModel(editingModelConfiguration.recordId);
      setModelConfigurations((items) =>
        items.filter((item) => item.id !== editingModelConfiguration.id),
      );
      toast.success("模型配置已删除。");
      setIsProviderDialogOpen(false);
      resetProviderForm();
    } catch (error) {
      toast.danger(`模型配置删除失败：${getActionErrorMessage(error)}`);
    } finally {
      setIsDeletingProvider(false);
    }
  }

  function toggleCapability(capability: ModelCapabilityId, selected: boolean) {
    setSelectedCapabilities((current) => {
      if (selected) {
        return current.includes(capability)
          ? current
          : [...current, capability];
      }

      return current.filter((item) => item !== capability);
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-3">
        <button
          className="border-border bg-surface cursor-[var(--cursor-interactive)] hover:bg-surface-hover disabled:text-muted flex min-h-28 items-center gap-3 rounded-3xl border border-dashed px-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoadingModels}
          type="button"
          onClick={() => openCreateProviderDialog()}
        >
          <AdminIcon
            className="text-muted-foreground size-4 shrink-0"
            name="plus"
          />
          <Typography className="truncate" type="body-sm" weight="medium">
            添加模型
          </Typography>
        </button>
        {modelConfigurations.map((modelConfiguration) => (
          <div
            key={modelConfiguration.id}
            className="bg-surface flex min-h-28 min-w-0 items-center justify-between gap-3 rounded-3xl px-3 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <ModelProviderLogo
                label={modelProviderLabel(modelConfiguration.provider_type)}
                providerType={modelConfiguration.provider_type}
              />
              <div className="flex min-w-0 flex-col gap-1">
                <Typography className="truncate" type="body-sm" weight="medium">
                  {modelConfiguration.name}
                </Typography>
                <Typography className="truncate" color="muted" type="body-xs">
                  {modelProviderLabel(modelConfiguration.provider_type)} ·{" "}
                  {modelConfiguration.model || "未配置模型 ID"}
                </Typography>
                <div className="flex flex-wrap gap-1">
                  {modelConfiguration.capabilities.length === 0 ? (
                    <Chip size="sm" variant="soft">
                      兼容模式
                    </Chip>
                  ) : null}
                  {modelConfiguration.capabilities
                    .slice(0, 2)
                    .map((capability) => (
                      <Chip key={capability} size="sm" variant="soft">
                        {modelCapabilityLabel(capability)}
                      </Chip>
                    ))}
                  {modelConfiguration.capabilities.length > 2 ? (
                    <Chip size="sm" variant="soft">
                      +{modelConfiguration.capabilities.length - 2}
                    </Chip>
                  ) : null}
                  <Chip
                    color={modelConfiguration.enabled ? "success" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {modelConfiguration.enabled ? "已启用" : "已停用"}
                  </Chip>
                </div>
              </div>
            </div>
            <Tooltip>
              <Button
                isIconOnly
                aria-label="编辑模型配置"
                size="sm"
                variant="tertiary"
                onPress={() => openEditProviderDialog(modelConfiguration)}
              >
                <AdminIcon className="size-4" name="edit" />
              </Button>
              <Tooltip.Content>编辑模型配置</Tooltip.Content>
            </Tooltip>
          </div>
        ))}
      </div>

      {isLoadingModels ? (
        <div className="bg-surface text-muted rounded-3xl px-4 py-3 text-sm">
          正在加载模型配置...
        </div>
      ) : null}
      {!isLoadingModels && loadError ? (
        <div className="bg-danger-soft text-danger flex items-center justify-between gap-3 rounded-3xl px-4 py-3 text-sm">
          <span className="min-w-0 truncate">加载失败：{loadError}</span>
          <Button
            size="sm"
            type="button"
            variant="danger-soft"
            onPress={() => void loadModelConfigurations()}
          >
            重新加载
          </Button>
        </div>
      ) : null}
      {!isLoadingModels && !loadError && modelConfigurations.length === 0 ? (
        <div className="bg-surface text-muted rounded-3xl px-4 py-3 text-sm">
          暂无模型配置，请先添加模型。
        </div>
      ) : null}

      <Modal.Backdrop
        isOpen={isProviderDialogOpen}
        onOpenChange={(isOpen) => {
          setIsProviderDialogOpen(isOpen);
          if (!isOpen && !isSubmitting) {
            resetProviderForm();
          }
        }}
      >
        <Modal.Container placement="auto" scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Form onSubmit={submitProvider}>
              <Modal.Header>
                <Modal.Heading>{providerDialogTitle}</Modal.Heading>
                <Typography color="muted" type="body-sm">
                  配置模型服务和可用能力。
                </Typography>
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-4">
                  <TextField
                    fullWidth
                    isRequired
                    name="model_config_name"
                    value={modelConfigName}
                    onChange={setModelConfigName}
                  >
                    <Label>配置名称</Label>
                    <Input placeholder="例如：默认主模型" variant="secondary" />
                    <FieldError />
                  </TextField>
                  <Select
                    fullWidth
                    isRequired
                    name="provider_type"
                    selectedKey={providerType}
                    variant="secondary"
                    onSelectionChange={(key) => {
                      if (key) {
                        applyProviderPreset(String(key));
                      }
                    }}
                  >
                    <Label>主模型来源</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {modelProviderPresets.map((provider) => (
                          <ListBox.Item
                            key={provider.id}
                            id={provider.id}
                            textValue={provider.label}
                          >
                            <ProviderPresetOption provider={provider} />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                    <FieldError />
                  </Select>
                  {usesCustomProvider ? (
                    <TextField
                      fullWidth
                      isRequired
                      name="provider"
                      value={customProvider}
                      onChange={setCustomProvider}
                    >
                      <Label>供应商标识</Label>
                      <Input placeholder="例如：google" variant="secondary" />
                      <FieldError />
                    </TextField>
                  ) : null}
                  <TextField
                    fullWidth
                    isRequired
                    name="model"
                    value={model}
                    onChange={setModel}
                  >
                    <Label>模型名称</Label>
                    <Input placeholder={modelPlaceholder} variant="secondary" />
                    <FieldError />
                  </TextField>
                  <div className="grid gap-2">
                    <Label>模型能力</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {modelCapabilityDefinitions.map((definition) => (
                        <Checkbox
                          key={definition.id}
                          isSelected={selectedCapabilities.includes(
                            definition.id,
                          )}
                          onChange={(selected) =>
                            toggleCapability(definition.id, selected)
                          }
                        >
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                          <Checkbox.Content>
                            <span className="block text-sm font-medium">
                              {definition.label}
                            </span>
                            <span className="text-muted block text-xs">
                              {definition.description}
                            </span>
                          </Checkbox.Content>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <div className="flex w-full items-center justify-between gap-3">
                  {editingModelConfiguration ? (
                    <Button
                      isDisabled={!editingModelConfiguration.recordId}
                      isPending={isDeletingProvider}
                      type="button"
                      variant="danger-soft"
                      onPress={deleteProvider}
                    >
                      <AdminIcon className="size-4" name="trash" />
                      删除模型
                    </Button>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      isDisabled={isSubmitting || isDeletingProvider}
                      type="button"
                      variant="secondary"
                      onPress={() => setIsProviderDialogOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      isDisabled={isDeletingProvider}
                      isPending={isSubmitting}
                      type="submit"
                    >
                      {providerSubmitLabel}
                    </Button>
                  </div>
                </div>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

function buildModelRequest({
  capabilities,
  displayName,
  modelid,
  provider,
  record,
}: {
  capabilities: string[];
  displayName: string;
  modelid: string;
  provider: string;
  record?: Model;
}): ReqModelCreate {
  const request: ReqModelCreate = {
    capabilities,
    displayName,
    enabled: record?.enabled ?? true,
    modelid,
    provider,
  };

  if (record?.cacheReadPricePerMillion !== undefined) {
    request.cacheReadPricePerMillion = record.cacheReadPricePerMillion;
  }
  if (record?.cacheWritePricePerMillion !== undefined) {
    request.cacheWritePricePerMillion = record.cacheWritePricePerMillion;
  }
  if (record?.currency !== undefined) {
    request.currency = record.currency;
  }
  if (record?.inputPricePerMillion !== undefined) {
    request.inputPricePerMillion = record.inputPricePerMillion;
  }
  if (record?.outputPricePerMillion !== undefined) {
    request.outputPricePerMillion = record.outputPricePerMillion;
  }

  return request;
}

function toModelConfiguration(model: Model): ModelConfiguration {
  const provider = normalizeText(model.provider) || "custom";
  const modelid = normalizeText(model.modelid);
  const displayName = normalizeText(model.displayName);
  const preset =
    modelProviderPresets.find((item) => item.id === provider) ??
    modelProviderPresets.find((item) => item.id === "custom") ??
    defaultModelProviderPreset;
  const presetModels = providerPresetModels(preset);
  const models = modelid
    ? Array.from(new Set([modelid, ...presetModels]))
    : presetModels;

  return {
    capabilities: normalizeCapabilities(model.capabilities),
    enabled: model.enabled ?? true,
    id:
      model.id !== undefined
        ? String(model.id)
        : `${provider}:${modelid || displayName || "model"}`,
    model: modelid,
    models,
    name: displayName || modelid || "未命名模型",
    provider_type: provider,
    record: model,
    recordId: model.id,
  };
}

function normalizeCapabilities(
  capabilities?: string[],
): ModelCapabilityValue[] {
  const values: ModelCapabilityValue[] = [];
  const seen = new Set<string>();

  for (const capability of capabilities ?? []) {
    const nextCapability = capability.trim();

    if (!nextCapability || seen.has(nextCapability)) continue;
    seen.add(nextCapability);
    values.push(nextCapability as ModelCapabilityValue);
  }

  return values;
}

function modelProviderLabel(providerType: string): string {
  return (
    modelProviderPresets.find((provider) => provider.id === providerType)
      ?.label ?? providerType
  );
}

function modelCapabilityLabel(capability: ModelCapabilityValue): string {
  return (
    modelCapabilityDefinitions.find(
      (definition) => definition.id === capability,
    )?.label ?? capability
  );
}

function parseModelList(value: string): string[] {
  const models: string[] = [];
  const seen = new Set<string>();

  for (const item of value.replace(/,/g, "\n").split(/\r?\n/)) {
    const nextModel = item.trim();

    if (!nextModel || seen.has(nextModel)) continue;
    seen.add(nextModel);
    models.push(nextModel);
  }

  return models;
}

function providerPresetModels(provider: ModelProviderPreset) {
  return parseModelList(provider.defaultModel);
}

function normalizeText(value?: string) {
  return value?.trim() ?? "";
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "请求失败，请稍后重试。";
}
