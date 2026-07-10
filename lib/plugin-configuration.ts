import type {
  OpenClawPluginConfiguration,
  OpenClawPluginConfigurationInput,
  OpenClawPluginConfigurationUIHint,
  PluginJsonSchema,
} from "./api.ts";

type ConfigurationFormState = Record<string, Record<string, unknown>>;
type ValidationErrors = Record<string, string>;

export function createPluginConfigurationValue(
  schema: PluginJsonSchema,
  existing?: Record<string, unknown>,
): Record<string, unknown> {
  const value = initializeSchemaValue(schema, existing);

  return isRecord(value) ? value : {};
}

export function validatePluginConfigurationValue(
  schema: PluginJsonSchema,
  value: unknown,
  path = "",
  hints: Record<string, OpenClawPluginConfigurationUIHint> = {},
): ValidationErrors {
  const errors: ValidationErrors = {};

  validateSchemaValue(schema, value, path, errors, hints);

  return errors;
}

export function toPluginConfigurationInputs(
  configurations: OpenClawPluginConfiguration[],
  state: ConfigurationFormState,
): OpenClawPluginConfigurationInput[] {
  return configurations.map(({ target }) => ({
    target,
    value: state[target] ?? {},
  }));
}

export function mergePluginConfigurations(
  definitions: OpenClawPluginConfiguration[],
  preferred: OpenClawPluginConfiguration[],
): OpenClawPluginConfiguration[] {
  if (definitions.length === 0) return preferred;

  const preferredByTarget = new Map(
    preferred.map((configuration) => [configuration.target, configuration]),
  );

  return definitions.map((definition) => {
    const value = preferredByTarget.get(definition.target)?.value;

    return isRecord(value) ? { ...definition, value } : definition;
  });
}

function initializeSchemaValue(
  schema: PluginJsonSchema,
  existing: unknown,
): unknown {
  const source = existing === undefined ? cloneValue(schema.default) : existing;
  const type = schema.type;

  if (type === "object" || isRecord(schema.properties)) {
    const result: Record<string, unknown> = isRecord(source)
      ? cloneValue(source)
      : {};
    const properties = isRecord(schema.properties) ? schema.properties : {};

    for (const [key, childSchema] of Object.entries(properties)) {
      if (!isRecord(childSchema)) continue;

      const childExisting = Object.hasOwn(result, key)
        ? result[key]
        : undefined;
      const childValue = initializeSchemaValue(childSchema, childExisting);

      if (childValue !== undefined) result[key] = childValue;
    }

    return result;
  }

  if (type === "array") {
    if (!Array.isArray(source)) return source;

    const itemSchema = isRecord(schema.items) ? schema.items : {};

    return source.map((item) => initializeSchemaValue(itemSchema, item));
  }

  return cloneValue(source);
}

function validateSchemaValue(
  schema: PluginJsonSchema,
  value: unknown,
  path: string,
  errors: ValidationErrors,
  hints: Record<string, OpenClawPluginConfigurationUIHint>,
) {
  if (value === undefined || value === null || value === "") return;

  const enumValues = Array.isArray(schema.enum) ? schema.enum : null;

  if (enumValues && !enumValues.some((item) => Object.is(item, value))) {
    errors[path] = "请选择有效选项。";

    return;
  }

  switch (schema.type) {
    case "string":
      validateString(schema, value, path, errors, hints);
      break;
    case "number":
    case "integer":
      validateNumber(schema, value, path, errors);
      break;
    case "boolean":
      if (typeof value !== "boolean") errors[path] = "请选择有效状态。";
      break;
    case "array":
      validateArray(schema, value, path, errors, hints);
      break;
    case "object":
      validateObject(schema, value, path, errors, hints);
      break;
  }
}

function validateString(
  schema: PluginJsonSchema,
  value: unknown,
  path: string,
  errors: ValidationErrors,
  hints: Record<string, OpenClawPluginConfigurationUIHint>,
) {
  if (typeof value !== "string") {
    errors[path] = "请输入文本。";

    return;
  }

  if (value === "********" && isSensitivePath(hints, path)) return;

  if (schema.format === "uri") {
    try {
      new URL(value);
    } catch {
      errors[path] = "请输入有效的 URL。";

      return;
    }
  }

  if (typeof schema.minLength === "number" && value.length < schema.minLength) {
    errors[path] = `至少需要 ${schema.minLength} 个字符。`;
  } else if (
    typeof schema.maxLength === "number" &&
    value.length > schema.maxLength
  ) {
    errors[path] = `不能超过 ${schema.maxLength} 个字符。`;
  }
}

function validateNumber(
  schema: PluginJsonSchema,
  value: unknown,
  path: string,
  errors: ValidationErrors,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (schema.type === "integer" && !Number.isInteger(value))
  ) {
    errors[path] = schema.type === "integer" ? "请输入整数。" : "请输入数字。";

    return;
  }

  if (typeof schema.minimum === "number" && value < schema.minimum) {
    errors[path] = `不能小于 ${schema.minimum}。`;
  } else if (typeof schema.maximum === "number" && value > schema.maximum) {
    errors[path] = `不能大于 ${schema.maximum}。`;
  }
}

function validateArray(
  schema: PluginJsonSchema,
  value: unknown,
  path: string,
  errors: ValidationErrors,
  hints: Record<string, OpenClawPluginConfigurationUIHint>,
) {
  if (!Array.isArray(value)) {
    errors[path] = "配置值必须是列表。";

    return;
  }

  if (typeof schema.minItems === "number" && value.length < schema.minItems) {
    errors[path] = `至少需要 ${schema.minItems} 项。`;
  } else if (
    typeof schema.maxItems === "number" &&
    value.length > schema.maxItems
  ) {
    errors[path] = `不能超过 ${schema.maxItems} 项。`;
  }

  const itemSchema = isRecord(schema.items) ? schema.items : {};

  value.forEach((item, index) =>
    validateSchemaValue(
      itemSchema,
      item,
      joinPath(path, String(index)),
      errors,
      hints,
    ),
  );
}

function validateObject(
  schema: PluginJsonSchema,
  value: unknown,
  path: string,
  errors: ValidationErrors,
  hints: Record<string, OpenClawPluginConfigurationUIHint>,
) {
  if (!isRecord(value)) {
    errors[path] = "配置值必须是对象。";

    return;
  }

  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === "string")
    : [];

  for (const key of required) {
    const child = value[key];

    if (child === undefined || child === null || child === "") {
      errors[joinPath(path, key)] = "此项为必填项。";
    }
  }

  for (const [key, childSchema] of Object.entries(properties)) {
    if (!isRecord(childSchema) || !Object.hasOwn(value, key)) continue;

    validateSchemaValue(
      childSchema,
      value[key],
      joinPath(path, key),
      errors,
      hints,
    );
  }

  if (isRecord(schema.additionalProperties)) {
    for (const [key, child] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) continue;

      validateSchemaValue(
        schema.additionalProperties,
        child,
        joinPath(path, key),
        errors,
        hints,
      );
    }
  } else if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(properties, key)) {
        errors[joinPath(path, key)] = "不支持此配置项。";
      }
    }
  }
}

function joinPath(path: string, key: string) {
  return path ? `${path}.${key}` : key;
}

function isSensitivePath(
  hints: Record<string, OpenClawPluginConfigurationUIHint>,
  path: string,
) {
  const fieldName = path.split(".").at(-1) ?? path;

  return (
    hints[path]?.sensitive === true || hints[fieldName]?.sensitive === true
  );
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneValue) as T;
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, cloneValue(child)]),
  ) as T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
