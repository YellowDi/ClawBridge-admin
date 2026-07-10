# Plugin Deployment Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render backend-provided plugin type and deployment strategy, then restrict Agent-scoped installation and management to plugins that explicitly support it.

**Architecture:** Extend the shared plugin DTOs in `lib/api.ts` so the same `pluginType` and `deployment` objects flow from the library, detail, and installation APIs into the existing page. Keep the page client-side: add a library type selector, condition the install form from `deployment.supportsAgentScope`, and surface pending configuration without inventing a configuration API or route.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, HeroUI v3, HeroUI Pro.

## Global Constraints

- Use backend `deployment.supportsAgentScope` as the sole Agent-scope permission signal.
- For unsupported scope, send `scopeType: "global"` and omit `agentIds`.
- Do not add configuration API calls, routes, or runtime dependencies.
- Show configuration as a pending state and a disabled placeholder only.
- Preserve Chinese visible copy and existing HeroUI compound-component patterns.

---

### Task 1: Extend Plugin API Contracts

**Files:**
- Modify: `lib/api.ts:1195-1306`
- Modify: `lib/api-contract.test.ts:180-228`

**Interfaces:**
- Produces `OpenClawPluginType`, `OpenClawPluginDeployment`, `OpenClawPlugin.pluginType`, `OpenClawPlugin.deployment`, `OpenClawPluginInstall.pluginType`, `OpenClawPluginInstall.deployment`, and `ReqOpenClawPluginLibraryList.pluginType`.
- Consumes the existing list, detail, and installation helpers without changing endpoint paths.

- [ ] **Step 1: Extend the type contract assertion with backend fields**

```ts
expectType<OpenClawPlugin>({
  deployment: {
    configurationRequired: true,
    configurationTargets: ["channel:telegram"],
    modes: ["channel"],
    postInstallAction: "configure_channel",
    supportsAgentScope: false,
    type: "channel",
  },
  pluginType: "channel",
});
```

- [ ] **Step 2: Add the DTO fields and list request filter**

```ts
export type OpenClawPluginType =
  | "tool"
  | "channel"
  | "provider"
  | "memory"
  | "mixed"
  | "extension"
  | (string & {});

export interface OpenClawPluginDeployment {
  configurationRequired?: boolean;
  configurationTargets?: string[];
  modes?: string[];
  postInstallAction?: string;
  supportsAgentScope?: boolean;
  type?: OpenClawPluginType;
}
```

```ts
export interface ReqOpenClawPluginLibraryList extends ReqPagination {
  includeDeleted?: boolean;
  pluginType?: OpenClawPluginType;
  query?: string;
}
```

- [ ] **Step 3: Verify contract compilation**

Run: `pnpm exec tsc --noEmit`

Expected: exit code `0`.

### Task 2: Render Deployment Strategy and Restrict Operations

**Files:**
- Modify: `components/openclaw-plugins-page.tsx:216-610`
- Modify: `components/openclaw-plugins-page.tsx:598-1245`
- Modify: `components/openclaw-plugins-page.tsx:1661-1905`
- Modify: `components/openclaw-plugins-page.tsx:2371-2440`

**Interfaces:**
- Consumes `OpenClawPlugin.deployment`, `OpenClawPluginInstall.deployment`, and `OpenClawPluginType` from Task 1.
- Produces the existing install request with `agentIds` omitted when Agent scope is unsupported.

- [ ] **Step 1: Add an optional HeroUI type filter to the library request**

```tsx
<Select
  selectedKey={pluginType}
  variant="secondary"
  onSelectionChange={(key) => {
    const next = String(key ?? "");
    setPluginType(next);
    void loadLibrary(1, queryInput, state.includeDeleted, next);
  }}
>
  <Label>插件类型</Label>
  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
  <Select.Popover><ListBox>{PLUGIN_TYPE_OPTIONS.map((option) => <ListBox.Item key={option.id} id={option.id} textValue={option.label}>{option.label}</ListBox.Item>)}</ListBox></Select.Popover>
</Select>
```

- [ ] **Step 2: Render type and pending-configuration chips in library, detail, and instance rows**

```tsx
{plugin.pluginType ? <Chip size="sm" variant="soft">{getPluginTypeLabel(plugin.pluginType)}</Chip> : null}
{plugin.deployment?.configurationRequired ? <Chip color="warning" size="sm" variant="soft">待配置</Chip> : null}
```

- [ ] **Step 3: Constrain the install dialog from deployment strategy**

```ts
const supportsAgentScope = target?.plugin.deployment?.supportsAgentScope === true;
const installRequest = {
  dryRun,
  enabled,
  openclawPluginId: selectedInstanceId,
  pluginRecordId,
  scopeType: supportsAgentScope ? scopeType : "global",
  ...(supportsAgentScope
    ? {agentIds: scopeType === "agents" ? selectedAgentIds : []}
    : {}),
};
```

- [ ] **Step 4: Hide Agent controls and Agent refresh when unsupported**

```tsx
{supportsAgentScope ? (
  <>
    <Button type="button" variant="tertiary" onPress={() => void loadAgents(selectedInstanceId)}>刷新 Agent</Button>
    <ScopeFields
      agents={agents}
      isDisabled={isSubmitting || isLoadingAgents}
      scopeType={scopeType}
      selectedAgentIds={selectedAgentIds}
      onAgentIdsChange={setSelectedAgentIds}
      onScopeTypeChange={setScopeType}
    />
  </>
) : (
  <Description>此插件仅支持实例级全局安装。</Description>
)}
```

- [ ] **Step 5: Gate the instance “修改 Agent” action and expose configuration placeholder**

```tsx
{item.deployment?.supportsAgentScope === true ? <Button onPress={() => setScopeRecord(item)}>修改 Agent</Button> : null}
{item.deployment?.configurationRequired ? <Chip color="warning" size="sm" variant="soft">待配置</Chip> : null}
```

```tsx
<Button isDisabled size="sm" variant="tertiary">配置即将支持</Button>
```

- [ ] **Step 6: Verify the page and production build**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm build`

Expected: every command exits with code `0`; a channel plugin hides scope controls and omits `agentIds`, while a tool plugin retains the Agent controls.
