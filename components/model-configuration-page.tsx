"use client";

import type { FormEvent, ReactNode } from "react";

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Chip,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  TextField,
  Tooltip,
  toast,
} from "@heroui/react";
import { ActionBar } from "@heroui-pro/react";
import { useCallback, useEffect, useReducer, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { ModelProviderLogo } from "@/components/model-provider-logo";
import {
  createModel,
  deleteModel,
  listModelProviderCatalog,
  listModels,
  listOpenClawRPCInstances,
  type Model,
  type ModelProviderCatalogModel,
  type ModelProviderCatalogProvider,
  type OpenClawRPCInstance,
  type ReqModelCreate,
  type ReqModelUpdate,
  type SyncOpenClawModelsResult,
  syncModelsToOpenClaw,
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
  apiBase?: string;
  catalogModels?: ModelProviderCatalogModel[];
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

type ModelFormState = {
  billingUnit: string;
  cacheReadPricePerMillion: string;
  cacheWritePricePerMillion: string;
  currency: string;
  customProvider: string;
  inputPricePerMillion: string;
  model: string;
  modelConfigName: string;
  modelEnabled: boolean;
  openClawContextTokens: string;
  openClawContextWindow: string;
  openClawMaxTokens: string;
  openClawProviderApi: string;
  openClawProviderApiKeyRef: string;
  openClawProviderBaseUrl: string;
  openClawReasoning: boolean;
  openClawSyncProviderCatalog: boolean;
  outputPricePerMillion: string;
  providerType: string;
  selectedCapabilities: ModelCapabilityValue[];
  unitPriceAmount: string;
};

type ModelSyncDialogState = {
  changed: unknown[];
  error: string | null;
  instances: OpenClawRPCInstance[];
  isConfirming: boolean;
  isLoadingInstances: boolean;
  isOpen: boolean;
  isPreviewing: boolean;
  message: string;
  pluginId: string;
  result: SyncOpenClawModelsResult | null;
  syncProviderCatalog: boolean;
};

type ModelConfigurationPageState = {
  editingModelConfiguration: ModelConfiguration | null;
  form: ModelFormState;
  isDeletingProvider: boolean;
  isLoadingModels: boolean;
  isProviderDialogOpen: boolean;
  isSubmitting: boolean;
  loadError: string | null;
  modelConfigurations: ModelConfiguration[];
};

type ModelConfigurationPageAction =
  | {
      type: "capabilityToggled";
      capability: ModelCapabilityId;
      selected: boolean;
    }
  | { type: "deleteFinished" }
  | { type: "deleteStarted" }
  | { type: "dialogOpenChanged"; isOpen: boolean }
  | { type: "dialogSaveSucceeded" }
  | { type: "formPatched"; patch: Partial<ModelFormState> }
  | { type: "modelDeleted"; modelConfigurationId: string }
  | { type: "modelSaved"; modelConfiguration: ModelConfiguration }
  | { type: "modelsLoaded"; modelConfigurations: ModelConfiguration[] }
  | { type: "modelsLoadFailed"; error: string }
  | { type: "modelsLoading" }
  | { type: "openCreate"; apiBase?: string; providerId: string }
  | {
      type: "openEdit";
      form: ModelFormState;
      modelConfiguration: ModelConfiguration;
    }
  | { type: "providerChanged"; apiBase?: string; providerId: string }
  | { type: "submitFinished" }
  | { type: "submitStarted" };

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

const DEFAULT_MODEL_FORM: ModelFormState = {
  billingUnit: "token",
  cacheReadPricePerMillion: "",
  cacheWritePricePerMillion: "",
  currency: "CNY",
  customProvider: "",
  inputPricePerMillion: "",
  model: "",
  modelConfigName: "",
  modelEnabled: true,
  openClawContextTokens: "",
  openClawContextWindow: "",
  openClawMaxTokens: "",
  openClawProviderApi: "",
  openClawProviderApiKeyRef: "",
  openClawProviderBaseUrl: "",
  openClawReasoning: false,
  openClawSyncProviderCatalog: false,
  outputPricePerMillion: "",
  providerType: defaultModelProviderPreset.id,
  selectedCapabilities: ["chat"],
  unitPriceAmount: "",
};

const DEFAULT_MODEL_SYNC_DIALOG_STATE: ModelSyncDialogState = {
  changed: [],
  error: null,
  instances: [],
  isConfirming: false,
  isLoadingInstances: false,
  isOpen: false,
  isPreviewing: false,
  message: "",
  pluginId: "",
  result: null,
  syncProviderCatalog: false,
};

const INITIAL_MODEL_CONFIGURATION_PAGE_STATE: ModelConfigurationPageState = {
  editingModelConfiguration: null,
  form: DEFAULT_MODEL_FORM,
  isDeletingProvider: false,
  isLoadingModels: true,
  isProviderDialogOpen: false,
  isSubmitting: false,
  loadError: null,
  modelConfigurations: [],
};

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
  const [state, dispatch] = useReducer(
    modelConfigurationPageReducer,
    INITIAL_MODEL_CONFIGURATION_PAGE_STATE,
  );
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [providerCatalog, setProviderCatalog] = useState<
    ModelProviderCatalogProvider[]
  >([]);
  const [providerCatalogError, setProviderCatalogError] = useState<
    string | null
  >(null);
  const [syncDialogState, setSyncDialogState] = useState<ModelSyncDialogState>(
    DEFAULT_MODEL_SYNC_DIALOG_STATE,
  );
  const {
    editingModelConfiguration,
    form,
    isDeletingProvider,
    isLoadingModels,
    isProviderDialogOpen,
    isSubmitting,
    loadError,
    modelConfigurations,
  } = state;

  const providerPresets = getModelProviderPresets(providerCatalog);
  const selectedProvider =
    getModelProviderPreset(form.providerType, providerPresets) ??
    defaultModelProviderPreset;
  const usesCustomProvider = selectedProvider.id === "custom";
  const suggestedModel = providerPresetModels(selectedProvider)[0];
  const modelPlaceholder = suggestedModel
    ? `例如：${suggestedModel}`
    : "例如：gemini-2.5-pro";
  const selectedModels = modelConfigurations.filter(
    (modelConfiguration) =>
      modelConfiguration.recordId !== undefined &&
      selectedModelIds.includes(modelConfiguration.recordId),
  );

  const loadProviderCatalog = useCallback(async () => {
    try {
      const providers = await listModelProviderCatalog();

      setProviderCatalog(providers);
      setProviderCatalogError(null);
    } catch (error) {
      const message = getActionErrorMessage(error);

      setProviderCatalog([]);
      setProviderCatalogError(message);
      toast.danger(`Provider 目录加载失败：${message}`);
    }
  }, []);

  const loadModelConfigurations = useCallback(async () => {
    dispatch({ type: "modelsLoading" });

    try {
      const models = await listModels();

      dispatch({
        modelConfigurations: models.map(toModelConfiguration),
        type: "modelsLoaded",
      });
    } catch (error) {
      const message = getActionErrorMessage(error);

      dispatch({ error: message, type: "modelsLoadFailed" });
      toast.danger(`模型配置加载失败：${message}`);
    }
  }, []);

  useEffect(() => {
    void loadProviderCatalog();
  }, [loadProviderCatalog]);

  useEffect(() => {
    void loadModelConfigurations();
  }, [loadModelConfigurations]);

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = form.modelConfigName.trim();
    const modelReference = splitModelReference(
      form.model,
      usesCustomProvider ? "" : selectedProvider.id,
    );
    const nextProvider = usesCustomProvider
      ? form.customProvider.trim()
      : selectedProvider.id;
    const nextModel = modelReference.modelid;
    const nextBillingUnit = form.billingUnit.trim() || "token";
    const nextUnitPrice = form.unitPriceAmount.trim();
    const nextInputPrice = form.inputPricePerMillion.trim();
    const nextOutputPrice = form.outputPricePerMillion.trim();
    const nextCacheReadPrice = form.cacheReadPricePerMillion.trim();
    const nextCacheWritePrice = form.cacheWritePricePerMillion.trim();
    const nextCurrency = form.currency.trim();
    let nextOpenClawContextWindow: number | undefined;
    let nextOpenClawContextTokens: number | undefined;
    let nextOpenClawMaxTokens: number | undefined;
    const nextCapabilities = form.selectedCapabilities.flatMap((capability) => {
      const trimmedCapability = capability.trim();

      return trimmedCapability ? [trimmedCapability] : [];
    });

    try {
      nextOpenClawContextWindow = getOptionalTokenNumber(
        form.openClawContextWindow,
        "原生上下文窗口",
      );
      nextOpenClawContextTokens = getOptionalTokenNumber(
        form.openClawContextTokens,
        "运行上下文预算",
      );
      nextOpenClawMaxTokens = getOptionalTokenNumber(
        form.openClawMaxTokens,
        "最大输出 token",
      );
    } catch (error) {
      toast.danger(getActionErrorMessage(error));

      return;
    }

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

    if (!nextCurrency) {
      toast.danger("币种为必填项。");

      return;
    }

    if (nextCapabilities.length === 0) {
      toast.danger("至少选择一个模型能力。");

      return;
    }

    dispatch({ type: "submitStarted" });

    try {
      const request = buildModelRequest({
        capabilities: nextCapabilities,
        billingUnit: nextBillingUnit,
        cacheReadPricePerMillion: nextCacheReadPrice,
        cacheWritePricePerMillion: nextCacheWritePrice,
        currency: nextCurrency,
        displayName: nextName,
        enabled: form.modelEnabled,
        inputPricePerMillion: nextInputPrice,
        modelid: nextModel,
        openClawContextTokens: nextOpenClawContextTokens,
        openClawContextWindow: nextOpenClawContextWindow,
        openClawMaxTokens: nextOpenClawMaxTokens,
        openClawProviderApi: form.openClawProviderApi.trim(),
        openClawProviderApiKeyRef: form.openClawProviderApiKeyRef.trim(),
        openClawProviderBaseUrl: form.openClawProviderBaseUrl.trim(),
        openClawReasoning: form.openClawReasoning,
        openClawSyncProviderCatalog: form.openClawSyncProviderCatalog,
        outputPricePerMillion: nextOutputPrice,
        provider: nextProvider,
        unitPriceAmount: nextUnitPrice,
      });
      const savedModel = editingModelConfiguration?.recordId
        ? await updateModel({
            ...request,
            id: editingModelConfiguration.recordId,
          } satisfies ReqModelUpdate)
        : await createModel(request);

      if (savedModel) {
        const nextModelConfiguration = toModelConfiguration(savedModel);

        dispatch({
          modelConfiguration: nextModelConfiguration,
          type: "modelSaved",
        });
      } else {
        await loadModelConfigurations();
      }

      toast.success(
        editingModelConfiguration ? "模型配置已更新。" : "模型配置已创建。",
      );
      dispatch({ type: "dialogSaveSucceeded" });
    } catch (error) {
      toast.danger(`模型配置保存失败：${getActionErrorMessage(error)}`);
      dispatch({ type: "submitFinished" });
    }
  }

  function openCreateProviderDialog(
    providerId = providerPresets[0]?.id ?? defaultModelProviderPreset.id,
  ) {
    dispatch({
      apiBase: getProviderApiBase(providerId, providerPresets),
      providerId,
      type: "openCreate",
    });
  }

  function openEditProviderDialog(modelConfiguration: ModelConfiguration) {
    dispatch({
      form: getModelFormFromConfiguration(modelConfiguration, providerPresets),
      modelConfiguration,
      type: "openEdit",
    });
  }

  async function deleteProvider() {
    if (!editingModelConfiguration?.recordId) return;
    if (!window.confirm(`删除“${editingModelConfiguration.name}”模型配置？`)) {
      return;
    }

    dispatch({ type: "deleteStarted" });

    try {
      await deleteModel(editingModelConfiguration.recordId);
      toast.success("模型配置已删除。");
      dispatch({
        modelConfigurationId: editingModelConfiguration.id,
        type: "modelDeleted",
      });
      setSelectedModelIds((current) =>
        current.filter((id) => id !== editingModelConfiguration.recordId),
      );
    } catch (error) {
      toast.danger(`模型配置删除失败：${getActionErrorMessage(error)}`);
      dispatch({ type: "deleteFinished" });
    }
  }

  function toggleCapability(capability: ModelCapabilityId, selected: boolean) {
    dispatch({ capability, selected, type: "capabilityToggled" });
  }

  async function openSyncDialog() {
    if (selectedModelIds.length === 0) {
      toast.danger("请先选择要同步的模型。");

      return;
    }

    setSyncDialogState({
      ...DEFAULT_MODEL_SYNC_DIALOG_STATE,
      isLoadingInstances: true,
      isOpen: true,
    });

    try {
      const instances = await listOpenClawRPCInstances();
      const pluginId =
        instances.find((instance) => instance.pluginId?.trim())?.pluginId ?? "";

      setSyncDialogState((current) => ({
        ...current,
        error: pluginId ? null : "当前没有可用的 OpenClaw RPC 实例。",
        instances,
        isLoadingInstances: false,
        pluginId,
      }));
    } catch (error) {
      const message = getActionErrorMessage(error);

      setSyncDialogState((current) => ({
        ...current,
        error: message,
        isLoadingInstances: false,
      }));
      toast.danger(`OpenClaw 实例加载失败：${message}`);
    }
  }

  async function previewSync() {
    if (!syncDialogState.pluginId) {
      toast.danger("请选择目标 OpenClaw 实例。");

      return;
    }

    setSyncDialogState((current) => ({
      ...current,
      error: null,
      isPreviewing: true,
      result: null,
    }));

    try {
      const result = await syncModelsToOpenClaw({
        dryRun: true,
        modelIds: selectedModelIds,
        pluginId: syncDialogState.pluginId,
        syncProviderCatalog: syncDialogState.syncProviderCatalog,
      });

      setSyncDialogState((current) => ({
        ...current,
        changed: result?.changed ?? [],
        isPreviewing: false,
        message: result?.message ?? "",
        result: result ?? null,
      }));
    } catch (error) {
      const message = getActionErrorMessage(error);

      setSyncDialogState((current) => ({
        ...current,
        error: message,
        isPreviewing: false,
      }));
      toast.danger(`同步预演失败：${message}`);
    }
  }

  async function confirmSync() {
    if (!syncDialogState.pluginId || !syncDialogState.result) return;

    setSyncDialogState((current) => ({
      ...current,
      error: null,
      isConfirming: true,
    }));

    try {
      const result = await syncModelsToOpenClaw({
        dryRun: false,
        modelIds: selectedModelIds,
        pluginId: syncDialogState.pluginId,
        syncProviderCatalog: syncDialogState.syncProviderCatalog,
      });

      toast.success(
        result?.message ||
          "模型已同步到目标 OpenClaw 实例。若是新 provider，请确认目标 OpenClaw 运行环境已配置对应的 API key 环境变量。",
      );
      setSyncDialogState(DEFAULT_MODEL_SYNC_DIALOG_STATE);
    } catch (error) {
      const message = getActionErrorMessage(error);

      setSyncDialogState((current) => ({
        ...current,
        error: message,
        isConfirming: false,
      }));
      toast.danger(`模型同步失败：${message}`);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <ModelConfigurationGrid
        isLoadingModels={isLoadingModels}
        loadError={loadError}
        modelConfigurations={modelConfigurations}
        providerPresets={providerPresets}
        selectedModelIds={selectedModelIds}
        onCreate={() => openCreateProviderDialog()}
        onEdit={openEditProviderDialog}
        onReload={() => void loadModelConfigurations()}
        onSelectedModelIdsChange={setSelectedModelIds}
        onSelectionClear={() => setSelectedModelIds([])}
        onSync={() => void openSyncDialog()}
      />

      <ModelConfigurationDialog
        editingModelConfiguration={editingModelConfiguration}
        form={form}
        isDeletingProvider={isDeletingProvider}
        isOpen={isProviderDialogOpen}
        isSubmitting={isSubmitting}
        modelPlaceholder={modelPlaceholder}
        providerCatalogError={providerCatalogError}
        providerPresets={providerPresets}
        usesCustomProvider={usesCustomProvider}
        onCapabilityToggle={toggleCapability}
        onDelete={() => void deleteProvider()}
        onFormChange={(patch) => dispatch({ patch, type: "formPatched" })}
        onOpenChange={(isOpen) =>
          dispatch({ isOpen, type: "dialogOpenChanged" })
        }
        onProviderChange={(providerId) =>
          dispatch({
            apiBase: getProviderApiBase(providerId, providerPresets),
            providerId,
            type: "providerChanged",
          })
        }
        onSubmit={submitProvider}
      />

      <ModelSyncDialog
        selectedModels={selectedModels}
        state={syncDialogState}
        onConfirm={() => void confirmSync()}
        onOpenChange={(isOpen) =>
          setSyncDialogState((current) =>
            isOpen ? current : DEFAULT_MODEL_SYNC_DIALOG_STATE,
          )
        }
        onPreview={() => void previewSync()}
        onStateChange={setSyncDialogState}
      />
    </div>
  );
}

function ModelConfigurationGrid({
  isLoadingModels,
  loadError,
  modelConfigurations,
  onCreate,
  onEdit,
  onReload,
  onSelectedModelIdsChange,
  onSelectionClear,
  onSync,
  providerPresets,
  selectedModelIds,
}: {
  isLoadingModels: boolean;
  loadError: string | null;
  modelConfigurations: ModelConfiguration[];
  onCreate: () => void;
  onEdit: (modelConfiguration: ModelConfiguration) => void;
  onReload: () => void;
  onSelectedModelIdsChange: (modelIds: number[]) => void;
  onSelectionClear: () => void;
  onSync: () => void;
  providerPresets: ModelProviderPreset[];
  selectedModelIds: number[];
}) {
  const selectedModelKeys = selectedModelIds.map(String);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <button
          className="border-border bg-surface cursor-[var(--cursor-interactive)] hover:bg-surface-hover disabled:text-muted flex h-36 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-4 py-4 text-center disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoadingModels}
          type="button"
          onClick={onCreate}
        >
          <AdminIcon
            className="text-muted-foreground size-8 shrink-0"
            name="plus"
          />
          <Typography className="truncate" type="body-sm" weight="medium">
            添加模型
          </Typography>
        </button>
        <CheckboxGroup
          className="contents"
          name="model_selection"
          value={selectedModelKeys}
          variant="secondary"
          onChange={(values) =>
            onSelectedModelIdsChange(
              values
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value)),
            )
          }
        >
          {modelConfigurations.map((modelConfiguration) =>
            modelConfiguration.recordId !== undefined ? (
              <Checkbox
                key={modelConfiguration.id}
                aria-label={`选择 ${modelConfiguration.name}`}
                className="relative !m-0 min-w-0"
                value={String(modelConfiguration.recordId)}
                variant="secondary"
              >
                <Checkbox.Content className="group/card bg-surface hover:bg-surface-hover data-[selected=true]:bg-accent/10 grid h-36 w-full cursor-[var(--cursor-interactive)] grid-cols-[56px_minmax(0,1fr)] gap-4 overflow-hidden rounded-3xl px-4 py-4 pr-14 transition-colors">
                  <Checkbox.Control className="absolute right-3 top-3 z-10">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <ModelProviderLogo
                    label={modelProviderLabel(
                      modelConfiguration.provider_type,
                      providerPresets,
                    )}
                    providerType={modelConfiguration.provider_type}
                    size="lg"
                  />
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="min-w-0">
                      <Typography
                        className="block truncate"
                        type="body-sm"
                        weight="medium"
                      >
                        {modelConfiguration.name}
                      </Typography>
                      <Typography
                        className="block truncate"
                        color="muted"
                        type="body-xs"
                      >
                        {modelProviderLabel(
                          modelConfiguration.provider_type,
                          providerPresets,
                        )}{" "}
                        · {modelConfiguration.model || "未配置模型 ID"}
                      </Typography>
                    </div>
                    <div className="flex max-h-12 flex-wrap gap-1 overflow-hidden pr-8">
                      <Chip
                        color={
                          modelConfiguration.enabled ? "success" : "default"
                        }
                        size="sm"
                        variant="soft"
                      >
                        {modelConfiguration.enabled ? "已启用" : "已停用"}
                      </Chip>
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
                    </div>
                  </div>
                </Checkbox.Content>
                <Tooltip>
                  <Button
                    isIconOnly
                    aria-label="编辑模型配置"
                    className="absolute bottom-3 right-3 z-10"
                    size="sm"
                    type="button"
                    variant="tertiary"
                    onPress={() => onEdit(modelConfiguration)}
                  >
                    <AdminIcon className="size-4" name="edit" />
                  </Button>
                  <Tooltip.Content>编辑模型配置</Tooltip.Content>
                </Tooltip>
              </Checkbox>
            ) : (
              <div
                key={modelConfiguration.id}
                className="bg-surface flex h-36 min-w-0 items-center gap-4 overflow-hidden rounded-3xl px-4 py-4"
              >
                <ModelProviderLogo
                  label={modelProviderLabel(
                    modelConfiguration.provider_type,
                    providerPresets,
                  )}
                  providerType={modelConfiguration.provider_type}
                  size="lg"
                />
                <div className="flex min-w-0 flex-col gap-1">
                  <Typography
                    className="block truncate"
                    type="body-sm"
                    weight="medium"
                  >
                    {modelConfiguration.name}
                  </Typography>
                  <Typography className="truncate" color="muted" type="body-xs">
                    {modelProviderLabel(
                      modelConfiguration.provider_type,
                      providerPresets,
                    )}{" "}
                    · {modelConfiguration.model || "未配置模型 ID"}
                  </Typography>
                </div>
              </div>
            ),
          )}
        </CheckboxGroup>
      </div>

      <ActionBar aria-label="模型批量操作" isOpen={selectedModelIds.length > 0}>
        <ActionBar.Prefix>
          <Chip className="shrink-0 tabular-nums" size="sm">
            已选 {selectedModelIds.length}
          </Chip>
        </ActionBar.Prefix>
        <Separator orientation="vertical" />
        <ActionBar.Content>
          <Button
            aria-label="同步到 OpenClaw"
            isDisabled={isLoadingModels}
            size="sm"
            type="button"
            variant="ghost"
            onPress={onSync}
          >
            <AdminIcon className="size-4" name="model" />
            <span className="action-bar__label">同步到 OpenClaw</span>
          </Button>
        </ActionBar.Content>
        <Separator orientation="vertical" />
        <ActionBar.Suffix>
          <Button
            aria-label="清除选择"
            size="sm"
            type="button"
            variant="ghost"
            onPress={onSelectionClear}
          >
            清除选择
          </Button>
        </ActionBar.Suffix>
      </ActionBar>

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
            onPress={onReload}
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
    </>
  );
}

