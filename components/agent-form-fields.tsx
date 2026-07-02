"use client";

import type { Model } from "@/lib/api";
import type { AgentForm } from "@/components/agent-form-types";

import { Input, Label, ListBox, Select, TextField } from "@heroui/react";

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
  onChange,
}: {
  form: AgentForm;
  isDisabled: boolean;
  modelOptions: Model[];
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

      <AgentModelSelectField
        isDisabled={isDisabled}
        label="默认模型"
        modelOptions={modelOptions}
        value={form.defaultModelid}
        onChange={(defaultModelid) => onChange({ defaultModelid })}
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
            <ListBox.Item id="enabled">启用</ListBox.Item>
            <ListBox.Item id="disabled">停用</ListBox.Item>
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
