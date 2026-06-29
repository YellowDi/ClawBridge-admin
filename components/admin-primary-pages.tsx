"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { Key } from "react";
import type {
  Agent as ApiAgent,
  Model as ApiModel,
  User as ApiUser,
} from "@/lib/api";

import { Avatar, Chip, SearchField, Tabs } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import {
  CreateAgentDialog,
  DeleteAgentDialog,
  EditAgentDialog,
} from "@/components/agent-dialog";
import {
  CreateUserDialog,
  DeleteUserDialog,
  EditUserDialog,
} from "@/components/create-user-dialog";
import { ModelConfigurationPage } from "@/components/model-configuration-page";
import {
  UserAuthorizationDialog,
  UserBalanceDialog,
} from "@/components/user-access-dialog";
import { listAgents, listModels, listUsers } from "@/lib/api";

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

type AgentFilter = "all" | "disabled" | "enabled";
type AgentStatus = "停用" | "启用";

type AdminAgent = {
  agentId: string;
  agentRecordId: number | null;
  capabilityModelSummary: string;
  defaultImageGenerationModelid: string;
  defaultImageModelid: string;
  defaultMusicGenerationModelid: string;
  defaultModelLabel: string;
  defaultModelid: string;
  defaultPdfModelid: string;
  defaultVideoGenerationModelid: string;
  description: string;
  displayLabel: string;
  displayName: string;
  enabled: boolean;
  id: string;
  reasoningLevel: string;
  status: AgentStatus;
  thinkingLevel: string;
  updatedAt: string;
  verboseLevel: string;
};

type AgentsLoadState = {
  agents: AdminAgent[];
  error: string | null;
  isLoading: boolean;
};

const AGENT_STATUS_COLOR: Record<AgentStatus, "danger" | "success"> = {
  停用: "danger",
  启用: "success",
};

const AGENT_BASE_COLUMNS: DataGridColumn<AdminAgent>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">
          {item.displayLabel}
        </span>
        <span className="text-muted truncate text-xs">{item.agentId}</span>
      </div>
    ),
    header: "Agent",
    id: "displayLabel",
    isRowHeader: true,
    minWidth: 220,
  },
  {
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">
          {item.defaultModelLabel}
        </span>
        {item.defaultModelid && item.defaultModelid !== "-" ? (
          <span className="text-muted truncate text-xs">
            {item.defaultModelid}
          </span>
        ) : null}
      </div>
    ),
    allowsSorting: true,
    header: "默认模型",
    id: "defaultModelLabel",
    minWidth: 190,
  },
  {
    cell: (item) => (
      <span className="text-muted line-clamp-2 text-xs">
        {item.capabilityModelSummary || "-"}
      </span>
    ),
    header: "能力模型",
    id: "capabilityModelSummary",
    minWidth: 260,
  },
  {
    cell: (item) => (
      <span className="text-muted text-xs">{formatAgentLevels(item)}</span>
    ),
    header: "默认配置",
    id: "levels",
    minWidth: 220,
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
              <UserAuthorizationDialog user={user} />
              <UserBalanceDialog user={user} />
              <EditUserDialog user={user} onUpdated={refreshUsers} />
              <DeleteUserDialog user={user} onDeleted={refreshUsers} />
            </div>
          );
        },
        cellClassName: "w-[248px] min-w-[248px] max-w-[248px]",
        header: "操作",
        headerClassName: "w-[248px] min-w-[248px] max-w-[248px]",
        id: "actions",
        pinned: "end",
        width: 248,
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
      description="保存可用模型，配置供应商、模型 ID 和模型能力。"
      eyebrow="Model Config"
      title="模型配置"
    >
      <ModelConfigurationPage />
    </AdminPage>
  );
}

