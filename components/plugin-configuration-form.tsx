"use client";

import type {
  OpenClawPluginConfiguration,
  OpenClawPluginConfigurationUIHint,
  PluginJsonSchema,
} from "@/lib/api";

import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  ListBox,
  NumberField,
  Select,
  Switch,
  TextField,
} from "@heroui/react";
import { useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import {
  createPluginConfigurationValue,
  isRecord,
} from "@/lib/plugin-configuration";

type ConfigurationFormState = Record<string, Record<string, unknown>>;

export function PluginConfigurationForm({
  configurations,
  errors,
  isDisabled,
  state,
  onChange,
}: {
  configurations: OpenClawPluginConfiguration[];
  errors: Record<string, string>;
  isDisabled?: boolean;
  state: ConfigurationFormState;
  onChange: (state: ConfigurationFormState) => void;
}) {
  return (
    <section className="flex flex-col gap-5 border-t border-divider pt-4">
      <div>
        <h3 className="text-sm font-semibold">插件配置</h3>
        <p className="text-muted mt-1 text-xs">
          配置将按目标完整提交，并由服务端再次校验。
        </p>
      </div>
      {configurations.map((configuration) => (
        <ConfigurationTarget
          key={configuration.target}
          configuration={configuration}
          errors={errors}
          isDisabled={isDisabled}
          value={state[configuration.target] ?? {}}
          onChange={(value) =>
            onChange({ ...state, [configuration.target]: value })
          }
        />
      ))}
    </section>
  );
}

function ConfigurationTarget({
  configuration,
  errors,
  isDisabled,
  value,
  onChange,
}: {
  configuration: OpenClawPluginConfiguration;
  errors: Record<string, string>;
  isDisabled?: boolean;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-1 text-sm font-medium">
        {getTargetLabel(configuration.target)}
      </legend>
      <SchemaField
        errors={errors}
        hints={configuration.uiHints ?? {}}
        isDisabled={isDisabled}
        path={configuration.target}
        schema={configuration.schema}
        value={value}
        onChange={(next) => onChange(isRecord(next) ? next : {})}
      />
    </fieldset>
  );
}

function SchemaField({
  errors,
  hints,
  isDisabled,
  label,
  objectValue,
  path,
  required,
  schema,
  value,
  onChange,
}: {
  errors: Record<string, string>;
  hints: Record<string, OpenClawPluginConfigurationUIHint>;
  isDisabled?: boolean;
  label?: string;
  objectValue?: Record<string, unknown>;
  path: string;
  required?: boolean;
  schema: PluginJsonSchema;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const fieldName = path.split(".").at(-1) ?? path;
  const hint = hints[path] ?? hints[fieldName] ?? {};
  const fieldLabel = hint.label ?? label ?? getSchemaLabel(schema, fieldName);
  const error = errors[path];
  const common = {
    "data-plugin-config-error": error ? "true" : undefined,
  };

  if (Array.isArray(schema.enum)) {
    const enumValues = schema.enum;

    return (
      <div {...common}>
        <Select
          fullWidth
          isDisabled={isDisabled}
          isInvalid={Boolean(error)}
          isRequired={required}
          selectedKey={value === undefined ? null : String(value)}
          variant="secondary"
          onSelectionChange={(key) =>
            onChange(
              key === null
                ? undefined
                : enumValues.find((option) => String(option) === String(key)),
            )
          }
        >
          <Label>{fieldLabel}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {enumValues.map((option) => (
                <ListBox.Item
                  key={String(option)}
                  id={String(option)}
                  textValue={String(option)}
                >
                  {String(option)}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          {schema.description ? (
            <Description>{String(schema.description)}</Description>
          ) : null}
          <FieldError>{error}</FieldError>
        </Select>
      </div>
    );
  }

  if (
    fieldName === "defaultAccount" &&
    isRecord(objectValue?.accounts) &&
    Object.keys(objectValue.accounts).length > 0
  ) {
    const accountIds = Object.keys(objectValue.accounts);

    return (
      <div {...common}>
        <Select
          fullWidth
          isDisabled={isDisabled}
          isInvalid={Boolean(error)}
          isRequired={required}
          selectedKey={typeof value === "string" ? value : null}
          variant="secondary"
          onSelectionChange={(key) => onChange(key === null ? undefined : key)}
        >
          <Label>{fieldLabel}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {accountIds.map((accountId) => (
                <ListBox.Item
                  key={accountId}
                  id={accountId}
                  textValue={accountId}
                >
                  {accountId}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          {schema.description ? (
            <Description>{String(schema.description)}</Description>
          ) : null}
          <FieldError>{error}</FieldError>
        </Select>
      </div>
    );
  }

  switch (schema.type) {
    case "boolean":
      return (
        <div {...common}>
          <Switch
            isDisabled={isDisabled}
            isSelected={value === true}
            onChange={onChange}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              {fieldLabel}
              {required ? <span aria-hidden="true"> *</span> : null}
            </Switch.Content>
          </Switch>
          {schema.description ? (
            <p className="text-muted mt-1 text-xs">
              {String(schema.description)}
            </p>
          ) : null}
          {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
        </div>
      );
    case "number":
    case "integer":
      return (
        <div {...common}>
          <NumberField
            fullWidth
            isDisabled={isDisabled}
            isInvalid={Boolean(error)}
            isRequired={required}
            maxValue={
              typeof schema.maximum === "number" ? schema.maximum : undefined
            }
            minValue={
              typeof schema.minimum === "number" ? schema.minimum : undefined
            }
            step={schema.type === "integer" ? 1 : undefined}
            value={typeof value === "number" ? value : undefined}
            variant="secondary"
            onChange={onChange}
          >
            <Label>{fieldLabel}</Label>
            <NumberField.Group>
              <NumberField.DecrementButton aria-label="减少" />
              <NumberField.Input />
              <NumberField.IncrementButton aria-label="增加" />
            </NumberField.Group>
            {schema.description ? (
              <Description>{String(schema.description)}</Description>
            ) : null}
            <FieldError>{error}</FieldError>
          </NumberField>
        </div>
      );
    case "array":
      return (
        <ArrayField
          {...common}
          errors={errors}
          hints={hints}
          isDisabled={isDisabled}
          label={fieldLabel}
          path={path}
          required={required}
          schema={schema}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
        />
      );
    case "object":
      return (
        <ObjectField
          {...common}
          errors={errors}
          hints={hints}
          isDisabled={isDisabled}
          label={label ? fieldLabel : undefined}
          path={path}
          schema={schema}
          value={isRecord(value) ? value : {}}
          onChange={onChange}
        />
      );
    default:
      return (
        <div {...common}>
          <TextField
            fullWidth
            isDisabled={isDisabled}
            isInvalid={Boolean(error)}
            isRequired={required}
            value={typeof value === "string" ? value : ""}
            variant="secondary"
            onChange={onChange}
          >
            <Label>{fieldLabel}</Label>
            <Input
              autoComplete={hint.sensitive ? "new-password" : undefined}
              placeholder={hint.placeholder}
              type={
                hint.sensitive
                  ? "password"
                  : schema.format === "uri"
                    ? "url"
                    : "text"
              }
            />
            {schema.description ? (
              <Description>{String(schema.description)}</Description>
            ) : null}
            {hint.sensitive ? (
              <Description>
                保持 ******** 可保留原值；留空不会自动保留。
              </Description>
            ) : null}
            <FieldError>{error}</FieldError>
          </TextField>
        </div>
      );
  }
}

function ObjectField({
  errors,
  hints,
  isDisabled,
  label,
  path,
  schema,
  value,
  onChange,
  ...dataProps
}: {
  errors: Record<string, string>;
  hints: Record<string, OpenClawPluginConfigurationUIHint>;
  isDisabled?: boolean;
  label?: string;
  path: string;
  schema: PluginJsonSchema;
  value: Record<string, unknown>;
  onChange: (value: unknown) => void;
  "data-plugin-config-error"?: string;
}) {
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  );
  const additionalSchema = isRecord(schema.additionalProperties)
    ? schema.additionalProperties
    : schema.additionalProperties === true
      ? { type: "string" }
      : null;

  return (
    <div
      {...dataProps}
      className={
        label
          ? "flex flex-col gap-4 border-l border-divider pl-4"
          : "flex flex-col gap-4"
      }
    >
      {label ? <h4 className="text-sm font-medium">{label}</h4> : null}
      {Object.entries(properties).map(([key, childSchema]) =>
        isRecord(childSchema) ? (
          <SchemaField
            key={key}
            errors={errors}
            hints={hints}
            isDisabled={isDisabled}
            label={key}
            objectValue={value}
            path={`${path}.${key}`}
            required={required.has(key)}
            schema={childSchema}
            value={value[key]}
            onChange={(next) => {
              const nextValue = { ...value, [key]: next };

              if (key === "accounts" && isRecord(next)) {
                const accountIds = Object.keys(next);

                if (
                  typeof nextValue.defaultAccount !== "string" ||
                  !accountIds.includes(nextValue.defaultAccount)
                ) {
                  if (accountIds[0]) nextValue.defaultAccount = accountIds[0];
                  else delete nextValue.defaultAccount;
                }
              }

              onChange(nextValue);
            }}
          />
        ) : null,
      )}
      {additionalSchema ? (
        <AdditionalPropertiesField
          errors={errors}
          hints={hints}
          isDisabled={isDisabled}
          path={path}
          schema={additionalSchema}
          value={Object.fromEntries(
            Object.entries(value).filter(
              ([key]) => !Object.hasOwn(properties, key),
            ),
          )}
          onChange={(entries) =>
            onChange({
              ...Object.fromEntries(
                Object.entries(value).filter(([key]) =>
                  Object.hasOwn(properties, key),
                ),
              ),
              ...entries,
            })
          }
        />
      ) : null}
    </div>
  );
}

function AdditionalPropertiesField({
  errors,
  hints,
  isDisabled,
  path,
  schema,
  value,
  onChange,
}: {
  errors: Record<string, string>;
  hints: Record<string, OpenClawPluginConfigurationUIHint>;
  isDisabled?: boolean;
  path: string;
  schema: PluginJsonSchema;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const [draftKey, setDraftKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const isAccounts = path.split(".").at(-1) === "accounts";

  function addEntry() {
    const key = draftKey.trim();

    if (!key) {
      setKeyError(isAccounts ? "请输入账号 ID。" : "请输入配置键。");

      return;
    }
    if (Object.hasOwn(value, key)) {
      setKeyError("该键已存在。");

      return;
    }

    onChange({ ...value, [key]: createNewValue(schema) });
    setDraftKey("");
    setKeyError("");
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(value).map(([key, item]) => (
        <div
          key={key}
          className="flex flex-col gap-4 border-l border-divider pl-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium" title={key}>
                {key}
              </p>
              <p className="text-muted text-xs">
                {isAccounts ? "账号 ID" : "配置键"}
              </p>
            </div>
            <Button
              isDisabled={isDisabled}
              size="sm"
              type="button"
              variant="danger-soft"
              onPress={() => {
                const next = { ...value };

                delete next[key];
                onChange(next);
              }}
            >
              删除
            </Button>
          </div>
          <SchemaField
            errors={errors}
            hints={hints}
            isDisabled={isDisabled}
            path={`${path}.${key}`}
            schema={schema}
            value={item}
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        </div>
      ))}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <TextField
          fullWidth
          className="min-w-0"
          isDisabled={isDisabled}
          isInvalid={Boolean(keyError)}
          value={draftKey}
          variant="secondary"
          onChange={setDraftKey}
        >
          <Label>{isAccounts ? "账号 ID" : "配置键"}</Label>
          <Input placeholder={isAccounts ? "例如：default" : "请输入唯一键"} />
          <FieldError>{keyError}</FieldError>
        </TextField>
        <Button
          className="sm:mt-6"
          isDisabled={isDisabled}
          type="button"
          variant="secondary"
          onPress={addEntry}
        >
          <AdminIcon className="size-4" name="plus" />
          {isAccounts ? "添加账号" : "添加配置"}
        </Button>
      </div>
    </div>
  );
}

function ArrayField({
  errors,
  hints,
  isDisabled,
  label,
  path,
  required,
  schema,
  value,
  onChange,
  ...dataProps
}: {
  errors: Record<string, string>;
  hints: Record<string, OpenClawPluginConfigurationUIHint>;
  isDisabled?: boolean;
  label: string;
  path: string;
  required?: boolean;
  schema: PluginJsonSchema;
  value: unknown[];
  onChange: (value: unknown) => void;
  "data-plugin-config-error"?: string;
}) {
  const itemSchema = isRecord(schema.items) ? schema.items : { type: "string" };
  const error = errors[path];

  return (
    <div {...dataProps} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">
            {label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </p>
          {schema.description ? (
            <p className="text-muted mt-1 text-xs">
              {String(schema.description)}
            </p>
          ) : null}
        </div>
        <Button
          isDisabled={isDisabled}
          size="sm"
          type="button"
          variant="secondary"
          onPress={() => onChange([...value, createNewValue(itemSchema)])}
        >
          添加
        </Button>
      </div>
      {value.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <SchemaField
              errors={errors}
              hints={hints}
              isDisabled={isDisabled}
              label={`第 ${index + 1} 项`}
              path={`${path}.${index}`}
              schema={itemSchema}
              value={item}
              onChange={(next) =>
                onChange(
                  value.map((current, itemIndex) =>
                    itemIndex === index ? next : current,
                  ),
                )
              }
            />
          </div>
          <Button
            className="mt-6"
            isDisabled={isDisabled}
            size="sm"
            type="button"
            variant="danger-soft"
            onPress={() =>
              onChange(value.filter((_, itemIndex) => itemIndex !== index))
            }
          >
            删除
          </Button>
        </div>
      ))}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

function createNewValue(schema: PluginJsonSchema): unknown {
  if (schema.type === "object") return createPluginConfigurationValue(schema);
  if (schema.type === "array") return [];
  if (schema.type === "boolean") return false;
  if (schema.type === "number" || schema.type === "integer") return 0;

  return typeof schema.default === "string" ? schema.default : "";
}

function getSchemaLabel(schema: PluginJsonSchema, fallback: string) {
  return typeof schema.title === "string" && schema.title.trim()
    ? schema.title
    : fallback;
}

function getTargetLabel(target: string) {
  const [kind, id] = target.split(":", 2);
  const labels: Record<string, string> = {
    channel: "Channel 配置",
    plugin: "插件参数",
    provider: "Provider 配置",
  };

  return `${labels[kind] ?? "配置"}${id ? ` · ${id}` : ""}`;
}
