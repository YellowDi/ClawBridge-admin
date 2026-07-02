# 后台知识库管理接入设计

## 背景

ClawBridge Admin 需要接入 `claw-core-admin` 新增的知识库管理接口，并同步前端现有接口类型与后端实际代码。接口事实源以本地 `/Users/Rolly/ClawCore/claw-core-admin` 新代码为准，Apifox 文档只作为对照。

## 范围

- 新增后台知识库管理页 `/knowledge-bases`。
- 支持查询知识库列表、通过 URL 创建知识库、重试失败知识库入库。
- 支持为用户和 Agent 设置“可用知识库”。
- 在导航中增加“知识库”入口。
- 在 `lib/api.ts` 补齐知识库类型与 helper。
- 同步老接口类型：模型计费字段、usage 非 token 计费字段、余额流水 `relatedId` 类型。

## 暂不包含

- 不接入本地文件上传创建知识库；本轮按用户要求使用 `/api/knowledge-bases/create-url`。
- 不考虑 clawbridge 运行时知识库消费链路；用户确认 clawbridge 暂未接入知识库。
- 不新增依赖，不重做用量统计 UI。

## 接口契约

- `POST /api/knowledge-bases/list` 返回 `{ items: KnowledgeBase[] }`。
- `POST /api/knowledge-bases/create-url` 请求 `{ name, description, url }`，返回单个知识库记录。
- `POST /api/knowledge-bases/retry` 请求 `{ knowledgeBaseId }`，只允许失败状态重试。
- `POST /api/knowledge-bases/users/replace` 与 `POST /api/knowledge-bases/agents/replace` 保存用户和 Agent 的“可用知识库”。

## 前端设计

- 新建 `components/admin-knowledge-page.tsx`，复用 `AdminPage`、`StatGrid` 和 HeroUI Pro `DataGrid` 的现有页面模式。
- 新建 `app/knowledge-bases/page.tsx` 作为薄路由入口。
- 列表展示名称、来源类型、状态、片段数、来源地址、更新时间和操作。
- URL 创建使用一个 Modal 表单，字段为名称、描述、URL。
- 只有 `failed` 状态显示重试操作；成功后刷新列表。
- 用户列表和 Agent 列表各提供“可用知识库”弹窗；后端暂未提供当前可用知识库读接口，因此弹窗保存的是本次选择的完整列表。

## 错误处理

- 复用 `lib/api.ts` 现有 `requestJson`、`ApiError` 和 toast 风格。
- 创建表单做最小前端校验：名称和 URL 必填。
- 后端重复 URL、URL 格式、状态不可重试等错误直接展示后端 message。

## 验证

- 运行 `pnpm exec tsc --noEmit`。
- 运行 `pnpm exec eslint .`。
- 如改动影响构建面，再运行 `pnpm build`。

## 风险

- 知识库列表接口无分页，当前页面按全量列表实现；数据量变大时再加分页。
- 后端暂未提供当前可用知识库读接口，弹窗无法回显已保存选择；后续有读接口后再预填当前选择。
