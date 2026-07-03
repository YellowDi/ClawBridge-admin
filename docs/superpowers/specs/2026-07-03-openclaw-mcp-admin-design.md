# OpenClaw MCP Admin 设计

## 背景

`clawcore` 后端新增 MCP 配置库与 OpenClaw RPC 集成接口。前端当前只有旧的 OpenClaw 模型和 Agent 配置下发入口，缺少维护 MCP server 配置、查看已连接 RPC 实例、读取 OpenClaw 当前 Agent/MCP 摘要，以及把 MCP 配置应用到目标 Agent 的能力。

后端事实来源：

- MCP 配置库保存在 claw-core-admin DB，通过 `/api/mcp-servers/*` CRUD 管理。
- OpenClaw RPC 实例、Agent、当前 MCP server 摘要、Agent 工具 allowlist 都来自目标 OpenClaw 的实时快照。
- 应用 MCP 时调用 `/api/openclaw/mcp/apply`，传入 `pluginId`、`agentId`、`mcpServerIds`、`mode`、`dryRun` 和 `validateEnvRefs`。

## 目标

新增独立 `/mcp` 管理页，让管理员可以：

- 查看、创建、编辑、删除 MCP server 配置库记录。
- 查看当前已连接的 OpenClaw RPC 实例。
- 选择实例后读取 OpenClaw 配置快照，展示 Agent 和 MCP 摘要。
- 选择 MCP 配置和 OpenClaw Agent，执行 dry run 或正式应用。

## 非目标

- 不实现通用 JSON schema 编辑器。
- 不保存 OpenClaw 实例、OpenClaw Agent 或绑定状态到前端/后台以外的新存储。
- 不重做现有 `/settings` 的 OpenClaw 模型和 Agent 配置下发。
- 不新增运行时依赖。
- 不做批量导入、批量删除或配置版本历史。

## 方案

采用独立页面方案：

- 新增侧边栏导航项 `OpenClaw MCP`，路径 `/mcp`，归入运维治理。
- 新增 `components/admin-mcp-page.tsx` 承载页面状态和 UI。
- 扩展 `lib/api.ts`，加入 MCP 配置库和 OpenClaw MCP/RPC helper。
- 新增 `app/mcp/page.tsx` 薄路由入口。
- 扩展 `lib/api-contract.test.ts` 的类型契约，保证关键接口返回类型可被 TypeScript 静态检查。

页面分三块：

- MCP 配置库：列表展示名称、serverName、transport、启用状态和更新时间；支持创建、编辑、删除。
- OpenClaw RPC：展示已连接实例；选择实例后读取快照，展示 Agent 数、MCP server 数、configHash、Agent allowlist 摘要和 MCP 摘要。
- 应用配置：选择 RPC 实例、OpenClaw Agent、一个或多个 MCP 配置，选择 `merge` 或 `replace_agent_mcp`，勾选 dry run 和 env ref 校验后调用应用接口。

## 表单范围

表单覆盖接口文档中的 MCP 配置字段：

- 基础字段：`serverName`、`displayName`、`description`、`enabled`。
- 连接字段：`transport`、`command`、`args`、`url`、`cwd`、`workingDirectory`。
- 配置值：`env`、`headers`，使用每行 `key / type / value 或 envName` 的简化输入。
- 工具过滤：`toolFilter.include`、`toolFilter.exclude`，使用逗号分隔文本。
- 超时：`connectionTimeoutMs`、`requestTimeoutMs`、`connectTimeout`、`timeout`。
- 鉴权和连接安全：`auth`、`oauth.scope`、`oauth.redirectUrl`、`oauth.clientMetadataUrl`、`sslVerify`、`clientCert`、`clientKey`。
- 其他能力：`supportsParallelToolCalls`、`codex`、`extra`。

多行文本输入使用 HeroUI `TextArea`。`codex` 和 `extra` 使用 JSON object 文本输入，提交前做 JSON object 校验。

`secret` 类型值由后端加密保存，返回时显示 `******`。编辑时如果用户保留 `******`，按后端规则沿用旧 secret；如果用户输入新值，则提交新 secret。

## 数据流

1. 页面加载时并发请求 `/api/mcp-servers/list` 和 `/api/openclaw/instances/list`。
2. 如果有 RPC 实例，默认选中第一个并请求 `/api/openclaw/config/snapshot`。
3. 创建或编辑 MCP 配置成功后刷新配置库列表。
4. 删除 MCP 配置只调用软删除接口，不修改 OpenClaw 当前配置。
5. 应用 MCP 配置成功后用响应里的 `snapshot` 更新页面快照；如果响应没有快照，则重新请求当前实例快照。

## 错误处理

- API 错误沿用 `lib/api.ts` 的 `ApiError` 和 toast 模式。
- 表单提交前做最小前端校验：`serverName`、`displayName`、连接字段和应用所需选择项不能为空。
- 远程 transport 需要 `url`；`stdio` 需要 `command`。
- 删除前使用确认 Modal。
- 页面局部失败展示错误文案，不阻塞用户刷新或重试。

## 验证

- `pnpm exec tsc --noEmit`
- `pnpm exec eslint .`

项目当前没有 `package.json` test script，因此不声明测试套件通过。

## 风险

- OpenClaw 快照依赖 RPC 插件在线；离线或 bridge 不可用时只能展示错误和空状态。
- `replace_agent_mcp` 的精确语义由后端和 OpenClaw 插件执行，前端只透传 mode。
