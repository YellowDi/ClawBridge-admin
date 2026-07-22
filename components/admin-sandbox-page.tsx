"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type {
  ReqSandboxConfigCreate,
  SandboxBindAccessMode,
  SandboxConfig,
  SandboxEnvValueType,
  SandboxMode,
  SandboxScope,
  SandboxSessionToolsVisibility,
  SandboxWorkspaceAccess,
} from "@/lib/api";
import type { FormEvent, ReactNode } from "react";

import { DataGrid } from "@heroui-pro/react";
import {
  Button,
  Checkbox,
  Chip,
  Description,
  Disclosure,
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
  createSandboxConfig,
  deleteSandboxConfig,
  getSandboxConfigDetail,
  listSandboxConfigs,
  updateSandboxConfig,
} from "@/lib/api";

type SandboxForm = {
  binds: BindRow[];
  capDrop: CapDropRow[];
  description: string;
  dnsServers: DNSRow[];
  dockerAllowContainerNamespaceJoin: boolean;
  dockerAllowExternalBindSources: boolean;
  dockerAllowReservedContainerTargets: boolean;
  dockerApparmorProfile: string;
  dockerContainerPrefix: string;
  dockerCpus: string;
  dockerGpus: string;
  dockerImage: string;
  dockerMemoryBytes: string;
  dockerMemorySwapBytes: string;
  dockerNetwork: string;
  dockerPidsLimit: string;
  dockerReadOnlyRoot: boolean;
  dockerSeccompProfile: string;
  dockerSetupCommand: string;
  dockerUser: string;
  dockerWorkdir: string;
  enabled: boolean;
  envs: EnvRow[];
  extraHosts: ExtraHostRow[];
  mode: SandboxMode;
  name: string;
  pruneIdleHours: string;
  pruneMaxAgeDays: string;
  scope: SandboxScope;
  sessionToolsVisibility: SandboxSessionToolsVisibility;
  tmpfs: TmpfsRow[];
  ulimits: UlimitRow[];
  workspaceAccess: SandboxWorkspaceAccess;
  workspaceRoot: string;
};

type TmpfsRow = {
  deviceEnabled: boolean;
  executable: boolean;
  mountPath: string;
  permissionMode: string;
  readOnly: boolean;
  sizeBytes: string;
  suidEnabled: boolean;
};

type CapDropRow = { capability: string };
type EnvRow = {
  envKey: string;
  envRef: string;
  envValue: string;
  valueType: SandboxEnvValueType;
};
type UlimitRow = { hardLimit: string; limitName: string; softLimit: string };
type DNSRow = { dnsServer: string };
type ExtraHostRow = { address: string; hostname: string };
type BindRow = {
  accessMode: SandboxBindAccessMode;
  sourcePath: string;
  targetPath: string;
};

type SandboxDialogMode = "create" | "edit" | "view";

const CONTAINER_PREFIX_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,30}-$/;
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const MODE_OPTIONS = [
  { id: "off", label: "关闭" },
  { id: "non-main", label: "仅非主会话" },
  { id: "all", label: "全部会话" },
] as const;
const SCOPE_OPTIONS = [
  { id: "session", label: "会话" },
  { id: "agent", label: "Agent" },
  { id: "shared", label: "共享（不能绑定单个 Agent）" },
] as const;
const WORKSPACE_ACCESS_OPTIONS = [
  { id: "none", label: "不挂载" },
  { id: "ro", label: "只读" },
  { id: "rw", label: "读写" },
] as const;
const SESSION_TOOLS_OPTIONS = [
  { id: "spawned", label: "仅派生会话" },
  { id: "all", label: "全部会话" },
] as const;

const DEFAULT_SANDBOX_FORM: SandboxForm = {
  binds: [],
  capDrop: [{ capability: "ALL" }],
  description: "",
  dnsServers: [],
  dockerAllowContainerNamespaceJoin: false,
  dockerAllowExternalBindSources: false,
  dockerAllowReservedContainerTargets: false,
  dockerApparmorProfile: "",
  dockerContainerPrefix: "openclaw-sbx-",
  dockerCpus: "0",
  dockerGpus: "",
  dockerImage: "openclaw-sandbox:bookworm-slim",
  dockerMemoryBytes: "0",
  dockerMemorySwapBytes: "0",
  dockerNetwork: "none",
  dockerPidsLimit: "0",
  dockerReadOnlyRoot: true,
  dockerSeccompProfile: "",
  dockerSetupCommand: "",
  dockerUser: "",
  dockerWorkdir: "/workspace",
  enabled: true,
  envs: [],
  extraHosts: [],
  mode: "non-main",
  name: "",
  pruneIdleHours: "24",
  pruneMaxAgeDays: "7",
  scope: "agent",
  sessionToolsVisibility: "spawned",
  tmpfs: [
    createTmpfsRow("/tmp"),
    createTmpfsRow("/var/tmp"),
    createTmpfsRow("/run"),
  ],
  ulimits: [],
  workspaceAccess: "none",
  workspaceRoot: "",
};