export function AgentsPage() {
  const isMountedRef = useRef(false);
  const [loadState, setLoadState] = useState<AgentsLoadState>({
    agents: [],
    error: null,
    isLoading: true,
  });
  const [agentFilter, setAgentFilter] = useState<AgentFilter>("all");
  const [agentModelOptions, setAgentModelOptions] = useState<ApiModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { agents, error, isLoading } = loadState;

  const loadAgents = useCallback(async () => {
    setLoadState((state) => ({
      ...state,
      error: null,
      isLoading: true,
    }));

    try {
      const response = await listAgents();

      if (isMountedRef.current) {
        setLoadState({
          agents: response.map(toAdminAgent),
          error: null,
          isLoading: false,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setLoadState({
          agents: [],
          error: getAgentListError(error),
          isLoading: false,
        });
      }
    }
  }, []);

  const loadAgentModelOptions = useCallback(async () => {
    try {
      const response = await listModels({ pageSize: 500 });

      if (isMountedRef.current) {
        setAgentModelOptions(response);
      }
    } catch {
      if (isMountedRef.current) {
        setAgentModelOptions([]);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadAgents();
    void loadAgentModelOptions();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadAgentModelOptions, loadAgents]);

  const filteredAgents = useMemo(
    () => filterAgents(agents, searchQuery, agentFilter),
    [agentFilter, agents, searchQuery],
  );
  const refreshAgents = useCallback(() => void loadAgents(), [loadAgents]);
  const agentColumns = useMemo<DataGridColumn<AdminAgent>[]>(
    () => [
      ...AGENT_BASE_COLUMNS,
      {
        align: "end",
        cell: (item) => {
          if (item.agentRecordId == null) {
            return <span className="text-muted text-xs">-</span>;
          }

          const agent = toEditableAgentSummary(item, item.agentRecordId);

          return (
            <div className="flex items-center justify-end gap-2">
              <EditAgentDialog
                agent={agent}
                modelOptions={agentModelOptions}
                onUpdated={refreshAgents}
              />
              <DeleteAgentDialog agent={agent} onDeleted={refreshAgents} />
            </div>
          );
        },
        cellClassName: "w-[160px] min-w-[160px] max-w-[160px]",
        header: "操作",
        headerClassName: "w-[160px] min-w-[160px] max-w-[160px]",
        id: "actions",
        pinned: "end",
        width: 160,
      },
    ],
    [agentModelOptions, refreshAgents],
  );
  const agentStats = useMemo(() => getAgentStats(agents), [agents]);
  const emptyState = getAgentsEmptyState({
    error,
    hasFilter: Boolean(searchQuery.trim()) || agentFilter !== "all",
    isLoading,
  });

  return (
    <AdminPage
      actions={
        <CreateAgentDialog
          modelOptions={agentModelOptions}
          onCreated={() => void loadAgents()}
        />
      }
      description="维护 Agent 标识、默认模型、推理配置和启用状态。"
      eyebrow="Agent Studio"
      title="Agent 编排"
    >
      <StatGrid
        stats={[
          {
            helper: "当前列表总数",
            label: "Agent 总数",
            value: formatCount(agentStats.total, isLoading),
          },
          {
            helper: "可被授权和使用",
            label: "启用 Agent",
            tone: "accent",
            value: formatCount(agentStats.enabled, isLoading),
          },
          {
            helper: "不可授权或使用",
            label: "停用 Agent",
            tone: "danger",
            value: formatCount(agentStats.disabled, isLoading),
          },
          {
            helper: agentStats.defaultModelHelper,
            label: "默认模型",
            value: formatCount(agentStats.defaultModels, isLoading),
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            selectedKey={agentFilter}
            onSelectionChange={(key) => setAgentFilter(toAgentFilter(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Agent 筛选">
                <Tabs.Tab className="whitespace-nowrap" id="all">
                  全部
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="enabled">
                  启用
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="whitespace-nowrap" id="disabled">
                  停用
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <SearchField
            aria-label="搜索 Agent"
            className="w-full sm:w-[260px]"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索 Agent 或模型" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="Agent 列表"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={agentColumns}
          contentClassName="min-w-[1180px]"
          data={filteredAgents}
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

function toAdminAgent(agent: ApiAgent, index: number): AdminAgent {
  const agentId = agent.agentId?.trim() || `agent-${agent.id ?? index + 1}`;
  const displayName = agent.displayName?.trim() ?? "";
  const displayLabel = displayName || agentId;
  const defaultModelid = agent.defaultModelid?.trim() ?? "";
  const defaultImageGenerationModelid =
    agent.defaultImageGenerationModelid?.trim() ?? "";
  const defaultVideoGenerationModelid =
    agent.defaultVideoGenerationModelid?.trim() ?? "";
  const defaultMusicGenerationModelid =
    agent.defaultMusicGenerationModelid?.trim() ?? "";
  const defaultImageModelid = agent.defaultImageModelid?.trim() ?? "";
  const defaultPdfModelid = agent.defaultPdfModelid?.trim() ?? "";

  return {
    agentId,
    agentRecordId: agent.id ?? null,
    capabilityModelSummary: formatCapabilityModelSummary({
      defaultImageGenerationModelid,
      defaultImageModelid,
      defaultMusicGenerationModelid,
      defaultPdfModelid,
      defaultVideoGenerationModelid,
    }),
    defaultImageGenerationModelid,
    defaultImageModelid,
    defaultMusicGenerationModelid,
    defaultModelLabel: getDefaultModelLabel(agent),
    defaultModelid: defaultModelid || "-",
    defaultPdfModelid,
    defaultVideoGenerationModelid,
    description: agent.description?.trim() ?? "",
    displayLabel,
    displayName,
    enabled: agent.enabled !== false,
    id: agent.id == null ? agentId : String(agent.id),
    reasoningLevel: agent.reasoningLevel?.trim() ?? "",
    status: agent.enabled === false ? "停用" : "启用",
    thinkingLevel: agent.thinkingLevel?.trim() ?? "",
    updatedAt: formatDateTime(agent.updatedAt),
    verboseLevel: agent.verboseLevel?.trim() ?? "",
  };
}

function toEditableAgentSummary(agent: AdminAgent, id: number) {
  return {
    agentId: agent.agentId,
    defaultImageGenerationModelid: agent.defaultImageGenerationModelid,
    defaultImageModelid: agent.defaultImageModelid,
    defaultMusicGenerationModelid: agent.defaultMusicGenerationModelid,
    defaultModelid: agent.defaultModelid === "-" ? "" : agent.defaultModelid,
    defaultPdfModelid: agent.defaultPdfModelid,
    defaultVideoGenerationModelid: agent.defaultVideoGenerationModelid,
    description: agent.description,
    displayName: agent.displayName,
    enabled: agent.enabled,
    id,
    reasoningLevel: agent.reasoningLevel,
    thinkingLevel: agent.thinkingLevel,
    verboseLevel: agent.verboseLevel,
  };
}

function filterAgents(
  agents: AdminAgent[],
  searchQuery: string,
  agentFilter: AgentFilter,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return agents.filter((agent) => {
    if (agentFilter === "enabled" && agent.status !== "启用") return false;
    if (agentFilter === "disabled" && agent.status !== "停用") return false;
    if (!normalizedQuery) return true;

    return [
      agent.agentId,
      agent.capabilityModelSummary,
      agent.defaultImageGenerationModelid,
      agent.defaultImageModelid,
      agent.defaultMusicGenerationModelid,
      agent.defaultModelid,
      agent.defaultModelLabel,
      agent.defaultPdfModelid,
      agent.defaultVideoGenerationModelid,
      agent.description,
      agent.displayLabel,
      agent.reasoningLevel,
      agent.status,
      agent.thinkingLevel,
      agent.verboseLevel,
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });
}

function formatCapabilityModelSummary({
  defaultImageGenerationModelid,
  defaultImageModelid,
  defaultMusicGenerationModelid,
  defaultPdfModelid,
  defaultVideoGenerationModelid,
}: Pick<
  AdminAgent,
  | "defaultImageGenerationModelid"
  | "defaultImageModelid"
  | "defaultMusicGenerationModelid"
  | "defaultPdfModelid"
  | "defaultVideoGenerationModelid"
>) {
  return [
    defaultImageGenerationModelid
      ? `图像生成 ${defaultImageGenerationModelid}`
      : null,
    defaultVideoGenerationModelid
      ? `视频 ${defaultVideoGenerationModelid}`
      : null,
    defaultMusicGenerationModelid
      ? `音乐 ${defaultMusicGenerationModelid}`
      : null,
    defaultImageModelid ? `图像理解 ${defaultImageModelid}` : null,
    defaultPdfModelid ? `PDF ${defaultPdfModelid}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}

function getAgentStats(agents: AdminAgent[]) {
  const defaultModels = Array.from(
    new Set(
      agents
        .map((agent) => agent.defaultModelid)
        .filter((defaultModelid) => defaultModelid && defaultModelid !== "-"),
    ),
  );

  return {
    defaultModelHelper: defaultModels.length
      ? defaultModels.slice(0, 3).join(" / ")
      : "暂无默认模型",
    defaultModels: defaultModels.length,
    disabled: agents.filter((agent) => agent.status === "停用").length,
    enabled: agents.filter((agent) => agent.status === "启用").length,
    total: agents.length,
  };
}

function getDefaultModelLabel(agent: ApiAgent) {
  const displayName = agent.defaultModel?.displayName?.trim();
  const provider = agent.defaultModel?.provider?.trim();
  const modelid = agent.defaultModel?.modelid?.trim();
  const defaultModelid = agent.defaultModelid?.trim();

  if (displayName) return displayName;
  if (provider && modelid) return `${provider}/${modelid}`;
  if (defaultModelid) return defaultModelid;

  return "-";
}

function formatAgentLevels(
  agent: Pick<AdminAgent, "reasoningLevel" | "thinkingLevel" | "verboseLevel">,
) {
  const levels = [
    agent.reasoningLevel ? `reasoning: ${agent.reasoningLevel}` : null,
    agent.thinkingLevel ? `thinking: ${agent.thinkingLevel}` : null,
    agent.verboseLevel ? `verbose: ${agent.verboseLevel}` : null,
  ].filter(Boolean);

  return levels.length ? levels.join(" / ") : "-";
}

function toAgentFilter(key: Key): AgentFilter {
  if (key === "enabled" || key === "disabled") return key;

  return "all";
}

function getAgentsEmptyState({
  error,
  hasFilter,
  isLoading,
}: {
  error: string | null;
  hasFilter: boolean;
  isLoading: boolean;
}) {
  if (isLoading) return "正在加载 Agent...";
  if (error) return error;
  if (hasFilter) return "没有匹配的 Agent。";

  return "暂无 Agent 数据。";
}

function getAgentListError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return "Agent 列表加载失败。";
}
