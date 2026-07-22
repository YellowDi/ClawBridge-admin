"use client";

import type { Model, SandboxConfig } from "@/lib/api";
import type { AgentForm } from "@/components/agent-form-types";

import { Input, Label, ListBox, Select, TextField } from "@heroui/react";

import { AgentAvatarField } from "@/components/agent-avatar-field";
import { AgentLevelSelect } from "@/components/agent-level-select";
import { AgentModelSelectField } from "@/components/agent-model-select-field";
import {
  REASONING_LEVELS,
  THINKING_LEVELS,
  VERBOSE_LEVELS,
} from "@/components/agent-form-types";

export function AgentFormFields({
  form,
  isDisabled,
  modelOptions,
  sandboxOptions,
  onChange,
}: {
  form: AgentForm;
  isDisabled: boolean;
  modelOptions: Model[];
  sandboxOptions: SandboxConfig[];
  onChange: (patch: Partial<AgentForm>) => void;
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Label>Agent ID</Label>
        <Input
          fullWidth
          value={form.agentId}
          onChange={(event) => onChange({ agentId: event.target.value })}
        />
      </TextField>

      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Label>展示名称</Label>
        <Input
          fullWidth
          value={form.displayName}
          onChange={(event) => onChange({ displayName: event.target.value })}
        />
      </TextField>

      <AgentAvatarField
        agentId={form.agentId}
        displayName={form.displayName}
        isDisabled={isDisabled}
        value={form.avatarUrl}
        onChange={(avatarUrl) => onChange({ avatarUrl })}
      />

      <AgentModelSelectField
        isDisabled={isDisabled}
        label="默认模型"
        modelOptions={modelOptions}
        value={form.defaultModelid}
        onChange={(defaultModelid) => onChange({ defaultModelid })}
      />

      <SandboxConfigSelectField
        isDisabled={isDisabled}
        options={sandboxOptions}
        value={form.sandboxConfigId}
        onChange={(sandboxConfigId) => onChange({ sandboxConfigId })}
      />

      <Select
        fullWidth
        className="min-w-0"
        isDisabled={isDisabled}
        selectedKey={form.enabled ? "enabled" : "disabled"}
        variant="secondary"
        onSelectionChange={(key) => onChange({ enabled: key === "enabled" })}
      >
        <Label>状态</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="enabled" textValue="启用">
              启用
            </ListBox.Item>
            <ListBox.Item id="disabled" textValue="停用">
              停用
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>

      <AgentLevelSelect
        isDisabled={isDisabled}
        label="Reasoning 等级"
        levels={REASONING_LEVELS}
        value={form.reasoningLevel}
        onChange={(reasoningLevel) => onChange({ reasoningLevel })}
      />

      <AgentLevelSelect
        isDisabled={isDisabled}
        label="思考等级"
        levels={THINKING_LEVELS}
        value={form.thinkingLevel}
        onChange={(thinkingLevel) => onChange({ thinkingLevel })}
      />

      <AgentLevelSelect
        isDisabled={isDisabled}
        label="详细度"
        levels={VERBOSE_LEVELS}
        value={form.verboseLevel}
        onChange={(verboseLevel) => onChange({ verboseLevel })}
      />

      <AgentModelSelectField
        isDisabled={isDisabled}
        label="图像生成模型"
        modelOptions={modelOptions}
        value={form.defaultImageGenerationModelid}
        onChange={(defaultImageGenerationModelid) =>
          onChange({ defaultImageGenerationModelid })
        }
      />

      <AgentModelSelectField
        isDisabled={isDisabled}
        label="视频生成模型"
        modelOptions={modelOptions}
        value={form.defaultVideoGenerationModelid}
        onChange={(defaultVideoGenerationModelid) =>
          onChange({ defaultVideoGenerationModelid })
        }
      />

      <AgentModelSelectField
        isDisabled={isDisabled}
        label="音乐生成模型"
        modelOptions={modelOptions}
        value={form.defaultMusicGenerationModelid}
        onChange={(defaultMusicGenerationModelid) =>
          onChange({ defaultMusicGenerationModelid })
        }
      />

      <AgentModelSelectField
        isDisabled={isDisabled}
        label="图像理解模型"
        modelOptions={modelOptions}
        value={form.defaultImageModelid}
        onChange={(defaultImageModelid) => onChange({ defaultImageModelid })}
      />

      <AgentModelSelectField
        isDisabled={isDisabled}
        label="PDF 理解模型"
        modelOptions={modelOptions}
        value={form.defaultPdfModelid}
        onChange={(defaultPdfModelid) => onChange({ defaultPdfModelid })}
      />

      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Label>说明</Label>
        <Input
          fullWidth
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </TextField>
    </div>
  );
}

function SandboxConfigSelectField({
  isDisabled,
  options,
  value,
  onChange,
}: {
  isDisabled: boolean;
  options: SandboxConfig[];
  value: number;
  onChange: (value: number) => void;
}) {
  const bindableOptions = options.filter(
    (item) =>
      item.isDelete !== 2 &&
      item.enabled &&
      (item.scope === "session" || item.scope === "agent") &&
      typeof item.id === "number",
  );
  const currentIsUnavailable =
    value > 0 && !bindableOptions.some((item) => item.id === value);

  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={String(value)}
      variant="secondary"
      onSelectionChange={(key) => onChange(Number(key ?? 0))}
    >
      <Label>Sandbox 配置</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id="0" textValue="不绑定">
            不绑定
          </ListBox.Item>
          {bindableOptions.map((item) => (
            <ListBox.Item
              key={item.id}
              id={String(item.id)}
              textValue={item.name || `Sandbox #${item.id}`}
            >
              {item.name || `Sandbox #${item.id}`}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      {currentIsUnavailable ? (
        <span className="text-warning text-xs">
          当前绑定的 Sandbox #{value} 已删除、禁用或不支持 Agent
          绑定；请选择新配置或解绑。
        </span>
      ) : null}
    </Select>
  );
}
