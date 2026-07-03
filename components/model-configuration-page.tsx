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
import { useCallback, useEffect, useReducer } from "react";

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
  outputPricePerMillion: string;
  providerType: string;
  selectedCapabilities: ModelCapabilityValue[];
  unitPriceAmount: string;
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
  | { type: "openCreate"; providerId: string }
  | { type: "openEdit"; modelConfiguration: ModelConfiguration }
  | { type: "providerChanged"; providerId: string }
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
  outputPricePerMillion: "",
  providerType: defaultModelProviderPreset.id,
  selectedCapabilities: ["chat"],
  unitPriceAmount: "",
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

  const selectedProvider =
    modelProviderPresets.find(
      (provider) => provider.id === form.providerType,
    ) ?? defaultModelProviderPreset;
  const usesCustomProvider = selectedProvider.id === "custom";
  const suggestedModel = providerPresetModels(selectedProvider)[0];
  const modelPlaceholder = suggestedModel
    ? `例如：${suggestedModel}`
    : "例如：gemini-2.5-pro";

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
    void loadModelConfigurations();
  }, [loadModelConfigurations]);

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextName = form.modelConfigName.trim();
    const nextProvider = usesCustomProvider
      ? form.customProvider.trim()
      : selectedProvider.id;
    const nextModel = form.model.trim();
    const nextBillingUnit = form.billingUnit.trim() || "token";
    const nextUnitPrice = form.unitPriceAmount.trim();
    const nextInputPrice = form.inputPricePerMillion.trim();
    const nextOutputPrice = form.outputPricePerMillion.trim();
    const nextCacheReadPrice = form.cacheReadPricePerMillion.trim();
    const nextCacheWritePrice = form.cacheWritePricePerMillion.trim();
    const nextCurrency = form.currency.trim();
    const nextCapabilities = form.selectedCapabilities.flatMap((capability) => {
      const trimmedCapability = capability.trim();

      return trimmedCapability ? [trimmedCapability] : [];
    });

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
    providerId = defaultModelProviderPreset.id,
  ) {
    dispatch({ providerId, type: "openCreate" });
  }

  function openEditProviderDialog(modelConfiguration: ModelConfiguration) {
    dispatch({ modelConfiguration, type: "openEdit" });
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
    } catch (error) {
      toast.danger(`模型配置删除失败：${getActionErrorMessage(error)}`);
      dispatch({ type: "deleteFinished" });
    }
  }

  function toggleCapability(capability: ModelCapabilityId, selected: boolean) {
    dispatch({ capability, selected, type: "capabilityToggled" });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <ModelConfigurationGrid
        isLoadingModels={isLoadingModels}
        loadError={loadError}
        modelConfigurations={modelConfigurations}
        onCreate={() => openCreateProviderDialog()}
        onEdit={openEditProviderDialog}
        onReload={() => void loadModelConfigurations()}
      />

      <ModelConfigurationDialog
        editingModelConfiguration={editingModelConfiguration}
        form={form}
        isDeletingProvider={isDeletingProvider}
        isOpen={isProviderDialogOpen}
        isSubmitting={isSubmitting}
        modelPlaceholder={modelPlaceholder}
        usesCustomProvider={usesCustomProvider}
        onCapabilityToggle={toggleCapability}
        onDelete={() => void deleteProvider()}
        onFormChange={(patch) => dispatch({ patch, type: "formPatched" })}
        onOpenChange={(isOpen) =>
          dispatch({ isOpen, type: "dialogOpenChanged" })
        }
        onProviderChange={(providerId) =>
          dispatch({ providerId, type: "providerChanged" })
        }
        onSubmit={submitProvider}
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
}: {
  isLoadingModels: boolean;
  loadError: string | null;
  modelConfigurations: ModelConfiguration[];
  onCreate: () => void;
  onEdit: (modelConfiguration: ModelConfiguration) => void;
  onReload: () => void;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <button
          className="border-border bg-surface cursor-[var(--cursor-interactive)] hover:bg-surface-hover disabled:text-muted flex min-h-28 items-center gap-3 rounded-3xl border border-dashed px-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoadingModels}
          type="button"
          onClick={onCreate}
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
                onPress={() => onEdit(modelConfiguration)}
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
  usesCustomProvider: boolean;
}) {
  const providerDialogTitle = editingModelConfiguration
    ? "编辑模型配置"
    : "添加模型配置";
  const providerSubmitLabel = editingModelConfiguration ? "保存" : "创建模型";

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="auto" scroll="inside" size="lg">
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Form onSubmit={onSubmit}>
            <Modal.Header>
              <Modal.Heading>{providerDialogTitle}</Modal.Heading>
              <Typography color="muted" type="body-sm">
                配置模型服务和可用能力。
              </Typography>
            </Modal.Header>
            <Modal.Body>
              <ModelConfigurationFields
                form={form}
                modelPlaceholder={modelPlaceholder}
                usesCustomProvider={usesCustomProvider}
                onCapabilityToggle={onCapabilityToggle}
                onFormChange={onFormChange}
                onProviderChange={onProviderChange}
              />
            </Modal.Body>
            <Modal.Footer>
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
  usesCustomProvider: boolean;
}) {
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
          value={form.customProvider}
          onChange={(value) => onFormChange({ customProvider: value })}
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
        value={form.model}
        onChange={(value) => onFormChange({ model: value })}
      >
        <Label>模型名称</Label>
        <Input placeholder={modelPlaceholder} variant="secondary" />
        <FieldError />
      </TextField>
      <ModelPricingFields form={form} onFormChange={onFormChange} />
      <ModelCapabilityFields
        selectedCapabilities={form.selectedCapabilities}
        onCapabilityToggle={onCapabilityToggle}
      />
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
            onChange={(selected) => onCapabilityToggle(definition.id, selected)}
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
        form: getDefaultModelForm(action.providerId),
        isProviderDialogOpen: true,
      };
    case "openEdit":
      return {
        ...state,
        editingModelConfiguration: action.modelConfiguration,
        form: getModelFormFromConfiguration(action.modelConfiguration),
        isProviderDialogOpen: true,
      };
    case "providerChanged":
      return {
        ...state,
        form: {
          ...state.form,
          customProvider: "",
          model: "",
          providerType: getModelProviderPreset(action.providerId).id,
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
): ModelFormState {
  return {
    ...DEFAULT_MODEL_FORM,
    providerType: getModelProviderPreset(providerId).id,
  };
}

function getModelFormFromConfiguration(
  modelConfiguration: ModelConfiguration,
): ModelFormState {
  const nextProvider = modelProviderPresets.find(
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
    outputPricePerMillion:
      modelConfiguration.record?.outputPricePerMillion?.trim() ?? "",
    providerType: nextProvider?.id ?? "custom",
    selectedCapabilities: modelConfiguration.capabilities,
    unitPriceAmount: modelConfiguration.record?.unitPriceAmount?.trim() ?? "",
  };
}

function getModelProviderPreset(providerId: string) {
  return (
    modelProviderPresets.find((provider) => provider.id === providerId) ??
    defaultModelProviderPreset
  );
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
