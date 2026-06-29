"use client";

import type { FormEvent, ReactNode } from "react";

import {
  Button,
  Chip,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Switch,
  TextField,
  Tooltip,
  toast,
} from "@heroui/react";
import { Widget } from "@heroui-pro/react";
import { useMemo, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { ModelProviderLogo } from "@/components/model-provider-logo";

const DEFAULT_MODEL_CONTEXT_WINDOW = 50000;
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
  apiBase?: string;
  apiBasePlaceholder?: string;
  contextWindow?: number;
  requiresApiBase?: boolean;
};

type ModelProvider = {
  id: string;
  name: string;
  provider_type: string;
  model: string;
  models?: string[];
  api_base?: string;
  has_api_key?: boolean;
  tts_voice_id?: string;
  context_window: number;
  is_default: boolean;
  status: string;
  scope?: string;
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
    contextWindow: 1000000,
    defaultModel: "mimo-v2.5-pro\nmimo-v2.5\nmimo-v2.5-asr\nmimo-v2.5-tts",
    id: "mimo",
    label: "小米 MiMo",
  },
  {
    apiBasePlaceholder: "https://example.test/v1",
    defaultModel: "",
    id: "custom",
    label: "自定义 OpenAI 兼容",
    requiresApiBase: true,
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

const INITIAL_PROVIDERS: ModelProvider[] = [
  createStaticProvider({
    has_api_key: true,
    id: "provider-deepseek",
    is_default: true,
    provider_type: "deepseek",
  }),
  createStaticProvider({
    has_api_key: true,
    id: "provider-openai",
    provider_type: "openai",
  }),
  createStaticProvider({
    has_api_key: true,
    id: "provider-zhipu",
    provider_type: "zhipu",
  }),
  createStaticProvider({
    has_api_key: true,
    id: "provider-mimo",
    model: "mimo-v2.5-tts",
    provider_type: "mimo",
    tts_voice_id: "mimo_default",
  }),
  createStaticProvider({
    has_api_key: true,
    id: "provider-qianfan",
    provider_type: "qianfan",
  }),
];

const INITIAL_CAPABILITIES: ModelCapabilityRoute[] = [
  createCapabilityRoute("chat", INITIAL_PROVIDERS[0]),
  createCapabilityRoute("vision", INITIAL_PROVIDERS[1]),
  createCapabilityRoute("image", INITIAL_PROVIDERS[2], "glm-image"),
  createCapabilityRoute("asr", INITIAL_PROVIDERS[3], "mimo-v2.5-asr"),
  createCapabilityRoute(
    "tts",
    INITIAL_PROVIDERS[3],
    "mimo-v2.5-tts",
    "mimo_default",
  ),
  createCapabilityRoute("embedding", INITIAL_PROVIDERS[4]),
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
  providers,
  route,
  onSave,
}: {
  definition: CapabilityDefinition;
  isSaving: boolean;
  providers: ModelProvider[];
  route: ModelCapabilityRoute | undefined;
  onSave: (
    capability: ModelCapabilityId,
    providerId: string,
    model: string,
    ttsVoiceId?: string,
  ) => void;
}) {
  const initialProvider = route
    ? providers.find((provider) => provider.id === route.provider_id)
    : providers[0];
  const [providerId, setProviderId] = useState(initialProvider?.id ?? "");
  const [modelValue, setModelValue] = useState(
    route?.model || initialProvider?.model || "",
  );
  const [voiceId, setVoiceId] = useState(
    route?.tts_voice_id || initialProvider?.tts_voice_id || "mimo_default",
  );
  const selectedProvider = providerId
    ? providers.find((provider) => provider.id === providerId)
    : undefined;
  const savedProviderModels = selectedProvider?.models?.length
    ? selectedProvider.models
    : selectedProvider?.model
      ? [selectedProvider.model]
      : [];
  const presetProvider = selectedProvider
    ? modelProviderPresets.find(
        (provider) => provider.id === selectedProvider.provider_type,
      )
    : undefined;
  const providerModels = Array.from(
    new Set([
      ...savedProviderModels,
      ...(presetProvider ? providerPresetModels(presetProvider) : []),
    ]),
  );
  const modelOptions =
    modelValue && !providerModels.includes(modelValue)
      ? [modelValue, ...providerModels]
      : providerModels;
  const isConfigured = Boolean(route && selectedProvider?.status === "active");

  function handleProviderChange(nextProviderId: string) {
    const nextProvider = providers.find(
      (provider) => provider.id === nextProviderId,
    );

    setProviderId(nextProviderId);
    setModelValue(nextProvider?.model || "");
    setVoiceId(nextProvider?.tts_voice_id || "mimo_default");
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
              name={`${definition.id}_provider`}
              selectedKey={providerId}
              variant="secondary"
              onSelectionChange={(key) => {
                if (key) {
                  handleProviderChange(String(key));
                }
              }}
            >
              <Label>供应商</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {providers.map((provider) => (
                    <ListBox.Item
                      key={provider.id}
                      id={provider.id}
                      textValue={modelProviderLabel(provider.provider_type)}
                    >
                      {providerDisplayName(provider)}
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
                    textValue="使用供应商默认模型"
                  >
                    使用供应商默认模型
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
              当前：{providerDisplayName(selectedProvider)} ·{" "}
              <span className="font-mono">{routeModel(route)}</span>
            </Typography>
            <Button
              isDisabled={!providerId}
              isPending={isSaving}
              onPress={() => {
                onSave(
                  definition.id,
                  providerId,
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
  const [providerType, setProviderType] = useState(
    defaultModelProviderPreset.id,
  );
  const [model, setModel] = useState(defaultModelProviderPreset.defaultModel);
  const [apiBase, setApiBase] = useState(
    defaultModelProviderPreset.apiBase ?? "",
  );
  const [contextWindow, setContextWindow] = useState(
    String(DEFAULT_MODEL_CONTEXT_WINDOW),
  );
  const [apiKey, setApiKey] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [providerStatus, setProviderStatus] = useState("active");
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [globalProviders, setGlobalProviders] = useState(INITIAL_PROVIDERS);
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
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(
    null,
  );

  const selectedProvider =
    modelProviderPresets.find((provider) => provider.id === providerType) ??
    defaultModelProviderPreset;
  const providerDialogTitle = editingProvider ? "编辑模型配置" : "添加模型配置";
  const providerSubmitLabel = editingProvider ? "保存" : "创建全局配置";
  const providerModelOptions = useMemo(() => {
    const savedModels =
      editingProvider?.provider_type === providerType
        ? (editingProvider.models ?? [])
        : [];
    const presetModels = providerPresetModels(selectedProvider);
    const options = Array.from(new Set([...savedModels, ...presetModels]));
    const currentModel = model.trim();

    return currentModel && !options.includes(currentModel)
      ? [currentModel, ...options]
      : options;
  }, [editingProvider, model, providerType, selectedProvider]);
  const usesCustomProvider = selectedProvider.id === "custom";
  const capabilitiesById = useMemo(() => {
    return new Map(
      globalCapabilities.map((route) => [route.capability, route]),
    );
  }, [globalCapabilities]);
  const activeProviders = useMemo(
    () => globalProviders.filter((provider) => provider.status === "active"),
    [globalProviders],
  );
  const configuredSearchProviders = new Set(
    webSearchTool.config_summary?.configured_providers ?? [],
  );
  const reusableSearchProviders = new Set(
    globalProviders
      .filter(
        (provider) => provider.status === "active" && provider.has_api_key,
      )
      .map((provider) => provider.provider_type),
  );

  function applyProviderPreset(providerId: string) {
    const nextProvider =
      modelProviderPresets.find((provider) => provider.id === providerId) ??
      defaultModelProviderPreset;
    const nextModels = providerPresetModels(nextProvider);

    setProviderType(nextProvider.id);
    setModel(nextModels[0] ?? "");
    setApiBase(nextProvider.apiBase ?? "");
    setContextWindow(
      String(nextProvider.contextWindow ?? DEFAULT_MODEL_CONTEXT_WINDOW),
    );
  }

  function resetProviderForm(providerId = defaultModelProviderPreset.id) {
    setEditingProvider(null);
    applyProviderPreset(providerId);
    setApiKey("");
    setIsDefault(false);
    setProviderStatus("active");
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
    const customModels = parseModelList(model);
    const nextModels = usesCustomProvider ? customModels : providerModelOptions;
    const nextModel = model.trim() || nextModels[0] || "";
    const nextName =
      `${modelProviderLabel(nextProviderType)} ${nextModel}`.trim();
    const nextApiBase = apiBase.trim();
    const nextContextWindow = Number(contextWindow);

    if (!nextProviderType || !nextModel) {
      toast.danger("供应商和模型为必填项。");

      return;
    }

    if (selectedProvider.requiresApiBase && !nextApiBase) {
      toast.danger("自定义供应商必须填写 API 地址。");

      return;
    }

    if (!Number.isInteger(nextContextWindow) || nextContextWindow <= 0) {
      toast.danger("上下文窗口必须是正整数。");

      return;
    }

    setIsSubmitting(true);
    const nextProvider: ModelProvider = {
      api_base: nextApiBase || selectedProvider.apiBase,
      context_window: nextContextWindow,
      has_api_key: Boolean(apiKey.trim()) || editingProvider?.has_api_key,
      id: editingProvider?.id ?? `provider-${Date.now()}`,
      is_default: isDefault,
      model: nextModel,
      models: nextModels,
      name: editingProvider?.name || nextName,
      provider_type: nextProviderType,
      status: editingProvider ? providerStatus : "active",
      tts_voice_id:
        nextProviderType === "mimo" ? editingProvider?.tts_voice_id : undefined,
    };

    setGlobalProviders((providers) => {
      const nextProviders = editingProvider
        ? providers.map((provider) =>
            provider.id === editingProvider.id ? nextProvider : provider,
          )
        : [...providers, nextProvider];

      if (!isDefault) return nextProviders;

      return nextProviders.map((provider) => ({
        ...provider,
        is_default: provider.id === nextProvider.id,
      }));
    });

    toast.success(
      editingProvider ? "平台全局模型配置已更新。" : "平台全局模型配置已创建。",
    );
    resetProviderForm();
    setIsProviderDialogOpen(false);
    setIsSubmitting(false);
  }

  function saveCapabilityRoute(
    capability: ModelCapabilityId,
    providerId: string,
    modelOverride: string,
    ttsVoiceId?: string,
  ) {
    if (!providerId) {
      toast.danger("请选择供应商。");

      return;
    }

    const selectedRouteProvider = globalProviders.find(
      (provider) => provider.id === providerId,
    );

    if (!selectedRouteProvider) {
      toast.danger("供应商不存在。");

      return;
    }

    setSavingCapabilityId(capability);
    const nextRoute = createCapabilityRoute(
      capability,
      selectedRouteProvider,
      modelOverride.trim() || selectedRouteProvider.model,
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

  function openEditProviderDialog(provider: ModelProvider) {
    const nextProvider =
      modelProviderPresets.find((item) => item.id === provider.provider_type) ??
      defaultModelProviderPreset;

    setEditingProvider(provider);
    setProviderType(provider.provider_type || nextProvider.id);
    setModel(
      provider.model ||
        provider.models?.[0] ||
        providerPresetModels(nextProvider)[0] ||
        "",
    );
    setApiBase(provider.api_base ?? "");
    setContextWindow(
      String(provider.context_window ?? DEFAULT_MODEL_CONTEXT_WINDOW),
    );
    setApiKey("");
    setIsDefault(provider.is_default);
    setProviderStatus(provider.status || "active");
    setIsProviderDialogOpen(true);
  }

  function deleteProvider() {
    if (!editingProvider) return;
    if (
      !window.confirm(`删除“${providerDisplayName(editingProvider)}”模型配置？`)
    ) {
      return;
    }

    setIsDeletingProvider(true);
    setGlobalProviders((providers) =>
      providers.filter((provider) => provider.id !== editingProvider.id),
    );
    setGlobalCapabilities((routes) =>
      routes.filter((route) => route.provider_id !== editingProvider.id),
    );
    toast.success("模型配置已删除。");
    setIsProviderDialogOpen(false);
    resetProviderForm();
    setIsDeletingProvider(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Typography color="muted" type="body-sm">
        管理平台全局模型供应商，并按能力配置默认路由。
      </Typography>

      <div className="grid gap-3 md:grid-cols-3">
        <button
          className="border-border bg-surface cursor-[var(--cursor-interactive)] hover:bg-surface-hover flex h-16 items-center gap-3 rounded-lg border border-dashed px-3 text-left"
          type="button"
          onClick={() => openCreateProviderDialog()}
        >
          <AdminIcon
            className="text-muted-foreground size-4 shrink-0"
            name="plus"
          />
          <Typography className="truncate" type="body-sm" weight="medium">
            添加厂商
          </Typography>
        </button>
        {globalProviders.map((provider) => (
          <div
            key={provider.id}
            className="bg-surface flex h-16 min-w-0 items-center justify-between gap-3 rounded-lg px-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <ModelProviderLogo
                label={modelProviderLabel(provider.provider_type)}
                providerType={provider.provider_type}
              />
              <Typography className="truncate" type="body-sm" weight="medium">
                {modelProviderLabel(provider.provider_type)}
              </Typography>
            </div>
            <Tooltip>
              <Button
                isIconOnly
                aria-label="编辑模型配置"
                size="sm"
                variant="tertiary"
                onPress={() => openEditProviderDialog(provider)}
              >
                <AdminIcon className="size-4" name="edit" />
              </Button>
              <Tooltip.Content>编辑模型配置</Tooltip.Content>
            </Tooltip>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {modelCapabilityDefinitions.map((definition) => (
          <CapabilitySettingsPanel
            key={definition.id}
            definition={definition}
            isSaving={savingCapabilityId === definition.id}
            providers={activeProviders}
            route={capabilitiesById.get(definition.id)}
            onSave={saveCapabilityRoute}
          />
        ))}
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
                  配置平台全局模型服务。
                </Typography>
              </Modal.Header>
              <Modal.Body>
                <div className="grid gap-4">
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
                    <Label>模型供应商</Label>
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
                  <div className="grid gap-4 md:grid-cols-2">
                    {usesCustomProvider ? (
                      <TextField
                        fullWidth
                        isRequired
                        name="model"
                        value={model}
                        onChange={setModel}
                      >
                        <Label>模型</Label>
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
                        <Label>模型</Label>
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
                      isRequired
                      name="context_window"
                      type="number"
                      value={contextWindow}
                      onChange={setContextWindow}
                    >
                      <Label>上下文窗口</Label>
                      <Input
                        min="1"
                        placeholder={String(DEFAULT_MODEL_CONTEXT_WINDOW)}
                        step="1"
                        variant="secondary"
                      />
                      <FieldError />
                    </TextField>
                    <TextField
                      fullWidth
                      isRequired={selectedProvider.requiresApiBase}
                      name="api_base"
                      type="url"
                      value={apiBase}
                      onChange={setApiBase}
                    >
                      <Label>API 地址</Label>
                      <Input
                        placeholder={
                          selectedProvider.apiBasePlaceholder ??
                          selectedProvider.apiBase ??
                          "按供应商默认地址调用"
                        }
                        variant="secondary"
                      />
                      <FieldError />
                    </TextField>
                  </div>
                  <TextField
                    fullWidth
                    name="api_key"
                    type="password"
                    value={apiKey}
                    onChange={setApiKey}
                  >
                    <Label>API Key</Label>
                    <Input
                      placeholder={
                        editingProvider
                          ? "留空则保留当前 API Key"
                          : "仅保存到后端配置"
                      }
                      variant="secondary"
                    />
                  </TextField>
                  <div className="flex flex-wrap gap-4">
                    <Switch isSelected={isDefault} onChange={setIsDefault}>
                      <Switch.Content>
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                        设为默认
                      </Switch.Content>
                    </Switch>
                    {editingProvider ? (
                      <Switch
                        isSelected={providerStatus === "active"}
                        onChange={(selected) =>
                          setProviderStatus(selected ? "active" : "inactive")
                        }
                      >
                        <Switch.Content>
                          <Switch.Control>
                            <Switch.Thumb />
                          </Switch.Control>
                          启用
                        </Switch.Content>
                      </Switch>
                    ) : null}
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <div className="flex w-full items-center justify-between gap-3">
                  {editingProvider ? (
                    <Button
                      isPending={isDeletingProvider}
                      type="button"
                      variant="danger-soft"
                      onPress={deleteProvider}
                    >
                      <AdminIcon className="size-4" name="trash" />
                      删除供应商
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

function createStaticProvider({
  has_api_key,
  id,
  is_default = false,
  model,
  provider_type,
  status = "active",
  tts_voice_id,
}: {
  has_api_key?: boolean;
  id: string;
  is_default?: boolean;
  model?: string;
  provider_type: string;
  status?: string;
  tts_voice_id?: string;
}): ModelProvider {
  const preset =
    modelProviderPresets.find((provider) => provider.id === provider_type) ??
    defaultModelProviderPreset;
  const models = providerPresetModels(preset);
  const nextModel = model || models[0] || preset.defaultModel;

  return {
    api_base: preset.apiBase,
    context_window: preset.contextWindow ?? DEFAULT_MODEL_CONTEXT_WINDOW,
    has_api_key,
    id,
    is_default,
    model: nextModel,
    models,
    name: `${preset.label} ${nextModel}`.trim(),
    provider_type,
    status,
    tts_voice_id,
  };
}

function createCapabilityRoute(
  capability: ModelCapabilityId,
  provider: ModelProvider,
  model = provider.model,
  ttsVoiceId?: string,
): ModelCapabilityRoute {
  return {
    capability,
    model,
    models: provider.models,
    provider_id: provider.id,
    provider_name: provider.name,
    provider_type: provider.provider_type,
    status: provider.status,
    tts_voice_id: ttsVoiceId,
  };
}

function modelProviderLabel(providerType: string): string {
  return (
    modelProviderPresets.find((provider) => provider.id === providerType)
      ?.label ?? providerType
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

function providerDisplayName(provider: ModelProvider | undefined) {
  if (!provider) return "-";

  return modelProviderLabel(provider.provider_type);
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
