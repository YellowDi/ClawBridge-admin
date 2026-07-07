"use client";

import type {
  Agent,
  Model,
  UserBalance,
  UserBalanceTransaction,
} from "@/lib/api";
import type { EditableUserSummary } from "@/components/create-user-dialog";

import {
  Button,
  Checkbox,
  Description,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import {
  adjustUserBalance,
  getUserBalance,
  listAgents,
  listModels,
  listUserAgents,
  listUserBalanceTransactions,
  listUserModels,
  replaceUserAgents,
  replaceUserModels,
} from "@/lib/api";

type AuthorizationState = {
  agents: Agent[];
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  models: Model[];
  selectedAgentIds: number[];
  selectedModelIds: number[];
};

type BalanceState = {
  balance?: UserBalance;
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  transactions: UserBalanceTransaction[];
};

type BalanceForm = {
  amount: string;
  description: string;
  direction: string;
  type: string;
};

const DEFAULT_BALANCE_FORM: BalanceForm = {
  amount: "",
  description: "",
  direction: "credit",
  type: "adjustment",
};

export function UserAuthorizationDialog({
  user,
}: {
  user: EditableUserSummary;
}) {
  const modal = useOverlayState();

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          授权
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>用户授权</Modal.Heading>
              <p className="text-muted text-sm">{user.username}</p>
            </Modal.Header>
            <UserAuthorizationPanel
              isActive={modal.isOpen}
              user={user}
              onClose={() => modal.close()}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function UserAuthorizationPanel({
  isActive,
  onClose,
  user,
}: {
  isActive: boolean;
  onClose: () => void;
  user: EditableUserSummary;
}) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<AuthorizationState>({
    agents: [],
    error: null,
    isLoading: false,
    isSaving: false,
    models: [],
    selectedAgentIds: [],
    selectedModelIds: [],
  });
  const isBusy = state.isLoading || state.isSaving;

  useEffect(() => {
    if (!isActive) {
      loadRequestRef.current += 1;

      return;
    }

    void loadAuthorization();

    return () => {
      loadRequestRef.current += 1;
    };
  }, [isActive, user.id]);

  async function loadAuthorization() {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const [models, agents, userModels, userAgents] = await Promise.all([
        listModels({ pageSize: 500 }),
        listAgents({ pageSize: 500 }),
        listUserModels({ pageSize: 500, userId: user.id }),
        listUserAgents({ pageSize: 500, userId: user.id }),
      ]);

      if (loadRequestRef.current !== requestId) return;

      setState({
        agents,
        error: null,
        isLoading: false,
        isSaving: false,
        models,
        selectedAgentIds: getRecordIds(userAgents),
        selectedModelIds: getRecordIds(userModels),
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      const message = getAccessError(error, "用户授权加载失败。");

      setState((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }));
      toast.danger(message);
    }
  }

  async function saveAuthorization() {
    setState((current) => ({ ...current, error: null, isSaving: true }));

    try {
      const [userModels, userAgents] = await Promise.all([
        replaceUserModels({
          modelIds: state.selectedModelIds,
          userId: user.id,
        }),
        replaceUserAgents({
          agentIds: state.selectedAgentIds,
          userId: user.id,
        }),
      ]);

      setState((current) => ({
        ...current,
        error: null,
        isSaving: false,
        selectedAgentIds: getRecordIds(userAgents),
        selectedModelIds: getRecordIds(userModels),
      }));
      toast.success("用户授权已保存。");
    } catch (error) {
      const message = getAccessError(error, "保存授权失败。");

      setState((current) => ({
        ...current,
        error: message,
        isSaving: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <>
      <Modal.Body className="flex min-w-0 flex-col gap-4">
        {state.isLoading ? (
          <div className="text-muted text-sm">正在加载授权...</div>
        ) : null}
        {state.error ? <AccessError>{state.error}</AccessError> : null}
        <AccessList
          emptyText="暂无模型配置。"
          items={state.models}
          selectedIds={state.selectedModelIds}
          title="模型授权"
          onToggle={(id, selected) =>
            setState((current) => ({
              ...current,
              selectedModelIds: toggleId(
                current.selectedModelIds,
                id,
                selected,
              ),
            }))
          }
        />
        <AccessList
          emptyText="暂无 Agent 配置。"
          items={state.agents}
          selectedIds={state.selectedAgentIds}
          title="Agent 授权"
          onToggle={(id, selected) =>
            setState((current) => ({
              ...current,
              selectedAgentIds: toggleId(
                current.selectedAgentIds,
                id,
                selected,
              ),
            }))
          }
        />
      </Modal.Body>
      <Modal.Footer>
        <Button isDisabled={isBusy} variant="tertiary" onPress={onClose}>
          关闭
        </Button>
        <Button isDisabled={isBusy} onPress={saveAuthorization}>
          {state.isSaving ? "保存中..." : "保存授权"}
        </Button>
      </Modal.Footer>
    </>
  );
}

export function UserBalanceDialog({ user }: { user: EditableUserSummary }) {
  const modal = useOverlayState();

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          余额
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="inside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>用户余额</Modal.Heading>
              <p className="text-muted text-sm">{user.username}</p>
            </Modal.Header>
            <UserBalancePanel
              isActive={modal.isOpen}
              user={user}
              onClose={() => modal.close()}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function UserBalancePanel({
  isActive,
  onClose,
  showTransactions = true,
  user,
}: {
  isActive: boolean;
  onClose: () => void;
  showTransactions?: boolean;
  user: EditableUserSummary;
}) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<BalanceState>({
    balance: undefined,
    error: null,
    isLoading: false,
    isSaving: false,
    transactions: [],
  });
  const [form, setForm] = useState<BalanceForm>(DEFAULT_BALANCE_FORM);
  const isBusy = state.isLoading || state.isSaving;

  useEffect(() => {
    if (!isActive) {
      loadRequestRef.current += 1;

      return;
    }

    void loadBalance();

    return () => {
      loadRequestRef.current += 1;
    };
  }, [isActive, showTransactions, user.id]);

  async function loadBalance() {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const [balance, transactions] = await Promise.all([
        getUserBalance({ currency: "CNY", userId: user.id }),
        showTransactions
          ? listUserBalanceTransactions({
              currency: "CNY",
              pageSize: 10,
              userId: user.id,
            })
          : Promise.resolve([]),
      ]);

      if (loadRequestRef.current !== requestId) return;

      setState({
        balance,
        error: null,
        isLoading: false,
        isSaving: false,
        transactions,
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      const message = getAccessError(error, "用户余额加载失败。");

      setState((current) => ({
        ...current,
        error: message,
        isLoading: false,
        isSaving: false,
      }));
      toast.danger(message);
    }
  }

  async function saveBalance() {
    const amount = form.amount.trim();

    if (!amount) {
      const message = "请输入调整金额。";

      setState((current) => ({ ...current, error: message }));
      toast.danger(message);

      return;
    }

    setState((current) => ({ ...current, error: null, isSaving: true }));

    try {
      await adjustUserBalance({
        amount,
        currency: "CNY",
        description: form.description.trim() || "admin adjustment",
        direction: form.direction,
        type: form.type,
        userId: user.id,
      });
      setForm(DEFAULT_BALANCE_FORM);
      await loadBalance();
      toast.success("用户余额已调整。");
    } catch (error) {
      const message = getAccessError(error, "调整余额失败。");

      setState((current) => ({
        ...current,
        error: message,
        isSaving: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <>
      <Modal.Body className="flex min-w-0 flex-col gap-4">
        {state.isLoading ? (
          <div className="text-muted text-sm">正在加载余额...</div>
        ) : null}
        {state.error ? <AccessError>{state.error}</AccessError> : null}

        <div className="grid grid-cols-2 gap-3">
          <BalanceMetric
            label="可用余额"
            value={state.balance?.availableAmount}
          />
          <BalanceMetric label="冻结余额" value={state.balance?.frozenAmount} />
          <BalanceMetric
            label="累计充值"
            value={state.balance?.totalRechargedAmount}
          />
          <BalanceMetric
            label="累计消费"
            value={state.balance?.totalConsumedAmount}
          />
        </div>

        <div className="grid gap-3">
          <Select
            fullWidth
            selectedKey={form.direction}
            variant="secondary"
            onSelectionChange={(key) =>
              setForm((current) => ({
                ...current,
                direction: String(key ?? "credit"),
              }))
            }
          >
            <Label>方向</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="credit" textValue="增加余额">
                  增加余额
                </ListBox.Item>
                <ListBox.Item id="debit" textValue="减少余额">
                  减少余额
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          <Select
            fullWidth
            selectedKey={form.type}
            variant="secondary"
            onSelectionChange={(key) =>
              setForm((current) => ({
                ...current,
                type: String(key ?? "adjustment"),
              }))
            }
          >
            <Label>类型</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="adjustment" textValue="手动调整">
                  手动调整
                </ListBox.Item>
                <ListBox.Item id="recharge" textValue="充值">
                  充值
                </ListBox.Item>
                <ListBox.Item id="refund" textValue="退款">
                  退款
                </ListBox.Item>
                <ListBox.Item id="grant" textValue="赠送额度">
                  赠送额度
                </ListBox.Item>
                <ListBox.Item id="expire" textValue="额度过期">
                  额度过期
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
          <TextField fullWidth variant="secondary">
            <Label>金额</Label>
            <Input
              inputMode="decimal"
              placeholder="100.0000000000"
              value={form.amount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  amount: event.target.value,
                }))
              }
            />
          </TextField>
          <TextField fullWidth variant="secondary">
            <Label>说明</Label>
            <Input
              placeholder="manual adjustment"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </TextField>
        </div>

        {showTransactions ? (
          <section className="flex min-w-0 flex-col gap-2">
            <h3 className="text-sm font-semibold">最近流水</h3>
            {state.transactions.length === 0 ? (
              <span className="text-muted text-sm">暂无余额流水。</span>
            ) : null}
            {state.transactions.map((transaction) => (
              <div
                key={transaction.id ?? transaction.createdAt}
                className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-surface px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">
                    {transaction.description || transaction.type || "-"}
                  </div>
                  <div className="text-muted truncate">
                    {transaction.direction || "-"} ·{" "}
                    {formatDateTime(transaction.createdAt)}
                  </div>
                </div>
                <div className="text-right font-medium">
                  {transaction.amount ?? "-"}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <Button isDisabled={isBusy} variant="tertiary" onPress={onClose}>
          关闭
        </Button>
        <Button isDisabled={isBusy} onPress={saveBalance}>
          {state.isSaving ? "调整中..." : "调整余额"}
        </Button>
      </Modal.Footer>
    </>
  );
}

function AccessList({
  emptyText,
  items,
  onToggle,
  selectedIds,
  title,
}: {
  emptyText: string;
  items: Array<Agent | Model>;
  onToggle: (id: number, selected: boolean) => void;
  selectedIds: number[];
  title: string;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="max-h-72 overflow-auto pr-1">
        {items.length === 0 ? (
          <span className="text-muted text-sm">{emptyText}</span>
        ) : null}
        <div className="grid gap-2">
          {items.map((item) => {
            const itemId = item.id;

            if (itemId == null) return null;

            return (
              <Checkbox
                key={itemId}
                isSelected={selectedIds.includes(itemId)}
                onChange={(selected) => onToggle(itemId, selected)}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="truncate">{getItemLabel(item)}</span>
                </Checkbox.Content>
                <Description>{getItemDescription(item)}</Description>
              </Checkbox>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BalanceMetric({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md bg-surface px-3 py-2">
      <div className="text-muted text-xs">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold tabular-nums">
        {value ?? "-"}
      </div>
    </div>
  );
}

function AccessError({ children }: { children: string }) {
  return (
    <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function toggleId(ids: number[], id: number, selected: boolean) {
  if (selected) return ids.includes(id) ? ids : [...ids, id];

  return ids.filter((item) => item !== id);
}

function getRecordIds(items: Array<{ id?: number }>) {
  return items
    .map((item) => item.id)
    .filter((id): id is number => typeof id === "number");
}

function getItemLabel(item: Agent | Model) {
  return (
    stringValue(item.displayName) ||
    stringValue(item.modelid) ||
    stringValue(item.agentId) ||
    "-"
  );
}

function getItemDescription(item: Agent | Model) {
  const provider = stringValue(item.provider);
  const modelid = stringValue(item.modelid);

  if (provider || modelid) return [provider, modelid].filter(Boolean).join("/");

  return stringValue(item.agentId) || "-";
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

function getAccessError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
