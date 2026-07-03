"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type {
  MCPConfigValue,
  MCPConfigValueType,
  MCPServer,
  MCPServerConfig,
  MCPTransport,
  OpenClawAgentConfigSnapshot,
  OpenClawConfigSnapshot,
  OpenClawMCPApplyMode,
  OpenClawMCPApplyResult,
  OpenClawRPCInstance,
  ReqMCPServerCreate,
  ReqMCPServerUpdate,
} from "@/lib/api";
import type { FormEvent } from "react";

import { DataGrid } from "@heroui-pro/react";
import {
  Button,
  Checkbox,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, SectionCard, StatGrid } from "@/components/admin-page-kit";
import {
  applyOpenClawMCPConfig,
  createMCPServer,
  deleteMCPServer,
  getOpenClawConfigSnapshot,
  listMCPServers,
  listOpenClawRPCInstances,
  updateMCPServer,
} from "@/lib/api";

type MCPServerLoadState = {
  error: string | null;
  isLoading: boolean;
  items: MCPServer[];
};

type RPCInstanceLoadState = {
  error: string | null;
  isLoading: boolean;
  items: OpenClawRPCInstance[];
};

type SnapshotState = {
  error: string | null;
  isLoading: boolean;
  value: OpenClawConfigSnapshot | undefined;
};

type ApplyState = {
  dryRun: boolean;
  error: string | null;
  isApplying: boolean;
  mode: OpenClawMCPApplyMode;
  result: OpenClawMCPApplyResult | undefined;
  selectedAgentId: string;
  selectedMCPIds: number[];
  validateEnvRefs: boolean;
};

type ConfigValueRow = {
  envName: string;
  id: string;
  key: string;
  type: MCPConfigValueType;
  value: string;
};

type OptionalBooleanValue = "" | "false" | "true";

type MCPServerFormState = {
  argsText: string;
  auth: string;
  clientCert: string;
  clientKey: string;
  command: string;
  codexJson: string;
  connectTimeout: string;
  connectionTimeoutMs: string;
  cwd: string;
  description: string;
  displayName: string;
  enabled: boolean;
  envRows: ConfigValueRow[];
  extraJson: string;
  headerRows: ConfigValueRow[];
  id?: number;
  oauthClientMetadataUrl: string;
  oauthRedirectUrl: string;
  oauthScope: string;
  requestTimeoutMs: string;
  serverName: string;
  sslVerify: OptionalBooleanValue;
  supportsParallelToolCalls: OptionalBooleanValue;
  toolFilterExcludeText: string;
  toolFilterIncludeText: string;
  timeout: string;
  transport: MCPTransport;
  url: string;
  workingDirectory: string;
};

