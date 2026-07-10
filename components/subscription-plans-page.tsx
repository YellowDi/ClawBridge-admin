"use client";

import type { FormEvent, Key } from "react";
import type { SubscriptionPlan } from "@/lib/api";

import {
  Button,
  Card,
  Checkbox,
  Chip,
  Description,
  Dropdown,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import {
  AdminPage,
  CardCollection,
  CollectionToolbar,
  StatGrid,
} from "@/components/admin-page-kit";
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

type PlanSort =
  | "default"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

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
const PLAN_SKELETON_IDS = [
  "plan-skeleton-1",
  "plan-skeleton-2",
  "plan-skeleton-3",
  "plan-skeleton-4",
  "plan-skeleton-5",
  "plan-skeleton-6",
] as const;

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
  const [sort, setSort] = useState<PlanSort>("default");
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

        setLoadState((current) => ({
          ...current,
          error: message,
          isLoading: false,
        }));
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

  const stats = useMemo(() => getPlanStats(plans), [plans]);
  const sortedPlans = useMemo(() => sortPlans(plans, sort), [plans, sort]);

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
        <>
          <Button
            aria-label="刷新订阅套餐"
            isDisabled={isLoading}
            size="sm"
            variant="tertiary"
            onPress={() => void loadPlans()}
          >
            <AdminIcon className="size-4" name="refresh" />
            <span className="hidden sm:inline">刷新</span>
          </Button>
          <Button size="sm" onPress={openCreate}>
            <AdminIcon className="size-4" name="plus" />
            添加套餐
          </Button>
        </>
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

      <section className="flex min-w-0 flex-col gap-4">
        <CollectionToolbar>
          <Select
            aria-label="订阅套餐排序方式"
            className="w-full sm:ml-auto sm:w-52"
            selectedKey={sort}
            variant="secondary"
            onSelectionChange={(key) => setSort(toPlanSort(key))}
          >
            <Label className="sr-only">排序方式</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="default" textValue="默认顺序">
                  默认顺序
                </ListBox.Item>
                <ListBox.Item id="name-asc" textValue="名称 A-Z">
                  名称 A-Z
                </ListBox.Item>
                <ListBox.Item id="name-desc" textValue="名称 Z-A">
                  名称 Z-A
                </ListBox.Item>
                <ListBox.Item id="price-desc" textValue="价格从高到低">
                  价格从高到低
                </ListBox.Item>
                <ListBox.Item id="price-asc" textValue="价格从低到高">
                  价格从低到高
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </CollectionToolbar>
        {error ? <PlanFormError>{error}</PlanFormError> : null}
        {isLoading && plans.length === 0 ? (
          <PlanGridSkeleton />
        ) : sortedPlans.length > 0 ? (
          <CardCollection>
            {sortedPlans.map((plan) => (
              <SubscriptionPlanCard
                key={String(plan.id ?? plan.name)}
                plan={plan}
                onDelete={deletePlan}
                onEdit={openEdit}
              />
            ))}
          </CardCollection>
        ) : error ? null : (
          <PlanEmptyState />
        )}
      </section>

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

function SubscriptionPlanCard({
  onDelete,
  onEdit,
  plan,
}: {
  onDelete: (plan: SubscriptionPlan) => Promise<void>;
  onEdit: (plan: SubscriptionPlan) => void;
  plan: SubscriptionPlan;
}) {
  const name = plan.name || `套餐 ${plan.id ?? "-"}`;
  const windowSummary = formatWindows(plan);

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="bg-default-100 text-muted flex size-10 shrink-0 items-center justify-center rounded-md">
              <AdminIcon className="size-5" name="database" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <Card.Title className="truncate text-base">{name}</Card.Title>
                <Chip
                  className="shrink-0 whitespace-nowrap"
                  color={plan.enabled === false ? "default" : "success"}
                  size="sm"
                  variant="soft"
                >
                  {plan.enabled === false ? "停用" : "启用"}
                </Chip>
              </div>
              <Card.Description className="truncate text-xs">
                {plan.remark || "订阅套餐"}
              </Card.Description>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="tertiary" onPress={() => onEdit(plan)}>
              编辑
            </Button>
            <Dropdown>
              <Button
                isIconOnly
                aria-label={`${name} 更多操作`}
                size="sm"
                variant="tertiary"
              >
                <AdminIcon className="size-4" name="more" />
              </Button>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu
                  aria-label={`${name} 更多操作`}
                  onAction={(key) => {
                    if (key === "delete") void onDelete(plan);
                  }}
                >
                  <Dropdown.Item id="delete" variant="danger">
                    删除
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>
      </Card.Header>
      <Card.Content className="flex h-full flex-col gap-4">
        <p className="text-muted line-clamp-3 min-h-14 text-sm">
          {plan.description || "暂无套餐说明"}
        </p>
        <div className="min-w-0 rounded-md bg-default-50 px-3 py-2">
          <div className="text-muted text-xs">功能介绍</div>
          <div
            className="text-foreground mt-1 line-clamp-2 text-xs font-medium"
            title={plan.featureIntro}
          >
            {plan.featureIntro || "暂无功能介绍"}
          </div>
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-3 text-xs">
          <PlanMeta
            label="月价格"
            value={formatDecimal(plan.monthlyPriceAmount)}
          />
          <PlanMeta label="席位" value={String(plan.seatLimit ?? 0)} />
          <PlanMeta
            label="额度窗口"
            value={`${plan.windows?.length ?? 0} 个`}
          />
          <PlanMeta label="窗口摘要" value={windowSummary} />
        </dl>
      </Card.Content>
    </Card>
  );
}

function PlanMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

function PlanGridSkeleton() {
  return (
    <CardCollection>
      {PLAN_SKELETON_IDS.map((id) => (
        <Card key={id}>
          <Card.Content className="flex min-h-64 flex-col gap-4 p-5">
            <div className="bg-default-200 h-5 w-2/3 animate-pulse rounded" />
            <div className="bg-default-100 h-14 animate-pulse rounded" />
            <div className="bg-default-100 h-12 animate-pulse rounded" />
            <div className="mt-auto grid grid-cols-2 gap-3">
              <div className="bg-default-100 h-10 animate-pulse rounded" />
              <div className="bg-default-100 h-10 animate-pulse rounded" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </CardCollection>
  );
}

function PlanEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-default-300 px-6 py-12 text-center">
      <AdminIcon className="text-muted size-9" name="database" />
      <h2 className="text-foreground mt-4 text-base font-semibold">
        还没有订阅套餐
      </h2>
      <p className="text-muted mt-2 max-w-md text-sm">
        添加套餐后会在这里显示价格、席位和额度窗口。
      </p>
    </div>
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

function sortPlans(plans: SubscriptionPlan[], sort: PlanSort) {
  if (sort === "default") return [...plans];

  return [...plans].sort((left, right) => {
    if (sort === "name-asc") {
      return (left.name ?? "").localeCompare(right.name ?? "", "zh-CN");
    }
    if (sort === "name-desc") {
      return (right.name ?? "").localeCompare(left.name ?? "", "zh-CN");
    }

    const leftPrice = Number(left.monthlyPriceAmount) || 0;
    const rightPrice = Number(right.monthlyPriceAmount) || 0;

    return sort === "price-asc"
      ? leftPrice - rightPrice
      : rightPrice - leftPrice;
  });
}

function toPlanSort(key: Key | null): PlanSort {
  const value = String(key ?? "default");

  if (
    value === "name-asc" ||
    value === "name-desc" ||
    value === "price-asc" ||
    value === "price-desc"
  ) {
    return value;
  }

  return "default";
}

function formatWindows(plan: SubscriptionPlan) {
  const windows = plan.windows ?? [];

  if (windows.length === 0) return "-";

  return windows
    .map(
      (window) =>
        `${window.windowHours ?? "-"}h/${formatDecimal(window.quotaAmount)}`,
    )
    .join(" · ");
}

function formatDecimal(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) return "-";
  if (!trimmed.includes(".")) return trimmed;

  const [integer, fraction] = trimmed.split(".");
  const significantFraction = fraction.replace(/0+$/, "");

  return significantFraction ? `${integer}.${significantFraction}` : integer;
}

function formatCount(value: number, isLoading: boolean) {
  return isLoading ? "-" : String(value);
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
