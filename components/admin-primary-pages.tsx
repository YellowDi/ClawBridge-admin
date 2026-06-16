"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { Key } from "react";
import type { Model as ApiModel, User as ApiUser } from "@/lib/api";

import { Avatar, Button, Chip, SearchField, Tabs } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
} from "@/components/create-user-dialog";
import {
  CreateModelDialog,
  DeleteModelDialog,
  EditModelDialog,
} from "@/components/model-dialog";
import { listModels, listUsers } from "@/lib/api";

type UserStatus = "正常" | "已停用";
type UserFilter = "admin" | "all" | "disabled";

type AdminUser = {
  id: string;
  accountId: string;
  createdAt: string;
  enabled: boolean;
  isAdmin: boolean;
  role: string;
  status: UserStatus;
  updatedAt: string;
  userId: number | null;
  username: string;
};

type UsersLoadState = {
  error: string | null;
  isLoading: boolean;
  users: AdminUser[];
};

const USER_STATUS_COLOR: Record<UserStatus, "danger" | "success"> = {
  已停用: "danger",
  正常: "success",
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const USER_BASE_COLUMNS: DataGridColumn<AdminUser>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <Avatar.Fallback>{getUserInitials(item.username)}</Avatar.Fallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium">{item.username}</span>
          <span className="text-muted truncate text-xs">
            ID {item.accountId}
          </span>
        </div>
      </div>
    ),
    header: "用户",
    id: "username",
    isRowHeader: true,
    minWidth: 240,
  },
  {
    accessorKey: "accountId",
    allowsSorting: true,
    header: "ID",
    id: "accountId",
    minWidth: 100,
  },
  {
    accessorKey: "role",
    allowsSorting: true,
    header: "角色",
    id: "role",
    minWidth: 120,
  },
  {
    cell: (item) => (
      <Chip color={USER_STATUS_COLOR[item.status]} size="sm" variant="soft">
        {item.status}
      </Chip>
    ),
    header: "状态",
    id: "status",
    minWidth: 110,
  },
  {
    accessorKey: "createdAt",
    align: "end",
    allowsSorting: true,
    header: "创建时间",
    id: "createdAt",
    minWidth: 150,
  },
  {
    accessorKey: "updatedAt",
    align: "end",
    allowsSorting: true,
    header: "更新时间",
    id: "updatedAt",
    minWidth: 150,
  },
];

type ModelStatus = "停用" | "启用";

type AdminModel = {
  cacheReadPricePerMillion: string;
  cacheWritePricePerMillion: string;
  createdAt: string;
  currency: string;
  displayName: string;
  displayLabel: string;
  enabled: boolean;
  id: string;
  inputPricePerMillion: string;
  modelRecordId: number | null;
  modelid: string;
  outputPricePerMillion: string;
  provider: string;
  status: ModelStatus;
  updatedAt: string;
};

type ModelsLoadState = {
  error: string | null;
  isLoading: boolean;
  models: AdminModel[];
};

const MODEL_STATUS_COLOR: Record<ModelStatus, "danger" | "success"> = {
  停用: "danger",
  启用: "success",
};

const MODEL_BASE_COLUMNS: DataGridColumn<AdminModel>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">
          {item.displayLabel}
        </span>
        <span className="text-muted truncate text-xs">{item.modelid}</span>
      </div>
    ),
    header: "模型",
    id: "displayLabel",
    isRowHeader: true,
    minWidth: 220,
  },
  {
    accessorKey: "provider",
    allowsSorting: true,
    header: "供应商",
    id: "provider",
    minWidth: 140,
  },
  {
    accessorKey: "inputPricePerMillion",
    align: "end",
    allowsSorting: true,
    cell: (item) =>
      formatPricePerMillion(item.inputPricePerMillion, item.currency),
    header: "输入价格",
    id: "inputPricePerMillion",
    minWidth: 120,
  },
  {
    accessorKey: "outputPricePerMillion",
    align: "end",
    allowsSorting: true,
    cell: (item) =>
      formatPricePerMillion(item.outputPricePerMillion, item.currency),
    header: "输出价格",
    id: "outputPricePerMillion",
    minWidth: 120,
  },
  {
    cell: (item) => (
      <Chip color={MODEL_STATUS_COLOR[item.status]} size="sm" variant="soft">
        {item.status}
      </Chip>
    ),
    header: "状态",
    id: "status",
    minWidth: 110,
  },
  {
    accessorKey: "updatedAt",
    align: "end",
    allowsSorting: true,
    header: "更新时间",
    id: "updatedAt",
    minWidth: 150,
  },
];