type MCPServerDialogState = {
  error: string | null;
  form: MCPServerFormState;
  isSaving: boolean;
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const MCP_TRANSPORT_OPTIONS = [
  { id: "stdio", label: "stdio" },
  { id: "sse", label: "SSE" },
  { id: "streamable-http", label: "streamable-http" },
] as const;

const MCP_VALUE_TYPE_OPTIONS = [
  { id: "literal", label: "明文" },
  { id: "secret", label: "密钥" },
  { id: "env_ref", label: "环境变量" },
] as const;

const MCP_APPLY_MODE_OPTIONS = [
  { id: "merge", label: "追加 MCP 授权" },
  { id: "replace_agent_mcp", label: "替换该 Agent 的 MCP 授权" },
] as const;

export function AdminMCPPage() {
  const isMountedRef = useRef(false);
  const [serversState, setServersState] = useState<MCPServerLoadState>({
    error: null,
    isLoading: true,
    items: [],
  });
  const [instancesState, setInstancesState] = useState<RPCInstanceLoadState>({
    error: null,
    isLoading: true,
    items: [],
  });
  const [selectedPluginId, setSelectedPluginId] = useState("");
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    error: null,
    isLoading: false,
    value: undefined,
  });
  const [applyState, setApplyState] = useState<ApplyState>({
    dryRun: true,
    error: null,
    isApplying: false,
    mode: "merge",
    result: undefined,
    selectedAgentId: "",
    selectedMCPIds: [],
    validateEnvRefs: true,
  });

  const loadMCPServers = useCallback(async () => {
    setServersState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const items = await listMCPServers({ pageSize: 500 });

      if (isMountedRef.current) {
        setServersState({
          error: null,
          isLoading: false,
          items,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setServersState({
          error: getMCPActionError(error, "MCP 配置库加载失败。"),
          isLoading: false,
          items: [],
        });
      }
    }
  }, []);

  const loadRPCInstances = useCallback(async () => {
    setInstancesState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const items = await listOpenClawRPCInstances();

      if (isMountedRef.current) {
        setInstancesState({
          error: null,
          isLoading: false,
          items,
        });
        setSelectedPluginId((current) => {
          if (items.some((item) => item.pluginId === current)) return current;

          return items[0]?.pluginId?.trim() ?? "";
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setInstancesState({
          error: getMCPActionError(error, "OpenClaw RPC 实例加载失败。"),
          isLoading: false,
          items: [],
        });
      }
    }
  }, []);

  const loadSnapshot = useCallback(async (pluginId: string) => {
    if (!pluginId.trim()) {
      setSnapshotState({
        error: null,
        isLoading: false,
        value: undefined,
      });

      return;
    }

    setSnapshotState((current) => ({
      ...current,
      error: null,
      isLoading: true,
    }));

    try {
      const value = await getOpenClawConfigSnapshot({ pluginId });

      if (isMountedRef.current) {
        setSnapshotState({
          error: null,
          isLoading: false,
          value,
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setSnapshotState({
          error: getMCPActionError(error, "OpenClaw 配置快照加载失败。"),
          isLoading: false,
          value: undefined,
        });
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    void loadMCPServers();
    void loadRPCInstances();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadMCPServers, loadRPCInstances]);

  useEffect(() => {
    void loadSnapshot(selectedPluginId);
  }, [loadSnapshot, selectedPluginId]);

  useEffect(() => {
    const agents = snapshotState.value?.agents ?? [];

    setApplyState((current) => {
      if (
        current.selectedAgentId &&
        agents.some((agent) => agent.agentId === current.selectedAgentId)
      ) {
        return current;
      }

      return {
        ...current,
        selectedAgentId: agents[0]?.agentId?.trim() ?? "",
      };
    });
  }, [snapshotState.value?.agents]);

  useEffect(() => {
    const validIds = new Set(
      serversState.items
        .map((item) => item.id)
        .filter((id): id is number => typeof id === "number"),
    );

    setApplyState((current) => ({
      ...current,
      selectedMCPIds: current.selectedMCPIds.filter((id) => validIds.has(id)),
    }));
  }, [serversState.items]);

  const refreshAll = useCallback(() => {
    void loadMCPServers();
    void loadRPCInstances();
  }, [loadMCPServers, loadRPCInstances]);

  const handleApply = useCallback(async () => {
    const pluginId = selectedPluginId.trim();

    if (!pluginId) {
      toast.danger("请选择 OpenClaw RPC 实例。");

      return;
    }

    if (!applyState.selectedAgentId.trim()) {
      toast.danger("请选择 OpenClaw Agent。");

      return;
    }

    if (applyState.selectedMCPIds.length === 0) {
      toast.danger("请选择至少一个 MCP 配置。");

      return;
    }

    setApplyState((current) => ({
      ...current,
      error: null,
      isApplying: true,
      result: undefined,
    }));

    try {
      const result = await applyOpenClawMCPConfig({
        agentId: applyState.selectedAgentId,
        dryRun: applyState.dryRun,
        mcpServerIds: applyState.selectedMCPIds,
        mode: applyState.mode,
        pluginId,
        validateEnvRefs: applyState.validateEnvRefs,
      });

      if (isMountedRef.current) {
        setApplyState((current) => ({
          ...current,
          error: null,
          isApplying: false,
          result,
        }));

        if (result?.snapshot) {
          setSnapshotState({
            error: null,
            isLoading: false,
            value: result.snapshot,
          });
        } else {
          void loadSnapshot(pluginId);
        }

        toast.success(
          applyState.dryRun ? "MCP 配置预检完成。" : "MCP 配置已应用。",
        );
      }
    } catch (error) {
      if (isMountedRef.current) {
        const message = getMCPActionError(error, "MCP 配置应用失败。");

        setApplyState((current) => ({
          ...current,
          error: message,
          isApplying: false,
        }));
        toast.danger(message);
      }
    }
  }, [applyState, loadSnapshot, selectedPluginId]);

  const mcpColumns = useMemo<DataGridColumn<MCPServer>[]>(
    () => [
      {
        cell: (item) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium">
              {item.displayName?.trim() || item.serverName || "-"}
            </span>
            <span className="text-muted truncate text-xs">
              {item.serverName || "-"}
            </span>
          </div>
        ),
        header: "配置",
        headerClassName: "whitespace-nowrap",
        id: "displayName",
        isRowHeader: true,
        minWidth: 180,
        width: 220,
      },
      {
        cellClassName: "whitespace-nowrap",
        cell: (item) => item.transportType || item.config?.transport || "-",
        header: "连接方式",
        headerClassName: "whitespace-nowrap",
        id: "transportType",
        width: 112,
      },
      {
        cellClassName: "whitespace-nowrap",
        cell: (item) => (
          <Chip
            className="whitespace-nowrap"
            color={item.enabled === false ? "default" : "success"}
            size="sm"
            variant="soft"
          >
            {item.enabled === false ? "停用" : "启用"}
          </Chip>
        ),
        header: "状态",
        headerClassName: "whitespace-nowrap",
        id: "enabled",
        width: 72,
      },
      {
        cellClassName: "whitespace-nowrap",
        cell: (item) => formatDateTime(item.updatedAt || item.createdAt),
        header: "更新时间",
        headerClassName: "whitespace-nowrap",
        id: "updatedAt",
        width: 132,
      },
      {
        cellClassName: "whitespace-nowrap",
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <MCPServerDialog server={item} onSaved={loadMCPServers} />
            <DeleteMCPServerDialog server={item} onDeleted={loadMCPServers} />
          </div>
        ),
        header: "操作",
        headerClassName: "whitespace-nowrap",
        id: "actions",
        width: 128,
      },
    ],
    [loadMCPServers],
  );

  const snapshot = snapshotState.value;
  const agents = snapshot?.agents ?? [];
  const openClawMCPServers = snapshot?.mcpServers ?? [];
  const selectedMCPSet = useMemo(
    () => new Set(applyState.selectedMCPIds),
    [applyState.selectedMCPIds],
  );

  return (
    <AdminPage
      actions={
        <>
          <Button
            isPending={serversState.isLoading || instancesState.isLoading}
            size="sm"
            variant="tertiary"
            onPress={refreshAll}
          >
            <AdminIcon className="size-4" name="refresh" />
            刷新
          </Button>
          <MCPServerDialog onSaved={loadMCPServers} />
        </>
      }
      description="维护可复用 MCP 配置，并把配置应用到已连接 OpenClaw RPC 实例的 Agent。"
      eyebrow="OpenClaw"
      title="OpenClaw MCP"
    >
      <StatGrid
        stats={[
          {
            helper: "后台 MCP 配置库",
            label: "MCP 配置",
            value: serversState.isLoading
              ? "-"
              : formatCount(serversState.items.length),
          },
          {
            helper: "claw-core-bridge 当前连接",
            label: "RPC 实例",
            tone: "accent",
            value: instancesState.isLoading
              ? "-"
              : formatCount(instancesState.items.length),
          },
          {
            helper: selectedPluginId || "未选择实例",
            label: "OpenClaw Agent",
            value: snapshotState.isLoading ? "-" : formatCount(agents.length),
          },
          {
            helper: snapshot?.configHash || "当前快照",
            label: "OpenClaw MCP",
            tone: "warning",
            value: snapshotState.isLoading
              ? "-"
              : formatCount(openClawMCPServers.length),
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <SectionCard
          description="配置会保存在 claw-core-admin；删除只软删除配置库记录，不会直接修改 OpenClaw 当前配置。"
          title="MCP 配置库"
        >
          <div className="flex min-w-0 flex-col gap-3">
            {serversState.error ? (
              <InlineError>{serversState.error}</InlineError>
            ) : null}
            <DataGrid
              aria-label="MCP 配置库"
              className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
              columns={mcpColumns}
              contentClassName="min-w-[720px]"
              data={serversState.items}
              defaultSortDescriptor={{
                column: "updatedAt",
                direction: "descending",
              }}
              getRowId={(item) => String(item.id ?? item.serverName)}
              renderEmptyState={() =>
                serversState.isLoading ? "加载中..." : "暂无 MCP 配置"
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="应用到 OpenClaw Agent">
          <div className="flex min-w-0 flex-col gap-4">
            <RPCInstanceSelect
              instances={instancesState.items}
              isDisabled={instancesState.isLoading || applyState.isApplying}
              selectedPluginId={selectedPluginId}
              onChange={setSelectedPluginId}
            />
            <AgentSelect
              agents={agents}
              isDisabled={snapshotState.isLoading || applyState.isApplying}
              selectedAgentId={applyState.selectedAgentId}
              onChange={(selectedAgentId) =>
                setApplyState((current) => ({ ...current, selectedAgentId }))
              }
            />
            <Select
              fullWidth
              className="min-w-0"
              isDisabled={applyState.isApplying}
              selectedKey={applyState.mode}
              variant="secondary"
              onSelectionChange={(key) =>
                setApplyState((current) => ({
                  ...current,
                  mode: String(key ?? "merge"),
                }))
              }
            >
              <Label>应用模式</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {MCP_APPLY_MODE_OPTIONS.map((option) => (
                    <ListBox.Item key={option.id} id={option.id}>
                      {option.label}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">选择 MCP 配置</span>
              <div className="flex max-h-56 flex-col gap-2 overflow-auto rounded-md border border-divider p-2">
                {serversState.items.length > 0 ? (
                  serversState.items.map((server) => {
                    const id = server.id;

                    if (typeof id !== "number") return null;

                    return (
                      <Checkbox
                        key={id}
                        isDisabled={applyState.isApplying}
                        isSelected={selectedMCPSet.has(id)}
                        onChange={(isSelected) =>
                          setApplyState((current) => ({
                            ...current,
                            selectedMCPIds: isSelected
                              ? [...current.selectedMCPIds, id]
                              : current.selectedMCPIds.filter(
                                  (selectedId) => selectedId !== id,
                                ),
                          }))
                        }
                      >
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Content>
                          <span className="block truncate text-sm font-medium">
                            {server.displayName ||
                              server.serverName ||
                              `#${id}`}
                          </span>
                          <span className="text-muted block truncate text-xs">
                            {server.serverName || "-"} ·{" "}
                            {server.transportType ||
                              server.config?.transport ||
                              "-"}
                          </span>
                        </Checkbox.Content>
                      </Checkbox>
                    );
                  })
                ) : (
                  <span className="text-muted px-1 py-2 text-sm">
                    暂无可应用的 MCP 配置。
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Checkbox
                isDisabled={applyState.isApplying}
                isSelected={applyState.dryRun}
                onChange={(dryRun) =>
                  setApplyState((current) => ({ ...current, dryRun }))
                }
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <span className="block text-sm font-medium">Dry run</span>
                  <span className="text-muted block text-xs">
                    先预检，不写入 OpenClaw 配置。
                  </span>
                </Checkbox.Content>
              </Checkbox>
              <Checkbox
                isDisabled={applyState.isApplying}
                isSelected={applyState.validateEnvRefs}
                onChange={(validateEnvRefs) =>
                  setApplyState((current) => ({
                    ...current,
                    validateEnvRefs,
                  }))
                }
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <span className="block text-sm font-medium">
                    校验环境变量引用
                  </span>
                  <span className="text-muted block text-xs">
                    由 OpenClaw 插件检查 env_ref 是否存在。
                  </span>
                </Checkbox.Content>
              </Checkbox>
            </div>

            {instancesState.error ? (
              <InlineError>{instancesState.error}</InlineError>
            ) : null}
            {snapshotState.error ? (
              <InlineError>{snapshotState.error}</InlineError>
            ) : null}
            {applyState.error ? (
              <InlineError>{applyState.error}</InlineError>
            ) : null}

            <Button
              isDisabled={applyState.isApplying || snapshotState.isLoading}
              isPending={applyState.isApplying}
              onPress={() => void handleApply()}
            >
              {applyState.dryRun ? "预检 MCP 应用" : "应用 MCP 配置"}
            </Button>
          </div>
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <OpenClawAgentsCard
          agents={agents}
          isLoading={snapshotState.isLoading}
        />
        <OpenClawMCPServersCard
          isLoading={snapshotState.isLoading}
          servers={openClawMCPServers}
        />
      </section>

      {applyState.result ? (
        <ApplyResultCard result={applyState.result} />
      ) : null}
    </AdminPage>
  );
}

function MCPServerDialog({
  onSaved,
  server,
}: {
  onSaved: () => void;
  server?: MCPServer;
}) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: toMCPServerForm(server),
        isSaving: false,
      });
    },
  });
  const [state, setState] = useState<MCPServerDialogState>({
    error: null,
    form: toMCPServerForm(server),
    isSaving: false,
  });
  const isEditing = Boolean(server?.id);
  const { error, form, isSaving } = state;

  function updateForm(patch: Partial<MCPServerFormState>) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        ...patch,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
    }));

    try {
      const request = buildMCPServerRequest(form);

      if (isEditing) {
        await updateMCPServer({
          ...request,
          id: server?.id,
        } satisfies ReqMCPServerUpdate);
      } else {
        await createMCPServer(request satisfies ReqMCPServerCreate);
      }

      modal.close();
      setState({
        error: null,
        form: toMCPServerForm(server),
        isSaving: false,
      });
      toast.success(isEditing ? "MCP 配置已更新。" : "MCP 配置已创建。");
      onSaved();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getMCPActionError(error, "MCP 配置保存失败。"),
        isSaving: false,
      }));
    }
  }

  function closeDialog() {
    if (isSaving) return;

    modal.close();
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant={isEditing ? "tertiary" : "primary"}>
          {isEditing ? (
            "编辑"
          ) : (
            <>
              <AdminIcon className="size-4" name="plus" />
              新建 MCP
            </>
          )}
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isSaving}
        isKeyboardDismissDisabled={isSaving}
      >
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>
                  {isEditing ? "编辑 MCP 配置" : "新建 MCP 配置"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                <MCPServerFormFields
                  form={form}
                  isDisabled={isSaving}
                  onChange={updateForm}
                />
                {error ? <InlineError>{error}</InlineError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isSaving}
                  type="button"
                  variant="tertiary"
                  onPress={closeDialog}
                >
                  取消
                </Button>
                <Button isDisabled={isSaving} type="submit">
                  {isSaving ? "保存中..." : "保存配置"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function MCPServerFormFields({
  form,
  isDisabled,
  onChange,
}: {
  form: MCPServerFormState;
  isDisabled: boolean;
  onChange: (patch: Partial<MCPServerFormState>) => void;
}) {
  const isStdio = form.transport === "stdio";

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField fullWidth variant="secondary">
          <Label>Server Name</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="github"
            value={form.serverName}
            onChange={(event) => onChange({ serverName: event.target.value })}
          />
        </TextField>
        <TextField fullWidth variant="secondary">
          <Label>展示名称</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="GitHub MCP"
            value={form.displayName}
            onChange={(event) => onChange({ displayName: event.target.value })}
          />
        </TextField>
      </div>

      <LabeledTextarea
        isDisabled={isDisabled}
        label="说明"
        placeholder="GitHub repository tools"
        rows={2}
        value={form.description}
        onChange={(description) => onChange({ description })}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select
          fullWidth
          className="min-w-0"
          isDisabled={isDisabled}
          selectedKey={form.transport}
          variant="secondary"
          onSelectionChange={(key) =>
            onChange({ transport: String(key ?? "stdio") })
          }
        >
          <Label>连接方式</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {MCP_TRANSPORT_OPTIONS.map((option) => (
                <ListBox.Item key={option.id} id={option.id}>
                  {option.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <TextField fullWidth variant="secondary">
          <Label>连接超时 ms</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            inputMode="numeric"
            placeholder="10000"
            value={form.connectionTimeoutMs}
            onChange={(event) =>
              onChange({ connectionTimeoutMs: event.target.value })
            }
          />
        </TextField>
        <TextField fullWidth variant="secondary">
          <Label>请求超时 ms</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            inputMode="numeric"
            placeholder="30000"
            value={form.requestTimeoutMs}
            onChange={(event) =>
              onChange({ requestTimeoutMs: event.target.value })
            }
          />
        </TextField>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField fullWidth variant="secondary">
          <Label>连接超时 sec</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            inputMode="numeric"
            placeholder="10"
            value={form.connectTimeout}
            onChange={(event) =>
              onChange({ connectTimeout: event.target.value })
            }
          />
        </TextField>
        <TextField fullWidth variant="secondary">
          <Label>请求超时 sec</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            inputMode="numeric"
            placeholder="30"
            value={form.timeout}
            onChange={(event) => onChange({ timeout: event.target.value })}
          />
        </TextField>
      </div>

      {isStdio ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextField fullWidth variant="secondary">
            <Label>Command</Label>
            <Input
              autoComplete="off"
              disabled={isDisabled}
              placeholder="npx"
              value={form.command}
              onChange={(event) => onChange({ command: event.target.value })}
            />
          </TextField>
          <TextField fullWidth variant="secondary">
            <Label>CWD</Label>
            <Input
              autoComplete="off"
              disabled={isDisabled}
              placeholder="/srv/mcp"
              value={form.cwd}
              onChange={(event) => onChange({ cwd: event.target.value })}
            />
          </TextField>
          <TextField fullWidth variant="secondary">
            <Label>Working Directory</Label>
            <Input
              autoComplete="off"
              disabled={isDisabled}
              placeholder="/srv/mcp"
              value={form.workingDirectory}
              onChange={(event) =>
                onChange({ workingDirectory: event.target.value })
              }
            />
          </TextField>
          <div className="md:col-span-2">
            <LabeledTextarea
              isDisabled={isDisabled}
              label="Args（每行一个）"
              placeholder={"-y\n@modelcontextprotocol/server-github"}
              rows={3}
              value={form.argsText}
              onChange={(argsText) => onChange({ argsText })}
            />
          </div>
        </div>
      ) : (
        <TextField fullWidth variant="secondary">
          <Label>URL</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="https://mcp.example.com/sse"
            value={form.url}
            onChange={(event) => onChange({ url: event.target.value })}
          />
        </TextField>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TextField fullWidth variant="secondary">
          <Label>Auth</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="oauth"
            value={form.auth}
            onChange={(event) => onChange({ auth: event.target.value })}
          />
        </TextField>
        <OptionalBooleanSelect
          isDisabled={isDisabled}
          label="SSL Verify"
          value={form.sslVerify}
          onChange={(sslVerify) => onChange({ sslVerify })}
        />
        <OptionalBooleanSelect
          isDisabled={isDisabled}
          label="并行工具调用"
          value={form.supportsParallelToolCalls}
          onChange={(supportsParallelToolCalls) =>
            onChange({ supportsParallelToolCalls })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField fullWidth variant="secondary">
          <Label>Client Cert</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="/etc/ssl/client.crt"
            value={form.clientCert}
            onChange={(event) => onChange({ clientCert: event.target.value })}
          />
        </TextField>
        <TextField fullWidth variant="secondary">
          <Label>Client Key</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="/etc/ssl/client.key"
            value={form.clientKey}
            onChange={(event) => onChange({ clientKey: event.target.value })}
          />
        </TextField>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TextField fullWidth variant="secondary">
          <Label>OAuth Scope</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="repo read:user"
            value={form.oauthScope}
            onChange={(event) => onChange({ oauthScope: event.target.value })}
          />
        </TextField>
        <TextField fullWidth variant="secondary">
          <Label>OAuth Redirect URL</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="http://127.0.0.1:1455/oauth/callback"
            value={form.oauthRedirectUrl}
            onChange={(event) =>
              onChange({ oauthRedirectUrl: event.target.value })
            }
          />
        </TextField>
        <TextField fullWidth variant="secondary">
          <Label>OAuth Client Metadata URL</Label>
          <Input
            autoComplete="off"
            disabled={isDisabled}
            placeholder="https://example.com/.well-known/oauth-client"
            value={form.oauthClientMetadataUrl}
            onChange={(event) =>
              onChange({ oauthClientMetadataUrl: event.target.value })
            }
          />
        </TextField>
      </div>

      <ValueRowsEditor
        isDisabled={isDisabled}
        label="环境变量"
        rows={form.envRows}
        onChange={(envRows) => onChange({ envRows })}
      />
      <ValueRowsEditor
        isDisabled={isDisabled}
        label="请求头"
        rows={form.headerRows}
        onChange={(headerRows) => onChange({ headerRows })}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LabeledTextarea
          isDisabled={isDisabled}
          label="允许工具（逗号或换行分隔）"
          placeholder="search, fetch"
          rows={2}
          value={form.toolFilterIncludeText}
          onChange={(toolFilterIncludeText) =>
            onChange({ toolFilterIncludeText })
          }
        />
        <LabeledTextarea
          isDisabled={isDisabled}
          label="排除工具（逗号或换行分隔）"
          placeholder="delete_*"
          rows={2}
          value={form.toolFilterExcludeText}
          onChange={(toolFilterExcludeText) =>
            onChange({ toolFilterExcludeText })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LabeledTextarea
          isDisabled={isDisabled}
          label="Codex JSON"
          placeholder={'{"approvalPolicy":"never"}'}
          rows={4}
          value={form.codexJson}
          onChange={(codexJson) => onChange({ codexJson })}
        />
        <LabeledTextarea
          isDisabled={isDisabled}
          label="Extra JSON"
          placeholder={'{"customField":"value"}'}
          rows={4}
          value={form.extraJson}
          onChange={(extraJson) => onChange({ extraJson })}
        />
      </div>

      <Checkbox
        isDisabled={isDisabled}
        isSelected={form.enabled}
        onChange={(enabled) => onChange({ enabled })}
      >
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Content>
          <span className="block text-sm font-medium">启用配置</span>
          <span className="text-muted block text-xs">
            下发到 OpenClaw 后默认启用该 MCP server。
          </span>
        </Checkbox.Content>
      </Checkbox>
    </div>
  );
}

function OptionalBooleanSelect({
  isDisabled,
  label,
  onChange,
  value,
}: {
  isDisabled: boolean;
  label: string;
  onChange: (value: OptionalBooleanValue) => void;
  value: OptionalBooleanValue;
}) {
  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={value || "unset"}
      variant="secondary"
      onSelectionChange={(key) =>
        onChange(key === "true" || key === "false" ? key : "")
      }
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="unset">默认</ListBox.Item>
          <ListBox.Item id="true">是</ListBox.Item>
          <ListBox.Item id="false">否</ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function ValueRowsEditor({
  isDisabled,
  label,
  rows,
  onChange,
}: {
  isDisabled: boolean;
  label: string;
  rows: ConfigValueRow[];
  onChange: (rows: ConfigValueRow[]) => void;
}) {
  function updateRow(id: string, patch: Partial<ConfigValueRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Button
          isDisabled={isDisabled}
          size="sm"
          type="button"
          variant="tertiary"
          onPress={() => onChange([...rows, createEmptyValueRow()])}
        >
          添加
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-1 gap-2 rounded-md border border-divider p-2 md:grid-cols-[minmax(120px,1fr)_120px_minmax(160px,1.2fr)_auto]"
            >
              <Input
                autoComplete="off"
                disabled={isDisabled}
                placeholder="Key"
                value={row.key}
                onChange={(event) =>
                  updateRow(row.id, { key: event.target.value })
                }
              />
              <Select
                fullWidth
                className="min-w-0"
                isDisabled={isDisabled}
                selectedKey={row.type}
                variant="secondary"
                onSelectionChange={(key) =>
                  updateRow(row.id, { type: String(key ?? "literal") })
                }
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {MCP_VALUE_TYPE_OPTIONS.map((option) => (
                      <ListBox.Item key={option.id} id={option.id}>
                        {option.label}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Input
                autoComplete="off"
                disabled={isDisabled}
                placeholder={row.type === "env_ref" ? "ENV_NAME" : "Value"}
                value={row.type === "env_ref" ? row.envName : row.value}
                onChange={(event) =>
                  updateRow(
                    row.id,
                    row.type === "env_ref"
                      ? { envName: event.target.value }
                      : { value: event.target.value },
                  )
                }
              />
              <Button
                isDisabled={isDisabled}
                size="sm"
                type="button"
                variant="danger-soft"
                onPress={() =>
                  onChange(rows.filter((item) => item.id !== row.id))
                }
              >
                删除
              </Button>
            </div>
          ))
        ) : (
          <span className="text-muted rounded-md border border-dashed border-divider px-3 py-2 text-sm">
            未配置{label}。
          </span>
        )}
      </div>
    </div>
  );
}

function DeleteMCPServerDialog({
  onDeleted,
  server,
}: {
  onDeleted: () => void;
  server: MCPServer;
}) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setError(null);
      setIsDeleting(false);
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const serverId = server.id;

  async function handleDelete() {
    if (typeof serverId !== "number") {
      setError("MCP 配置缺少记录 ID，无法删除。");

      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await deleteMCPServer(serverId);
      modal.close();
      setIsDeleting(false);
      toast.success("MCP 配置已删除。");
      onDeleted();
    } catch (error) {
      setError(getMCPActionError(error, "MCP 配置删除失败。"));
      setIsDeleting(false);
    }
  }

  function closeDialog() {
    if (isDeleting) return;

    modal.close();
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="danger-soft">
          删除
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isDeleting}
        isKeyboardDismissDisabled={isDeleting}
      >
        <Modal.Container placement="center" scroll="outside" size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>删除 MCP 配置</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-3">
              <p className="text-muted text-sm">
                确认删除「{server.displayName || server.serverName || server.id}
                」？该操作只删除后台配置库记录，不会改动 OpenClaw 当前配置。
              </p>
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="tertiary"
                onPress={closeDialog}
              >
                取消
              </Button>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="danger"
                onPress={() => void handleDelete()}
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function RPCInstanceSelect({
  instances,
  isDisabled,
  onChange,
  selectedPluginId,
}: {
  instances: OpenClawRPCInstance[];
  isDisabled: boolean;
  onChange: (pluginId: string) => void;
  selectedPluginId: string;
}) {
  if (instances.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-divider px-3 py-2 text-sm text-muted">
        当前没有已连接的 OpenClaw RPC 实例。
      </div>
    );
  }

  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={selectedPluginId}
      variant="secondary"
      onSelectionChange={(key) => onChange(String(key ?? ""))}
    >
      <Label>RPC 实例</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {instances.map((instance) => {
            const pluginId = instance.pluginId?.trim() ?? "";

            return (
              <ListBox.Item key={pluginId} id={pluginId}>
                {pluginId || "未命名实例"}
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function AgentSelect({
  agents,
  isDisabled,
  onChange,
  selectedAgentId,
}: {
  agents: OpenClawAgentConfigSnapshot[];
  isDisabled: boolean;
  onChange: (agentId: string) => void;
  selectedAgentId: string;
}) {
  if (agents.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-divider px-3 py-2 text-sm text-muted">
        当前快照没有可绑定的 OpenClaw Agent。
      </div>
    );
  }

  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={selectedAgentId}
      variant="secondary"
      onSelectionChange={(key) => onChange(String(key ?? ""))}
    >
      <Label>目标 Agent</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {agents.map((agent) => {
            const agentId = agent.agentId?.trim() ?? "";

            return (
              <ListBox.Item key={agentId} id={agentId}>
                {agent.displayName || agentId || "未命名 Agent"}
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function OpenClawAgentsCard({
  agents,
  isLoading,
}: {
  agents: OpenClawAgentConfigSnapshot[];
  isLoading: boolean;
}) {
  return (
    <SectionCard title="OpenClaw Agent 快照">
      <div className="flex max-h-[420px] flex-col gap-2 overflow-auto">
        {agents.length > 0 ? (
          agents.map((agent) => (
            <div
              key={agent.agentId}
              className="rounded-md border border-divider px-3 py-2"
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {agent.displayName || agent.agentId || "未命名 Agent"}
                  </div>
                  <div className="text-muted truncate text-xs">
                    {agent.agentId || "-"}
                  </div>
                </div>
                <Chip size="sm" variant="soft">
                  {(agent.toolsAlsoAllow?.length ?? 0) +
                    (agent.sandboxToolsAlsoAllow?.length ?? 0)}
                </Chip>
              </div>
              <SnapshotLine
                label="tools.alsoAllow"
                values={agent.toolsAlsoAllow}
              />
              <SnapshotLine
                label="sandbox.tools.alsoAllow"
                values={agent.sandboxToolsAlsoAllow}
              />
            </div>
          ))
        ) : (
          <EmptySnapshotText isLoading={isLoading} label="Agent" />
        )}
      </div>
    </SectionCard>
  );
}

function OpenClawMCPServersCard({
  isLoading,
  servers,
}: {
  isLoading: boolean;
  servers: NonNullable<OpenClawConfigSnapshot["mcpServers"]>;
}) {
  return (
    <SectionCard title="OpenClaw MCP 快照">
      <div className="flex max-h-[420px] flex-col gap-2 overflow-auto">
        {servers.length > 0 ? (
          servers.map((server) => (
            <div
              key={server.serverName}
              className="rounded-md border border-divider px-3 py-2"
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {server.serverName || "未命名 MCP"}
                  </div>
                  <div className="text-muted truncate text-xs">
                    {server.transport || "-"} ·{" "}
                    {server.hasCommand
                      ? "command"
                      : server.hasUrl
                        ? "url"
                        : "-"}
                  </div>
                </div>
                <Chip
                  color={server.enabled === false ? "default" : "success"}
                  size="sm"
                  variant="soft"
                >
                  {server.enabled === false ? "停用" : "启用"}
                </Chip>
              </div>
              <SnapshotLine label="include" values={server.toolFilterInclude} />
              <SnapshotLine label="exclude" values={server.toolFilterExclude} />
            </div>
          ))
        ) : (
          <EmptySnapshotText isLoading={isLoading} label="MCP server" />
        )}
      </div>
    </SectionCard>
  );
}

function ApplyResultCard({ result }: { result: OpenClawMCPApplyResult }) {
  return (
    <SectionCard title="最近应用结果">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            color={result.success === false ? "danger" : "success"}
            size="sm"
            variant="soft"
          >
            {result.success === false ? "失败" : "成功"}
          </Chip>
          <Chip size="sm" variant="soft">
            {result.dryRun ? "Dry run" : "已写入"}
          </Chip>
          {result.followUpMode ? (
            <Chip size="sm" variant="soft">
              {result.followUpMode}
            </Chip>
          ) : null}
        </div>
        {result.message ? (
          <p className="text-sm text-foreground">{result.message}</p>
        ) : null}
        <SnapshotLine label="changed" values={result.changed} />
        <SnapshotLine label="warnings" values={result.warnings} />
        {result.followUpReason ? (
          <p className="text-muted text-xs">{result.followUpReason}</p>
        ) : null}
      </div>
    </SectionCard>
  );
}

function SnapshotLine({ label, values }: { label: string; values?: string[] }) {
  return (
    <div className="mt-2 flex min-w-0 flex-col gap-1">
      <span className="text-muted text-xs">{label}</span>
      <span className="break-all text-xs">
        {values && values.length > 0 ? values.join(", ") : "-"}
      </span>
    </div>
  );
}

function EmptySnapshotText({
  isLoading,
  label,
}: {
  isLoading: boolean;
  label: string;
}) {
  return (
    <span className="text-muted rounded-md border border-dashed border-divider px-3 py-6 text-center text-sm">
      {isLoading ? "加载中..." : `暂无 ${label} 快照。`}
    </span>
  );
}

function LabeledTextarea({
  isDisabled,
  label,
  onChange,
  placeholder,
  rows = 3,
  value,
}: {
  isDisabled: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}) {
  return (
    <TextField
      fullWidth
      isDisabled={isDisabled}
      value={value}
      variant="secondary"
      onChange={onChange}
    >
      <Label>{label}</Label>
      <TextArea placeholder={placeholder} rows={rows} variant="secondary" />
    </TextField>
  );
}

function InlineError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function toMCPServerForm(server?: MCPServer): MCPServerFormState {
  const config = server?.config ?? {};
  const transport =
    config.transport || server?.transportType || inferTransport(config);
  const toolFilter = config.toolFilter ?? {};

  return {
    argsText: (config.args ?? []).join("\n"),
    auth: config.auth ?? "",
    clientCert: config.clientCert ?? "",
    clientKey: config.clientKey ?? "",
    command: config.command ?? "",
    codexJson: formatOptionalJson(config.codex),
    connectTimeout: formatOptionalNumber(config.connectTimeout),
    connectionTimeoutMs: formatOptionalNumber(config.connectionTimeoutMs),
    cwd: config.cwd ?? "",
    description: server?.description ?? "",
    displayName: server?.displayName ?? "",
    enabled: server?.enabled !== false,
    envRows: valueRowsFromMap(config.env),
    extraJson: formatOptionalJson(config.extra),
    headerRows: valueRowsFromMap(config.headers),
    id: server?.id,
    oauthClientMetadataUrl: config.oauth?.clientMetadataUrl ?? "",
    oauthRedirectUrl: config.oauth?.redirectUrl ?? "",
    oauthScope: config.oauth?.scope ?? "",
    requestTimeoutMs: formatOptionalNumber(config.requestTimeoutMs),
    serverName: server?.serverName ?? "",
    sslVerify: optionalBooleanToForm(config.sslVerify),
    supportsParallelToolCalls: optionalBooleanToForm(
      config.supportsParallelToolCalls,
    ),
    toolFilterExcludeText: (toolFilter.exclude ?? []).join("\n"),
    toolFilterIncludeText: (toolFilter.include ?? []).join("\n"),
    timeout: formatOptionalNumber(config.timeout),
    transport,
    url: config.url ?? "",
    workingDirectory: config.workingDirectory ?? "",
  };
}

function buildMCPServerRequest(form: MCPServerFormState): ReqMCPServerCreate {
  const serverName = form.serverName.trim();
  const displayName = form.displayName.trim();
  const transport = form.transport.trim();

  if (!serverName) throw new Error("Server Name 为必填项。");
  if (!displayName) throw new Error("展示名称为必填项。");
  if (!transport) throw new Error("连接方式为必填项。");

  const config: MCPServerConfig = {
    enabled: form.enabled,
    transport,
  };

  if (transport === "stdio") {
    const command = form.command.trim();

    if (!command) throw new Error("stdio MCP 配置需要填写 Command。");

    config.command = command;
    config.args = splitTextList(form.argsText);

    if (form.cwd.trim()) config.cwd = form.cwd.trim();
    if (form.workingDirectory.trim()) {
      config.workingDirectory = form.workingDirectory.trim();
    }
  } else {
    const url = form.url.trim();

    if (!url) throw new Error("远程 MCP 配置需要填写 URL。");

    config.url = url;
  }

  const env = buildConfigValueMap(form.envRows, "环境变量");
  const headers = buildConfigValueMap(form.headerRows, "请求头");
  const toolFilterInclude = splitTextList(form.toolFilterIncludeText);
  const toolFilterExclude = splitTextList(form.toolFilterExcludeText);
  const connectTimeout = parseOptionalNumber(
    form.connectTimeout,
    "连接超时 sec",
  );
  const connectionTimeoutMs = parseOptionalNumber(
    form.connectionTimeoutMs,
    "连接超时",
  );
  const requestTimeoutMs = parseOptionalNumber(
    form.requestTimeoutMs,
    "请求超时",
  );
  const timeout = parseOptionalNumber(form.timeout, "请求超时 sec");
  const codex = parseOptionalObject(form.codexJson, "Codex JSON");
  const extra = parseOptionalObject(form.extraJson, "Extra JSON");
  const supportsParallelToolCalls = optionalBooleanFromForm(
    form.supportsParallelToolCalls,
  );
  const sslVerify = optionalBooleanFromForm(form.sslVerify);

  if (form.auth.trim()) config.auth = form.auth.trim();
  if (form.clientCert.trim()) config.clientCert = form.clientCert.trim();
  if (form.clientKey.trim()) config.clientKey = form.clientKey.trim();
  if (
    form.oauthScope.trim() ||
    form.oauthRedirectUrl.trim() ||
    form.oauthClientMetadataUrl.trim()
  ) {
    config.oauth = {
      clientMetadataUrl: form.oauthClientMetadataUrl.trim(),
      redirectUrl: form.oauthRedirectUrl.trim(),
      scope: form.oauthScope.trim(),
    };
  }
  if (Object.keys(env).length > 0) config.env = env;
  if (Object.keys(headers).length > 0) config.headers = headers;
  if (toolFilterInclude.length > 0 || toolFilterExclude.length > 0) {
    config.toolFilter = {
      exclude: toolFilterExclude,
      include: toolFilterInclude,
    };
  }
  if (typeof connectTimeout === "number") {
    config.connectTimeout = connectTimeout;
  }
  if (typeof connectionTimeoutMs === "number") {
    config.connectionTimeoutMs = connectionTimeoutMs;
  }
  if (typeof requestTimeoutMs === "number") {
    config.requestTimeoutMs = requestTimeoutMs;
  }
  if (typeof timeout === "number") config.timeout = timeout;
  if (typeof supportsParallelToolCalls === "boolean") {
    config.supportsParallelToolCalls = supportsParallelToolCalls;
  }
  if (typeof sslVerify === "boolean") config.sslVerify = sslVerify;
  if (codex) config.codex = codex;
  if (extra) config.extra = extra;

  return {
    config,
    description: form.description.trim(),
    displayName,
    enabled: form.enabled,
    serverName,
  };
}

function buildConfigValueMap(rows: ConfigValueRow[], label: string) {
  const result: Record<string, MCPConfigValue> = {};

  for (const row of rows) {
    const key = row.key.trim();

    if (!key) continue;

    if (row.type === "env_ref") {
      const envName = row.envName.trim();

      if (!envName) throw new Error(`${label} ${key} 缺少环境变量名。`);

      result[key] = {
        envName,
        type: "env_ref",
      };
    } else {
      const value = row.value.trim();

      if (!value) throw new Error(`${label} ${key} 缺少值。`);

      result[key] = {
        type: row.type,
        value,
      };
    }
  }

  return result;
}

function valueRowsFromMap(values?: Record<string, MCPConfigValue>) {
  if (!values) return [];

  return Object.entries(values).map(([key, value]) => ({
    envName: value.envName ?? "",
    id: createRowId(),
    key,
    type: value.type ?? "literal",
    value: value.value ?? "",
  }));
}

function createEmptyValueRow(): ConfigValueRow {
  return {
    envName: "",
    id: createRowId(),
    key: "",
    type: "literal",
    value: "",
  };
}

function createRowId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function inferTransport(config: MCPServerConfig): MCPTransport {
  if (config.command) return "stdio";
  if (config.url) return "sse";

  return "stdio";
}

function splitTextList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  const result = Number(trimmed);

  if (!Number.isFinite(result) || result < 0) {
    throw new Error(`${label}必须是非负数字。`);
  }

  return result;
}

function parseOptionalObject(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${label} 必须是 JSON object。`);
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${label} 格式不是有效 JSON。`);
    }

    throw error;
  }
}

function formatOptionalNumber(value?: number) {
  return typeof value === "number" ? String(value) : "";
}

function formatOptionalJson(value?: Record<string, unknown>) {
  if (!value || Object.keys(value).length === 0) return "";

  return JSON.stringify(value, null, 2);
}

function optionalBooleanToForm(value?: boolean): OptionalBooleanValue {
  if (typeof value !== "boolean") return "";

  return value ? "true" : "false";
}

function optionalBooleanFromForm(value: OptionalBooleanValue) {
  if (value === "true") return true;
  if (value === "false") return false;

  return undefined;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function getMCPActionError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
