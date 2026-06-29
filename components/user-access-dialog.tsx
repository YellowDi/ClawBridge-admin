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
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useRef, useState } from "react";

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

type AccessState = {
  agents: Agent[];
  balance?: UserBalance;
  error: string | null;
  isAdjustingBalance: boolean;
  isLoading: boolean;
  isSavingAccess: boolean;
  models: Model[];
  selectedAgentIds: number[];
  selectedModelIds: number[];
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

export function UserAccessDialog({ user }: { user: EditableUserSummary }) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<AccessState>({
    agents: [],
    balance: undefined,
    error: null,
    isAdjustingBalance: false,
    isLoading: false,
    isSavingAccess: false,
    models: [],
    selectedAgentIds: [],
    selectedModelIds: [],
    transactions: [],
  });
  const [balanceForm, setBalanceForm] =
    useState<BalanceForm>(DEFAULT_BALANCE_FORM);
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) {
        loadRequestRef.current += 1;

        return;
      }

      void loadAccess();
    },
  });
  const isBusy =
    state.isLoading || state.isSavingAccess || state.isAdjustingBalance;

  async function loadAccess() {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const [models, agents, userModels, userAgents, balance, transactions] =
        await Promise.all([
          listModels({ pageSize: 500 }),
          listAgents({ pageSize: 500 }),
          listUserModels({ pageSize: 500, userId: user.id }),
          listUserAgents({ pageSize: 500, userId: user.id }),
          getUserBalance({ currency: "CNY", userId: user.id }),
          listUserBalanceTransactions({
            currency: "CNY",
            pageSize: 10,
            userId: user.id,
          }),
        ]);

      if (loadRequestRef.current !== requestId) return;

      setState({
        agents,
        balance,
        error: null,
        isAdjustingBalance: false,
        isLoading: false,
        isSavingAccess: false,
        models,
        selectedAgentIds: getRecordIds(userAgents),
        selectedModelIds: getRecordIds(userModels),
        transactions,
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      setState((current) => ({
        ...current,
        error: getAccessError(error, "用户授权与余额加载失败。"),
        isLoading: false,
      }));
    }
  }

  function toggleModel(id: number, selected: boolean) {
    setState((current) => ({
      ...current,
      selectedModelIds: toggleId(current.selectedModelIds, id, selected),
    }));
  }

  function toggleAgent(id: number, selected: boolean) {
    setState((current) => ({
      ...current,
      selectedAgentIds: toggleId(current.selectedAgentIds, id, selected),
    }));
  }

  async function saveAccess() {
    setState((current) => ({
      ...current,
      error: null,
      isSavingAccess: true,
    }));

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
        isSavingAccess: false,
        selectedAgentIds: getRecordIds(userAgents),
        selectedModelIds: getRecordIds(userModels),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getAccessError(error, "保存授权失败。"),
        isSavingAccess: false,
      }));
    }
  }

  async function adjustBalance() {
    const amount = balanceForm.amount.trim();

    if (!amount) {
      setState((current) => ({
        ...current,
        error: "请输入调整金额。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isAdjustingBalance: true,
    }));

    try {
      const result = await adjustUserBalance({
        amount,
        currency: "CNY",
        description: balanceForm.description.trim() || "admin adjustment",
        direction: balanceForm.direction,
        type: balanceForm.type,
        userId: user.id,
      });
      const [balance, transactions] = await Promise.all([
        getUserBalance({ currency: "CNY", userId: user.id }),
        listUserBalanceTransactions({
          currency: "CNY",
          pageSize: 10,
          userId: user.id,
        }),
      ]);

      setState((current) => ({
        ...current,
        balance: balance ?? result?.balance,
        error: null,
        isAdjustingBalance: false,
        transactions,
      }));
      setBalanceForm(DEFAULT_BALANCE_FORM);
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getAccessError(error, "调整余额失败。"),
        isAdjustingBalance: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          授权与余额
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isBusy}
        isKeyboardDismissDisabled={isBusy}
      >
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>授权与余额</Modal.Heading>
              <p className="text-muted text-sm">{user.username}</p>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-5">
              {state.isLoading ? (
                <div className="text-muted text-sm">正在加载用户数据...</div>
              ) : null}
              {state.error ? <AccessError>{state.error}</AccessError> : null}

              <section className="grid gap-4 lg:grid-cols-2">
                <AccessList
                  emptyText="暂无模型配置。"
                  items={state.models}
                  selectedIds={state.selectedModelIds}
                  title="模型授权"
                  onToggle={toggleModel}
                />
                <AccessList
                  emptyText="暂无 Agent 配置。"
                  items={state.agents}
                  selectedIds={state.selectedAgentIds}
                  title="Agent 授权"
                  onToggle={toggleAgent}
                />
              </section>

              <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                <div className="rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold">余额</h3>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <BalanceMetric
                      label="可用余额"
                      value={state.balance?.availableAmount}
                    />
                    <BalanceMetric
                      label="冻结余额"
                      value={state.balance?.frozenAmount}
                    />
                    <BalanceMetric
                      label="累计充值"
                      value={state.balance?.totalRechargedAmount}
                    />
                    <BalanceMetric
                      label="累计消费"
                      value={state.balance?.totalConsumedAmount}
                    />
                  </div>

                  <div className="mt-4 grid gap-3">
                    <Select
                      fullWidth
                      selectedKey={balanceForm.direction}
                      variant="secondary"
                      onSelectionChange={(key) =>
                        setBalanceForm((current) => ({
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
                          <ListBox.Item id="credit">增加余额</ListBox.Item>
                          <ListBox.Item id="debit">减少余额</ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <Select
                      fullWidth
                      selectedKey={balanceForm.type}
                      variant="secondary"
                      onSelectionChange={(key) =>
                        setBalanceForm((current) => ({
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
                          <ListBox.Item id="adjustment">手动调整</ListBox.Item>
                          <ListBox.Item id="recharge">充值</ListBox.Item>
                          <ListBox.Item id="refund">退款</ListBox.Item>
                          <ListBox.Item id="grant">赠送额度</ListBox.Item>
                          <ListBox.Item id="expire">额度过期</ListBox.Item>
                        </ListBox>
                      </Select.Popover>
                    </Select>
                    <TextField fullWidth variant="secondary">
                      <Label>金额</Label>
                      <Input
                        inputMode="decimal"
                        placeholder="100.0000000000"
                        value={balanceForm.amount}
                        onChange={(event) =>
                          setBalanceForm((current) => ({
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
                        value={balanceForm.description}
                        onChange={(event) =>
                          setBalanceForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </TextField>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <h3 className="text-sm font-semibold">最近流水</h3>
                  <div className="mt-3 flex flex-col gap-2">
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
                  </div>
                </div>
              </section>
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isBusy}
                variant="tertiary"
                onPress={() => modal.close()}
              >
                关闭
              </Button>
              <Button
                isDisabled={isBusy}
                variant="secondary"
                onPress={adjustBalance}
              >
                {state.isAdjustingBalance ? "调整中..." : "调整余额"}
              </Button>
              <Button isDisabled={isBusy} onPress={saveAccess}>
                {state.isSavingAccess ? "保存中..." : "保存授权"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
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
    <div className="rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 max-h-64 overflow-auto pr-1">
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
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <span className="block truncate text-sm font-medium">
                    {getItemLabel(item)}
                  </span>
                  <span className="text-muted block truncate text-xs">
                    {getItemDescription(item)}
                  </span>
                </Checkbox.Content>
              </Checkbox>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BalanceMetric({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md bg-surface px-3 py-2">
      <div className="text-muted text-xs">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value ?? "-"}</div>
    </div>
  );
}

function AccessError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
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