function ModelSyncDialog({
  onConfirm,
  onOpenChange,
  onPreview,
  onStateChange,
  selectedModels,
  state,
}: {
  onConfirm: () => void;
  onOpenChange: (isOpen: boolean) => void;
  onPreview: () => void;
  onStateChange: (
    update:
      | ModelSyncDialogState
      | ((current: ModelSyncDialogState) => ModelSyncDialogState),
  ) => void;
  selectedModels: ModelConfiguration[];
  state: ModelSyncDialogState;
}) {
  const canPreview =
    Boolean(state.pluginId) && !state.isLoadingInstances && !state.isPreviewing;
  const canConfirm =
    Boolean(state.result) && !state.isConfirming && !state.isPreviewing;

  return (
    <Modal.Backdrop
      isDismissable={!state.isConfirming && !state.isPreviewing}
      isKeyboardDismissDisabled={state.isConfirming || state.isPreviewing}
      isOpen={state.isOpen}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="auto" scroll="inside" size="lg">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>同步到 OpenClaw</Modal.Heading>
            <Typography color="muted" type="body-sm">
              这是预演结果，尚未写入 OpenClaw。请确认变更项后再正式同步。
            </Typography>
          </Modal.Header>
          <Modal.Body className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {selectedModels.map((model) => (
                <Chip key={model.id} size="sm" variant="soft">
                  {model.provider_type}/{model.model || model.name}
                </Chip>
              ))}
            </div>
            <Select
              fullWidth
              isRequired
              isDisabled={state.isLoadingInstances || state.isPreviewing}
              name="openclaw_plugin_id"
              selectedKey={state.pluginId}
              variant="secondary"
              onSelectionChange={(key) =>
                onStateChange((current) => ({
                  ...current,
                  pluginId: String(key ?? ""),
                  result: null,
                }))
              }
            >
              <Label>目标 OpenClaw 实例</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {state.instances.map((instance) => {
                    const pluginId = instance.pluginId?.trim() ?? "";

                    return pluginId ? (
                      <ListBox.Item
                        key={pluginId}
                        id={pluginId}
                        textValue={pluginId}
                      >
                        {pluginId}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ) : null;
                  })}
                </ListBox>
              </Select.Popover>
              <FieldError />
            </Select>
            <Checkbox
              isSelected={state.syncProviderCatalog}
              variant="secondary"
              onChange={(syncProviderCatalog) =>
                onStateChange((current) => ({
                  ...current,
                  result: null,
                  syncProviderCatalog,
                }))
              }
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                本次同步强制写入 provider catalog
              </Checkbox.Content>
            </Checkbox>
            {state.error ? (
              <div className="bg-danger-soft text-danger rounded-2xl px-3 py-2 text-sm">
                {state.error}
              </div>
            ) : null}
            {state.isLoadingInstances ? (
              <Typography color="muted" type="body-sm">
                正在加载 OpenClaw 实例...
              </Typography>
            ) : null}
            {state.result ? (
              <div className="border-border grid gap-3 rounded-3xl border px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip
                    color={
                      state.result.success === false ? "danger" : "success"
                    }
                    size="sm"
                    variant="soft"
                  >
                    {state.result.success === false ? "失败" : "成功"}
                  </Chip>
                  <Chip size="sm" variant="soft">
                    {state.result.dryRun === false ? "正式同步" : "预演"}
                  </Chip>
                </div>
                {state.message ? (
                  <Typography type="body-sm">{state.message}</Typography>
                ) : null}
                <div className="grid gap-2">
                  <Typography type="body-sm" weight="medium">
                    变更项
                  </Typography>
                  {state.changed.length > 0 ? (
                    <ul className="grid max-h-56 gap-2 overflow-auto pr-1 text-sm">
                      {state.changed.map((item, index) => (
                        <li
                          key={`${index}-${formatChangedItem(item)}`}
                          className="bg-muted/40 rounded-2xl px-3 py-2"
                        >
                          {formatChangedItem(item)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Typography color="muted" type="body-sm">
                      没有配置变更。
                    </Typography>
                  )}
                </div>
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Button
                isDisabled={state.isConfirming || state.isPreviewing}
                type="button"
                variant="secondary"
                onPress={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                isDisabled={!canPreview}
                isPending={state.isPreviewing}
                type="button"
                variant="secondary"
                onPress={onPreview}
              >
                预演同步
              </Button>
              <Button
                isDisabled={!canConfirm}
                isPending={state.isConfirming}
                type="button"
                onPress={onConfirm}
              >
                正式同步
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ModelConfigurationDialog({
  editingModelConfiguration,
  form,
  isDeletingProvider,
  isOpen,
  isSubmitting,
  modelPlaceholder,
  onCapabilityToggle,
  onDelete,
  onFormChange,
  onOpenChange,
  onProviderChange,
  onSubmit,
  providerCatalogError,
  providerPresets,
  usesCustomProvider,
}: {
  editingModelConfiguration: ModelConfiguration | null;
  form: ModelFormState;
  isDeletingProvider: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  modelPlaceholder: string;
  onCapabilityToggle: (
    capability: ModelCapabilityId,
    selected: boolean,
  ) => void;
  onDelete: () => void;
  onFormChange: (patch: Partial<ModelFormState>) => void;
  onOpenChange: (isOpen: boolean) => void;
  onProviderChange: (providerId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  providerCatalogError: string | null;
  providerPresets: ModelProviderPreset[];
  usesCustomProvider: boolean;
}) {
  const providerDialogTitle = editingModelConfiguration
    ? "编辑模型配置"
    : "添加模型配置";
  const providerSubmitLabel = editingModelConfiguration ? "保存" : "创建模型";

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="auto" scroll="inside" size="lg">
        <Modal.Dialog className="flex max-h-[calc(100dvh-5rem)] flex-col overflow-hidden">
          <Modal.CloseTrigger />
          <Form
            className="flex min-h-0 min-w-0 flex-1 flex-col"
            onSubmit={onSubmit}
          >
            <Modal.Header className="shrink-0">
              <Modal.Heading>{providerDialogTitle}</Modal.Heading>
              <Typography color="muted" type="body-sm">
                配置模型服务和可用能力。
              </Typography>
            </Modal.Header>
            <Modal.Body className="min-h-0 flex-1 overflow-y-auto">
              <ModelConfigurationFields
                form={form}
                modelPlaceholder={modelPlaceholder}
                providerCatalogError={providerCatalogError}
                providerPresets={providerPresets}
                usesCustomProvider={usesCustomProvider}
                onCapabilityToggle={onCapabilityToggle}
                onFormChange={onFormChange}
                onProviderChange={onProviderChange}
              />
            </Modal.Body>
            <Modal.Footer className="shrink-0">
              <ModelConfigurationDialogFooter
                editingModelConfiguration={editingModelConfiguration}
                isDeletingProvider={isDeletingProvider}
                isSubmitting={isSubmitting}
                providerSubmitLabel={providerSubmitLabel}
                onCancel={() => onOpenChange(false)}
                onDelete={onDelete}
              />
            </Modal.Footer>
          </Form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

function ModelConfigurationFields({
  form,
  modelPlaceholder,
  onCapabilityToggle,
  onFormChange,
  onProviderChange,
  providerCatalogError,
  providerPresets,
  usesCustomProvider,
}: {
  form: ModelFormState;
  modelPlaceholder: string;
  onCapabilityToggle: (
    capability: ModelCapabilityId,
    selected: boolean,
  ) => void;
  onFormChange: (patch: Partial<ModelFormState>) => void;
  onProviderChange: (providerId: string) => void;
  providerCatalogError: string | null;
  providerPresets: ModelProviderPreset[];
  usesCustomProvider: boolean;
}) {
  const selectedProvider =
    getModelProviderPreset(form.providerType, providerPresets) ??
    defaultModelProviderPreset;
  const catalogModels = selectedProvider.catalogModels ?? [];
  const selectedCatalogModelKey = getSelectedCatalogModelKey(
    form.model,
    selectedProvider.id,
    catalogModels,
  );

  return (
    <div className="grid gap-4">
      <TextField
        fullWidth
        isRequired
        name="model_config_name"
        value={form.modelConfigName}
        onChange={(value) => onFormChange({ modelConfigName: value })}
      >
        <Label>配置名称</Label>
        <Input placeholder="例如：默认主模型" variant="secondary" />
        <FieldError />
      </TextField>
      <Select
        fullWidth
        isRequired
        name="provider_type"
        selectedKey={form.providerType}
        variant="secondary"
        onSelectionChange={(key) => {
          if (key) {
            onProviderChange(String(key));
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
            {providerPresets.map((provider) => (
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
        {providerCatalogError ? (
          <Description>
            Provider 目录加载失败，当前使用本地兜底选项。
          </Description>
        ) : null}
        <FieldError />
      </Select>
      {usesCustomProvider ? (
        <TextField
          fullWidth
          isRequired
          name="provider"
          value={form.customProvider}
          onChange={(value) => onFormChange({ customProvider: value })}
        >
          <Label>供应商标识</Label>
          <Input placeholder="例如：google" variant="secondary" />
          <FieldError />
        </TextField>
      ) : null}
      {catalogModels.length > 0 ? (
        <Select
          fullWidth
          name="official_model"
          selectedKey={selectedCatalogModelKey}
          variant="secondary"
          onSelectionChange={(key) => {
            const model = String(key ?? "");

            if (model) {
              onFormChange({ model });
            }
          }}
        >
          <Label>官方模型</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {catalogModels.map((model) => {
                const modelId = model.model ?? "";

                return (
                  <ListBox.Item
                    key={modelId}
                    id={modelId}
                    textValue={model.name || modelId}
                  >
                    {model.name || modelId}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                );
              })}
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}
      <TextField
        fullWidth
        isRequired
        name="model"
        value={form.model}
        onChange={(value) => onFormChange({ model: value })}
      >
        <Label>模型 ID</Label>
        <Input placeholder={modelPlaceholder} variant="secondary" />
        <FieldError />
      </TextField>
      <ModelPricingFields form={form} onFormChange={onFormChange} />
      <ModelCapabilityFields
        selectedCapabilities={form.selectedCapabilities}
        onCapabilityToggle={onCapabilityToggle}
      />
      <OpenClawConfigurationFields form={form} onFormChange={onFormChange} />
    </div>
  );
}

function ModelPricingFields({
  form,
  onFormChange,
}: {
  form: ModelFormState;
  onFormChange: (patch: Partial<ModelFormState>) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        fullWidth
        isRequired
        name="currency"
        value={form.currency}
        onChange={(value) => onFormChange({ currency: value })}
      >
        <Label>币种</Label>
        <Input placeholder="例如：CNY" variant="secondary" />
        <FieldError />
      </TextField>
      <Select
        fullWidth
        className="min-w-0"
        name="enabled"
        selectedKey={form.modelEnabled ? "enabled" : "disabled"}
        variant="secondary"
        onSelectionChange={(key) =>
          onFormChange({ modelEnabled: key === "enabled" })
        }
      >
        <Label>状态</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="enabled" textValue="启用">
              启用
            </ListBox.Item>
            <ListBox.Item id="disabled" textValue="停用">
              停用
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      <Select
        fullWidth
        className="min-w-0"
        name="billing_unit"
        selectedKey={form.billingUnit}
        variant="secondary"
        onSelectionChange={(key) =>
          onFormChange({ billingUnit: String(key || "token") })
        }
      >
        <Label>计费单位</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="token" textValue="token">
              token
            </ListBox.Item>
            <ListBox.Item id="image" textValue="image">
              image
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      <TextField
        fullWidth
        name="unit_price_amount"
        value={form.unitPriceAmount}
        onChange={(value) => onFormChange({ unitPriceAmount: value })}
      >
        <Label>单价 / 次数单位</Label>
        <Input inputMode="decimal" variant="secondary" />
        <FieldError />
      </TextField>
      <TextField
        fullWidth
        name="input_price_per_million"
        value={form.inputPricePerMillion}
        onChange={(value) => onFormChange({ inputPricePerMillion: value })}
      >
        <Label>输入价格 / 百万 token</Label>
        <Input inputMode="decimal" variant="secondary" />
        <FieldError />
      </TextField>
      <TextField
        fullWidth
        name="output_price_per_million"
        value={form.outputPricePerMillion}
        onChange={(value) => onFormChange({ outputPricePerMillion: value })}
      >
        <Label>输出价格 / 百万 token</Label>
        <Input inputMode="decimal" variant="secondary" />
        <FieldError />
      </TextField>
      <TextField
        fullWidth
        name="cache_read_price_per_million"
        value={form.cacheReadPricePerMillion}
        onChange={(value) => onFormChange({ cacheReadPricePerMillion: value })}
      >
        <Label>缓存读取价格 / 百万 token</Label>
        <Input inputMode="decimal" variant="secondary" />
        <FieldError />
      </TextField>
      <TextField
        fullWidth
        name="cache_write_price_per_million"
        value={form.cacheWritePricePerMillion}
        onChange={(value) => onFormChange({ cacheWritePricePerMillion: value })}
      >
        <Label>缓存写入价格 / 百万 token</Label>
        <Input inputMode="decimal" variant="secondary" />
        <FieldError />
      </TextField>
    </div>
  );
}

function ModelCapabilityFields({
  onCapabilityToggle,
  selectedCapabilities,
}: {
  onCapabilityToggle: (
    capability: ModelCapabilityId,
    selected: boolean,
  ) => void;
  selectedCapabilities: ModelCapabilityValue[];
}) {
  return (
    <div className="grid gap-2">
      <Label>模型能力</Label>
      <div className="grid gap-2 md:grid-cols-2">
        {modelCapabilityDefinitions.map((definition) => (
          <Checkbox
            key={definition.id}
            isSelected={selectedCapabilities.includes(definition.id)}
            variant="secondary"
            onChange={(selected) => onCapabilityToggle(definition.id, selected)}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              {definition.label}
            </Checkbox.Content>
            <Description>{definition.description}</Description>
          </Checkbox>
        ))}
      </div>
    </div>
  );
}

function OpenClawConfigurationFields({
  form,
  onFormChange,
}: {
  form: ModelFormState;
  onFormChange: (patch: Partial<ModelFormState>) => void;
}) {
  return (
    <details className="border-border rounded-3xl border px-4 py-3">
      <summary className="cursor-[var(--cursor-interactive)] text-sm font-medium">
        OpenClaw 配置
      </summary>
      <div className="mt-4 grid gap-4">
        <Typography className="block" color="muted" type="body-sm">
          官方 provider 通常只需要同步到 OpenClaw 模型 allowlist，不需要填写
          OpenClaw provider catalog 配置。
        </Typography>
        <Typography className="block" color="muted" type="body-sm">
          自定义 provider、OpenAI-compatible 代理或本地模型服务需要开启「同步
          provider catalog」，并填写 API 地址、协议适配器和密钥环境变量引用。
        </Typography>
        <Checkbox
          isSelected={form.openClawSyncProviderCatalog}
          variant="secondary"
          onChange={(openClawSyncProviderCatalog) =>
            onFormChange({ openClawSyncProviderCatalog })
          }
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            同步 provider catalog
          </Checkbox.Content>
        </Checkbox>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            fullWidth
            name="openclaw_provider_base_url"
            value={form.openClawProviderBaseUrl}
            onChange={(openClawProviderBaseUrl) =>
              onFormChange({ openClawProviderBaseUrl })
            }
          >
            <Label>API 基础地址</Label>
            <Input
              placeholder="https://api.example.com/v1"
              variant="secondary"
            />
            <FieldError />
          </TextField>
          <TextField
            fullWidth
            name="openclaw_provider_api"
            value={form.openClawProviderApi}
            onChange={(openClawProviderApi) =>
              onFormChange({ openClawProviderApi })
            }
          >
            <Label>协议适配器</Label>
            <Input placeholder="openai-completions" variant="secondary" />
            <FieldError />
          </TextField>
          <TextField
            fullWidth
            name="openclaw_provider_api_key_ref"
            value={form.openClawProviderApiKeyRef}
            onChange={(openClawProviderApiKeyRef) =>
              onFormChange({ openClawProviderApiKeyRef })
            }
          >
            <Label>API key 环境变量引用</Label>
            <Input placeholder="${CUSTOM_API_KEY}" variant="secondary" />
            <FieldError />
          </TextField>
          <TextField
            fullWidth
            name="openclaw_context_window"
            value={form.openClawContextWindow}
            onChange={(openClawContextWindow) =>
              onFormChange({ openClawContextWindow })
            }
          >
            <Label>原生上下文窗口</Label>
            <Input
              inputMode="numeric"
              placeholder="128000"
              variant="secondary"
            />
            <FieldError />
          </TextField>
          <TextField
            fullWidth
            name="openclaw_context_tokens"
            value={form.openClawContextTokens}
            onChange={(openClawContextTokens) =>
              onFormChange({ openClawContextTokens })
            }
          >
            <Label>运行上下文预算</Label>
            <Input
              inputMode="numeric"
              placeholder="96000"
              variant="secondary"
            />
            <FieldError />
          </TextField>
          <TextField
            fullWidth
            name="openclaw_max_tokens"
            value={form.openClawMaxTokens}
            onChange={(openClawMaxTokens) =>
              onFormChange({ openClawMaxTokens })
            }
          >
            <Label>最大输出 token</Label>
            <Input inputMode="numeric" placeholder="8192" variant="secondary" />
            <FieldError />
          </TextField>
        </div>
        <Checkbox
          isSelected={form.openClawReasoning}
          variant="secondary"
          onChange={(openClawReasoning) => onFormChange({ openClawReasoning })}
        >
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            支持 thinking/reasoning 控制
          </Checkbox.Content>
        </Checkbox>
      </div>
    </details>
  );
}

function ModelConfigurationDialogFooter({
  editingModelConfiguration,
  isDeletingProvider,
  isSubmitting,
  onCancel,
  onDelete,
  providerSubmitLabel,
}: {
  editingModelConfiguration: ModelConfiguration | null;
  isDeletingProvider: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onDelete: () => void;
  providerSubmitLabel: string;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      {editingModelConfiguration ? (
        <Button
          isDisabled={!editingModelConfiguration.recordId}
          isPending={isDeletingProvider}
          type="button"
          variant="danger-soft"
          onPress={onDelete}
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
          onPress={onCancel}
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
  );
}

function modelConfigurationPageReducer(
  state: ModelConfigurationPageState,
  action: ModelConfigurationPageAction,
): ModelConfigurationPageState {
  switch (action.type) {
    case "capabilityToggled": {
      const selectedCapabilities = action.selected
        ? addCapability(state.form.selectedCapabilities, action.capability)
        : state.form.selectedCapabilities.filter(
            (item) => item !== action.capability,
          );

      return {
        ...state,
        form: {
          ...state.form,
          selectedCapabilities,
        },
      };
    }
    case "deleteFinished":
      return {
        ...state,
        isDeletingProvider: false,
      };
    case "deleteStarted":
      return {
        ...state,
        isDeletingProvider: true,
      };
    case "dialogOpenChanged":
      if (action.isOpen || state.isSubmitting) {
        return {
          ...state,
          isProviderDialogOpen: action.isOpen,
        };
      }

      return {
        ...state,
        editingModelConfiguration: null,
        form: getDefaultModelForm(),
        isProviderDialogOpen: false,
      };
    case "dialogSaveSucceeded":
      return {
        ...state,
        editingModelConfiguration: null,
        form: getDefaultModelForm(),
        isProviderDialogOpen: false,
        isSubmitting: false,
      };
    case "formPatched":
      return {
        ...state,
        form: {
          ...state.form,
          ...action.patch,
        },
      };
    case "modelDeleted":
      return {
        ...state,
        editingModelConfiguration: null,
        form: getDefaultModelForm(),
        isDeletingProvider: false,
        isProviderDialogOpen: false,
        modelConfigurations: state.modelConfigurations.filter(
          (item) => item.id !== action.modelConfigurationId,
        ),
      };
    case "modelSaved":
      return {
        ...state,
        modelConfigurations: state.editingModelConfiguration
          ? state.modelConfigurations.map((item) =>
              item.id === state.editingModelConfiguration?.id
                ? action.modelConfiguration
                : item,
            )
          : [action.modelConfiguration, ...state.modelConfigurations],
      };
    case "modelsLoaded":
      return {
        ...state,
        isLoadingModels: false,
        loadError: null,
        modelConfigurations: action.modelConfigurations,
      };
    case "modelsLoadFailed":
      return {
        ...state,
        isLoadingModels: false,
        loadError: action.error,
        modelConfigurations: [],
      };
    case "modelsLoading":
      return {
        ...state,
        isLoadingModels: true,
        loadError: null,
      };
    case "openCreate":
      return {
        ...state,
        editingModelConfiguration: null,
        form: getDefaultModelForm(action.providerId, action.apiBase),
        isProviderDialogOpen: true,
      };
    case "openEdit":
      return {
        ...state,
        editingModelConfiguration: action.modelConfiguration,
        form: action.form,
        isProviderDialogOpen: true,
      };
    case "providerChanged":
      return {
        ...state,
        form: {
          ...state.form,
          customProvider: "",
          model: "",
          openClawProviderBaseUrl: action.apiBase ?? "",
          providerType: action.providerId,
        },
      };
    case "submitFinished":
      return {
        ...state,
        isSubmitting: false,
      };
    case "submitStarted":
      return {
        ...state,
        isSubmitting: true,
      };
  }
}

function addCapability(
  capabilities: ModelCapabilityValue[],
  capability: ModelCapabilityId,
) {
  return capabilities.includes(capability)
    ? capabilities
    : [...capabilities, capability];
}

function getDefaultModelForm(
  providerId = defaultModelProviderPreset.id,
  apiBase = "",
): ModelFormState {
  return {
    ...DEFAULT_MODEL_FORM,
    openClawProviderBaseUrl: apiBase,
    providerType: providerId,
  };
}

function getModelFormFromConfiguration(
  modelConfiguration: ModelConfiguration,
  providerPresets = modelProviderPresets,
): ModelFormState {
  const nextProvider = providerPresets.find(
    (item) => item.id === modelConfiguration.provider_type,
  );

  return {
    billingUnit: modelConfiguration.record?.billingUnit?.trim() || "token",
    cacheReadPricePerMillion:
      modelConfiguration.record?.cacheReadPricePerMillion?.trim() ?? "",
    cacheWritePricePerMillion:
      modelConfiguration.record?.cacheWritePricePerMillion?.trim() ?? "",
    currency: modelConfiguration.record?.currency?.trim() || "CNY",
    customProvider: nextProvider ? "" : modelConfiguration.provider_type,
    inputPricePerMillion:
      modelConfiguration.record?.inputPricePerMillion?.trim() ?? "",
    model: modelConfiguration.model || modelConfiguration.models?.[0] || "",
    modelConfigName: modelConfiguration.name,
    modelEnabled: modelConfiguration.enabled,
    openClawContextTokens: optionalNumberToString(
      modelConfiguration.record?.openClawContextTokens,
    ),
    openClawContextWindow: optionalNumberToString(
      modelConfiguration.record?.openClawContextWindow,
    ),
    openClawMaxTokens: optionalNumberToString(
      modelConfiguration.record?.openClawMaxTokens,
    ),
    openClawProviderApi:
      modelConfiguration.record?.openClawProviderApi?.trim() ?? "",
    openClawProviderApiKeyRef:
      modelConfiguration.record?.openClawProviderApiKeyRef?.trim() ?? "",
    openClawProviderBaseUrl:
      modelConfiguration.record?.openClawProviderBaseUrl?.trim() ?? "",
    openClawReasoning: Boolean(modelConfiguration.record?.openClawReasoning),
    openClawSyncProviderCatalog: Boolean(
      modelConfiguration.record?.openClawSyncProviderCatalog,
    ),
    outputPricePerMillion:
      modelConfiguration.record?.outputPricePerMillion?.trim() ?? "",
    providerType: nextProvider?.id ?? "custom",
    selectedCapabilities: modelConfiguration.capabilities,
    unitPriceAmount: modelConfiguration.record?.unitPriceAmount?.trim() ?? "",
  };
}

function getModelProviderPreset(
  providerId: string,
  providerPresets = modelProviderPresets,
) {
  return providerPresets.find((provider) => provider.id === providerId);
}

function buildModelRequest({
  capabilities,
  billingUnit,
  cacheReadPricePerMillion,
  cacheWritePricePerMillion,
  currency,
  displayName,
  enabled,
  inputPricePerMillion,
  modelid,
  openClawContextTokens,
  openClawContextWindow,
  openClawMaxTokens,
  openClawProviderApi,
  openClawProviderApiKeyRef,
  openClawProviderBaseUrl,
  openClawReasoning,
  openClawSyncProviderCatalog,
  outputPricePerMillion,
  provider,
  unitPriceAmount,
}: {
  capabilities: string[];
  billingUnit: string;
  cacheReadPricePerMillion: string;
  cacheWritePricePerMillion: string;
  currency: string;
  displayName: string;
  enabled: boolean;
  inputPricePerMillion: string;
  modelid: string;
  openClawContextTokens?: number;
  openClawContextWindow?: number;
  openClawMaxTokens?: number;
  openClawProviderApi: string;
  openClawProviderApiKeyRef: string;
  openClawProviderBaseUrl: string;
  openClawReasoning: boolean;
  openClawSyncProviderCatalog: boolean;
  outputPricePerMillion: string;
  provider: string;
  unitPriceAmount: string;
}): ReqModelCreate {
  const request: ReqModelCreate = {
    capabilities,
    billingUnit,
    displayName,
    currency,
    enabled,
    modelid,
    openClawReasoning,
    openClawSyncProviderCatalog,
    provider,
  };

  if (cacheReadPricePerMillion) {
    request.cacheReadPricePerMillion = cacheReadPricePerMillion;
  }
  if (cacheWritePricePerMillion) {
    request.cacheWritePricePerMillion = cacheWritePricePerMillion;
  }
  if (inputPricePerMillion) {
    request.inputPricePerMillion = inputPricePerMillion;
  }
  if (outputPricePerMillion) {
    request.outputPricePerMillion = outputPricePerMillion;
  }
  if (unitPriceAmount) {
    request.unitPriceAmount = unitPriceAmount;
  }
  if (openClawContextTokens !== undefined) {
    request.openClawContextTokens = openClawContextTokens;
  }
  if (openClawContextWindow !== undefined) {
    request.openClawContextWindow = openClawContextWindow;
  }
  if (openClawMaxTokens !== undefined) {
    request.openClawMaxTokens = openClawMaxTokens;
  }
  if (openClawProviderApi) {
    request.openClawProviderApi = openClawProviderApi;
  }
  if (openClawProviderApiKeyRef) {
    request.openClawProviderApiKeyRef = openClawProviderApiKeyRef;
  }
  if (openClawProviderBaseUrl) {
    request.openClawProviderBaseUrl = openClawProviderBaseUrl;
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

function getModelProviderPresets(
  providerCatalog: ModelProviderCatalogProvider[],
): ModelProviderPreset[] {
  const customPreset =
    modelProviderPresets.find((provider) => provider.id === "custom") ??
    defaultModelProviderPreset;
  const presets = modelProviderPresets
    .filter((provider) => provider.id !== "custom")
    .map((provider) => ({ ...provider }));
  const presetById = new Map(
    presets.map((provider) => [provider.id, provider]),
  );

  for (const catalogProvider of providerCatalog) {
    const id = normalizeText(catalogProvider.provider);
    const catalogModels = normalizeCatalogModels(catalogProvider.models);
    const existing = presetById.get(id);

    if (!id) continue;

    const nextPreset: ModelProviderPreset = {
      apiBase: normalizeText(catalogProvider.api_base),
      catalogModels,
      defaultModel:
        catalogModels
          .map((model) => model.model)
          .filter(Boolean)
          .join("\n") ||
        existing?.defaultModel ||
        "",
      id,
      label: normalizeText(catalogProvider.name) || existing?.label || id,
    };

    if (existing) {
      Object.assign(existing, nextPreset);
    } else {
      presets.push(nextPreset);
      presetById.set(id, nextPreset);
    }
  }

  return [...presets, customPreset];
}

function normalizeCatalogModels(
  models?: ModelProviderCatalogModel[],
): ModelProviderCatalogModel[] {
  const values: ModelProviderCatalogModel[] = [];
  const seen = new Set<string>();

  for (const model of models ?? []) {
    const modelId = normalizeText(model.model);

    if (!modelId || seen.has(modelId)) continue;
    seen.add(modelId);
    values.push({
      ...model,
      model: modelId,
      name: normalizeText(model.name) || modelId,
    });
  }

  return values;
}

function getProviderApiBase(
  providerId: string,
  providerPresets: ModelProviderPreset[],
) {
  return normalizeText(
    getModelProviderPreset(providerId, providerPresets)?.apiBase,
  );
}

function getSelectedCatalogModelKey(
  value: string,
  providerId: string,
  models: ModelProviderCatalogModel[],
) {
  const modelReference = normalizeText(value);

  if (!modelReference) return null;

  const normalizedModel = splitModelReference(
    modelReference,
    providerId,
  ).modelid;

  return (
    models.find((model) => {
      const catalogModel = normalizeText(model.model);

      return (
        catalogModel === modelReference ||
        splitModelReference(catalogModel, providerId).modelid ===
          normalizedModel
      );
    })?.model ?? null
  );
}

function splitModelReference(value: string, providerId: string) {
  const modelReference = normalizeText(value);
  const providerPrefix = `${providerId}/`;

  if (providerId && modelReference.startsWith(providerPrefix)) {
    return { modelid: modelReference.slice(providerPrefix.length) };
  }

  return { modelid: modelReference };
}

function modelProviderLabel(
  providerType: string,
  providerPresets = modelProviderPresets,
): string {
  return (
    providerPresets.find((provider) => provider.id === providerType)?.label ??
    providerType
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

function getOptionalTokenNumber(value: string, label: string) {
  const nextValue = value.trim();

  if (!nextValue) return undefined;

  const numberValue = Number(nextValue);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(`${label}必须是非负整数。`);
  }

  return numberValue;
}

function optionalNumberToString(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : "";
}

function formatChangedItem(item: unknown) {
  if (typeof item === "string") return item;
  if (item == null) return String(item);

  return JSON.stringify(item);
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
