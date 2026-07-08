"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { Key } from "react";
import type { User as ApiUser } from "@/lib/api";
import type { EditableUserSummary } from "@/components/create-user-dialog";

import {
  Avatar,
  Button,
  Chip,
  Dropdown,
  SearchField,
  Tabs,
  toast,
  useOverlayState,
} from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import { AdminIcon } from "@/components/admin-icons";
import {
  CreateUserDialog,
  DeleteUserDialog,
} from "@/components/create-user-dialog";
import { UserSettingsDialog } from "@/components/user-settings-dialog";
import { listUsers } from "@/lib/api";

type UserStatus = "正常" | "已停用";
type UserFilter = "admin" | "all" | "disabled";

type AdminUser = {
  id: string;
  accountId: string;
  accountNature: string;
  accountType: string;
  adminSeatLimit: number;
  avatarUrl: string;
  billingMode: string;
  createdAt: string;
  displayName: string;
  enabled: boolean;
  isAdmin: boolean;
  knowledgeBaseIds: number[];
  parentUserId: number;
  role: string;
  seatLimit: number;
  status: UserStatus;
  updatedAt: string;
  usedSeats: number;
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

const BILLING_MODE_COLOR: Record<string, "accent" | "default"> = {
  metered: "default",
  subscription: "accent",
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
          {item.avatarUrl ? (
            <Avatar.Image alt={`${item.username} 头像`} src={item.avatarUrl} />
          ) : null}
          <Avatar.Fallback>{getUserInitials(item.username)}</Avatar.Fallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium">{item.username}</span>
          <span className="text-muted truncate text-xs">
            {item.displayName || `ID ${item.accountId}`}
          </span>
        </div>
      </div>
    ),
    header: "用户",
    headerClassName: "whitespace-nowrap",
    id: "username",
    isRowHeader: true,
    minWidth: 220,
    width: 240,
  },
  {
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">
          {toAccountTypeLabel(item)}
        </span>
        <span className="text-muted truncate text-xs">
          {item.parentUserId > 0 ? `主账号 ${item.parentUserId}` : "主账号"}
        </span>
      </div>
    ),
    allowsSorting: true,
    header: "账号类型",
    headerClassName: "whitespace-nowrap",
    id: "accountType",
    width: 130,
  },
  {
    cell: (item) => toAccountNatureLabel(item.accountNature),
    allowsSorting: true,
    cellClassName: "whitespace-nowrap",
    header: "账号性质",
    headerClassName: "whitespace-nowrap",
    id: "accountNature",
    width: 96,
  },
  {
    cell: (item) => (item.parentUserId > 0 ? "-" : item.adminSeatLimit),
    cellClassName: "whitespace-nowrap tabular-nums",
    header: "管理员席位",
    headerClassName: "whitespace-nowrap",
    id: "adminSeatLimit",
    width: 104,
  },
  {
    cell: (item) => (item.parentUserId > 0 ? "-" : item.seatLimit),
    cellClassName: "whitespace-nowrap tabular-nums",
    header: "当前生效席位",
    headerClassName: "whitespace-nowrap",
    id: "seatLimit",
    width: 120,
  },
  {
    cell: (item) => (
      <Chip
        className="whitespace-nowrap"
        color={BILLING_MODE_COLOR[item.billingMode] ?? "default"}
        size="sm"
        variant="soft"
      >
        {toBillingModeLabel(item.billingMode)}
      </Chip>
    ),
    cellClassName: "whitespace-nowrap",
    header: "计费模式",
    headerClassName: "whitespace-nowrap",
    id: "billingMode",
    width: 96,
  },
  {
    cell: (item) => (item.isAdmin ? "是" : "否"),
    cellClassName: "whitespace-nowrap",
    header: "管理员",
    headerClassName: "whitespace-nowrap",
    id: "isAdmin",
    width: 88,
  },
  {
    cellClassName: "whitespace-nowrap",
    cell: (item) => (
      <Chip
        className="whitespace-nowrap"
        color={USER_STATUS_COLOR[item.status]}
        size="sm"
        variant="soft"
      >
        {item.status}
      </Chip>
    ),
    header: "状态",
    headerClassName: "whitespace-nowrap",
    id: "status",
    width: 88,
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
          users: response.map((user, index) =>
            toAdminUser(user, index, response),
          ),
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        const message = getUserListError(error);

        setLoadState({
          error: message,
          isLoading: false,
          users: [],
        });
        toast.danger(message);
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
            <UserRowActions
              selectedKnowledgeBaseIds={item.knowledgeBaseIds}
              user={user}
              onChanged={refreshUsers}
            />
          );
        },
        cellClassName: "w-[132px] min-w-[132px] max-w-[132px] pl-4 pr-4",
        header: "操作",
        headerClassName:
          "w-[132px] min-w-[132px] max-w-[132px] whitespace-nowrap pl-4 pr-4",
        id: "actions",
        pinned: "end",
        width: 132,
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
            label: "团队账号",
            tone: "accent",
            value: formatCount(userStats.team, isLoading),
          },
          {
            helper: "当前使用套餐额度",
            label: "订阅账号",
            tone: "warning",
            value: formatCount(userStats.subscription, isLoading),
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
              <SearchField.Input placeholder="搜索用户名、展示名或账号类型" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="用户列表"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={userColumns}
          contentClassName="min-w-[1080px]"
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

function UserRowActions({
  onChanged,
  selectedKnowledgeBaseIds,
  user,
}: {
  onChanged: () => void;
  selectedKnowledgeBaseIds: number[];
  user: EditableUserSummary;
}) {
  const deleteModal = useOverlayState();

  return (
    <div className="flex items-center justify-end gap-2">
      <UserSettingsDialog
        selectedKnowledgeBaseIds={selectedKnowledgeBaseIds}
        user={user}
        onUpdated={onChanged}
      />
      <Dropdown>
        <Button isIconOnly aria-label="更多操作" size="sm" variant="tertiary">
          <AdminIcon className="size-4" name="more" />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            aria-label={`${user.username} 更多操作`}
            onAction={(key) => {
              if (key === "delete") deleteModal.open();
            }}
          >
            <Dropdown.Item id="delete" variant="danger">
              删除
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <DeleteUserDialog
        hideTrigger
        state={deleteModal}
        user={user}
        onDeleted={onChanged}
      />
    </div>
  );
}

function toAdminUser(
  user: ApiUser,
  index: number,
  users: ApiUser[],
): AdminUser {
  const username = user.username?.trim() || `用户 ${user.id ?? index + 1}`;
  const parentUserId = user.parentUserId ?? 0;
  const accountType = user.accountType ?? (parentUserId > 0 ? "sub" : "main");
  const accountNature = user.accountNature ?? "personal";
  const billingMode = user.billingMode ?? "metered";
  const adminSeatLimit =
    accountNature === "team" ? (user.adminSeatLimit ?? 0) : 0;
  const seatLimit = accountNature === "team" ? (user.seatLimit ?? 0) : 0;

  return {
    accountId: user.id == null ? "-" : String(user.id),
    accountNature,
    accountType,
    adminSeatLimit,
    avatarUrl: user.avatarUrl?.trim() ?? "",
    billingMode,
    createdAt: formatDateTime(user.createdAt),
    displayName: user.displayName?.trim() ?? "",
    enabled: user.enabled !== false,
    id:
      user.id == null
        ? user.username?.trim() || `user-${index}`
        : String(user.id),
    isAdmin: user.isAdmin === true,
    knowledgeBaseIds: getKnowledgeBaseIds(user.knowledgeBases),
    parentUserId,
    role: user.isAdmin ? "管理员" : "普通用户",
    seatLimit,
    status: user.enabled === false ? "已停用" : "正常",
    updatedAt: formatDateTime(user.updatedAt),
    usedSeats: getUsedSeatCount(user, users),
    userId: user.id ?? null,
    username,
  };
}

function toEditableUserSummary(user: AdminUser, id: number) {
  return {
    accountNature: user.accountNature,
    accountType: user.accountType,
    adminSeatLimit: user.adminSeatLimit,
    billingMode: user.billingMode,
    displayName: user.displayName,
    enabled: user.enabled,
    id,
    isAdmin: user.isAdmin,
    parentUserId: user.parentUserId,
    seatLimit: user.seatLimit,
    usedSeats: user.usedSeats,
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
    subscription: users.filter((user) => user.billingMode === "subscription")
      .length,
    team: users.filter((user) => user.accountNature === "team").length,
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

    return [
      user.username,
      user.displayName,
      user.accountId,
      user.role,
      user.status,
      toAccountTypeLabel(user),
      toAccountNatureLabel(user.accountNature),
      toBillingModeLabel(user.billingMode),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

function toUserFilter(key: Key): UserFilter {
  if (key === "admin" || key === "disabled") return key;

  return "all";
}

function formatCount(value: number, isLoading: boolean) {
  return isLoading ? "-" : String(value);
}

function getUsedSeatCount(user: ApiUser, users: ApiUser[]) {
  const id = user.id;

  if (id == null) return 0;

  return users.filter(
    (item) => item.parentUserId === id && item.accountType === "sub",
  ).length;
}

function toAccountTypeLabel(
  user: Pick<AdminUser, "accountType" | "parentUserId">,
) {
  return user.accountType === "sub" && user.parentUserId > 0
    ? "子账号"
    : "主账号";
}

function toAccountNatureLabel(value: string) {
  return value === "team" ? "团队" : "个人";
}

function toBillingModeLabel(value: string) {
  return value === "subscription" ? "订阅" : "按量";
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
