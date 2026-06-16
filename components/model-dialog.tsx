"use client";

import type { FormEvent } from "react";
import type { Model, ReqModelCreate, ReqModelUpdate } from "@/lib/api";

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
  createModel,
  deleteModel,
  getModelDetail,
  updateModel,
} from "@/lib/api";

type ModelForm = {
  cacheReadPricePerMillion: string;
  cacheWritePricePerMillion: string;
  currency: string;
  displayName: string;
  enabled: boolean;
  inputPricePerMillion: string;
  modelid: string;
  outputPricePerMillion: string;
  provider: string;
};

type CreateModelState = {
  error: string | null;
  form: ModelForm;
  isCreating: boolean;
};

type EditModelState = {
  error: string | null;
  form: ModelForm;
  isLoading: boolean;
  isSaving: boolean;
  loadedModelId: number | null;
};

type DeleteModelState = {
  error: string | null;
  isDeleting: boolean;
};

export type EditableModelSummary = Pick<
  Model,
  | "cacheReadPricePerMillion"
  | "cacheWritePricePerMillion"
  | "currency"
  | "displayName"
  | "enabled"
  | "id"
  | "inputPricePerMillion"
  | "modelid"
  | "outputPricePerMillion"
  | "provider"
> & {
  id: number;
};

const DEFAULT_MODEL_FORM: ModelForm = {
  cacheReadPricePerMillion: "",
  cacheWritePricePerMillion: "",
  currency: "USD",
  displayName: "",
  enabled: true,
  inputPricePerMillion: "",
  modelid: "",
  outputPricePerMillion: "",
  provider: "",
};

