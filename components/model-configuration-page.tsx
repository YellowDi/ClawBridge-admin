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
import { Widget } from "@heroui-pro/react";
import { useMemo, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { ModelProviderLogo } from "@/components/model-provider-logo";

const PROVIDER_DEFAULT_MODEL = "__provider_default_model__";

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
};

type ModelConfiguration = {
  id: string;
  name: string;
  provider_type: string;
  model: string;
  models?: string[];
  tts_voice_id?: string;
  capabilities: ModelCapabilityId[];
  status: string;
};

type ModelCapabilityRoute = {
  capability: ModelCapabilityId;
  provider_id: string;
  provider_name: string;
  provider_type: string;
  model: string;
  models?: string[];
  status: string;
  tts_voice_id?: string;
};

type SearchToolConfigSummary = {
  strategy: "auto" | "fixed";
  provider: string;
  configured_providers: string[];
};

type CatalogItem = {
  name: string;
  description: string;
  display_name?: string;
  localized_description?: string;
  source: string;
  status: string;
  config_summary?: SearchToolConfigSummary;
};

type SearchToolConfigInput = {
  strategy?: "auto" | "fixed";
  provider?: string;
  bocha_api_key?: string;
  zhipu_api_key?: string;
  qianfan_api_key?: string;
  zhipu_api_base?: string;
  qianfan_api_base?: string;
};