export function AdminSandboxPage() {
  const isMountedRef = useRef(false);
  const [items, setItems] = useState<SandboxConfig[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadConfigs = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await listSandboxConfigs({ pageSize: 500 });

      if (isMountedRef.current) {
        setItems(response.filter((item) => item.isDelete !== 2));
        setIsLoading(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const message = getSandboxError(error, "Sandbox 配置加载失败。");

        setError(message);
        setItems([]);
        setIsLoading(false);
        toast.danger(message);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadConfigs();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadConfigs]);

  const columns = useMemo<DataGridColumn<SandboxConfig>[]>(
    () => [
      {
        cell: (item) => (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-medium" title={item.name}>
              {item.name || "未命名配置"}
            </span>
            <span
              className="text-muted truncate text-xs"
              title={item.description}
            >
              {item.description || "暂无说明"}
            </span>
          </div>
        ),
        header: "配置",
        headerClassName: "whitespace-nowrap",
        id: "name",
        isRowHeader: true,
        minWidth: 210,
      },
      {
        cell: (item) => formatMode(item.mode),
        cellClassName: "whitespace-nowrap",
        header: "启用模式",
        headerClassName: "whitespace-nowrap",
        id: "mode",
        width: 112,
      },
      {
        cell: (item) => formatScope(item.scope),
        cellClassName: "whitespace-nowrap",
        header: "隔离范围",
        headerClassName: "whitespace-nowrap",
        id: "scope",
        width: 96,
      },
      {
        cell: (item) => formatWorkspaceAccess(item.workspaceAccess),
        cellClassName: "whitespace-nowrap",
        header: "工作区权限",
        headerClassName: "whitespace-nowrap",
        id: "workspaceAccess",
        width: 104,
      },
      {
        cell: (item) => (
          <Chip
            className="whitespace-nowrap"
            color={item.enabled ? "success" : "default"}
            size="sm"
            variant="soft"
          >
            {item.enabled ? "启用" : "停用"}
          </Chip>
        ),
        cellClassName: "whitespace-nowrap",
        header: "状态",
        headerClassName: "whitespace-nowrap",
        id: "enabled",
        width: 72,
      },
      {
        cell: (item) => formatDateTime(item.updatedAt || item.createdAt),
        cellClassName: "whitespace-nowrap",
        header: "更新时间",
        headerClassName: "whitespace-nowrap",
        id: "updatedAt",
        width: 138,
      },
      {
        cell: (item) => (
          <div className="flex items-center justify-end gap-2">
            <SandboxConfigDialog
              config={item}
              mode="view"
              onSaved={loadConfigs}
            />
            <SandboxConfigDialog
              config={item}
              mode="edit"
              onSaved={loadConfigs}
            />
            <DeleteSandboxConfigDialog config={item} onDeleted={loadConfigs} />
          </div>
        ),
        cellClassName: "whitespace-nowrap",
        header: "操作",
        headerClassName: "whitespace-nowrap",
        id: "actions",
        width: 190,
      },
    ],
    [loadConfigs],
  );

  const enabledCount = items.filter((item) => item.enabled).length;
  const bindableCount = items.filter(isBindableSandboxConfig).length;
  const dangerousCount = items.filter(hasDangerousOptions).length;

  return (
    <AdminPage
      actions={
        <>
          <Button
            aria-label="刷新 Sandbox 配置"
            isPending={isLoading}
            size="sm"
            variant="tertiary"
            onPress={() => void loadConfigs()}
          >
            <AdminIcon className="size-4" name="refresh" />
            <span className="hidden sm:inline">刷新</span>
          </Button>
          <SandboxConfigDialog mode="create" onSaved={loadConfigs} />
        </>
      }
      description="维护可复用的 OpenClaw Docker Sandbox 配置，并供 Agent 单选绑定。"
      eyebrow="AI 资源"
      title="Sandbox 配置"
    >
      <StatGrid
        stats={[
          {
            helper: "当前配置库记录",
            label: "配置总数",
            value: isLoading ? "-" : String(items.length),
          },
          {
            helper: "允许继续绑定和下发",
            label: "已启用",
            tone: "accent",
            value: isLoading ? "-" : String(enabledCount),
          },
          {
            helper: "scope 为 session 或 agent",
            label: "可绑定",
            value: isLoading ? "-" : String(bindableCount),
          },
          {
            helper: "至少开启一个危险开关",
            label: "危险配置",
            tone: dangerousCount > 0 ? "danger" : "default",
            value: isLoading ? "-" : String(dangerousCount),
          },
        ]}
      />

      <SectionCard
        description="更新会完整替换全部标量字段和所有子项数组；被 Agent 使用的配置不能删除。"
        title="Sandbox 配置库"
      >
        <div className="flex min-w-0 flex-col gap-3">
          {error ? <InlineError>{error}</InlineError> : null}
          <DataGrid
            aria-label="Sandbox 配置库"
            className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
            columns={columns}
            contentClassName="min-w-[920px]"
            data={items}
            defaultSortDescriptor={{
              column: "updatedAt",
              direction: "descending",
            }}
            getRowId={(item) => String(item.id ?? item.name)}
            renderEmptyState={() =>
              isLoading ? "加载中..." : "暂无 Sandbox 配置"
            }
          />
        </div>
      </SectionCard>
    </AdminPage>
  );
}

function SandboxConfigDialog({
  config,
  mode,
  onSaved,
}: {
  config?: SandboxConfig;
  mode: SandboxDialogMode;
  onSaved: () => void;
}) {
  const isReadOnly = mode === "view";
  const isEditing = mode === "edit";
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        dangerConfirmed: false,
        error: null,
        form: toSandboxForm(config),
        isLoading: Boolean(config?.id),
        isSaving: false,
      });

      if (config?.id) void loadDetail(config.id);
    },
  });
  const [state, setState] = useState({
    dangerConfirmed: false,
    error: null as string | null,
    form: toSandboxForm(config),
    isLoading: false,
    isSaving: false,
  });
  const { dangerConfirmed, error, form, isLoading, isSaving } = state;
  const isBusy = isLoading || isSaving;

  async function loadDetail(id: number) {
    try {
      const detail = await getSandboxConfigDetail(id);

      setState((current) => ({
        ...current,
        error: null,
        form: toSandboxForm(detail ?? config),
        isLoading: false,
      }));
    } catch (error) {
      const message = getSandboxError(error, "Sandbox 配置详情加载失败。");

      setState((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }));
      toast.danger(message);
    }
  }

  function updateForm(patch: Partial<SandboxForm>) {
    setState((current) => ({
      ...current,
      form: { ...current.form, ...patch },
    }));
  }

  function closeDialog() {
    if (isBusy) return;

    modal.close();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReadOnly || isLoading) return;

    try {
      const request = buildSandboxRequest(form);

      setState((current) => ({ ...current, error: null, isSaving: true }));

      if (isEditing) {
        const id = config?.id;

        if (typeof id !== "number")
          throw new Error("Sandbox 配置缺少记录 ID。");
        await updateSandboxConfig({ ...request, id });
      } else {
        await createSandboxConfig(request);
      }

      modal.close();
      setState((current) => ({ ...current, isSaving: false }));
      toast.success(
        isEditing ? "Sandbox 配置已更新。" : "Sandbox 配置已创建。",
      );
      onSaved();
    } catch (error) {
      const message = getSandboxError(error, "Sandbox 配置保存失败。");

      setState((current) => ({
        ...current,
        error: message,
        isSaving: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant={mode === "create" ? "primary" : "tertiary"}>
          {mode === "create" ? (
            <>
              <AdminIcon className="size-4" name="plus" />
              新建 Sandbox
            </>
          ) : mode === "edit" ? (
            "编辑"
          ) : (
            "查看"
          )}
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isBusy}
        isKeyboardDismissDisabled={isBusy}
      >
        <Modal.Container placement="center" scroll="inside" size="cover">
          <Modal.Dialog className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden">
            <form
              className="flex min-h-0 min-w-0 flex-1 flex-col"
              onSubmit={handleSubmit}
            >
              <Modal.Header className="shrink-0">
                <Modal.Heading>
                  {mode === "create"
                    ? "新建 Sandbox 配置"
                    : mode === "edit"
                      ? "编辑 Sandbox 配置"
                      : "查看 Sandbox 配置"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 py-1">
                {isLoading ? (
                  <span className="text-muted text-sm">
                    正在加载配置详情...
                  </span>
                ) : null}
                <SandboxFormFields
                  dangerConfirmed={dangerConfirmed}
                  form={form}
                  isDisabled={isReadOnly || isBusy}
                  onChange={updateForm}
                  onDangerConfirmedChange={(confirmed) =>
                    setState((current) => ({
                      ...current,
                      dangerConfirmed: confirmed,
                    }))
                  }
                />
                {error ? <InlineError>{error}</InlineError> : null}
              </Modal.Body>
              <Modal.Footer className="shrink-0">
                <Button
                  isDisabled={isBusy}
                  type="button"
                  variant="tertiary"
                  onPress={closeDialog}
                >
                  {isReadOnly ? "关闭" : "取消"}
                </Button>
                {isReadOnly ? null : (
                  <Button
                    isDisabled={isBusy}
                    isPending={isSaving}
                    type="submit"
                  >
                    {isSaving ? "保存中..." : "保存配置"}
                  </Button>
                )}
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function SandboxFormFields({
  dangerConfirmed,
  form,
  isDisabled,
  onChange,
  onDangerConfirmedChange,
}: {
  dangerConfirmed: boolean;
  form: SandboxForm;
  isDisabled: boolean;
  onChange: (patch: Partial<SandboxForm>) => void;
  onDangerConfirmedChange: (confirmed: boolean) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <FormSection
        description="控制 Sandbox 何时启用、如何隔离以及工作区访问范围。"
        title="基础配置"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            isDisabled={isDisabled}
            label="名称"
            value={form.name}
            onChange={(name) => onChange({ name })}
          />
          <EnumSelect
            isDisabled={isDisabled}
            label="启用模式"
            options={MODE_OPTIONS}
            value={form.mode}
            onChange={(mode) => onChange({ mode: mode as SandboxMode })}
          />
          <EnumSelect
            isDisabled={isDisabled}
            label="隔离范围"
            options={SCOPE_OPTIONS}
            value={form.scope}
            onChange={(scope) => onChange({ scope: scope as SandboxScope })}
          />
          <EnumSelect
            isDisabled={isDisabled}
            label="工作区权限"
            options={WORKSPACE_ACCESS_OPTIONS}
            value={form.workspaceAccess}
            onChange={(workspaceAccess) =>
              onChange({
                workspaceAccess: workspaceAccess as SandboxWorkspaceAccess,
              })
            }
          />
          <EnumSelect
            isDisabled={isDisabled}
            label="会话工具可见性"
            options={SESSION_TOOLS_OPTIONS}
            value={form.sessionToolsVisibility}
            onChange={(sessionToolsVisibility) =>
              onChange({
                sessionToolsVisibility:
                  sessionToolsVisibility as SandboxSessionToolsVisibility,
              })
            }
          />
          <TextInput
            isDisabled={isDisabled}
            label="工作区根目录"
            placeholder="留空使用 OpenClaw 默认值"
            value={form.workspaceRoot}
            onChange={(workspaceRoot) => onChange({ workspaceRoot })}
          />
          <div className="md:col-span-2">
            <TextareaInput
              isDisabled={isDisabled}
              label="描述"
              rows={2}
              value={form.description}
              onChange={(description) => onChange({ description })}
            />
          </div>
          <ToggleField
            description="停用后可继续查看和编辑，但不能绑定或下发。"
            isDisabled={isDisabled}
            isSelected={form.enabled}
            label="启用配置"
            onChange={(enabled) => onChange({ enabled })}
          />
        </div>
      </FormSection>

      <FormSection
        description="0 表示不显式限制；内存和 Swap 使用字节数。"
        title="Docker 配置"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <TextInput
            isDisabled={isDisabled}
            label="镜像"
            value={form.dockerImage}
            onChange={(dockerImage) => onChange({ dockerImage })}
          />
          <TextInput
            description="最多 32 个字符，必须以 - 结尾。"
            isDisabled={isDisabled}
            label="容器名前缀"
            value={form.dockerContainerPrefix}
            onChange={(dockerContainerPrefix) =>
              onChange({ dockerContainerPrefix })
            }
          />
          <TextInput
            isDisabled={isDisabled}
            label="工作目录"
            value={form.dockerWorkdir}
            onChange={(dockerWorkdir) => onChange({ dockerWorkdir })}
          />
          <TextInput
            isDisabled={isDisabled}
            label="网络模式"
            value={form.dockerNetwork}
            onChange={(dockerNetwork) => onChange({ dockerNetwork })}
          />
          <TextInput
            isDisabled={isDisabled}
            label="Docker 用户"
            placeholder="留空使用镜像用户"
            value={form.dockerUser}
            onChange={(dockerUser) => onChange({ dockerUser })}
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="PID 限制"
            value={form.dockerPidsLimit}
            onChange={(dockerPidsLimit) => onChange({ dockerPidsLimit })}
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="内存限制（字节）"
            value={form.dockerMemoryBytes}
            onChange={(dockerMemoryBytes) => onChange({ dockerMemoryBytes })}
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="内存 + Swap（字节）"
            value={form.dockerMemorySwapBytes}
            onChange={(dockerMemorySwapBytes) =>
              onChange({ dockerMemorySwapBytes })
            }
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="CPU 限制"
            value={form.dockerCpus}
            onChange={(dockerCpus) => onChange({ dockerCpus })}
          />
          <TextInput
            isDisabled={isDisabled}
            label="GPU 限制"
            placeholder="例如 all"
            value={form.dockerGpus}
            onChange={(dockerGpus) => onChange({ dockerGpus })}
          />
          <TextInput
            isDisabled={isDisabled}
            label="Seccomp Profile"
            value={form.dockerSeccompProfile}
            onChange={(dockerSeccompProfile) =>
              onChange({ dockerSeccompProfile })
            }
          />
          <TextInput
            isDisabled={isDisabled}
            label="AppArmor Profile"
            value={form.dockerApparmorProfile}
            onChange={(dockerApparmorProfile) =>
              onChange({ dockerApparmorProfile })
            }
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="空闲清理时间（小时）"
            value={form.pruneIdleHours}
            onChange={(pruneIdleHours) => onChange({ pruneIdleHours })}
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="最长保留天数"
            value={form.pruneMaxAgeDays}
            onChange={(pruneMaxAgeDays) => onChange({ pruneMaxAgeDays })}
          />
          <ToggleField
            isDisabled={isDisabled}
            isSelected={form.dockerReadOnlyRoot}
            label="根文件系统只读"
            onChange={(dockerReadOnlyRoot) => onChange({ dockerReadOnlyRoot })}
          />
          <div className="md:col-span-2 xl:col-span-3">
            <TextareaInput
              isDisabled={isDisabled}
              label="初始化命令"
              rows={3}
              value={form.dockerSetupCommand}
              onChange={(dockerSetupCommand) =>
                onChange({ dockerSetupCommand })
              }
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        description="所有列表会在编辑保存时完整替换，空列表会显式提交为 []。"
        title="可重复配置项"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <TmpfsEditor
            isDisabled={isDisabled}
            rows={form.tmpfs}
            onChange={(tmpfs) => onChange({ tmpfs })}
          />
          <CapDropEditor
            isDisabled={isDisabled}
            rows={form.capDrop}
            onChange={(capDrop) => onChange({ capDrop })}
          />
          <EnvEditor
            isDisabled={isDisabled}
            rows={form.envs}
            onChange={(envs) => onChange({ envs })}
          />
          <UlimitEditor
            isDisabled={isDisabled}
            rows={form.ulimits}
            onChange={(ulimits) => onChange({ ulimits })}
          />
          <SimpleRowsEditor
            addLabel="添加 DNS"
            isDisabled={isDisabled}
            label="DNS 服务器"
            renderRow={(row, index) => (
              <TextInput
                isDisabled={isDisabled}
                label={`DNS ${index + 1}`}
                placeholder="1.1.1.1"
                value={row.dnsServer}
                onChange={(dnsServer) =>
                  onChange({
                    dnsServers: replaceAt(form.dnsServers, index, {
                      dnsServer,
                    }),
                  })
                }
              />
            )}
            rows={form.dnsServers}
            onAdd={() =>
              onChange({ dnsServers: [...form.dnsServers, { dnsServer: "" }] })
            }
            onRemove={(index) =>
              onChange({ dnsServers: removeAt(form.dnsServers, index) })
            }
          />
          <ExtraHostsEditor
            isDisabled={isDisabled}
            rows={form.extraHosts}
            onChange={(extraHosts) => onChange({ extraHosts })}
          />
          <BindsEditor
            isDisabled={isDisabled}
            rows={form.binds}
            onChange={(binds) => onChange({ binds })}
          />
        </div>
      </FormSection>

      <Disclosure>
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <Disclosure.Heading>
              <Disclosure.Trigger className="flex items-center gap-2 font-medium text-danger">
                高级危险配置
                <Disclosure.Indicator />
              </Disclosure.Trigger>
            </Disclosure.Heading>
            {hasDangerousFormOptions(form) ? (
              <Chip
                className="whitespace-nowrap"
                color="danger"
                size="sm"
                variant="soft"
              >
                已开启
              </Chip>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-danger">
            开启危险配置可能扩大容器对宿主机文件或其他容器网络的访问范围，请仅在确认目标
            OpenClaw 运行环境可信时启用。
          </p>
          <Disclosure.Content>
            <Disclosure.Body className="mt-4 flex flex-col gap-3">
              <ToggleField
                description="勾选后才可修改下列危险开关。"
                isDisabled={isDisabled}
                isSelected={dangerConfirmed}
                label="我已确认目标 OpenClaw 运行环境可信"
                onChange={onDangerConfirmedChange}
              />
              <ToggleField
                description="允许 bind 覆盖 /workspace、/agent 及其子目录。"
                isDisabled={isDisabled || !dangerConfirmed}
                isSelected={form.dockerAllowReservedContainerTargets}
                label="允许保留容器目标"
                onChange={(dockerAllowReservedContainerTargets) =>
                  onChange({ dockerAllowReservedContainerTargets })
                }
              />
              <ToggleField
                description="自定义 bind mount 必须开启此项。"
                isDisabled={isDisabled || !dangerConfirmed}
                isSelected={form.dockerAllowExternalBindSources}
                label="允许外部 Bind 来源"
                onChange={(dockerAllowExternalBindSources) =>
                  onChange({ dockerAllowExternalBindSources })
                }
              />
              <ToggleField
                description="允许 network=container:<id> 加入其他容器网络命名空间。"
                isDisabled={isDisabled || !dangerConfirmed}
                isSelected={form.dockerAllowContainerNamespaceJoin}
                label="允许容器 Namespace Join"
                onChange={(dockerAllowContainerNamespaceJoin) =>
                  onChange({ dockerAllowContainerNamespaceJoin })
                }
              />
            </Disclosure.Body>
          </Disclosure.Content>
        </div>
      </Disclosure>
    </div>
  );
}

function TmpfsEditor({
  isDisabled,
  rows,
  onChange,
}: {
  isDisabled: boolean;
  rows: TmpfsRow[];
  onChange: (rows: TmpfsRow[]) => void;
}) {
  return (
    <SimpleRowsEditor
      addLabel="添加 tmpfs"
      isDisabled={isDisabled}
      label="tmpfs"
      renderRow={(row, index) => (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
          <TextInput
            isDisabled={isDisabled}
            label="挂载路径"
            value={row.mountPath}
            onChange={(mountPath) =>
              onChange(replaceAt(rows, index, { ...row, mountPath }))
            }
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="容量（字节）"
            value={row.sizeBytes}
            onChange={(sizeBytes) =>
              onChange(replaceAt(rows, index, { ...row, sizeBytes }))
            }
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="权限模式"
            placeholder="例如 1777"
            value={row.permissionMode}
            onChange={(permissionMode) =>
              onChange(replaceAt(rows, index, { ...row, permissionMode }))
            }
          />
          <ToggleField
            isDisabled={isDisabled}
            isSelected={row.readOnly}
            label="只读"
            onChange={(readOnly) =>
              onChange(replaceAt(rows, index, { ...row, readOnly }))
            }
          />
          <ToggleField
            isDisabled={isDisabled}
            isSelected={row.executable}
            label="允许执行"
            onChange={(executable) =>
              onChange(replaceAt(rows, index, { ...row, executable }))
            }
          />
          <ToggleField
            isDisabled={isDisabled}
            isSelected={row.suidEnabled}
            label="允许 SUID"
            onChange={(suidEnabled) =>
              onChange(replaceAt(rows, index, { ...row, suidEnabled }))
            }
          />
          <ToggleField
            isDisabled={isDisabled}
            isSelected={row.deviceEnabled}
            label="允许设备文件"
            onChange={(deviceEnabled) =>
              onChange(replaceAt(rows, index, { ...row, deviceEnabled }))
            }
          />
        </div>
      )}
      rows={rows}
      onAdd={() => onChange([...rows, createTmpfsRow("")])}
      onRemove={(index) => onChange(removeAt(rows, index))}
    />
  );
}

function CapDropEditor({
  isDisabled,
  rows,
  onChange,
}: {
  isDisabled: boolean;
  rows: CapDropRow[];
  onChange: (rows: CapDropRow[]) => void;
}) {
  return (
    <SimpleRowsEditor
      addLabel="添加 Capability"
      isDisabled={isDisabled}
      label="capDrop"
      renderRow={(row, index) => (
        <TextInput
          isDisabled={isDisabled}
          label={`Capability ${index + 1}`}
          placeholder="ALL"
          value={row.capability}
          onChange={(capability) =>
            onChange(replaceAt(rows, index, { capability }))
          }
        />
      )}
      rows={rows}
      onAdd={() => onChange([...rows, { capability: "" }])}
      onRemove={(index) => onChange(removeAt(rows, index))}
    />
  );
}

function EnvEditor({
  isDisabled,
  rows,
  onChange,
}: {
  isDisabled: boolean;
  rows: EnvRow[];
  onChange: (rows: EnvRow[]) => void;
}) {
  return (
    <SimpleRowsEditor
      addLabel="添加环境变量"
      isDisabled={isDisabled}
      label="环境变量"
      renderRow={(row, index) => (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
          <TextInput
            isDisabled={isDisabled}
            label="变量名"
            value={row.envKey}
            onChange={(envKey) =>
              onChange(replaceAt(rows, index, { ...row, envKey }))
            }
          />
          <EnumSelect
            isDisabled={isDisabled}
            label="值类型"
            options={[
              { id: "plain", label: "明文" },
              { id: "env_ref", label: "宿主环境变量引用" },
            ]}
            value={row.valueType}
            onChange={(valueType) =>
              onChange(
                replaceAt(rows, index, {
                  ...row,
                  valueType: valueType as SandboxEnvValueType,
                }),
              )
            }
          />
          <TextInput
            isDisabled={isDisabled}
            label={row.valueType === "env_ref" ? "宿主环境变量名" : "值"}
            value={row.valueType === "env_ref" ? row.envRef : row.envValue}
            onChange={(value) =>
              onChange(
                replaceAt(rows, index, {
                  ...row,
                  envRef: row.valueType === "env_ref" ? value : "",
                  envValue: row.valueType === "plain" ? value : "",
                }),
              )
            }
          />
        </div>
      )}
      rows={rows}
      onAdd={() =>
        onChange([
          ...rows,
          { envKey: "", envRef: "", envValue: "", valueType: "plain" },
        ])
      }
      onRemove={(index) => onChange(removeAt(rows, index))}
    />
  );
}

function UlimitEditor({
  isDisabled,
  rows,
  onChange,
}: {
  isDisabled: boolean;
  rows: UlimitRow[];
  onChange: (rows: UlimitRow[]) => void;
}) {
  return (
    <SimpleRowsEditor
      addLabel="添加 Ulimit"
      isDisabled={isDisabled}
      label="Ulimit"
      renderRow={(row, index) => (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
          <TextInput
            isDisabled={isDisabled}
            label="名称"
            placeholder="nofile"
            value={row.limitName}
            onChange={(limitName) =>
              onChange(replaceAt(rows, index, { ...row, limitName }))
            }
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="Soft Limit"
            value={row.softLimit}
            onChange={(softLimit) =>
              onChange(replaceAt(rows, index, { ...row, softLimit }))
            }
          />
          <TextInput
            numeric
            isDisabled={isDisabled}
            label="Hard Limit"
            value={row.hardLimit}
            onChange={(hardLimit) =>
              onChange(replaceAt(rows, index, { ...row, hardLimit }))
            }
          />
        </div>
      )}
      rows={rows}
      onAdd={() =>
        onChange([...rows, { hardLimit: "0", limitName: "", softLimit: "0" }])
      }
      onRemove={(index) => onChange(removeAt(rows, index))}
    />
  );
}

function ExtraHostsEditor({
  isDisabled,
  rows,
  onChange,
}: {
  isDisabled: boolean;
  rows: ExtraHostRow[];
  onChange: (rows: ExtraHostRow[]) => void;
}) {
  return (
    <SimpleRowsEditor
      addLabel="添加 Host"
      isDisabled={isDisabled}
      label="extraHosts"
      renderRow={(row, index) => (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
          <TextInput
            isDisabled={isDisabled}
            label="主机名"
            value={row.hostname}
            onChange={(hostname) =>
              onChange(replaceAt(rows, index, { ...row, hostname }))
            }
          />
          <TextInput
            isDisabled={isDisabled}
            label="地址"
            placeholder="10.0.0.2 或 host-gateway"
            value={row.address}
            onChange={(address) =>
              onChange(replaceAt(rows, index, { ...row, address }))
            }
          />
        </div>
      )}
      rows={rows}
      onAdd={() => onChange([...rows, { address: "", hostname: "" }])}
      onRemove={(index) => onChange(removeAt(rows, index))}
    />
  );
}

function BindsEditor({
  isDisabled,
  rows,
  onChange,
}: {
  isDisabled: boolean;
  rows: BindRow[];
  onChange: (rows: BindRow[]) => void;
}) {
  return (
    <SimpleRowsEditor
      addLabel="添加 Bind"
      isDisabled={isDisabled}
      label="binds"
      renderRow={(row, index) => (
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_140px]">
          <TextInput
            isDisabled={isDisabled}
            label="宿主来源路径"
            value={row.sourcePath}
            onChange={(sourcePath) =>
              onChange(replaceAt(rows, index, { ...row, sourcePath }))
            }
          />
          <TextInput
            isDisabled={isDisabled}
            label="容器目标路径"
            value={row.targetPath}
            onChange={(targetPath) =>
              onChange(replaceAt(rows, index, { ...row, targetPath }))
            }
          />
          <EnumSelect
            isDisabled={isDisabled}
            label="权限"
            options={[
              { id: "ro", label: "只读" },
              { id: "rw", label: "读写" },
            ]}
            value={row.accessMode}
            onChange={(accessMode) =>
              onChange(
                replaceAt(rows, index, {
                  ...row,
                  accessMode: accessMode as SandboxBindAccessMode,
                }),
              )
            }
          />
        </div>
      )}
      rows={rows}
      onAdd={() =>
        onChange([
          ...rows,
          { accessMode: "ro", sourcePath: "", targetPath: "" },
        ])
      }
      onRemove={(index) => onChange(removeAt(rows, index))}
    />
  );
}

function SimpleRowsEditor<T>({
  addLabel,
  isDisabled,
  label,
  rows,
  renderRow,
  onAdd,
  onRemove,
}: {
  addLabel: string;
  isDisabled: boolean;
  label: string;
  rows: T[];
  renderRow: (row: T, index: number) => ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-divider p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Button
          isDisabled={isDisabled}
          size="sm"
          type="button"
          variant="tertiary"
          onPress={onAdd}
        >
          <AdminIcon className="size-4" name="plus" />
          {addLabel}
        </Button>
      </div>
      {rows.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-2">
          {rows.map((row, index) => (
            <div
              key={index}
              className="flex min-w-0 flex-col gap-3 rounded-lg bg-surface-secondary p-3"
            >
              {renderRow(row, index)}
              <div className="flex justify-end">
                <Button
                  isDisabled={isDisabled}
                  size="sm"
                  type="button"
                  variant="danger-soft"
                  onPress={() => onRemove(index)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-muted rounded-lg border border-dashed border-divider px-3 py-2 text-sm">
          未配置{label}。
        </span>
      )}
    </div>
  );
}

function FormSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-xl border border-divider p-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted mt-1 text-xs">{description}</p>
      </div>
      {children}
    </section>
  );
}

function TextInput({
  description,
  isDisabled,
  label,
  numeric = false,
  placeholder,
  value,
  onChange,
}: {
  description?: string;
  isDisabled: boolean;
  label: string;
  numeric?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField fullWidth isDisabled={isDisabled} variant="secondary">
      <Label>{label}</Label>
      <Input
        autoComplete="off"
        inputMode={numeric ? "decimal" : undefined}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {description ? <Description>{description}</Description> : null}
    </TextField>
  );
}

function TextareaInput({
  isDisabled,
  label,
  rows,
  value,
  onChange,
}: {
  isDisabled: boolean;
  label: string;
  rows: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField fullWidth isDisabled={isDisabled} variant="secondary">
      <Label>{label}</Label>
      <TextArea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </TextField>
  );
}

function EnumSelect({
  isDisabled,
  label,
  options,
  value,
  onChange,
}: {
  isDisabled: boolean;
  label: string;
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Select
      fullWidth
      isDisabled={isDisabled}
      selectedKey={value}
      variant="secondary"
      onSelectionChange={(key) => onChange(String(key ?? ""))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.id}
              id={option.id}
              textValue={option.label}
            >
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function ToggleField({
  description,
  isDisabled,
  isSelected,
  label,
  onChange,
}: {
  description?: string;
  isDisabled: boolean;
  isSelected: boolean;
  label: string;
  onChange: (selected: boolean) => void;
}) {
  return (
    <Checkbox
      isDisabled={isDisabled}
      isSelected={isSelected}
      variant="secondary"
      onChange={onChange}
    >
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {label}
      </Checkbox.Content>
      {description ? <Description>{description}</Description> : null}
    </Checkbox>
  );
}

function DeleteSandboxConfigDialog({
  config,
  onDeleted,
}: {
  config: SandboxConfig;
  onDeleted: () => void;
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

  async function handleDelete() {
    if (typeof config.id !== "number") {
      const message = "Sandbox 配置缺少记录 ID，无法删除。";

      setError(message);
      toast.danger(message);

      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await deleteSandboxConfig(config.id);
      modal.close();
      setIsDeleting(false);
      toast.success("Sandbox 配置已删除。");
      onDeleted();
    } catch (error) {
      const rawMessage = getSandboxError(error, "Sandbox 配置删除失败。");
      const message = /Agent 使用|仍被.*使用/.test(rawMessage)
        ? "当前 Sandbox 配置仍被 Agent 使用，请先解除所有 Agent 绑定后再删除。"
        : rawMessage;

      setError(message);
      setIsDeleting(false);
      toast.danger(message);
    }
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
              <Modal.Heading>删除 Sandbox 配置</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-3">
              <p className="text-muted text-sm">
                确认删除「{config.name || config.id}」？如果该配置仍被 Agent
                使用，后台会拒绝删除。
              </p>
              {error ? <InlineError>{error}</InlineError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="tertiary"
                onPress={() => modal.close()}
              >
                取消
              </Button>
              <Button
                isDisabled={isDeleting}
                isPending={isDeleting}
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

function buildSandboxRequest(form: SandboxForm): ReqSandboxConfigCreate {
  const name = form.name.trim();

  if (!name) throw new Error("请输入 Sandbox 配置名称。");
  if (!CONTAINER_PREFIX_PATTERN.test(form.dockerContainerPrefix.trim())) {
    throw new Error("容器名前缀最多 32 个字符，必须以 - 结尾且格式合法。");
  }

  const dockerPidsLimit = parseNonNegativeInteger(
    form.dockerPidsLimit,
    "PID 限制",
  );
  const dockerMemoryBytes = parseNonNegativeInteger(
    form.dockerMemoryBytes,
    "内存限制",
  );
  const dockerMemorySwapBytes = parseNonNegativeInteger(
    form.dockerMemorySwapBytes,
    "内存 + Swap 限制",
  );
  const pruneIdleHours = parseNonNegativeInteger(
    form.pruneIdleHours,
    "空闲清理时间",
  );
  const pruneMaxAgeDays = parseNonNegativeInteger(
    form.pruneMaxAgeDays,
    "最长保留天数",
  );
  const dockerCpus = Number(form.dockerCpus || 0);

  if (!Number.isFinite(dockerCpus) || dockerCpus < 0) {
    throw new Error("CPU 限制必须是非负数。");
  }
  if (
    dockerMemoryBytes > 0 &&
    dockerMemorySwapBytes > 0 &&
    dockerMemorySwapBytes < dockerMemoryBytes
  ) {
    throw new Error("内存 + Swap 限制不能小于内存限制。");
  }
  if (
    form.dockerNetwork.trim().startsWith("container:") &&
    !form.dockerAllowContainerNamespaceJoin
  ) {
    throw new Error("使用 container: 网络前必须开启允许容器 Namespace Join。");
  }
  if (form.binds.length > 0 && !form.dockerAllowExternalBindSources) {
    throw new Error("配置自定义 bind mount 时必须开启“允许外部 Bind 来源”。");
  }
  if (
    form.binds.some((item) => isReservedTarget(item.targetPath)) &&
    !form.dockerAllowReservedContainerTargets
  ) {
    throw new Error(
      "bind 目标位于 /workspace、/agent 或其子目录时必须开启“允许保留容器目标”。",
    );
  }

  return {
    binds: form.binds.map((item, index) => ({
      accessMode: item.accessMode,
      sourcePath: requiredText(item.sourcePath, `Bind ${index + 1} 来源路径`),
      targetPath: requiredText(item.targetPath, `Bind ${index + 1} 目标路径`),
    })),
    capDrop: form.capDrop.map((item, index) => ({
      capability: requiredText(
        item.capability,
        `Capability ${index + 1}`,
      ).toUpperCase(),
    })),
    description: form.description.trim(),
    dnsServers: form.dnsServers.map((item, index) => ({
      dnsServer: requiredText(item.dnsServer, `DNS ${index + 1}`),
    })),
    dockerAllowContainerNamespaceJoin: form.dockerAllowContainerNamespaceJoin,
    dockerAllowExternalBindSources: form.dockerAllowExternalBindSources,
    dockerAllowReservedContainerTargets:
      form.dockerAllowReservedContainerTargets,
    dockerApparmorProfile: form.dockerApparmorProfile.trim(),
    dockerContainerPrefix: form.dockerContainerPrefix.trim(),
    dockerCpus,
    dockerGpus: form.dockerGpus.trim(),
    dockerImage: requiredText(form.dockerImage, "Docker 镜像"),
    dockerMemoryBytes,
    dockerMemorySwapBytes,
    dockerNetwork: requiredText(form.dockerNetwork, "网络模式"),
    dockerPidsLimit,
    dockerReadOnlyRoot: form.dockerReadOnlyRoot,
    dockerSeccompProfile: form.dockerSeccompProfile.trim(),
    dockerSetupCommand: form.dockerSetupCommand,
    dockerUser: form.dockerUser.trim(),
    dockerWorkdir: requiredText(form.dockerWorkdir, "Docker 工作目录"),
    enabled: form.enabled,
    envs: form.envs.map((item, index) => ({
      envKey: requiredText(item.envKey, `环境变量 ${index + 1} 名称`),
      envRef:
        item.valueType === "env_ref"
          ? requiredText(item.envRef, `环境变量 ${index + 1} 宿主引用`)
          : "",
      envValue: item.valueType === "plain" ? item.envValue : "",
      valueType: item.valueType,
    })),
    extraHosts: form.extraHosts.map((item, index) => ({
      address: requiredText(item.address, `Host ${index + 1} 地址`),
      hostname: requiredText(item.hostname, `Host ${index + 1} 主机名`),
    })),
    mode: form.mode,
    name,
    pruneIdleHours,
    pruneMaxAgeDays,
    scope: form.scope,
    sessionToolsVisibility: form.sessionToolsVisibility,
    tmpfs: form.tmpfs.map((item, index) => ({
      deviceEnabled: item.deviceEnabled,
      executable: item.executable,
      mountPath: requiredText(item.mountPath, `tmpfs ${index + 1} 挂载路径`),
      permissionMode: parseNonNegativeInteger(
        item.permissionMode,
        `tmpfs ${index + 1} 权限模式`,
      ),
      readOnly: item.readOnly,
      sizeBytes: parseNonNegativeInteger(
        item.sizeBytes,
        `tmpfs ${index + 1} 容量`,
      ),
      suidEnabled: item.suidEnabled,
    })),
    ulimits: form.ulimits.map((item, index) => {
      const softLimit = parseNonNegativeInteger(
        item.softLimit,
        `Ulimit ${index + 1} Soft Limit`,
      );
      const hardLimit = parseNonNegativeInteger(
        item.hardLimit,
        `Ulimit ${index + 1} Hard Limit`,
      );

      if (softLimit > hardLimit) {
        throw new Error(
          `Ulimit ${index + 1} 必须满足 softLimit <= hardLimit。`,
        );
      }

      return {
        hardLimit,
        limitName: requiredText(item.limitName, `Ulimit ${index + 1} 名称`),
        softLimit,
      };
    }),
    workspaceAccess: form.workspaceAccess,
    workspaceRoot: form.workspaceRoot.trim(),
  };
}

function toSandboxForm(config?: SandboxConfig): SandboxForm {
  if (!config) return cloneDefaultForm();

  return {
    binds: (config.binds ?? []).map((item) => ({
      accessMode: item.accessMode ?? "ro",
      sourcePath: item.sourcePath ?? "",
      targetPath: item.targetPath ?? "",
    })),
    capDrop: (config.capDrop ?? []).map((item) => ({
      capability: item.capability ?? "",
    })),
    description: config.description ?? "",
    dnsServers: (config.dnsServers ?? []).map((item) => ({
      dnsServer: item.dnsServer ?? "",
    })),
    dockerAllowContainerNamespaceJoin:
      config.dockerAllowContainerNamespaceJoin ?? false,
    dockerAllowExternalBindSources:
      config.dockerAllowExternalBindSources ?? false,
    dockerAllowReservedContainerTargets:
      config.dockerAllowReservedContainerTargets ?? false,
    dockerApparmorProfile: config.dockerApparmorProfile ?? "",
    dockerContainerPrefix: config.dockerContainerPrefix ?? "openclaw-sbx-",
    dockerCpus: String(config.dockerCpus ?? 0),
    dockerGpus: config.dockerGpus ?? "",
    dockerImage: config.dockerImage ?? "openclaw-sandbox:bookworm-slim",
    dockerMemoryBytes: String(config.dockerMemoryBytes ?? 0),
    dockerMemorySwapBytes: String(config.dockerMemorySwapBytes ?? 0),
    dockerNetwork: config.dockerNetwork ?? "none",
    dockerPidsLimit: String(config.dockerPidsLimit ?? 0),
    dockerReadOnlyRoot: config.dockerReadOnlyRoot ?? true,
    dockerSeccompProfile: config.dockerSeccompProfile ?? "",
    dockerSetupCommand: config.dockerSetupCommand ?? "",
    dockerUser: config.dockerUser ?? "",
    dockerWorkdir: config.dockerWorkdir ?? "/workspace",
    enabled: config.enabled ?? true,
    envs: (config.envs ?? []).map((item) => ({
      envKey: item.envKey ?? "",
      envRef: item.envRef ?? "",
      envValue: item.envValue ?? "",
      valueType: item.valueType ?? "plain",
    })),
    extraHosts: (config.extraHosts ?? []).map((item) => ({
      address: item.address ?? "",
      hostname: item.hostname ?? "",
    })),
    mode: config.mode ?? "non-main",
    name: config.name ?? "",
    pruneIdleHours: String(config.pruneIdleHours ?? 24),
    pruneMaxAgeDays: String(config.pruneMaxAgeDays ?? 7),
    scope: config.scope ?? "agent",
    sessionToolsVisibility: config.sessionToolsVisibility ?? "spawned",
    tmpfs: (config.tmpfs ?? []).map((item) => ({
      deviceEnabled: item.deviceEnabled ?? false,
      executable: item.executable ?? false,
      mountPath: item.mountPath ?? "",
      permissionMode: String(item.permissionMode ?? 0),
      readOnly: item.readOnly ?? false,
      sizeBytes: String(item.sizeBytes ?? 0),
      suidEnabled: item.suidEnabled ?? false,
    })),
    ulimits: (config.ulimits ?? []).map((item) => ({
      hardLimit: String(item.hardLimit ?? 0),
      limitName: item.limitName ?? "",
      softLimit: String(item.softLimit ?? 0),
    })),
    workspaceAccess: config.workspaceAccess ?? "none",
    workspaceRoot: config.workspaceRoot ?? "",
  };
}

function cloneDefaultForm(): SandboxForm {
  return {
    ...DEFAULT_SANDBOX_FORM,
    binds: [],
    capDrop: DEFAULT_SANDBOX_FORM.capDrop.map((item) => ({ ...item })),
    dnsServers: [],
    envs: [],
    extraHosts: [],
    tmpfs: DEFAULT_SANDBOX_FORM.tmpfs.map((item) => ({ ...item })),
    ulimits: [],
  };
}

function createTmpfsRow(mountPath: string): TmpfsRow {
  return {
    deviceEnabled: false,
    executable: false,
    mountPath,
    permissionMode: "0",
    readOnly: false,
    sizeBytes: "0",
    suidEnabled: false,
  };
}

function replaceAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

function removeAt<T>(items: T[], index: number) {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function requiredText(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) throw new Error(`${label}不能为空。`);

  return normalized;
}

function parseNonNegativeInteger(value: string, label: string) {
  const number = Number(value || 0);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`${label}必须是非负整数。`);
  }

  return number;
}

function isReservedTarget(value: string) {
  const path = value.trim().replace(/\/+$/, "");

  return (
    path === "/workspace" ||
    path.startsWith("/workspace/") ||
    path === "/agent" ||
    path.startsWith("/agent/")
  );
}

function isBindableSandboxConfig(config: SandboxConfig) {
  return (
    config.isDelete !== 2 &&
    config.enabled &&
    (config.scope === "session" || config.scope === "agent")
  );
}

function hasDangerousOptions(config: SandboxConfig) {
  return Boolean(
    config.dockerAllowContainerNamespaceJoin ||
      config.dockerAllowExternalBindSources ||
      config.dockerAllowReservedContainerTargets,
  );
}

function hasDangerousFormOptions(form: SandboxForm) {
  return Boolean(
    form.dockerAllowContainerNamespaceJoin ||
      form.dockerAllowExternalBindSources ||
      form.dockerAllowReservedContainerTargets,
  );
}

function formatMode(mode: SandboxMode) {
  return MODE_OPTIONS.find((item) => item.id === mode)?.label ?? mode;
}

function formatScope(scope: SandboxScope) {
  return SCOPE_OPTIONS.find((item) => item.id === scope)?.label ?? scope;
}

function formatWorkspaceAccess(access: SandboxWorkspaceAccess) {
  return (
    WORKSPACE_ACCESS_OPTIONS.find((item) => item.id === access)?.label ?? access
  );
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : DATE_TIME_FORMATTER.format(date);
}

function getSandboxError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message;

  return fallback;
}

function InlineError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}
