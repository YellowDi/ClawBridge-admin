"use client";

import type { Key } from "react";

import { Label, ListBox, Select } from "@heroui/react";

const UNSET_LEVEL = "__unset";

export function AgentLevelSelect({
  isDisabled,
  label,
  levels,
  onChange,
  value,
}: {
  isDisabled: boolean;
  label: string;
  levels: readonly { id: string; label: string }[];
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Select
      fullWidth
      className="min-w-0"
      isDisabled={isDisabled}
      selectedKey={toSelectedLevelKey(value)}
      variant="secondary"
      onSelectionChange={(key) => onChange(toLevelValue(key))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {levels.map((level) => (
            <ListBox.Item key={level.id} id={level.id}>
              {level.label}
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

function toSelectedLevelKey(value: string) {
  return value || UNSET_LEVEL;
}

function toLevelValue(key: Key | null) {
  const value = String(key ?? UNSET_LEVEL);

  return value === UNSET_LEVEL ? "" : value;
}