const mimoTtsVoiceOptions = [
  { label: "MiMo 默认", value: "mimo_default" },
  { label: "冰糖", value: "冰糖" },
  { label: "茉莉", value: "茉莉" },
  { label: "苏打", value: "苏打" },
  { label: "白桦", value: "白桦" },
  { label: "Mia", value: "Mia" },
  { label: "Chloe", value: "Chloe" },
  { label: "Milo", value: "Milo" },
  { label: "Dean", value: "Dean" },
];

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
    id: "claudeAPI",
    label: "Claude",
  },
  {
    defaultModel: "gemini-3.5-flash",
    id: "gemini",
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

const searchProviderOptions = [
  { id: "bocha", label: "博查" },
  { id: "qianfan", label: "百度千帆" },
  { id: "zhipu", label: "智谱" },
] as const;

const searchStrategyOptions = [
  { id: "auto", label: "自动选择" },
  { id: "fixed", label: "固定供应商" },
] as const;

const INITIAL_MODEL_CONFIGURATIONS: ModelConfiguration[] = [
  createStaticModelConfiguration({
    capabilities: ["chat", "embedding"],
    id: "model-default",
    name: "默认主模型",
    provider_type: "deepseek",
  }),
  createStaticModelConfiguration({
    capabilities: ["vision"],
    id: "model-vision",
    name: "图像理解",
    provider_type: "openai",
  }),
  createStaticModelConfiguration({
    capabilities: ["image"],
    id: "model-image",
    model: "glm-image",
    name: "图像生成",
    provider_type: "zhipu",
  }),
  createStaticModelConfiguration({
    capabilities: ["asr", "tts"],
    id: "model-speech",
    model: "mimo-v2.5-tts",
    name: "语音模型",
    provider_type: "mimo",
    tts_voice_id: "mimo_default",
  }),
];

const INITIAL_CAPABILITIES: ModelCapabilityRoute[] = [
  createCapabilityRoute("chat", INITIAL_MODEL_CONFIGURATIONS[0]),
  createCapabilityRoute("vision", INITIAL_MODEL_CONFIGURATIONS[1]),
  createCapabilityRoute("image", INITIAL_MODEL_CONFIGURATIONS[2], "glm-image"),
  createCapabilityRoute(
    "asr",
    INITIAL_MODEL_CONFIGURATIONS[3],
    "mimo-v2.5-asr",
  ),
  createCapabilityRoute(
    "tts",
    INITIAL_MODEL_CONFIGURATIONS[3],
    "mimo-v2.5-tts",
    "mimo_default",
  ),
  createCapabilityRoute("embedding", INITIAL_MODEL_CONFIGURATIONS[0]),
];

const INITIAL_WEB_SEARCH_TOOL: CatalogItem = {
  config_summary: {
    configured_providers: ["bocha", "zhipu"],
    provider: "",
    strategy: "auto",
  },
  description: "实时网页检索能力，用于搜索工具。",
  display_name: "联网搜索",
  name: "web_search",
  source: "platform",
  status: "active",
};

type CapabilityDefinition = (typeof modelCapabilityDefinitions)[number];

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

function CapabilitySettingsPanel({
  definition,
  isSaving,
  modelConfigurations,
  route,
  onSave,
}: {
  definition: CapabilityDefinition;
  isSaving: boolean;
  modelConfigurations: ModelConfiguration[];
  route: ModelCapabilityRoute | undefined;
  onSave: (
    capability: ModelCapabilityId,
    modelConfigurationId: string,
    model: string,
    ttsVoiceId?: string,
  ) => void;
}) {
  const eligibleModelConfigurations = modelConfigurations.filter((item) =>
    item.capabilities.includes(definition.id),
  );
  const routeModelConfiguration = route
    ? modelConfigurations.find((item) => item.id === route.provider_id)
    : undefined;
  const modelConfigurationOptions = routeModelConfiguration
    ? Array.from(
        new Map(
          [routeModelConfiguration, ...eligibleModelConfigurations].map(
            (item) => [item.id, item],
          ),
        ).values(),
      )
    : eligibleModelConfigurations;
  const initialModelConfiguration =
    routeModelConfiguration ?? modelConfigurationOptions[0];
  const [modelConfigurationId, setModelConfigurationId] = useState(
    initialModelConfiguration?.id ?? "",
  );
  const [modelValue, setModelValue] = useState(
    route?.model || initialModelConfiguration?.model || "",
  );
  const [voiceId, setVoiceId] = useState(
    route?.tts_voice_id ||
      initialModelConfiguration?.tts_voice_id ||
      "mimo_default",
  );
  const selectedModelConfiguration = modelConfigurationId
    ? modelConfigurationOptions.find((item) => item.id === modelConfigurationId)
    : undefined;
  const savedModels = selectedModelConfiguration?.models?.length
    ? selectedModelConfiguration.models
    : selectedModelConfiguration?.model
      ? [selectedModelConfiguration.model]
      : [];
  const presetProvider = selectedModelConfiguration
    ? modelProviderPresets.find(
        (provider) => provider.id === selectedModelConfiguration.provider_type,
      )
    : undefined;
  const providerModels = Array.from(
    new Set([
      ...savedModels,
      ...(presetProvider ? providerPresetModels(presetProvider) : []),
    ]),
  );
  const modelOptions =
    modelValue && !providerModels.includes(modelValue)
      ? [modelValue, ...providerModels]
      : providerModels;
  const isConfigured = Boolean(
    route && selectedModelConfiguration?.status === "active",
  );

  function handleModelConfigurationChange(nextModelConfigurationId: string) {
    const nextModelConfiguration = modelConfigurationOptions.find(
      (item) => item.id === nextModelConfigurationId,
    );

    setModelConfigurationId(nextModelConfigurationId);
    setModelValue(nextModelConfiguration?.model || "");
    setVoiceId(nextModelConfiguration?.tts_voice_id || "mimo_default");
  }

  return (
    <Widget>
      <Widget.Header className="min-w-0">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
          <Widget.Title className="shrink-0 whitespace-nowrap">
            {definition.label}
          </Widget.Title>
          <span aria-hidden="true" className="text-muted shrink-0 text-xs">
            ·
          </span>
          <Widget.Description
            className="min-w-0 truncate whitespace-nowrap"
            title={definition.description}
          >
            {definition.description}
          </Widget.Description>
        </div>
        <Chip
          className="shrink-0"
          color={isConfigured ? "success" : "default"}
          size="sm"
          variant="soft"
        >
          {isConfigured ? "已配置" : "未配置"}
        </Chip>
      </Widget.Header>
      <Widget.Content>
        <div className="grid gap-4">
          {definition.id === "embedding" ? (
            <Typography color="muted" type="body-sm">
              切换向量模型后，已有索引需要执行 /memory rebuild-index 重建。
            </Typography>
          ) : null}
          <div className="grid gap-4">
            <Select
              fullWidth
              isRequired
              name={`${definition.id}_model_config`}
              selectedKey={modelConfigurationId}
              variant="secondary"
              onSelectionChange={(key) => {
                if (key) {
                  handleModelConfigurationChange(String(key));
                }
              }}
            >
              <Label>模型配置</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {modelConfigurationOptions.map((modelConfiguration) => (
                    <ListBox.Item
                      key={modelConfiguration.id}
                      id={modelConfiguration.id}
                      textValue={modelConfiguration.name}
                    >
                      {modelConfiguration.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
              <FieldError />
            </Select>
            <Select
              fullWidth
              name={`${definition.id}_model`}
              selectedKey={modelValue || PROVIDER_DEFAULT_MODEL}
              variant="secondary"
              onSelectionChange={(key) => {
                if (key) {
                  const nextKey = String(key);

                  setModelValue(
                    nextKey === PROVIDER_DEFAULT_MODEL ? "" : nextKey,
                  );
                }
              }}
            >
              <Label>模型</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item
                    id={PROVIDER_DEFAULT_MODEL}
                    textValue="使用模型配置默认模型"
                  >
                    使用模型配置默认模型
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  {modelOptions.map((modelOption) => (
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
            </Select>
            {definition.id === "tts" ? (
              <Select
                fullWidth
                name={`${definition.id}_voice`}
                selectedKey={voiceId}
                variant="secondary"
                onSelectionChange={(key) => {
                  if (key) {
                    setVoiceId(String(key));
                  }
                }}
              >
                <Label>TTS 音色</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {mimoTtsVoiceOptions.map((voice) => (
                      <ListBox.Item
                        key={voice.value}
                        id={voice.value}
                        textValue={voice.label}
                      >
                        {voice.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            ) : null}
          </div>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Typography className="truncate" color="muted" type="body-sm">
              当前：{modelConfigurationDisplayName(selectedModelConfiguration)}{" "}
              · <span className="font-mono">{routeModel(route)}</span>
            </Typography>
            <Button
              isDisabled={!modelConfigurationId}
              isPending={isSaving}
              onPress={() => {
                onSave(
                  definition.id,
                  modelConfigurationId,
                  modelValue,
                  definition.id === "tts" ? voiceId : undefined,
                );
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </Widget.Content>
    </Widget>
  );
}

export function ModelConfigurationPage() {
  const [modelConfigName, setModelConfigName] = useState("");
  const [providerType, setProviderType] = useState(
    defaultModelProviderPreset.id,
  );
  const [model, setModel] = useState(defaultModelProviderPreset.defaultModel);
  const [selectedCapabilities, setSelectedCapabilities] = useState<
    ModelCapabilityId[]
  >(["chat"]);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [modelConfigurations, setModelConfigurations] = useState(
    INITIAL_MODEL_CONFIGURATIONS,
  );
  const [globalCapabilities, setGlobalCapabilities] =
    useState(INITIAL_CAPABILITIES);
  const [webSearchTool, setWebSearchTool] = useState(INITIAL_WEB_SEARCH_TOOL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingProvider, setIsDeletingProvider] = useState(false);
  const [isSearchSubmitting, setIsSearchSubmitting] = useState(false);
  const [savingCapabilityId, setSavingCapabilityId] = useState<
    ModelCapabilityId | ""
  >("");
  const [searchStrategy, setSearchStrategy] =
    useState<SearchToolConfigInput["strategy"]>("auto");
  const [searchProvider, setSearchProvider] = useState("bocha");
  const [bochaApiKey, setBochaApiKey] = useState("");
  const [qianfanApiKey, setQianfanApiKey] = useState("");
  const [zhipuApiKey, setZhipuApiKey] = useState("");
  const [qianfanApiBase, setQianfanApiBase] = useState("");
  const [zhipuApiBase, setZhipuApiBase] = useState("");
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
  const capabilitiesById = useMemo(() => {
    return new Map(
      globalCapabilities.map((route) => [route.capability, route]),
    );
  }, [globalCapabilities]);
  const activeModelConfigurations = useMemo(
    () => modelConfigurations.filter((item) => item.status === "active"),
    [modelConfigurations],
  );
  const configuredSearchProviders = new Set(
    webSearchTool.config_summary?.configured_providers ?? [],
  );
  const reusableSearchProviders = new Set(
    modelConfigurations
      .filter((modelConfiguration) => modelConfiguration.status === "active")
      .map((modelConfiguration) => modelConfiguration.provider_type),
  );

  function applyProviderPreset(providerId: string) {
    const nextProvider =
      modelProviderPresets.find((provider) => provider.id === providerId) ??
      defaultModelProviderPreset;
    const nextModels = providerPresetModels(nextProvider);

    setProviderType(nextProvider.id);
    setModel(nextModels[0] ?? "");
  }

  function resetProviderForm(providerId = defaultModelProviderPreset.id) {
    setEditingModelConfiguration(null);
    setModelConfigName("");
    applyProviderPreset(providerId);
    setSelectedCapabilities(["chat"]);
  }

  function resetSearchForm() {
    setSearchStrategy("auto");
    setSearchProvider("bocha");
    setBochaApiKey("");
    setQianfanApiKey("");
    setZhipuApiKey("");
    setQianfanApiBase("");
    setZhipuApiBase("");
  }

  function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProviderType = providerType;
    const nextName = modelConfigName.trim();
    const customModels = parseModelList(model);
    const nextModels = usesCustomProvider ? customModels : providerModelOptions;
    const nextModel = model.trim() || nextModels[0] || "";

    if (!nextName) {
      toast.danger("配置名称为必填项。");

      return;
    }

    if (!nextProviderType || !nextModel) {
      toast.danger("模型为必填项。");

      return;
    }

    if (selectedCapabilities.length === 0) {
      toast.danger("至少选择一个模型能力。");

      return;
    }

    setIsSubmitting(true);
    const nextModelConfiguration: ModelConfiguration = {
      capabilities: selectedCapabilities,
      id: editingModelConfiguration?.id ?? `model-${Date.now()}`,
      model: nextModel,
      models: nextModels,
      name: nextName,
      provider_type: nextProviderType,
      status: "active",
      tts_voice_id:
        nextProviderType === "mimo"
          ? editingModelConfiguration?.tts_voice_id
          : undefined,
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
    syncCapabilityRoutes(nextModelConfiguration);

    toast.success(
      editingModelConfiguration ? "模型配置已更新。" : "模型配置已创建。",
    );
    resetProviderForm();
    setIsProviderDialogOpen(false);
    setIsSubmitting(false);
  }

  function saveCapabilityRoute(
    capability: ModelCapabilityId,
    modelConfigurationId: string,
    modelOverride: string,
    ttsVoiceId?: string,
  ) {
    if (!modelConfigurationId) {
      toast.danger("请选择模型配置。");

      return;
    }

    const selectedModelConfiguration = modelConfigurations.find(
      (item) => item.id === modelConfigurationId,
    );

    if (!selectedModelConfiguration) {
      toast.danger("模型配置不存在。");

      return;
    }

    setSavingCapabilityId(capability);
    const nextRoute = createCapabilityRoute(
      capability,
      selectedModelConfiguration,
      modelOverride.trim() || selectedModelConfiguration.model,
      capability === "tts" ? ttsVoiceId : undefined,
    );

    setGlobalCapabilities((routes) => {
      const exists = routes.some((route) => route.capability === capability);

      if (!exists) return [...routes, nextRoute];

      return routes.map((route) =>
        route.capability === capability ? nextRoute : route,
      );
    });
    toast.success("模型能力配置已保存。");
    setSavingCapabilityId("");
  }

  function saveSearchConfig() {
    const config: SearchToolConfigInput = {
      provider: searchStrategy === "fixed" ? searchProvider : "",
      strategy: searchStrategy,
    };
    const nextConfiguredProviders = new Set(
      webSearchTool.config_summary?.configured_providers ?? [],
    );

    if (bochaApiKey.trim()) {
      config.bocha_api_key = bochaApiKey.trim();
      nextConfiguredProviders.add("bocha");
    }
    if (qianfanApiKey.trim()) {
      config.qianfan_api_key = qianfanApiKey.trim();
      nextConfiguredProviders.add("qianfan");
    }
    if (zhipuApiKey.trim()) {
      config.zhipu_api_key = zhipuApiKey.trim();
      nextConfiguredProviders.add("zhipu");
    }
    if (qianfanApiBase.trim()) {
      config.qianfan_api_base = qianfanApiBase.trim();
    }
    if (zhipuApiBase.trim()) {
      config.zhipu_api_base = zhipuApiBase.trim();
    }

    setIsSearchSubmitting(true);
    setWebSearchTool((tool) => ({
      ...tool,
      config_summary: {
        configured_providers: Array.from(nextConfiguredProviders),
        provider: config.provider ?? "",
        strategy: config.strategy ?? "auto",
      },
    }));
    toast.success("搜索能力配置已保存。");
    resetSearchForm();
    setIsSearchSubmitting(false);
  }

  function submitSearchConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveSearchConfig();
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
    setGlobalCapabilities((routes) =>
      routes.filter(
        (route) => route.provider_id !== editingModelConfiguration.id,
      ),
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

  function syncCapabilityRoutes(modelConfiguration: ModelConfiguration) {
    setGlobalCapabilities((routes) => {
      const routeMap = new Map(
        routes
          .filter(
            (route) =>
              route.provider_id !== modelConfiguration.id ||
              modelConfiguration.capabilities.includes(route.capability),
          )
          .map((route) => [route.capability, route]),
      );

      for (const capability of modelConfiguration.capabilities) {
        const existingRoute = routeMap.get(capability);
        const nextRoute = createCapabilityRoute(
          capability,
          modelConfiguration,
          existingRoute?.model || modelConfiguration.model,
          capability === "tts"
            ? existingRoute?.tts_voice_id || modelConfiguration.tts_voice_id
            : undefined,
        );

        routeMap.set(capability, nextRoute);
      }

      return Array.from(routeMap.values());
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Typography color="muted" type="body-sm">
        保存可用模型，并按模型能力配置默认路由。
      </Typography>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          className="border-border bg-surface cursor-[var(--cursor-interactive)] hover:bg-surface-hover flex min-h-20 items-center gap-3 rounded-lg border border-dashed px-3 text-left"
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
            className="bg-surface flex min-h-20 min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-3"
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

      <div className="grid gap-5 md:grid-cols-2">
        {modelCapabilityDefinitions.map((definition) => {
          const route = capabilitiesById.get(definition.id);

          return (
            <CapabilitySettingsPanel
              key={`${definition.id}-${route?.provider_id ?? "empty"}-${modelConfigurations.length}`}
              definition={definition}
              isSaving={savingCapabilityId === definition.id}
              modelConfigurations={activeModelConfigurations}
              route={route}
              onSave={saveCapabilityRoute}
            />
          );
        })}
      </div>

      <Widget>
        <Widget.Header>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Widget.Title>联网搜索</Widget.Title>
            <Typography className="truncate" color="muted" type="body-sm">
              实时网页检索能力，用于搜索工具。
            </Typography>
          </div>
          {webSearchTool.config_summary?.strategy === "fixed" &&
          webSearchTool.config_summary.provider ? (
            <Chip color="accent" size="sm" variant="soft">
              固定 {searchProviderLabel(webSearchTool.config_summary.provider)}
            </Chip>
          ) : (
            <Chip size="sm" variant="soft">
              自动选择
            </Chip>
          )}
        </Widget.Header>
        <Widget.Content>
          <Form onSubmit={submitSearchConfig}>
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  fullWidth
                  name="search_strategy"
                  selectedKey={searchStrategy || "auto"}
                  variant="secondary"
                  onSelectionChange={(key) => {
                    if (key) {
                      setSearchStrategy(
                        String(key) === "fixed" ? "fixed" : "auto",
                      );
                    }
                  }}
                >
                  <Label>策略</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {searchStrategyOptions.map((option) => (
                        <ListBox.Item
                          key={option.id}
                          id={option.id}
                          textValue={option.label}
                        >
                          {option.label}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                {searchStrategy === "fixed" ? (
                  <Select
                    fullWidth
                    name="search_provider"
                    selectedKey={searchProvider}
                    variant="secondary"
                    onSelectionChange={(key) => {
                      if (key) {
                        setSearchProvider(String(key));
                      }
                    }}
                  >
                    <Label>搜索厂商</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {searchProviderOptions.map((option) => (
                          <ListBox.Item
                            key={option.id}
                            id={option.id}
                            textValue={option.label}
                          >
                            {option.label}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {searchProviderOptions.map((option) => {
                  const isReady =
                    configuredSearchProviders.has(option.id) ||
                    (option.id !== "bocha" &&
                      reusableSearchProviders.has(option.id));

                  return (
                    <Chip
                      key={option.id}
                      color={isReady ? "success" : "default"}
                      size="sm"
                      variant="soft"
                    >
                      {option.label}
                    </Chip>
                  );
                })}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  fullWidth
                  name="bocha_api_key"
                  type="password"
                  value={bochaApiKey}
                  onChange={setBochaApiKey}
                >
                  <Label>博查 API Key</Label>
                  <Input placeholder="留空保持已有密钥" variant="secondary" />
                </TextField>
                <TextField
                  fullWidth
                  name="qianfan_api_key"
                  type="password"
                  value={qianfanApiKey}
                  onChange={setQianfanApiKey}
                >
                  <Label>千帆搜索专用 Key</Label>
                  <Input
                    placeholder="留空则复用千帆模型 Key"
                    variant="secondary"
                  />
                </TextField>
                <TextField
                  fullWidth
                  name="zhipu_api_key"
                  type="password"
                  value={zhipuApiKey}
                  onChange={setZhipuApiKey}
                >
                  <Label>智谱搜索专用 Key</Label>
                  <Input
                    placeholder="留空则复用智谱模型 Key"
                    variant="secondary"
                  />
                </TextField>
                <TextField
                  fullWidth
                  name="qianfan_api_base"
                  type="url"
                  value={qianfanApiBase}
                  onChange={setQianfanApiBase}
                >
                  <Label>千帆搜索 Base</Label>
                  <Input placeholder="留空则复用默认地址" variant="secondary" />
                </TextField>
                <TextField
                  fullWidth
                  name="zhipu_api_base"
                  type="url"
                  value={zhipuApiBase}
                  onChange={setZhipuApiBase}
                >
                  <Label>智谱搜索 Base</Label>
                  <Input placeholder="留空则复用默认地址" variant="secondary" />
                </TextField>
              </div>
              <div className="flex justify-end">
                <Button isPending={isSearchSubmitting} type="submit">
                  保存
                </Button>
              </div>
            </div>
          </Form>
        </Widget.Content>
      </Widget>

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
                  保存一个可复用模型，并声明它支持的能力。
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
  capabilities,
  id,
  model,
  name,
  provider_type,
  status = "active",
  tts_voice_id,
}: {
  capabilities: ModelCapabilityId[];
  id: string;
  model?: string;
  name: string;
  provider_type: string;
  status?: string;
  tts_voice_id?: string;
}): ModelConfiguration {
  const preset =
    modelProviderPresets.find((provider) => provider.id === provider_type) ??
    defaultModelProviderPreset;
  const models = providerPresetModels(preset);
  const nextModel = model || models[0] || preset.defaultModel;

  return {
    capabilities,
    id,
    model: nextModel,
    models,
    name,
    provider_type,
    status,
    tts_voice_id,
  };
}

function createCapabilityRoute(
  capability: ModelCapabilityId,
  modelConfiguration: ModelConfiguration,
  model = modelConfiguration.model,
  ttsVoiceId?: string,
): ModelCapabilityRoute {
  return {
    capability,
    model,
    models: modelConfiguration.models,
    provider_id: modelConfiguration.id,
    provider_name: modelConfiguration.name,
    provider_type: modelConfiguration.provider_type,
    status: modelConfiguration.status,
    tts_voice_id: ttsVoiceId,
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

function modelConfigurationDisplayName(
  modelConfiguration: ModelConfiguration | undefined,
) {
  if (!modelConfiguration) return "-";

  return modelConfiguration.name;
}

function routeModel(route: ModelCapabilityRoute | undefined) {
  return route?.model || "-";
}

function searchProviderLabel(provider: string) {
  return (
    searchProviderOptions.find((option) => option.id === provider)?.label ||
    provider ||
    "-"
  );
}
