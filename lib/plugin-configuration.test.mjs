import assert from "node:assert/strict";

import {
  createPluginConfigurationValue,
  mergePluginConfigurations,
  toPluginConfigurationInputs,
  validatePluginConfigurationValue,
} from "./plugin-configuration.ts";

const schema = {
  type: "object",
  required: ["enabled", "serverUrl", "accounts", "defaultAccount"],
  properties: {
    enabled: { type: "boolean", default: true },
    serverUrl: {
      type: "string",
      format: "uri",
      default: "https://example.com",
    },
    retries: { type: "integer", minimum: 1, maximum: 5, default: 3 },
    mode: { type: "string", enum: ["poll", "push"], default: "push" },
    tags: {
      type: "array",
      minItems: 1,
      items: { type: "string" },
      default: ["primary"],
    },
    accounts: {
      type: "object",
      additionalProperties: {
        type: "object",
        required: ["token"],
        properties: { token: { type: "string" } },
      },
      default: { default: { token: "secret" } },
    },
    defaultAccount: { type: "string", default: "default" },
  },
};

const value = createPluginConfigurationValue(schema);

assert.deepEqual(value, {
  accounts: { default: { token: "secret" } },
  defaultAccount: "default",
  enabled: true,
  mode: "push",
  retries: 3,
  serverUrl: "https://example.com",
  tags: ["primary"],
});
assert.deepEqual(
  createPluginConfigurationValue(schema, {
    accounts: { secondary: { token: "********" } },
    retries: 4,
  }),
  {
    accounts: { secondary: { token: "********" } },
    defaultAccount: "default",
    enabled: true,
    mode: "push",
    retries: 4,
    serverUrl: "https://example.com",
    tags: ["primary"],
  },
);
assert.deepEqual(validatePluginConfigurationValue(schema, value), {});
assert.deepEqual(
  validatePluginConfigurationValue(schema, {
    ...value,
    mode: "invalid",
    retries: 8,
    serverUrl: "not a URL",
    tags: [],
  }),
  {
    mode: "请选择有效选项。",
    retries: "不能大于 5。",
    serverUrl: "请输入有效的 URL。",
    tags: "至少需要 1 项。",
  },
);
assert.deepEqual(validatePluginConfigurationValue(schema, {}), {
  accounts: "此项为必填项。",
  defaultAccount: "此项为必填项。",
  enabled: "此项为必填项。",
  serverUrl: "此项为必填项。",
});
assert.deepEqual(
  validatePluginConfigurationValue(
    {
      type: "object",
      properties: { token: { type: "string", minLength: 32 } },
    },
    { token: "********" },
    "channel:clawbridge",
    { token: { sensitive: true } },
  ),
  {},
);
assert.deepEqual(
  toPluginConfigurationInputs([{ target: "channel:clawbridge", schema }], {
    "channel:clawbridge": value,
  }),
  [{ target: "channel:clawbridge", value }],
);
assert.deepEqual(
  mergePluginConfigurations(
    [{ target: "channel:clawbridge", schema, value: { retries: 3 } }],
    [
      {
        target: "channel:clawbridge",
        schema: { type: "object" },
        value: { retries: 4, token: "********" },
      },
    ],
  ),
  [
    {
      target: "channel:clawbridge",
      schema,
      value: { retries: 4, token: "********" },
    },
  ],
);
assert.deepEqual(
  mergePluginConfigurations([], [
    {
      target: "channel:clawbridge",
      schema,
      value: { token: "********" },
    },
  ]),
  [
    {
      target: "channel:clawbridge",
      schema,
      value: { token: "********" },
    },
  ],
);

console.log("plugin configuration assertions passed");
