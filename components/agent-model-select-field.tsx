"use client";

import type { Key } from "react";
import type { Model } from "@/lib/api";

import { Input, Label, ListBox, Select, TextField } from "@heroui/react";

const UNSET_MODEL = "__unset";

export function AgentModelSelectField({
  isDisabled,
  label,
  modelOptions,
  onChange,
  value,
}: {
  isDisabled: boolean;
  label: string;
  modelOptions: Model[];
  onChange: (value: string) => void;
  value: string;
}) {
  const options = getModelSelectOptions(modelOptions, value);

  if (options.length === 0) {
    return (
      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Label>{label}</Label>
        <Input
          fullWidth
          placeholder="provider/modelid"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </TextField>
    );
  }

  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={value || UNSET_MODEL}
      variant="secondary"
      onSelectionChange={(key) => onChange(toModelValue(key))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={UNSET_MODEL}>不设置</ListBox.Item>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value}>
              {option.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function getModelSelectOptions(models: Model[], currentValue: string) {
  const options = models
    .map((model) => {
      const value = getModelReference(model);

      if (!value) return null;

      return {
        label: getModelOptionLabel(model, value),
        value,
      };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
  const current = currentValue.trim();

  if (current && !options.some((option) => option.value === current)) {
    return [{ label: current, value: current }, ...options];
  }

  return options;
}

function getModelReference(model: Model) {
  const provider = model.provider?.trim();
  const modelid = model.modelid?.trim();

  if (!modelid) return "";
  if (!provider || modelid.includes("/")) return modelid;

  return `${provider}/${modelid}`;
}

function getModelOptionLabel(model: Model, value: string) {
  const displayName = model.displayName?.trim();

  if (!displayName || displayName === value) return value;

  return `${displayName} · ${value}`;
}

function toModelValue(key: Key | null) {
  const value = String(key ?? UNSET_MODEL);

  return value === UNSET_MODEL ? "" : value;
}
