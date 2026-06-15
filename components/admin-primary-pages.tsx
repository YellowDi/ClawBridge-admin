"use client";

import type { DataGridColumn } from "@heroui-pro/react";

import { Avatar, Button, Chip, SearchField, Tabs } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";

import { AdminIcon } from "@/components/admin-icons";
import {
  AdminPage,
  SectionCard,
  StatGrid,
  StatusPill,
} from "@/components/admin-page-kit";

type UserStatus = "正常" | "待审核" | "已停用";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  org: string;
  status: UserStatus;
  lastSeen: string;
};

const USERS: AdminUser[] = [
  {
    email: "lina@clawbridge.ai",
    id: "usr_1042",
    lastSeen: "5 分钟前",
    name: "Lina Chen",
    org: "ClawBridge",
    role: "Owner",
    status: "正常",
  },
  {
    email: "ops@northstar.example",
    id: "usr_1038",
    lastSeen: "今天 12:10",
    name: "Northstar Ops",
    org: "Northstar",
    role: "Admin",
    status: "正常",
  },
  {
    email: "review@pilot.example",
    id: "usr_1027",
    lastSeen: "未登录",
    name: "Pilot Review",
    org: "Pilot Space",
    role: "Reviewer",
    status: "待审核",
  },
  {
    email: "bot@legacy.example",
    id: "usr_0994",
    lastSeen: "14 天前",
    name: "Legacy Bot",
    org: "Legacy",
    role: "Service",
    status: "已停用",
  },
];

const USER_STATUS_COLOR: Record<UserStatus, "danger" | "success" | "warning"> =
  {
    已停用: "danger",
    待审核: "warning",
    正常: "success",
  };

const USER_COLUMNS: DataGridColumn<AdminUser>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <Avatar.Fallback>
            {item.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </Avatar.Fallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium">{item.name}</span>
          <span className="text-muted truncate text-xs">{item.email}</span>
        </div>
      </div>
    ),
    header: "用户",
    id: "name",
    isRowHeader: true,
    minWidth: 240,
  },
  {
    accessorKey: "org",
    allowsSorting: true,
    header: "组织",
    id: "org",
    minWidth: 140,
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
    accessorKey: "lastSeen",
    align: "end",
    allowsSorting: true,
    header: "最近活跃",
    id: "lastSeen",
    minWidth: 130,
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
  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            导出用户
          </Button>
          <Button size="sm">
            <AdminIcon className="size-4" name="plus" />
            添加用户
          </Button>
        </>
      }
      description="集中管理企业用户、角色、组织空间和访问状态。当前阶段先提供静态管理视图。"
      eyebrow="Identity"
      title="用户管理"
    >
      <StatGrid
        stats={[
          { helper: "本周新增 36", label: "总用户", value: "1,284" },
          {
            helper: "需要管理员处理",
            label: "待审核",
            tone: "warning",
            value: "12",
          },
          {
            helper: "跨组织权限组",
            label: "角色组",
            tone: "accent",
            value: "8",
          },
          { helper: "过去 7 天", label: "活跃率", value: "86%" },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs defaultSelectedKey="all">
              <Tabs.ListContainer>
                <Tabs.List aria-label="用户筛选">
                  <Tabs.Tab id="all">
                    全部
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="pending">
                    待审核
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="disabled">
                    已停用
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
            <SearchField aria-label="搜索用户" className="w-full sm:w-[260px]">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="搜索姓名、邮箱或组织" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <DataGrid
            aria-label="用户列表"
            className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
            columns={USER_COLUMNS}
            contentClassName="min-w-[760px]"
            data={USERS}
            defaultSortDescriptor={{ column: "name", direction: "ascending" }}
            getRowId={(item) => item.id}
          />
        </div>

        <SectionCard
          description="这些动作后续需要接入真实接口。"
          title="审核队列"
        >
          <div className="flex flex-col gap-3">
            {["企业管理员邀请", "服务账号申请", "跨组织访问申请"].map(
              (item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-medium">{item}</div>
                    <div className="text-muted text-xs">
                      {index === 0
                        ? "4 条待处理"
                        : index === 1
                          ? "3 条待处理"
                          : "5 条待处理"}
                    </div>
                  </div>
                  <StatusPill tone="warning">待审核</StatusPill>
                </div>
              ),
            )}
          </div>
        </SectionCard>
      </section>
    </AdminPage>
  );
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

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-foreground text-base font-semibold">
              模型路由
            </h2>
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
        </div>

        <SectionCard title="默认策略">
          <div className="flex flex-col gap-4">
            {[
              ["任务规划", "GPT-5.4", "默认"],
              ["长文档解析", "Claude Sonnet", "可用"],
              ["低成本批处理", "Qwen Max", "待配置"],
            ].map(([label, model, status]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-muted text-xs">{model}</div>
                </div>
                <StatusPill
                  tone={
                    status === "默认"
                      ? "accent"
                      : status === "待配置"
                        ? "warning"
                        : "success"
                  }
                >
                  {status}
                </StatusPill>
              </div>
            ))}
          </div>
        </SectionCard>
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

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
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
            <SearchField
              aria-label="搜索 Agent"
              className="w-full sm:w-[260px]"
            >
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
        </div>

        <SectionCard
          description="上线前重点关注工具权限和触发条件。"
          title="发布前检查"
        >
          <div className="flex flex-col gap-3">
            {[
              ["工具权限", "2 个模板需要确认", "warning"],
              ["默认模型", "全部已绑定", "success"],
              ["回滚版本", "3 个模板未配置", "warning"],
              ["审计追踪", "已启用", "success"],
            ].map(([label, helper, tone]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-muted text-xs">{helper}</div>
                </div>
                <StatusPill tone={tone === "warning" ? "warning" : "success"}>
                  {tone === "warning" ? "待处理" : "通过"}
                </StatusPill>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </AdminPage>
  );
}