export function CreateModelDialog({ onCreated }: { onCreated: () => void }) {
  const [state, setState] = useState<CreateModelState>({
    error: null,
    form: DEFAULT_MODEL_FORM,
    isCreating: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: DEFAULT_MODEL_FORM,
        isCreating: false,
      });
    },
  });
  const { error, form, isCreating } = state;

  function closeDialog() {
    if (isCreating) return;

    modal.close();
  }

  function updateForm(patch: Partial<ModelForm>) {
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

    const request = toCreateModelRequest(form);

    if (!request.provider || !request.modelid) {
      setState((current) => ({
        ...current,
        error: "请输入供应商和模型 ID。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isCreating: true,
    }));

    try {
      await createModel(request);
      modal.close();
      setState({
        error: null,
        form: DEFAULT_MODEL_FORM,
        isCreating: false,
      });
      onCreated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getModelActionError(error, "创建模型失败。"),
        isCreating: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">
          <AdminIcon className="size-4" name="plus" />
          新增模型
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
                <Modal.Heading>新增模型</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                <ModelFormFields
                  form={form}
                  isDisabled={isCreating}
                  onChange={updateForm}
                />

                {error ? <ModelFormError>{error}</ModelFormError> : null}
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
                  {isCreating ? "创建中..." : "创建模型"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function EditModelDialog({
  model,
  onUpdated,
}: {
  model: EditableModelSummary;
  onUpdated: () => void;
}) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<EditModelState>({
    error: null,
    form: toModelForm(model),
    isLoading: false,
    isSaving: false,
    loadedModelId: null,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) {
        loadRequestRef.current += 1;

        return;
      }

      loadModel();
    },
  });
  const { error, form, isLoading, isSaving, loadedModelId } = state;
  const isBusy = isLoading || isSaving;

  function loadModel() {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState({
      error: null,
      form: toModelForm(model),
      isLoading: true,
      isSaving: false,
      loadedModelId: null,
    });

    void getModelDetail(model.id)
      .then((detail) => {
        if (loadRequestRef.current !== requestId) return;

        setState({
          error: null,
          form: toLoadedModelForm(model, detail),
          isLoading: false,
          isSaving: false,
          loadedModelId: model.id,
        });
      })
      .catch((error: unknown) => {
        if (loadRequestRef.current !== requestId) return;

        setState((current) => ({
          ...current,
          error: getModelActionError(error, "模型详情加载失败。"),
          isLoading: false,
          loadedModelId: null,
        }));
      });
  }

  function closeDialog() {
    if (isBusy) return;

    modal.close();
  }

  function updateForm(patch: Partial<ModelForm>) {
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

    if (isLoading || loadedModelId == null) return;

    const request = toUpdateModelRequest(form, loadedModelId);

    if (!request.provider || !request.modelid) {
      setState((current) => ({
        ...current,
        error: "请输入供应商和模型 ID。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
    }));

    try {
      await updateModel(request);
      modal.close();
      setState({
        error: null,
        form,
        isLoading: false,
        isSaving: false,
        loadedModelId: null,
      });
      onUpdated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getModelActionError(error, "更新模型失败。"),
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
                <Modal.Heading>编辑模型</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                {isLoading ? (
                  <div className="text-muted text-sm">正在加载模型详情...</div>
                ) : null}
                <ModelFormFields
                  form={form}
                  isDisabled={isBusy || loadedModelId == null}
                  onChange={updateForm}
                />
                {error ? <ModelFormError>{error}</ModelFormError> : null}
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
                  isDisabled={isBusy || loadedModelId == null}
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

export function DeleteModelDialog({
  model,
  onDeleted,
}: {
  model: EditableModelSummary;
  onDeleted: () => void;
}) {
  const [state, setState] = useState<DeleteModelState>({
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
  const modelName = getModelLabel(model);

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
      await deleteModel(model.id);
      modal.close();
      setState({
        error: null,
        isDeleting: false,
      });
      onDeleted();
    } catch (error) {
      setState({
        error: getModelActionError(error, "删除模型失败。"),
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
              <Modal.Heading>删除模型</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-3">
              <p className="text-muted text-sm">
                {"确认删除模型「"}
                <span className="break-all">{modelName}</span>
                {"」？删除后该模型将无法继续被授权或使用。"}
              </p>
              {error ? <ModelFormError>{error}</ModelFormError> : null}
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

function ModelFormFields({
  form,
  isDisabled,
  onChange,
}: {
  form: ModelForm;
  isDisabled: boolean;
  onChange: (patch: Partial<ModelForm>) => void;
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
          <Label>供应商</Label>
          <Input
            fullWidth
            value={form.provider}
            onChange={(event) => onChange({ provider: event.target.value })}
          />
        </TextField>

        <TextField
          fullWidth
          className="flex min-w-0 flex-col gap-2"
          isDisabled={isDisabled}
          variant="secondary"
        >
          <Label>模型 ID</Label>
          <Input
            fullWidth
            value={form.modelid}
            onChange={(event) => onChange({ modelid: event.target.value })}
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

        <TextField
          fullWidth
          className="flex min-w-0 flex-col gap-2"
          isDisabled={isDisabled}
          variant="secondary"
        >
          <Label>币种</Label>
          <Input
            fullWidth
            value={form.currency}
            onChange={(event) => onChange({ currency: event.target.value })}
          />
        </TextField>

        <PriceField
          isDisabled={isDisabled}
          label="输入价格 / 百万 token"
          value={form.inputPricePerMillion}
          onChange={(value) => onChange({ inputPricePerMillion: value })}
        />

        <PriceField
          isDisabled={isDisabled}
          label="输出价格 / 百万 token"
          value={form.outputPricePerMillion}
          onChange={(value) => onChange({ outputPricePerMillion: value })}
        />

        <PriceField
          isDisabled={isDisabled}
          label="Cache read 价格 / 百万 token"
          value={form.cacheReadPricePerMillion}
          onChange={(value) => onChange({ cacheReadPricePerMillion: value })}
        />

        <PriceField
          isDisabled={isDisabled}
          label="Cache write 价格 / 百万 token"
          value={form.cacheWritePricePerMillion}
          onChange={(value) => onChange({ cacheWritePricePerMillion: value })}
        />
      </div>

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
    </>
  );
}

function PriceField({
  isDisabled,
  label,
  onChange,
  value,
}: {
  isDisabled: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
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
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </TextField>
  );
}

function ModelFormError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function toCreateModelRequest(form: ModelForm): ReqModelCreate {
  return {
    cacheReadPricePerMillion: toOptionalString(form.cacheReadPricePerMillion),
    cacheWritePricePerMillion: toOptionalString(form.cacheWritePricePerMillion),
    currency: toOptionalString(form.currency),
    displayName: toOptionalString(form.displayName),
    enabled: form.enabled,
    inputPricePerMillion: toOptionalString(form.inputPricePerMillion),
    modelid: form.modelid.trim(),
    outputPricePerMillion: toOptionalString(form.outputPricePerMillion),
    provider: form.provider.trim(),
  };
}

function toUpdateModelRequest(form: ModelForm, id: number): ReqModelUpdate {
  return {
    ...toCreateModelRequest(form),
    id,
  };
}

function toModelForm(model: EditableModelSummary): ModelForm {
  return {
    cacheReadPricePerMillion: model.cacheReadPricePerMillion?.trim() ?? "",
    cacheWritePricePerMillion: model.cacheWritePricePerMillion?.trim() ?? "",
    currency: model.currency?.trim() || DEFAULT_MODEL_FORM.currency,
    displayName: model.displayName?.trim() ?? "",
    enabled: model.enabled !== false,
    inputPricePerMillion: model.inputPricePerMillion?.trim() ?? "",
    modelid: model.modelid?.trim() ?? "",
    outputPricePerMillion: model.outputPricePerMillion?.trim() ?? "",
    provider: model.provider?.trim() ?? "",
  };
}

function toLoadedModelForm(
  summary: EditableModelSummary,
  detail?: Model,
): ModelForm {
  if (!detail) return toModelForm(summary);

  return toModelForm({
    ...summary,
    ...detail,
    id: summary.id,
  });
}

function getModelLabel(model: Pick<Model, "displayName" | "modelid">) {
  return model.displayName?.trim() || model.modelid?.trim() || "未命名模型";
}

function toOptionalString(value: string) {
  return value.trim() || undefined;
}

function getModelActionError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