type AgentStatus = "已发布" | "草稿" | "需检查";

type AgentTemplate = {
  id: string;
  name: string;
  owner: string;
  tools: string;
  status: AgentStatus;
  updatedAt: string;
};

const AGENTS: AgentTemplate[] = [
  {
    id: "agt_product",
    name: "商品资料分析 Agent",
    owner: "Product Ops",
    status: "已发布",
    tools: "文件解析、联网检索",
    updatedAt: "今天 09:42",
  },
  {
    id: "agt_sourcing",
    name: "采购建议 Agent",
    owner: "Supply Team",
    status: "需检查",
    tools: "供应商库、报价表",
    updatedAt: "昨天 16:20",
  },
  {
    id: "agt_support",
    name: "客户支持 Agent",
    owner: "CS Team",
    status: "草稿",
    tools: "知识库、工单系统",
    updatedAt: "周一 11:18",
  },
];

const AGENT_STATUS_COLOR: Record<
  AgentStatus,
  "default" | "success" | "warning"
> = {
  已发布: "success",
  草稿: "default",
  需检查: "warning",
};

const AGENT_COLUMNS: DataGridColumn<AgentTemplate>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.name}</span>
        <span className="text-muted truncate text-xs">{item.id}</span>
      </div>
    ),
    header: "Agent",
    id: "name",
    isRowHeader: true,
    minWidth: 220,
  },
  {
    accessorKey: "owner",
    allowsSorting: true,
    header: "负责人",
    id: "owner",
    minWidth: 150,
  },
  {
    accessorKey: "tools",
    header: "授权工具",
    id: "tools",
    minWidth: 180,
  },
  {
    cell: (item) => (
      <Chip color={AGENT_STATUS_COLOR[item.status]} size="sm" variant="soft">
        {item.status}
      </Chip>
    ),
    header: "状态",
    id: "status",
    minWidth: 110,
  },
  {
    accessorKey: "updatedAt",
    align: "end",
    header: "更新时间",
    id: "updatedAt",
    minWidth: 120,
  },
];

