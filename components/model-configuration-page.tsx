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
import { useMemo, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { ModelProviderLogo } from "@/components/model-provider-logo";

type ModelCapabilityId =
  | "chat"
  | "vision"
  | "image"
  | "asr"
  | "tts"
  | "embedding";

type ModelProviderPreset = {
  id: string;
  label: string;
  defaultModel: string;
  apiBase?: string;
};

type ModelConfiguration = {
  api_base?: string;
  api_token?: string;
  capabilities: ModelCapabilityId[];
  id: string;
  model: string;
  models?: string[];
  name: string;
  provider_type: string;
  status: string;
};

const modelProviderPresets: ModelProviderPreset[] = [
  {
    apiBase: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-v4-flash",
    id: "deepseek",
    label: "DeepSeek",
  },
  {
    apiBase: "https://api.openai.com/v1",
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
    apiBase: "https://ark.cn-beijing.volces.com/api/v3",
    defaultModel: "doubao-seed-2-0-pro-260215",
    id: "doubao",
    label: "豆包",
  },
  {
    apiBase: "https://api.moonshot.cn/v1",
    defaultModel: "kimi-k2.7-code",
    id: "moonshot",
    label: "Kimi",
  },
  {
    apiBase: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel:
      "glm-5.2\nglm-image\ncogview-4-250304\ncogview-4\ncogview-3-flash",
    id: "zhipu",
    label: "智谱 AI",
  },
  {
    apiBase: "https://api.anthropic.com/v1",
    defaultModel: "claude-fable-5",
    id: "claudeAPI",
    label: "Claude",
  },
  {
    apiBase: "https://generativelanguage.googleapis.com",
    defaultModel: "gemini-3.5-flash",
    id: "gemini",
    label: "Gemini",
  },
  {
    apiBase: "https://qianfan.baidubce.com/v2",
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
    apiBase: "https://token-plan-cn.xiaomimimo.com/v1",
    defaultModel: "mimo-v2.5-pro\nmimo-v2.5\nmimo-v2.5-asr\nmimo-v2.5-tts",
    id: "mimo",
    label: "小米 MiMo",
  },
  {
    defaultModel: "",
    id: "custom",
    label: "自定义 OpenAI 兼容",
  },
];

const defaultModelProviderPreset = modelProviderPresets[0];

const modelCapabilityDefinitions: Array<{
  id: ModelCapabilityId;
  label: string;
  description: string;
}> = [
  {
    description: "基础对话和 Agent 推理",
    id: "chat",
    label: "主模型",
  },
  {
    description: "识别图片内容",
    id: "vision",
    label: "图像理解",
  },
  {
    description: "图像生成技能",
    id: "image",
    label: "图像生成",
  },
  {
    description: "语音转文字",
    id: "asr",
    label: "语音识别",
  },
  {
    description: "文字转语音",
    id: "tts",
    label: "语音合成",
  },
  {
    description: "用于记忆与知识的向量化检索",
    id: "embedding",
    label: "向量",
  },
];

const INITIAL_MODEL_CONFIGURATIONS: ModelConfiguration[] = [
  createStaticModelConfiguration({
    api_token: "configured",
    capabilities: ["chat", "embedding"],
    id: "model-default",
    name: "默认主模型",
    provider_type: "deepseek",
  }),
  createStaticModelConfiguration({
    api_token: "configured",
    capabilities: ["vision"],
    id: "model-vision",
    name: "图像理解",
    provider_type: "openai",
  }),
  createStaticModelConfiguration({
    api_token: "configured",
    capabilities: ["image"],
    id: "model-image",
    model: "glm-image",
    name: "图像生成",
    provider_type: "zhipu",
  }),
  createStaticModelConfiguration({
    api_token: "configured",
    capabilities: ["asr", "tts"],
    id: "model-speech",
    model: "mimo-v2.5-tts",
    name: "语音模型",
    provider_type: "mimo",
  }),
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
  const [model, setModel] = useState(defaultModelProviderPreset.defaultModel);
  const [apiBase, setApiBase] = useState(
    defaultModelProviderPreset.apiBase ?? "",
  );
  const [apiToken, setApiToken] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    ModelCapabilityId[]
  >(["chat"]);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [modelConfigurations, setModelConfigurations] = useState(
    INITIAL_MODEL_CONFIGURATIONS,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingProvider, setIsDeletingProvider] = useState(false);
  const [editingModelConfiguration, setEditingModelConfiguration] =
    useState<ModelConfiguration | null>(null);

  const selectedProvider =
    modelProviderPresets.find((provider) => provider.id === providerType) ??
    defaultModelProviderPreset;
  const providerDialogTitle = editingModelConfiguration
    ? "编辑模型配置"
    : "添加模型配置";
  const providerSubmitLabel = editingModelConfiguration ? "保存" : "创建模型";
  const providerModelOptions = useMemo(() => {
    const savedModels =
      editingModelConfiguration?.provider_type === providerType
        ? (editingModelConfiguration.models ?? [])
        : [];
    const presetModels = providerPresetModels(selectedProvider);
    const options = Array.from(new Set([...savedModels, ...presetModels]));
    const currentModel = model.trim();

    return currentModel && !options.includes(currentModel)
      ? [currentModel, ...options]
      : options;
  }, [editingModelConfiguration, model, providerType, selectedProvider]);
  const usesCustomProvider = selectedProvider.id === "custom";

  function applyProviderPreset(providerId: string) {
    const nextProvider =
      modelProviderPresets.find((provider) => provider.id === providerId) ??
      defaultModelProviderPreset;
    const nextModels = providerPresetModels(nextProvider);

    setProviderType(nextProvider.id);
    setModel(nextModels[0] ?? "");
    setApiBase(nextProvider.apiBase ?? "");
  }

  function resetProviderForm(providerId = defaultModelProviderPreset.id) {
    setEditingModelConfiguration(null);
    setModelConfigName("");
    applyProviderPreset(providerId);
    setApiToken("");
    setSelectedCapabilities(["chat"]);
  }

  function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProviderType = providerType;
    const nextName = modelConfigName.trim();
    const customModels = parseModelList(model);
    const nextModels = usesCustomProvider ? customModels : providerModelOptions;
    const nextModel = model.trim() || nextModels[0] || "";
    const nextApiBase = apiBase.trim();
    const nextApiToken =
      apiToken.trim() || editingModelConfiguration?.api_token || "";

    if (!nextName) {
      toast.danger("配置名称为必填项。");

      return;
    }

    if (!nextProviderType || !nextModel) {
      toast.danger("模型为必填项。");

      return;
    }

    if (selectedProvider.id === "custom" && !nextApiBase) {
      toast.danger("自定义模型必须填写 API 地址。");

      return;
    }

    if (selectedCapabilities.length === 0) {
      toast.danger("至少选择一个模型能力。");

      return;
    }

    setIsSubmitting(true);
    const nextModelConfiguration: ModelConfiguration = {
      api_base: nextApiBase || selectedProvider.apiBase,
      api_token: nextApiToken || undefined,
      capabilities: selectedCapabilities,
      id: editingModelConfiguration?.id ?? `model-${Date.now()}`,
      model: nextModel,
      models: nextModels,
      name: nextName,
      provider_type: nextProviderType,
      status: "active",
    };

    setModelConfigurations((items) => {
      return editingModelConfiguration
        ? items.map((item) =>
            item.id === editingModelConfiguration.id
              ? nextModelConfiguration
              : item,
          )
        : [...items, nextModelConfiguration];
    });

    toast.success(
      editingModelConfiguration ? "模型配置已更新。" : "模型配置已创建。",
    );
    resetProviderForm();
    setIsProviderDialogOpen(false);
    setIsSubmitting(false);
  }

  function openCreateProviderDialog(
    providerId = defaultModelProviderPreset.id,
  ) {
    resetProviderForm(providerId);
    setIsProviderDialogOpen(true);
  }

  function openEditProviderDialog(modelConfiguration: ModelConfiguration) {
    const nextProvider =
      modelProviderPresets.find(
        (item) => item.id === modelConfiguration.provider_type,
      ) ?? defaultModelProviderPreset;

    setEditingModelConfiguration(modelConfiguration);
    setModelConfigName(modelConfiguration.name);
    setProviderType(modelConfiguration.provider_type || nextProvider.id);
    setModel(
      modelConfiguration.model ||
        modelConfiguration.models?.[0] ||
        providerPresetModels(nextProvider)[0] ||
        "",
    );
    setApiBase(modelConfiguration.api_base ?? nextProvider.apiBase ?? "");
    setApiToken("");
    setSelectedCapabilities(modelConfiguration.capabilities);
    setIsProviderDialogOpen(true);
  }

  function deleteProvider() {
    if (!editingModelConfiguration) return;
    if (!window.confirm(`删除“${editingModelConfiguration.name}”模型配置？`)) {
      return;
    }

    setIsDeletingProvider(true);
    setModelConfigurations((items) =>
      items.filter((item) => item.id !== editingModelConfiguration.id),
    );
    toast.success("模型配置已删除。");
    setIsProviderDialogOpen(false);
    resetProviderForm();
    setIsDeletingProvider(false);
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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Typography color="muted" type="body-sm">
        保存可用模型，配置 API 地址、Token 和模型能力。
      </Typography>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          className="border-border bg-surface cursor-[var(--cursor-interactive)] hover:bg-surface-hover flex min-h-28 items-center gap-3 rounded-lg border border-dashed px-3 text-left"
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
            className="bg-surface flex min-h-28 min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-3"
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
                  {modelConfiguration.model}
                </Typography>
                <Typography className="truncate" color="muted" type="body-xs">
                  {modelConfiguration.api_base || "未配置 API 地址"}
                </Typography>
                <div className="flex flex-wrap gap-1">
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
                    color={modelConfiguration.api_token ? "success" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    Token {modelConfiguration.api_token ? "已配置" : "未配置"}
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
                  配置模型服务、鉴权 Token 和可用能力。
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
                      name="model"
                      value={model}
                      onChange={setModel}
                    >
                      <Label>主模型</Label>
                      <Input placeholder="输入模型名称" variant="secondary" />
                      <FieldError />
                    </TextField>
                  ) : (
                    <Select
                      fullWidth
                      isRequired
                      name="model"
                      selectedKey={model}
                      variant="secondary"
                      onSelectionChange={(key) => {
                        if (key) {
                          setModel(String(key));
                        }
                      }}
                    >
                      <Label>主模型</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {providerModelOptions.map((modelOption) => (
                            <ListBox.Item
                              key={modelOption}
                              id={modelOption}
                              textValue={modelOption}
                            >
                              {modelOption}
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                      <FieldError />
                    </Select>
                  )}
                  <TextField
                    fullWidth
                    isRequired={selectedProvider.id === "custom"}
                    name="api_base"
                    type="url"
                    value={apiBase}
                    onChange={setApiBase}
                  >
                    <Label>API 地址</Label>
                    <Input
                      placeholder={
                        selectedProvider.apiBase ?? "https://example.test/v1"
                      }
                      variant="secondary"
                    />
                    <FieldError />
                  </TextField>
                  <TextField
                    fullWidth
                    name="api_token"
                    type="password"
                    value={apiToken}
                    onChange={setApiToken}
                  >
                    <Label>API Token</Label>
                    <Input
                      placeholder={
                        editingModelConfiguration
                          ? "留空则保留当前 Token"
                          : "填入模型服务 Token"
                      }
                      variant="secondary"
                    />
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

function createStaticModelConfiguration({
  api_base,
  api_token,
  capabilities,
  id,
  model,
  name,
  provider_type,
  status = "active",
}: {
  api_base?: string;
  api_token?: string;
  capabilities: ModelCapabilityId[];
  id: string;
  model?: string;
  name: string;
  provider_type: string;
  status?: string;
}): ModelConfiguration {
  const preset =
    modelProviderPresets.find((provider) => provider.id === provider_type) ??
    defaultModelProviderPreset;
  const models = providerPresetModels(preset);
  const nextModel = model || models[0] || preset.defaultModel;

  return {
    api_base: api_base ?? preset.apiBase,
    api_token,
    capabilities,
    id,
    model: nextModel,
    models,
    name,
    provider_type,
    status,
  };
}

function modelProviderLabel(providerType: string): string {
  return (
    modelProviderPresets.find((provider) => provider.id === providerType)
      ?.label ?? providerType
  );
}

function modelCapabilityLabel(capability: ModelCapabilityId): string {
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
