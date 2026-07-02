"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { Key } from "react";
import type { User as ApiUser } from "@/lib/api";

import { Avatar, Chip, SearchField, Tabs } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
} from "@/components/create-user-dialog";
import { KnowledgeAvailabilityDialog } from "@/components/knowledge-availability-dialog";
import {
  UserAuthorizationDialog,
  UserBalanceDialog,
} from "@/components/user-access-dialog";
import { listUsers } from "@/lib/api";

type UserStatus = "正常" | "已停用";
type UserFilter = "admin" | "all" | "disabled";

type AdminUser = {
  id: string;
  accountId: string;
  createdAt: string;
  enabled: boolean;
  isAdmin: boolean;
  knowledgeBaseIds: number[];
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
              <KnowledgeAvailabilityDialog
                selectedKnowledgeBaseIds={item.knowledgeBaseIds}
                subjectId={user.id}
                subjectLabel={user.username}
                subjectType="user"
                onSaved={refreshUsers}
              />
              <UserAuthorizationDialog user={user} />
              <UserBalanceDialog user={user} />
              <EditUserDialog user={user} onUpdated={refreshUsers} />
              <DeleteUserDialog user={user} onDeleted={refreshUsers} />
            </div>
          );
        },
        cellClassName: "w-[360px] min-w-[360px] max-w-[360px] pl-4 pr-4",
        header: "操作",
        headerClassName: "w-[360px] min-w-[360px] max-w-[360px] pl-4 pr-4",
        id: "actions",
        pinned: "end",
        width: 360,
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
      actions={<CreateUserDialog onCreated={() => void loadUsers()} />}
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
          contentClassName="min-w-[1160px]"
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
    knowledgeBaseIds: getKnowledgeBaseIds(user.knowledgeBases),
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

function getKnowledgeBaseIds(
  knowledgeBases?: Array<{
    id?: number;
  }>,
) {
  return Array.from(
    new Set(
      (knowledgeBases ?? []).flatMap((knowledgeBase) => {
        const id = knowledgeBase.id;

        return typeof id === "number" && Number.isFinite(id) ? [id] : [];
      }),
    ),
  );
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

export { AgentsPage } from "@/components/agents-page";
export { ModelsPage } from "@/components/models-page";