export function UsersPage() {
  const isMountedRef = useRef(false);
  const [loadState, setLoadState] = useState<UsersLoadState>({
    error: null,
    isLoading: true,
    users: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const { error, isLoading, users } = loadState;

  const loadUsers = useCallback(async () => {
    setLoadState((state) => ({
      ...state,
      error: null,
      isLoading: true,
    }));

    try {
      const response = await listUsers();

      if (isMountedRef.current) {
        setLoadState({
          error: null,
          isLoading: false,
          users: response.map(toAdminUser),
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setLoadState({
          error: getUserListError(error),
          isLoading: false,
          users: [],
        });
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadUsers();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadUsers]);

  const filteredUsers = useMemo(
    () => filterUsers(users, searchQuery, userFilter),
    [searchQuery, userFilter, users],
  );
  const refreshUsers = useCallback(() => void loadUsers(), [loadUsers]);
  const userColumns = useMemo<DataGridColumn<AdminUser>[]>(
    () => [
      ...USER_BASE_COLUMNS,
      {
        align: "end",
        cell: (item) => {
          if (item.userId == null) {
            return <span className="text-muted text-xs">-</span>;
          }

          const user = toEditableUserSummary(item, item.userId);

          return (
            <div className="flex items-center justify-end gap-2">
              <EditUserDialog user={user} onUpdated={refreshUsers} />
              <DeleteUserDialog user={user} onDeleted={refreshUsers} />
            </div>
          );
        },
        header: "操作",
        id: "actions",
        minWidth: 160,
      },
    ],
    [refreshUsers],
  );
  const userStats = useMemo(() => getUserStats(users), [users]);
  const emptyState = getUsersEmptyState({
    error,
    hasFilter: Boolean(searchQuery.trim()) || userFilter !== "all",
    isLoading,
  });

  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            导出用户
          </Button>
          <CreateUserDialog onCreated={() => void loadUsers()} />
        </>
      }
      description="集中管理登录用户、管理员身份和账号状态。"
      eyebrow="Identity"
      title="用户管理"
    >
      <StatGrid
        stats={[
          {
            helper: "当前列表总数",
            label: "总用户",
            value: formatCount(userStats.total, isLoading),
          },
          {
            helper: "可正常登录",
            label: "启用用户",
            value: formatCount(userStats.enabled, isLoading),
          },
          {
            helper: "拥有全部模型权限",
            label: "管理员",
            tone: "accent",
            value: formatCount(userStats.admin, isLoading),
          },
          {
            helper: "不可登录账号",
            label: "已停用",
            tone: "danger",
            value: formatCount(userStats.disabled, isLoading),
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            selectedKey={userFilter}
            onSelectionChange={(key) => setUserFilter(toUserFilter(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="用户筛选">
                <Tabs.Tab className="whitespace-nowrap" id="all">
                  全部
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="admin">
                  管理员
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="disabled">
                  已停用
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <SearchField
            aria-label="搜索用户"
            className="w-full sm:w-[260px]"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索用户名、ID 或角色" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="用户列表"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={userColumns}
          contentClassName="min-w-[980px]"
          data={filteredUsers}
          defaultSortDescriptor={{
            column: "username",
            direction: "ascending",
          }}
          getRowId={(item) => item.id}
          renderEmptyState={() => emptyState}
        />
      </section>
    </AdminPage>
  );
}

function toAdminUser(user: ApiUser, index: number): AdminUser {
  const username = user.username?.trim() || `用户 ${user.id ?? index + 1}`;

  return {
    accountId: user.id == null ? "-" : String(user.id),
    createdAt: formatDateTime(user.createdAt),
    enabled: user.enabled !== false,
    id:
      user.id == null
        ? user.username?.trim() || `user-${index}`
        : String(user.id),
    isAdmin: user.isAdmin === true,
    role: user.isAdmin ? "管理员" : "普通用户",
    status: user.enabled === false ? "已停用" : "正常",
    updatedAt: formatDateTime(user.updatedAt),
    userId: user.id ?? null,
    username,
  };
}

function toEditableUserSummary(user: AdminUser, id: number) {
  return {
    enabled: user.enabled,
    id,
    isAdmin: user.isAdmin,
    username: user.username,
  };
}

function getUserInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return Array.from(value.trim()).slice(0, 2).join("").toUpperCase();
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function getUserStats(users: AdminUser[]) {
  return {
    admin: users.filter((user) => user.role === "管理员").length,
    disabled: users.filter((user) => user.status === "已停用").length,
    enabled: users.filter((user) => user.status === "正常").length,
    total: users.length,
  };
}

function filterUsers(
  users: AdminUser[],
  searchQuery: string,
  userFilter: UserFilter,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return users.filter((user) => {
    if (userFilter === "admin" && user.role !== "管理员") return false;
    if (userFilter === "disabled" && user.status !== "已停用") return false;
    if (!normalizedQuery) return true;

    return [user.username, user.accountId, user.role, user.status].some(
      (value) => value.toLowerCase().includes(normalizedQuery),
    );
  });
}

function toUserFilter(key: Key): UserFilter {
  if (key === "admin" || key === "disabled") return key;

  return "all";
}

function formatCount(value: number, isLoading: boolean) {
  return isLoading ? "-" : String(value);
}

function getUsersEmptyState({
  error,
  hasFilter,
  isLoading,
}: {
  error: string | null;
  hasFilter: boolean;
  isLoading: boolean;
}) {
  if (isLoading) return "正在加载用户...";
  if (error) return error;
  if (hasFilter) return "没有匹配的用户。";

  return "暂无用户数据。";
}

function getUserListError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return "用户列表加载失败。";
}

export function ModelsPage() {
  const isMountedRef = useRef(false);
  const [loadState, setLoadState] = useState<ModelsLoadState>({
    error: null,
    isLoading: true,
    models: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const { error, isLoading, models } = loadState;

  const loadModels = useCallback(async () => {
    setLoadState((state) => ({
      ...state,
      error: null,
      isLoading: true,
    }));

    try {
      const response = await listModels();

      if (isMountedRef.current) {
        setLoadState({
          error: null,
          isLoading: false,
          models: response.map(toAdminModel),
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setLoadState({
          error: getModelListError(error),
          isLoading: false,
          models: [],
        });
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadModels();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadModels]);

  const filteredModels = useMemo(
    () => filterModels(models, searchQuery),
    [models, searchQuery],
  );
  const refreshModels = useCallback(() => void loadModels(), [loadModels]);
  const modelColumns = useMemo<DataGridColumn<AdminModel>[]>(
    () => [
      ...MODEL_BASE_COLUMNS,
      {
        align: "end",
        cell: (item) => {
          if (item.modelRecordId == null) {
            return <span className="text-muted text-xs">-</span>;
          }

          const model = toEditableModelSummary(item, item.modelRecordId);

          return (
            <div className="flex items-center justify-end gap-2">
              <EditModelDialog model={model} onUpdated={refreshModels} />
              <DeleteModelDialog model={model} onDeleted={refreshModels} />
            </div>
          );
        },
        header: "操作",
        id: "actions",
        minWidth: 160,
      },
    ],
    [refreshModels],
  );
  const modelStats = useMemo(() => getModelStats(models), [models]);
  const emptyState = getModelsEmptyState({
    error,
    hasFilter: Boolean(searchQuery.trim()),
    isLoading,
  });

  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            测试路由
          </Button>
          <CreateModelDialog onCreated={() => void loadModels()} />
        </>
      }
      description="配置模型供应商、价格和启用状态。"
      eyebrow="Model Routing"
      title="模型配置"
    >
      <StatGrid
        stats={[
          {
            helper: "可被授权和使用",
            label: "启用模型",
            value: formatCount(modelStats.enabled, isLoading),
          },
          {
            helper: modelStats.providerHelper,
            label: "供应商",
            tone: "accent",
            value: formatCount(modelStats.providers, isLoading),
          },
          {
            helper: "不可授权或使用",
            label: "停用模型",
            tone: "danger",
            value: formatCount(modelStats.disabled, isLoading),
          },
          {
            helper: "当前列表总数",
            label: "总模型",
            value: formatCount(modelStats.total, isLoading),
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-foreground text-base font-semibold">模型列表</h2>
          <SearchField
            aria-label="搜索模型"
            className="w-full sm:w-[260px]"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索模型或供应商" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="模型列表"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={modelColumns}
          contentClassName="min-w-[980px]"
          data={filteredModels}
          defaultSortDescriptor={{
            column: "displayLabel",
            direction: "ascending",
          }}
          getRowId={(item) => item.id}
          renderEmptyState={() => emptyState}
        />
      </section>
    </AdminPage>
  );
}

function toAdminModel(model: ApiModel, index: number): AdminModel {
  const displayName = model.displayName?.trim() ?? "";
  const displayLabel =
    model.displayName?.trim() ||
    model.modelid?.trim() ||
    `模型 ${model.id ?? index + 1}`;

  return {
    cacheReadPricePerMillion: model.cacheReadPricePerMillion?.trim() ?? "",
    cacheWritePricePerMillion: model.cacheWritePricePerMillion?.trim() ?? "",
    createdAt: formatDateTime(model.createdAt),
    currency: model.currency?.trim() ?? "",
    displayName,
    displayLabel,
    enabled: model.enabled !== false,
    id:
      model.id == null
        ? model.modelid?.trim() || `model-${index}`
        : String(model.id),
    inputPricePerMillion: model.inputPricePerMillion?.trim() ?? "",
    modelRecordId: model.id ?? null,
    modelid: model.modelid?.trim() ?? "-",
    outputPricePerMillion: model.outputPricePerMillion?.trim() ?? "",
    provider: model.provider?.trim() || "-",
    status: model.enabled === false ? "停用" : "启用",
    updatedAt: formatDateTime(model.updatedAt),
  };
}

function toEditableModelSummary(model: AdminModel, id: number) {
  return {
    cacheReadPricePerMillion: model.cacheReadPricePerMillion,
    cacheWritePricePerMillion: model.cacheWritePricePerMillion,
    currency: model.currency,
    displayName: model.displayName,
    enabled: model.enabled,
    id,
    inputPricePerMillion: model.inputPricePerMillion,
    modelid: model.modelid === "-" ? "" : model.modelid,
    outputPricePerMillion: model.outputPricePerMillion,
    provider: model.provider === "-" ? "" : model.provider,
  };
}

function filterModels(models: AdminModel[], searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) return models;

  return models.filter((model) =>
    [
      model.displayName,
      model.displayLabel,
      model.modelid,
      model.provider,
      model.currency,
      model.status,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}

function getModelStats(models: AdminModel[]) {
  const providers = Array.from(
    new Set(
      models
        .map((model) => model.provider)
        .filter((provider) => provider && provider !== "-"),
    ),
  );

  return {
    disabled: models.filter((model) => model.status === "停用").length,
    enabled: models.filter((model) => model.status === "启用").length,
    providerHelper: providers.length ? providers.join(" / ") : "暂无供应商",
    providers: providers.length,
    total: models.length,
  };
}

function formatPricePerMillion(value: string, currency: string) {
  if (!value) return "-";

  return currency ? `${value} ${currency}` : value;
}

function getModelsEmptyState({
  error,
  hasFilter,
  isLoading,
}: {
  error: string | null;
  hasFilter: boolean;
  isLoading: boolean;
}) {
  if (isLoading) return "正在加载模型...";
  if (error) return error;
  if (hasFilter) return "没有匹配的模型。";

  return "暂无模型数据。";
}

function getModelListError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return "模型列表加载失败。";
}

export function AgentsPage() {
  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            发布检查
          </Button>
          <Button size="sm">
            <AdminIcon className="size-4" name="plus" />
            新建 Agent
          </Button>
        </>
      }
      description="维护 Agent 模板、工具授权、触发条件和发布状态，为后续真实编排接口预留清晰结构。"
      eyebrow="Agent Studio"
      title="Agent 编排"
    >
      <StatGrid
        stats={[
          { helper: "18 个运行中", label: "Agent 模板", value: "23" },
          {
            helper: "需要权限复核",
            label: "发布检查",
            tone: "warning",
            value: "5",
          },
          {
            helper: "文件、检索、数据表",
            label: "可用工具",
            tone: "accent",
            value: "14",
          },
          { helper: "过去 24 小时", label: "运行任务", value: "642" },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultSelectedKey="templates">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Agent 视图">
                <Tabs.Tab id="templates">
                  模板
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="runs">
                  运行
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="checks">
                  检查
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <SearchField aria-label="搜索 Agent" className="w-full sm:w-[260px]">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索 Agent 或负责人" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="Agent 模板"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={AGENT_COLUMNS}
          contentClassName="min-w-[780px]"
          data={AGENTS}
          getRowId={(item) => item.id}
        />
      </section>
    </AdminPage>
  );
}
