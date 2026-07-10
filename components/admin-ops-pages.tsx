"use client";

import type { Agent, Model } from "@/lib/api";

import {
  Button,
  Checkbox,
  Description,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import {
  AdminPage,
  SectionCard,
  StatGrid,
  StatusPill,
} from "@/components/admin-page-kit";
import { applyOpenClawConfig, listAgents, listModels } from "@/lib/api";

type OpenClawApplyState = {
  agents: Agent[];
  error: string | null;
  isApplying: boolean;
  isLoading: boolean;
  lastChanged: string[];
  lastMessage: string;
  models: Model[];
};

const DEFAULT_PLUGIN_ID = "macbook-openclaw-rpc";

export function AuditPage() {
  return (
    <UnavailableApiPage
      description="当前 Swagger 未提供审计日志查询或导出接口，因此不展示静态审计数据。"
      eyebrow="Audit Trail"
      title="审计日志"
    />
  );
}

export function SettingsPage() {
  const isMountedRef = useRef(false);
  const [pluginId, setPluginId] = useState(DEFAULT_PLUGIN_ID);
  const [dryRun, setDryRun] = useState(true);
  const [state, setState] = useState<OpenClawApplyState>({
    agents: [],
    error: null,
    isApplying: false,
    isLoading: true,
    lastChanged: [],
    lastMessage: "",
    models: [],
  });

  const loadSources = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const [models, agents] = await Promise.all([
        listModels({ pageSize: 500 }),
        listAgents({ pageSize: 500 }),
      ]);

      if (isMountedRef.current) {
        setState((current) => ({
          ...current,
          agents,
          error: null,
          isLoading: false,
          models,
        }));
      }
    } catch (error) {
      if (isMountedRef.current) {
        const message = getOpsError(error, "OpenClaw 配置资源加载失败。");

        setState((current) => ({
          ...current,
          error: message,
          isLoading: false,
        }));
        toast.danger(message);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadSources();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSources]);

  async function applyConfig() {
    const nextPluginId = pluginId.trim();

    if (!nextPluginId) {
      toast.danger("请输入 OpenClaw Plugin ID。");

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isApplying: true,
    }));

    try {
      const result = await applyOpenClawConfig({
        agents: state.agents.map(toOpenClawAgentConfig),
        dryRun,
        models: state.models.map(toOpenClawModelConfig),
        pluginId: nextPluginId,
      });

      setState((current) => ({
        ...current,
        error: null,
        isApplying: false,
        lastChanged: result?.changed ?? [],
        lastMessage: result?.message ?? "OpenClaw 配置下发完成。",
      }));
      toast.success(
        dryRun ? "OpenClaw 配置预检完成。" : "OpenClaw 配置已下发。",
      );
    } catch (error) {
      const message = getOpsError(error, "OpenClaw 配置下发失败。");

      setState((current) => ({
        ...current,
        error: message,
        isApplying: false,
      }));
      toast.danger(message);
    }
  }

  const enabledModels = state.models.filter((model) => model.enabled !== false);
  const enabledAgents = state.agents.filter((agent) => agent.enabled !== false);

  return (
    <AdminPage
      actions={
        <>
          <Button
            aria-label="刷新系统资源"
            isPending={state.isLoading}
            size="sm"
            variant="tertiary"
            onPress={() => void loadSources()}
          >
            <AdminIcon className="size-4" name="refresh" />
            <span className="hidden sm:inline">刷新资源</span>
          </Button>
          <Button
            isDisabled={state.isLoading || state.isApplying}
            isPending={state.isApplying}
            size="sm"
            onPress={() => void applyConfig()}
          >
            {dryRun ? "预检配置" : "下发配置"}
          </Button>
        </>
      }
      description="把当前后台登记的模型和 Agent 配置同步给指定 OpenClaw RPC 插件。"
      eyebrow="System"
      title="系统设置"
    >
      <StatGrid
        stats={[
          {
            helper: "后台模型配置",
            label: "模型总数",
            value: state.isLoading ? "-" : formatCount(state.models.length),
          },
          {
            helper: "enabled=true",
            label: "启用模型",
            tone: "accent",
            value: state.isLoading ? "-" : formatCount(enabledModels.length),
          },
          {
            helper: "后台 Agent 配置",
            label: "Agent 总数",
            value: state.isLoading ? "-" : formatCount(state.agents.length),
          },
          {
            helper: "enabled=true",
            label: "启用 Agent",
            tone: "warning",
            value: state.isLoading ? "-" : formatCount(enabledAgents.length),
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SectionCard
          description="调用 /api/openclaw/config/apply。Dry run 打开时只做预检。"
          title="OpenClaw 配置下发"
        >
          <div className="flex flex-col gap-4">
            <TextField fullWidth variant="secondary">
              <Label>Plugin ID</Label>
              <Input
                value={pluginId}
                onChange={(event) => setPluginId(event.target.value)}
              />
            </TextField>
            <Checkbox isSelected={dryRun} onChange={setDryRun}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                Dry run
              </Checkbox.Content>
              <Description>先验证配置，不实际下发到 OpenClaw。</Description>
            </Checkbox>
            {state.error ? (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {state.error}
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard title="接口接入状态">
          <div className="flex flex-col gap-3">
            {[
              ["用户管理接口", "完成"],
              ["模型配置接口", "完成"],
              ["Agent 编排接口", "完成"],
              ["用户授权与余额接口", "完成"],
              ["用量与会话接口", "完成"],
              ["工具 / 审计 / 安全接口", "未提供"],
            ].map(([label, status]) => (
              <StatusRow key={label} label={label} status={status} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="最近下发结果">
          <div className="flex flex-col gap-3 text-sm">
            <div className="text-muted">
              {state.lastMessage || "尚未执行 OpenClaw 配置下发。"}
            </div>
            {state.lastChanged.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {state.lastChanged.map((item) => (
                  <StatusPill key={item} tone="success">
                    {item}
                  </StatusPill>
                ))}
              </div>
            ) : null}
          </div>
        </SectionCard>
      </section>
    </AdminPage>
  );
}

export function SecurityPage() {
  return (
    <UnavailableApiPage
      description="当前 Swagger 未提供安全策略查询或更新接口，因此不展示静态安全策略。"
      eyebrow="Security"
      title="安全策略"
    />
  );
}

function UnavailableApiPage({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <AdminPage description={description} eyebrow={eyebrow} title={title}>
      <SectionCard title="接口状态">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">ClawCore Swagger</span>
          <StatusPill tone="warning">未提供对应接口</StatusPill>
        </div>
      </SectionCard>
    </AdminPage>
  );
}

function StatusRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <StatusPill tone={status === "完成" ? "success" : "warning"}>
        {status}
      </StatusPill>
    </div>
  );
}

function toOpenClawModelConfig(model: Model) {
  return {
    capabilities: model.capabilities ?? [],
    displayName: model.displayName,
    enabled: model.enabled !== false,
    modelid: model.modelid,
    provider: model.provider,
  };
}

function toOpenClawAgentConfig(agent: Agent) {
  return {
    agentId: agent.agentId,
    defaultImageGenerationModelid: agent.defaultImageGenerationModelid,
    defaultImageModelid: agent.defaultImageModelid,
    defaultModelid: agent.defaultModelid,
    defaultMusicGenerationModelid: agent.defaultMusicGenerationModelid,
    defaultPdfModelid: agent.defaultPdfModelid,
    defaultVideoGenerationModelid: agent.defaultVideoGenerationModelid,
    description: agent.description,
    displayName: agent.displayName,
    enabled: agent.enabled !== false,
    reasoningLevel: agent.reasoningLevel,
    thinkingLevel: agent.thinkingLevel,
    verboseLevel: agent.verboseLevel,
  };
}

function formatCount(value: number) {
  return value.toLocaleString("zh-CN");
}

function getOpsError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
