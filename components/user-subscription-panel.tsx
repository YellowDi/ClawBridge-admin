"use client";

import type { EditableUserSummary } from "@/components/create-user-dialog";
import type {
  SubscriptionPlan,
  SubscriptionTransaction,
  SubscriptionWalletWindow,
  UserSubscriptionView,
} from "@/lib/api";

import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  ProgressBar,
  Select,
  TextField,
  toast,
} from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getCurrentSubscription,
  grantUserSubscription,
  listSubscriptionPlans,
  listSubscriptionTransactions,
} from "@/lib/api";

type UserSubscriptionState = {
  error: string | null;
  isGranting: boolean;
  isLoading: boolean;
  plans: SubscriptionPlan[];
  subscription?: UserSubscriptionView;
  transactions: SubscriptionTransaction[];
};

const DEFAULT_GRANT_DAYS = "30";

export function UserSubscriptionPanel({
  isActive,
  onChanged,
  onClose,
  user,
}: {
  isActive: boolean;
  onChanged: () => void;
  onClose: () => void;
  user: EditableUserSummary;
}) {
  const loadRequestRef = useRef(0);
  const [grantDays, setGrantDays] = useState(DEFAULT_GRANT_DAYS);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [state, setState] = useState<UserSubscriptionState>({
    error: null,
    isGranting: false,
    isLoading: false,
    plans: [],
    subscription: undefined,
    transactions: [],
  });
  const isBusy = state.isLoading || state.isGranting;
  const enabledPlans = state.plans.filter((plan) => plan.enabled !== false);

  const loadSubscription = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const [plans, subscription, transactions] = await Promise.all([
        listSubscriptionPlans({ pageSize: 500 }),
        getCurrentSubscription({ userId: user.id }),
        listSubscriptionTransactions({ pageSize: 10, userId: user.id }),
      ]);

      if (loadRequestRef.current !== requestId) return;

      setState({
        error: null,
        isGranting: false,
        isLoading: false,
        plans,
        subscription,
        transactions,
      });
      setSelectedPlanId(
        subscription?.plan?.id ? String(subscription.plan.id) : "",
      );
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      const message = getSubscriptionError(error, "用户订阅加载失败。");

      setState((current) => ({
        ...current,
        error: message,
        isGranting: false,
        isLoading: false,
      }));
      toast.danger(message);
    }
  }, [user.id]);

  useEffect(() => {
    if (!isActive) {
      loadRequestRef.current += 1;

      return;
    }

    void loadSubscription();

    return () => {
      loadRequestRef.current += 1;
    };
  }, [isActive, loadSubscription]);

  async function grantSubscription() {
    const planId = Number(selectedPlanId);
    const normalizedGrantDays = normalizeGrantDays(grantDays);

    if (!Number.isInteger(planId) || planId <= 0) {
      const message = "请选择要授予的订阅套餐。";

      setState((current) => ({ ...current, error: message }));
      toast.danger(message);

      return;
    }

    if (!window.confirm(getGrantConfirmMessage(state.subscription))) return;

    setState((current) => ({ ...current, error: null, isGranting: true }));

    try {
      await grantUserSubscription({
        grantDays: normalizedGrantDays,
        planId,
        userId: user.id,
      });
      await loadSubscription();
      onChanged();
      toast.success("订阅套餐已授予。");
    } catch (error) {
      const message = getSubscriptionError(error, "授予订阅套餐失败。");

      setState((current) => ({
        ...current,
        error: message,
        isGranting: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-4 px-6 py-4">
        {state.isLoading ? (
          <div className="text-muted text-sm">正在加载订阅...</div>
        ) : null}
        {state.error ? (
          <SubscriptionError>{state.error}</SubscriptionError>
        ) : null}

        <section className="grid grid-cols-2 gap-3">
          <SubscriptionMetric
            label="计费模式"
            value={toBillingModeLabel(state.subscription?.billingMode)}
          />
          <SubscriptionMetric
            label="当前套餐"
            value={state.subscription?.plan?.name}
          />
          <SubscriptionMetric
            label="月价格"
            value={state.subscription?.plan?.monthlyPriceAmount}
          />
          <SubscriptionMetric
            label="订阅周期"
            value={formatSubscriptionPeriod(state.subscription)}
          />
          <SubscriptionMetric
            label="订阅来源"
            value={toSubscriptionSourceLabel(
              state.subscription?.subscription?.source,
            )}
          />
          <SubscriptionMetric
            label="原价快照"
            value={state.subscription?.subscription?.originalPriceAmount}
          />
          <SubscriptionMetric
            label="实际支付"
            value={state.subscription?.subscription?.paidPriceAmount}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
          <Select
            fullWidth
            isDisabled={isBusy || enabledPlans.length === 0}
            selectedKey={selectedPlanId || null}
            variant="secondary"
            onSelectionChange={(key) =>
              setSelectedPlanId(key == null ? "" : String(key))
            }
          >
            <Label>授予订阅套餐</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {enabledPlans.map((plan) => {
                  const id = plan.id;

                  if (id == null) return null;

                  return (
                    <ListBox.Item
                      key={id}
                      id={String(id)}
                      textValue={plan.name}
                    >
                      {plan.name || `套餐 ${id}`}
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </Select.Popover>
          </Select>
          <TextField fullWidth isDisabled={isBusy} variant="secondary">
            <Label>授予天数</Label>
            <Input
              inputMode="numeric"
              min={1}
              step={1}
              type="number"
              value={grantDays}
              onChange={(event) => setGrantDays(event.target.value)}
            />
          </TextField>
          <Button isDisabled={isBusy} onPress={() => void grantSubscription()}>
            {state.isGranting ? "授予中..." : "授予"}
          </Button>
        </section>

        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="text-sm font-semibold">额度窗口</h3>
          {(state.subscription?.windows ?? []).length === 0 ? (
            <span className="text-muted text-sm">暂无订阅额度窗口。</span>
          ) : null}
          <div className="grid gap-2">
            {(state.subscription?.windows ?? []).map((window) => (
              <SubscriptionWindowCard
                key={`${window.id ?? window.windowHours}-${window.nextResetAt}`}
                window={window}
              />
            ))}
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-2">
          <h3 className="text-sm font-semibold">最近订阅流水</h3>
          {state.transactions.length === 0 ? (
            <span className="text-muted text-sm">暂无订阅流水。</span>
          ) : null}
          <div className="grid gap-2">
            {state.transactions.map((transaction) => (
              <SubscriptionTransactionRow
                key={transaction.id ?? transaction.createdAt}
                transaction={transaction}
              />
            ))}
          </div>
        </section>
      </div>
      <div className="flex justify-end px-6 pb-6">
        <Button isDisabled={isBusy} variant="tertiary" onPress={onClose}>
          关闭
        </Button>
      </div>
    </>
  );
}

function SubscriptionWindowCard({
  window,
}: {
  window: SubscriptionWalletWindow;
}) {
  const remainingPercent = parsePercent(window.remainingPercent);

  return (
    <div className="rounded-md bg-surface px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium">
          {formatWindowHours(window.windowHours)}
        </span>
        <Chip
          color={window.isExceeded ? "danger" : "success"}
          size="sm"
          variant="soft"
        >
          {window.isExceeded ? "已超额" : "正常"}
        </Chip>
      </div>
      <ProgressBar
        aria-label={`${formatWindowHours(window.windowHours)}剩余额度`}
        color={window.isExceeded ? "danger" : "success"}
        maxValue={100}
        size="sm"
        value={remainingPercent}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
      <div className="text-muted mt-2 grid grid-cols-2 gap-2 text-xs">
        <span>已用 {window.usedAmount ?? "-"}</span>
        <span>剩余 {window.remainingAmount ?? "-"}</span>
        <span>剩余 {window.remainingPercent ?? "-"}%</span>
        <span>已用 {window.usedPercent ?? "-"}%</span>
        <span>超额 {window.overageAmount ?? "-"}</span>
        <span>下次刷新 {formatDateTime(window.nextResetAt)}</span>
      </div>
    </div>
  );
}

function SubscriptionTransactionRow({
  transaction,
}: {
  transaction: SubscriptionTransaction;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-surface px-3 py-2 text-xs">
      <div className="min-w-0">
        <div className="truncate font-medium">
          {toTransactionTypeLabel(transaction.type)}
          {transaction.description ? ` · ${transaction.description}` : ""}
        </div>
        <div className="text-muted truncate">
          用户 {transaction.userId ?? "-"} · 主账号{" "}
          {transaction.billingUserId ?? "-"} ·{" "}
          {formatDateTime(transaction.createdAt)}
        </div>
        <div className="text-muted truncate">
          套餐 {transaction.planId ?? "-"} · Token usage{" "}
          {transaction.tokenUsageId ?? "-"} · {transaction.usedBefore ?? "-"} →{" "}
          {transaction.usedAfter ?? "-"}
        </div>
      </div>
      <div className="text-right font-medium tabular-nums">
        {transaction.amount ?? "-"}
      </div>
    </div>
  );
}

function SubscriptionMetric({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-md bg-surface px-3 py-2">
      <div className="text-muted text-xs">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold tabular-nums">
        {value?.trim() || "-"}
      </div>
    </div>
  );
}

function SubscriptionError({ children }: { children: string }) {
  return (
    <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function formatSubscriptionPeriod(subscription?: UserSubscriptionView) {
  const startsAt =
    subscription?.wallet?.periodStart ?? subscription?.subscription?.startsAt;
  const expiresAt =
    subscription?.wallet?.periodEnd ?? subscription?.subscription?.expiresAt;

  if (!startsAt && !expiresAt) return "-";

  return `${formatDateTime(startsAt)} - ${formatDateTime(expiresAt)}`;
}

function formatWindowHours(value?: number) {
  if (value === 168) return "一周额度";
  if (value == null) return "窗口额度";

  return `${value} 小时额度`;
}

function parsePercent(value?: string) {
  const numberValue = Number(value ?? 0);

  if (!Number.isFinite(numberValue)) return 0;

  return Math.max(0, Math.min(100, numberValue));
}

function toBillingModeLabel(value?: string) {
  return value === "subscription" ? "订阅" : "按量";
}

function toSubscriptionSourceLabel(value?: string) {
  if (value === "grant") return "管理员授予";

  return value;
}

function toTransactionTypeLabel(value?: string) {
  const labels: Record<string, string> = {
    adjust: "调整",
    grant: "管理员授予",
    purchase: "购买",
    reset: "窗口刷新",
    usage: "用量消耗",
  };

  return value ? (labels[value] ?? value) : "-";
}

function normalizeGrantDays(value: string) {
  const days = Math.trunc(Number(value));

  return Number.isFinite(days) && days > 0 ? days : 30;
}

function getGrantConfirmMessage(subscription?: UserSubscriptionView) {
  const lines = [
    "授予会直接替换用户当前订阅，并重置订阅钱包额度。该操作不会扣除用户余额。",
  ];

  if (subscription?.subscription) {
    lines.push("该用户已有订阅，继续授予将失效旧订阅并创建新订阅。");
  }

  return lines.join("\n\n");
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getSubscriptionError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
