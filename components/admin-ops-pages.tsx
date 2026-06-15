"use client";

import type { DataGridColumn } from "@heroui-pro/react";

import { Button, Card, Chip, SearchField, Tabs } from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";

import { AdminIcon } from "@/components/admin-icons";
import {
  AdminPage,
  SectionCard,
  StatGrid,
  StatusPill,
} from "@/components/admin-page-kit";

type ToolRisk = "低" | "中" | "高";

type ToolPermission = {
  id: string;
  name: string;
  scope: string;
  agents: number;
  owner: string;
  risk: ToolRisk;
  status: "启用" | "受限" | "停用";
};

const TOOLS: ToolPermission[] = [
  {
    agents: 12,
    id: "tool_file_reader",
    name: "文件解析",
    owner: "Platform",
    risk: "低",
    scope: "读取上传文件",
    status: "启用",
  },
  {
    agents: 7,
    id: "tool_web_search",
    name: "联网检索",
    owner: "AI Infra",
    risk: "中",
    scope: "受控外部检索",
    status: "受限",
  },
  {
    agents: 3,
    id: "tool_supplier_db",
    name: "供应商库",
    owner: "Supply Team",
    risk: "中",
    scope: "内部数据表",
    status: "启用",
  },
  {
    agents: 1,
    id: "tool_payment",
    name: "付款操作",
    owner: "Finance",
    risk: "高",
    scope: "外部资金动作",
    status: "停用",
  },
];

const TOOL_RISK_COLOR: Record<ToolRisk, "danger" | "success" | "warning"> = {
  中: "warning",
  低: "success",
  高: "danger",
};

const TOOL_STATUS_COLOR: Record<
  ToolPermission["status"],
  "danger" | "success" | "warning"
> = {
  停用: "danger",
  受限: "warning",
  启用: "success",
};

const TOOL_COLUMNS: DataGridColumn<ToolPermission>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.name}</span>
        <span className="text-muted truncate text-xs">{item.id}</span>
      </div>
    ),
    header: "工具",
    id: "name",
    isRowHeader: true,
    minWidth: 190,
  },
  {
    accessorKey: "scope",
    header: "授权范围",
    id: "scope",
    minWidth: 170,
  },
  {
    accessorKey: "owner",
    allowsSorting: true,
    header: "负责人",
    id: "owner",
    minWidth: 130,
  },
  {
    align: "end",
    accessorKey: "agents",
    allowsSorting: true,
    header: "Agent",
    id: "agents",
    minWidth: 90,
  },
  {
    cell: (item) => (
      <Chip color={TOOL_RISK_COLOR[item.risk]} size="sm" variant="soft">
        {item.risk}风险
      </Chip>
    ),
    header: "风险",
    id: "risk",
    minWidth: 100,
  },
  {
    cell: (item) => (
      <Chip color={TOOL_STATUS_COLOR[item.status]} size="sm" variant="soft">
        {item.status}
      </Chip>
    ),
    header: "状态",
    id: "status",
    minWidth: 100,
  },
];

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  target: string;
  result: "成功" | "失败" | "待确认";
  time: string;
};

const AUDIT_LOGS: AuditLog[] = [
  {
    action: "发布 Agent 模板",
    actor: "Product Ops",
    id: "aud_2401",
    result: "成功",
    target: "商品资料分析 Agent",
    time: "今天 14:20",
  },
  {
    action: "修改模型路由",
    actor: "Rolly",
    id: "aud_2400",
    result: "成功",
    target: "默认模型路由",
    time: "今天 11:05",
  },
  {
    action: "授予工具权限",
    actor: "AI Infra",
    id: "aud_2398",
    result: "待确认",
    target: "联网检索",
    time: "昨天 18:42",
  },
  {
    action: "禁用服务账号",
    actor: "Security",
    id: "aud_2397",
    result: "失败",
    target: "Legacy Bot",
    time: "昨天 10:16",
  },
];

const AUDIT_RESULT_COLOR: Record<
  AuditLog["result"],
  "danger" | "success" | "warning"
