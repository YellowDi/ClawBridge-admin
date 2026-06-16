"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { Key } from "react";
import type { User as ApiUser } from "@/lib/api";

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
import { listUsers } from "@/lib/api";

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

type ModelStatus = "默认" | "可用" | "待配置";

type ModelRoute = {
  id: string;
  name: string;
  provider: string;
  context: string;
  status: ModelStatus;
  fallback: string;
};

const MODEL_ROUTES: ModelRoute[] = [
  {
    context: "128K",
    fallback: "Claude Sonnet",
    id: "mdl_001",
    name: "GPT-5.4",
    provider: "OpenAI",
    status: "默认",
  },
  {
    context: "200K",
    fallback: "GPT-5.4",
    id: "mdl_002",
    name: "Claude Sonnet",
    provider: "Anthropic",
    status: "可用",
  },
  {
    context: "64K",
    fallback: "GPT-5.4",
    id: "mdl_003",
    name: "Qwen Max",
    provider: "DashScope",
    status: "待配置",
  },
];

const MODEL_STATUS_COLOR: Record<
  ModelStatus,
  "accent" | "success" | "warning"
> = {
  可用: "success",
  默认: "accent",
  待配置: "warning",
};

const MODEL_COLUMNS: DataGridColumn<ModelRoute>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.name}</span>
        <span className="text-muted truncate text-xs">{item.id}</span>
      </div>
    ),
    header: "模型",
    id: "name",
    isRowHeader: true,
    minWidth: 190,
  },
  {
    accessorKey: "provider",
    allowsSorting: true,
    header: "供应商",
    id: "provider",
    minWidth: 140,
  },
  {
    accessorKey: "context",
    align: "end",
    allowsSorting: true,
    header: "上下文",
    id: "context",
    minWidth: 100,
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
    accessorKey: "fallback",
    header: "降级模型",
    id: "fallback",
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
  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            测试路由
          </Button>
          <Button size="sm">
            <AdminIcon className="size-4" name="plus" />
            新增模型
          </Button>
        </>
      }
      description="配置模型供应商、默认路由、降级策略与调用预算。接口完成前先固定前端结构。"
      eyebrow="Model Routing"
      title="模型配置"
    >
      <StatGrid
        stats={[
          { helper: "默认路由 1 个", label: "启用模型", value: "7" },
          {
            helper: "OpenAI / Anthropic / DashScope",
            label: "供应商",
            tone: "accent",
            value: "3",
          },
          {
            helper: "需要密钥或限额",
            label: "待配置",
            tone: "warning",
            value: "2",
          },
          { helper: "过去 24 小时", label: "降级次数", value: "18" },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-foreground text-base font-semibold">模型路由</h2>
          <SearchField aria-label="搜索模型" className="w-full sm:w-[260px]">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索模型或供应商" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="模型路由"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={MODEL_COLUMNS}
          contentClassName="min-w-[720px]"
          data={MODEL_ROUTES}
          getRowId={(item) => item.id}
        />
      </section>
    </AdminPage>
  );
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
