"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { FormEvent } from "react";
import type { SubscriptionPlan } from "@/lib/api";

import {
  Button,
  Checkbox,
  Description,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  listSubscriptionPlans,
  updateSubscriptionPlan,
} from "@/lib/api";

type SubscriptionPlanForm = {
  description: string;
  enabled: boolean;
  featureIntro: string;
  monthlyPriceAmount: string;
  name: string;
  remark: string;
  seatLimit: string;
  windows: SubscriptionPlanWindowForm[];
};

type SubscriptionPlanWindowForm = {
  enabled: boolean;
  id?: number;
  quotaAmount: string;
  sortOrder: string;
  windowHours: string;
};

type PlansLoadState = {
  error: string | null;
  isLoading: boolean;
  plans: SubscriptionPlan[];
};

const DEFAULT_PLAN_FORM: SubscriptionPlanForm = {
  description: "",
  enabled: true,
  featureIntro: "",
  monthlyPriceAmount: "",
  name: "",
  remark: "",
  seatLimit: "0",
  windows: [
    {
      enabled: true,
      quotaAmount: "",
      sortOrder: "1",
      windowHours: "5",
    },
  ],
};

const PLAN_COLUMNS: DataGridColumn<SubscriptionPlan>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">
          {item.name || `套餐 ${item.id}`}
        </span>
        <span className="text-muted truncate text-xs">
          {item.description || "无介绍"}
        </span>
      </div>
    ),
    header: "套餐",
    headerClassName: "whitespace-nowrap",
    id: "name",
    isRowHeader: true,
    minWidth: 220,
  },
  {
    cell: (item) => (
      <span
        className="text-muted line-clamp-2 whitespace-pre-line text-xs"
        title={item.featureIntro}
      >
        {item.featureIntro || "无功能介绍"}
      </span>
    ),
    header: "功能介绍",
    headerClassName: "whitespace-nowrap",
    id: "featureIntro",
    minWidth: 220,
  },
  {
    align: "end",
    accessorKey: "monthlyPriceAmount",
    cellClassName: "whitespace-nowrap tabular-nums",
    header: "月价格",
    headerClassName: "whitespace-nowrap",
    id: "monthlyPriceAmount",
    width: 130,
  },
  {
    align: "end",
    accessorKey: "seatLimit",
    cellClassName: "whitespace-nowrap tabular-nums",
    header: "席位",
    headerClassName: "whitespace-nowrap",
    id: "seatLimit",
    width: 80,
  },
  {
    cell: (item) => formatWindows(item),
    header: "额度窗口",
    headerClassName: "whitespace-nowrap",
    id: "windows",
    minWidth: 180,
  },
  {
    cell: (item) => (item.enabled === false ? "停用" : "启用"),
    cellClassName: "whitespace-nowrap",
    header: "状态",
    headerClassName: "whitespace-nowrap",
    id: "enabled",
    width: 80,
  },
];