> = {
  失败: "danger",
  待确认: "warning",
  成功: "success",
};

const AUDIT_COLUMNS: DataGridColumn<AuditLog>[] = [
  {
    allowsSorting: true,
    cell: (item) => (
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{item.action}</span>
        <span className="text-muted truncate text-xs">{item.id}</span>
      </div>
    ),
    header: "动作",
    id: "action",
    isRowHeader: true,
    minWidth: 210,
  },
  {
    accessorKey: "actor",
    allowsSorting: true,
    header: "操作者",
    id: "actor",
    minWidth: 140,
  },
  {
    accessorKey: "target",
    header: "对象",
    id: "target",
    minWidth: 190,
  },
  {
    cell: (item) => (
      <Chip color={AUDIT_RESULT_COLOR[item.result]} size="sm" variant="soft">
        {item.result}
      </Chip>
    ),
    header: "结果",
    id: "result",
    minWidth: 100,
  },
  {
    accessorKey: "time",
    align: "end",
    allowsSorting: true,
    header: "时间",
    id: "time",
    minWidth: 120,
  },
];

export function ToolsPage() {
  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            批量复核
          </Button>
          <Button size="sm">
            <AdminIcon className="size-4" name="plus" />
            新增工具
          </Button>
        </>
      }
      description="管理 Agent 可调用的工具、授权范围、风险等级和启停状态。"
      eyebrow="Tool Access"
      title="工具与权限"
    >
      <StatGrid
        stats={[
          { helper: "3 个内部工具", label: "工具总数", value: "14" },
          {
            helper: "需人工复核",
            label: "高风险工具",
            tone: "danger",
            value: "2",
          },
          {
            helper: "绑定到模板",
            label: "授权 Agent",
            tone: "accent",
            value: "23",
          },
          {
            helper: "最近 7 天",
            label: "权限变更",
            tone: "warning",
            value: "18",
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs defaultSelectedKey="all">
              <Tabs.ListContainer>
                <Tabs.List aria-label="工具筛选">
                  <Tabs.Tab id="all">
                    全部
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="restricted">
                    受限
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="disabled">
                    停用
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
            <SearchField aria-label="搜索工具" className="w-full sm:w-[260px]">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="搜索工具或负责人" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
          <DataGrid
            aria-label="工具权限"
            className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
            columns={TOOL_COLUMNS}
            contentClassName="min-w-[820px]"
            data={TOOLS}
            getRowId={(item) => item.id}
          />
        </div>

        <SectionCard
          description="这里先定义安全边界，后续接真实权限策略。"
          title="权限策略"
        >
          <div className="flex flex-col gap-3">
            {[
              ["高风险工具默认停用", "已启用"],
              ["外部写入动作需二次确认", "已启用"],
              ["服务账号禁止付款类工具", "待接入"],
            ].map(([label, state]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm">{label}</span>
                <StatusPill tone={state === "待接入" ? "warning" : "success"}>
                  {state}
                </StatusPill>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </AdminPage>
  );
}

export function AuditPage() {
  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            导出日志
          </Button>
          <Button size="sm">创建筛选器</Button>
        </>
      }
      description="记录管理员和系统关键配置动作，后续接入真实审计流和导出能力。"
      eyebrow="Audit Trail"
      title="审计日志"
    >
      <StatGrid
        stats={[
          { helper: "过去 24 小时", label: "审计事件", value: "248" },
          { helper: "需要确认", label: "待确认", tone: "warning", value: "6" },
          {
            helper: "权限与安全",
            label: "高敏动作",
            tone: "danger",
            value: "9",
          },
          {
            helper: "归档策略待接入",
            label: "保留天数",
            tone: "accent",
            value: "180",
          },
        ]}
      />

      <section className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs defaultSelectedKey="all">
            <Tabs.ListContainer>
              <Tabs.List aria-label="审计筛选">
                <Tabs.Tab id="all">
                  全部
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="security">
                  安全
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="model">
                  模型
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
          <SearchField
            aria-label="搜索审计日志"
            className="w-full sm:w-[280px]"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="搜索动作、对象或操作者" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
        <DataGrid
          aria-label="审计日志"
          className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
          columns={AUDIT_COLUMNS}
          contentClassName="min-w-[760px]"
          data={AUDIT_LOGS}
          defaultSortDescriptor={{ column: "time", direction: "descending" }}
          getRowId={(item) => item.id}
        />
      </section>
    </AdminPage>
  );
}

export function SettingsPage() {
  return (
    <AdminPage
      actions={<Button size="sm">保存配置</Button>}
      description="集中放置环境、默认行为、通知和数据保留策略，当前为静态配置预览。"
      eyebrow="System"
      title="系统设置"
    >
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SectionCard title="环境配置">
          <SettingRows
            rows={[
              ["默认环境", "生产环境"],
              ["后台语言", "简体中文"],
              ["时区", "Asia/Shanghai"],
              ["功能开关来源", "本地静态配置"],
            ]}
          />
        </SectionCard>
        <SectionCard title="通知策略">
          <SettingRows
            rows={[
              ["高风险权限变更", "站内通知 + 邮件"],
              ["模型降级事件", "站内通知"],
              ["Agent 发布失败", "负责人通知"],
              ["审计导出完成", "下载中心"],
            ]}
          />
        </SectionCard>
        <SectionCard title="数据保留">
          <SettingRows
            rows={[
              ["审计日志", "180 天"],
              ["运行记录", "90 天"],
              ["临时上传文件", "7 天"],
              ["异常快照", "30 天"],
            ]}
          />
        </SectionCard>
        <SectionCard title="接口接入状态">
          <div className="flex flex-col gap-3">
            {[
              ["用户管理接口", "待接入"],
              ["模型配置接口", "待接入"],
              ["Agent 编排接口", "待接入"],
              ["前端路由与布局", "完成"],
            ].map(([label, state]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm">{label}</span>
                <StatusPill tone={state === "完成" ? "success" : "warning"}>
                  {state}
                </StatusPill>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </AdminPage>
  );
}

export function SecurityPage() {
  return (
    <AdminPage
      actions={
        <>
          <Button size="sm" variant="tertiary">
            查看审计
          </Button>
          <Button size="sm">更新策略</Button>
        </>
      }
      description="安全策略覆盖登录、权限升级、高风险操作确认与后台访问边界。"
      eyebrow="Security"
      title="安全策略"
    >
      <StatGrid
        stats={[
          { helper: "管理员与服务账号", label: "受控主体", value: "42" },
          {
            helper: "需要复核",
            label: "安全告警",
            tone: "warning",
            value: "3",
          },
          {
            helper: "高风险动作",
            label: "二次确认",
            tone: "accent",
            value: "8",
          },
          {
            helper: "过去 24 小时",
            label: "拦截次数",
            tone: "danger",
            value: "5",
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {[
          {
            description: "管理员登录要求更高的身份确认。",
            items: ["管理员强制 MFA", "异常地登录提醒", "会话 12 小时过期"],
            title: "登录保护",
          },
          {
            description: "权限提升和跨组织访问必须留痕。",
            items: ["角色变更审计", "跨组织授权复核", "服务账号最小权限"],
            title: "权限边界",
          },
          {
            description: "外部写入和高风险工具调用默认受限。",
            items: ["付款类工具停用", "外部写入二次确认", "失败动作告警"],
            title: "操作保护",
          },
        ].map((policy) => (
          <Card key={policy.title}>
            <Card.Header>
              <Card.Title className="text-base">{policy.title}</Card.Title>
              <Card.Description className="text-xs">
                {policy.description}
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-col gap-2">
                {policy.items.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm">
                    <span className="bg-success size-1.5 shrink-0 rounded-full" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        ))}
      </section>
    </AdminPage>
  );
}

function SettingRows({ rows }: { rows: string[][] }) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="text-muted text-sm">{label}</span>
          <span className="text-foreground text-right text-sm font-medium">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