export function SubscriptionPlansPage() {
  const isMountedRef = useRef(false);
  const modal = useOverlayState();
  const [loadState, setLoadState] = useState<PlansLoadState>({
    error: null,
    isLoading: true,
    plans: [],
  });
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<SubscriptionPlanForm>(DEFAULT_PLAN_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { error, isLoading, plans } = loadState;

  const loadPlans = useCallback(async () => {
    setLoadState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const plans = await listSubscriptionPlans({ pageSize: 500 });

      if (isMountedRef.current) {
        setLoadState({ error: null, isLoading: false, plans });
      }
    } catch (error) {
      if (isMountedRef.current) {
        const message = getPlanError(error, "订阅套餐加载失败。");

        setLoadState({ error: message, isLoading: false, plans: [] });
        toast.danger(message);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadPlans();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadPlans]);

  const columns = useMemo<DataGridColumn<SubscriptionPlan>[]>(
    () => [
      ...PLAN_COLUMNS,
      {
        align: "end",
        cell: (item) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="tertiary" onPress={() => openEdit(item)}>
              编辑
            </Button>
            <Button
              size="sm"
              variant="danger-soft"
              onPress={() => void deletePlan(item)}
            >
              删除
            </Button>
          </div>
        ),
        cellClassName: "w-[132px] min-w-[132px] max-w-[132px]",
        header: "操作",
        headerClassName: "w-[132px] min-w-[132px] max-w-[132px]",
        id: "actions",
        pinned: "end",
        width: 132,
      },
    ],
    [plans],
  );
  const stats = useMemo(() => getPlanStats(plans), [plans]);

  function openCreate() {
    setEditingPlan(null);
    setForm(DEFAULT_PLAN_FORM);
    setFormError(null);
    modal.open();
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setForm(toPlanForm(plan));
    setFormError(null);
    modal.open();
  }

  async function deletePlan(plan: SubscriptionPlan) {
    if (plan.id == null) return;
    if (!window.confirm(`删除订阅套餐“${plan.name || plan.id}”？`)) return;

    try {
      await deleteSubscriptionPlan(plan.id);
      await loadPlans();
      toast.success("订阅套餐已删除。");
    } catch (error) {
      toast.danger(getPlanError(error, "删除订阅套餐失败。"));
    }
  }

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let request;

    try {
      request = toPlanRequest(form);
    } catch (error) {
      const message = getPlanError(error, "订阅套餐表单无效。");

      setFormError(message);
      toast.danger(message);

      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (editingPlan?.id) {
        await updateSubscriptionPlan({ ...request, id: editingPlan.id });
      } else {
        await createSubscriptionPlan(request);
      }

      modal.close();
      setIsSaving(false);
      await loadPlans();
      toast.success(editingPlan ? "订阅套餐已更新。" : "订阅套餐已创建。");
    } catch (error) {
      const message = getPlanError(error, "保存订阅套餐失败。");

      setFormError(message);
      setIsSaving(false);
      toast.danger(message);
    }
  }

  return (
    <AdminPage
      actions={
        <Button size="sm" onPress={openCreate}>
          <AdminIcon className="size-4" name="plus" />
          添加套餐
        </Button>
      }
      description="配置订阅套餐、月价格、席位和周期额度窗口。"
      eyebrow="Subscription"
      title="订阅套餐"
    >
      <StatGrid
        stats={[
          {
            helper: "当前套餐总数",
            label: "套餐",
            value: formatCount(stats.total, isLoading),
          },
          {
            helper: "可授予套餐",
            label: "启用套餐",
            tone: "accent",
            value: formatCount(stats.enabled, isLoading),
          },
          {
            helper: "seatLimit > 0",
            label: "团队套餐",
            value: formatCount(stats.team, isLoading),
          },
          {
            helper: "全部窗口配置",
            label: "额度窗口",
            tone: "warning",
            value: formatCount(stats.windows, isLoading),
          },
        ]}
      />

      <DataGrid
        aria-label="订阅套餐列表"
        className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
        columns={columns}
        contentClassName="min-w-[1080px]"
        data={plans}
        getRowId={(item) => String(item.id ?? item.name)}
        renderEmptyState={() => getPlansEmptyState(error, isLoading)}
      />

      <Modal.Backdrop
        isDismissable={!isSaving}
        isKeyboardDismissDisabled={isSaving}
        isOpen={modal.isOpen}
        onOpenChange={modal.setOpen}
      >
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={submitPlan}>
              <Modal.Header>
                <Modal.Heading>
                  {editingPlan ? "编辑订阅套餐" : "添加订阅套餐"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex min-w-0 flex-col gap-4">
                <PlanFormFields
                  form={form}
                  isDisabled={isSaving}
                  onChange={(patch) =>
                    setForm((current) => ({ ...current, ...patch }))
                  }
                />
                {formError ? <PlanFormError>{formError}</PlanFormError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isSaving}
                  type="button"
                  variant="tertiary"
                  onPress={() => modal.close()}
                >
                  取消
                </Button>
                <Button isDisabled={isSaving} type="submit">
                  {isSaving ? "保存中..." : "保存套餐"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </AdminPage>
  );
}

function PlanFormFields({
  form,
  isDisabled,
  onChange,
}: {
  form: SubscriptionPlanForm;
  isDisabled: boolean;
  onChange: (patch: Partial<SubscriptionPlanForm>) => void;
}) {
  function updateWindow(
    index: number,
    patch: Partial<SubscriptionPlanWindowForm>,
  ) {
    onChange({
      windows: form.windows.map((window, currentIndex) =>
        currentIndex === index ? { ...window, ...patch } : window,
      ),
    });
  }

  function addWindow() {
    onChange({
      windows: [
        ...form.windows,
        {
          enabled: true,
          quotaAmount: "",
          sortOrder: String(form.windows.length + 1),
          windowHours: "",
        },
      ],
    });
  }

  function removeWindow(index: number) {
    onChange({
      windows: form.windows.filter((_, currentIndex) => currentIndex !== index),
    });
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField fullWidth isDisabled={isDisabled} variant="secondary">
          <Label>套餐名称</Label>
          <Input
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </TextField>
        <TextField fullWidth isDisabled={isDisabled} variant="secondary">
          <Label>月价格</Label>
          <Input
            inputMode="decimal"
            placeholder="300.0000000000"
            value={form.monthlyPriceAmount}
            onChange={(event) =>
              onChange({ monthlyPriceAmount: event.target.value })
            }
          />
        </TextField>
        <TextField fullWidth isDisabled={isDisabled} variant="secondary">
          <Label>席位数量</Label>
          <Input
            inputMode="numeric"
            min={0}
            type="number"
            value={form.seatLimit}
            onChange={(event) => onChange({ seatLimit: event.target.value })}
          />
        </TextField>
        <div className="flex items-end">
          <Checkbox
            isDisabled={isDisabled}
            isSelected={form.enabled}
            onChange={(enabled) => onChange({ enabled })}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              是否启用
            </Checkbox.Content>
          </Checkbox>
        </div>
      </div>

      <TextField fullWidth isDisabled={isDisabled} variant="secondary">
        <Label>介绍</Label>
        <Input
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </TextField>
      <TextField
        fullWidth
        isDisabled={isDisabled}
        value={form.featureIntro}
        variant="secondary"
        onChange={(featureIntro) => onChange({ featureIntro })}
      >
        <Label>功能介绍</Label>
        <TextArea
          placeholder={"包含高级模型调用额度\n支持团队协作席位"}
          rows={4}
          variant="secondary"
        />
      </TextField>
      <TextField fullWidth isDisabled={isDisabled} variant="secondary">
        <Label>备注</Label>
        <Input
          value={form.remark}
          onChange={(event) => onChange({ remark: event.target.value })}
        />
      </TextField>

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">额度窗口</h3>
            <Description>窗口配置会按提交内容整体替换。</Description>
          </div>
          <Button
            isDisabled={isDisabled}
            size="sm"
            type="button"
            variant="tertiary"
            onPress={addWindow}
          >
            添加窗口
          </Button>
        </div>
        <div className="grid gap-3">
          {form.windows.map((window, index) => (
            <div
              key={`${window.id ?? "new"}-${index}`}
              className="rounded-md bg-surface p-3"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <TextField
                  fullWidth
                  isDisabled={isDisabled}
                  variant="secondary"
                >
                  <Label>小时数</Label>
                  <Input
                    inputMode="numeric"
                    min={1}
                    type="number"
                    value={window.windowHours}
                    onChange={(event) =>
                      updateWindow(index, { windowHours: event.target.value })
                    }
                  />
                </TextField>
                <TextField
                  fullWidth
                  isDisabled={isDisabled}
                  variant="secondary"
                >
                  <Label>RMB 额度</Label>
                  <Input
                    inputMode="decimal"
                    placeholder="500.0000000000"
                    value={window.quotaAmount}
                    onChange={(event) =>
                      updateWindow(index, { quotaAmount: event.target.value })
                    }
                  />
                </TextField>
                <TextField
                  fullWidth
                  isDisabled={isDisabled}
                  variant="secondary"
                >
                  <Label>排序</Label>
                  <Input
                    inputMode="numeric"
                    min={1}
                    type="number"
                    value={window.sortOrder}
                    onChange={(event) =>
                      updateWindow(index, { sortOrder: event.target.value })
                    }
                  />
                </TextField>
                <div className="flex items-end gap-2">
                  <Checkbox
                    isDisabled={isDisabled}
                    isSelected={window.enabled}
                    onChange={(enabled) => updateWindow(index, { enabled })}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      启用
                    </Checkbox.Content>
                  </Checkbox>
                  <Button
                    isDisabled={isDisabled || form.windows.length <= 1}
                    size="sm"
                    type="button"
                    variant="danger-soft"
                    onPress={() => removeWindow(index)}
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function toPlanForm(plan: SubscriptionPlan): SubscriptionPlanForm {
  return {
    description: plan.description ?? "",
    enabled: plan.enabled !== false,
    featureIntro: plan.featureIntro ?? "",
    monthlyPriceAmount: plan.monthlyPriceAmount ?? "",
    name: plan.name ?? "",
    remark: plan.remark ?? "",
    seatLimit: String(plan.seatLimit ?? 0),
    windows: plan.windows?.length
      ? plan.windows.map((window, index) => ({
          enabled: window.enabled !== false,
          id: window.id,
          quotaAmount: window.quotaAmount ?? "",
          sortOrder: String(window.sortOrder ?? index + 1),
          windowHours: String(window.windowHours ?? ""),
        }))
      : DEFAULT_PLAN_FORM.windows,
  };
}

function toPlanRequest(form: SubscriptionPlanForm) {
  const name = form.name.trim();
  const monthlyPriceAmount = form.monthlyPriceAmount.trim();
  const seatLimit = parseNonNegativeInteger(form.seatLimit, "席位数量");

  if (!name) throw new Error("套餐名称为必填项。");
  if (!monthlyPriceAmount) throw new Error("月价格为必填项。");
  if (form.windows.length === 0) throw new Error("至少需要一个额度窗口。");

  return {
    description: form.description.trim(),
    enabled: form.enabled,
    featureIntro: form.featureIntro.trim(),
    monthlyPriceAmount,
    name,
    remark: form.remark.trim(),
    seatLimit,
    windows: form.windows.map((window, index) => ({
      enabled: window.enabled,
      id: window.id,
      quotaAmount: requireText(window.quotaAmount, "RMB 额度"),
      sortOrder:
        parseNonNegativeInteger(
          window.sortOrder || String(index + 1),
          "排序",
        ) || index + 1,
      windowHours: parsePositiveInteger(window.windowHours, "小时数"),
    })),
  };
}

function parseNonNegativeInteger(value: string, label: string) {
  const parsed = Number(value.trim() || "0");

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label}必须是大于等于 0 的整数。`);
  }

  return parsed;
}

function parsePositiveInteger(value: string, label: string) {
  const parsed = Number(value.trim());

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label}必须是大于 0 的整数。`);
  }

  return parsed;
}

function requireText(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) throw new Error(`${label}为必填项。`);

  return trimmed;
}

function getPlanStats(plans: SubscriptionPlan[]) {
  return {
    enabled: plans.filter((plan) => plan.enabled !== false).length,
    team: plans.filter((plan) => (plan.seatLimit ?? 0) > 0).length,
    total: plans.length,
    windows: plans.reduce(
      (total, plan) => total + (plan.windows?.length ?? 0),
      0,
    ),
  };
}

function formatWindows(plan: SubscriptionPlan) {
  const windows = plan.windows ?? [];

  if (windows.length === 0) return "-";

  return windows
    .map(
      (window) => `${window.windowHours ?? "-"}h/${window.quotaAmount ?? "-"}`,
    )
    .join(" · ");
}

function formatCount(value: number, isLoading: boolean) {
  return isLoading ? "-" : String(value);
}

function getPlansEmptyState(error: string | null, isLoading: boolean) {
  if (isLoading) return "正在加载订阅套餐...";
  if (error) return error;

  return "暂无订阅套餐。";
}

function PlanFormError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function getPlanError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
