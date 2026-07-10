# Plugin Detail Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the plugin detail modal into an operations-focused summary with collapsible low-frequency metadata and raw configuration.

**Architecture:** Keep `PluginDetailModal` as the sole owner of the presentation change. Reuse the existing data and action callbacks, use HeroUI `Modal`, `Accordion`, `ListView`, `Tabs`, and Pro `CodeBlock` for all overlay and data-display anatomy, and keep the current footer actions unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, HeroUI v3.

## Global Constraints

- Do not modify plugin API contracts, loading behavior, or install/edit/delete behavior.
- Do not add runtime dependencies or decorative Card containers.
- Visible copy stays Simplified Chinese.
- Use HeroUI v3 compound components and `onPress` for actions.

---

### Task 1: Simplify Plugin Detail Modal

**Files:**
- Modify: `components/openclaw-plugins-page.tsx:16-31`
- Modify: `components/openclaw-plugins-page.tsx:1660-1790`
- Modify: `components/openclaw-plugins-page.tsx:2223-2244`
- Modify: `components/openclaw-plugins-page.tsx:2363-2397`

**Interfaces:**
- Consumes: `OpenClawPlugin`, `Modal`, `Accordion`, `ListView`, `Tabs`, `CodeBlock`, and existing `getSourceLabel`, `formatBytes`, and `formatDateTime`.
- Produces: the existing `PluginDetailModal` callback contract without data or behavior changes.

- [ ] **Step 1: Import HeroUI data-display components**

```tsx
import {CodeBlock, DataGrid, DropZone, ListView} from "@heroui-pro/react";
import {Accordion, Modal} from "@heroui/react";
```

- [ ] **Step 2: Replace the always-expanded detail sections with the summary layout**

```tsx
<Modal.Header>
  <div className="min-w-0">
    <Modal.Heading>{plugin?.name || plugin?.pluginId || "插件详情"}</Modal.Heading>
    {plugin ? (
      <div className="text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span title={plugin.pluginId}>{plugin.pluginId || "未标注 ID"}</span>
        <span>{plugin.version || "未标注版本"}</span>
        <span>{getSourceLabel(plugin.sourceType)}</span>
      </div>
    ) : null}
  </div>
  <Modal.CloseTrigger aria-label="关闭插件详情" />
</Modal.Header>
```

```tsx
<Modal.Body className="flex min-w-0 flex-col gap-6">
  {plugin ? (
    <>
      {plugin.description ? (
        <p className="text-pretty text-sm leading-6">{plugin.description}</p>
      ) : null}
      <Accordion allowsMultipleExpanded className="w-full">
        <Accordion.Item defaultExpanded id="capabilities">
          <Accordion.Heading><Accordion.Trigger>能力<Accordion.Indicator /></Accordion.Trigger></Accordion.Heading>
          <Accordion.Panel><Accordion.Body>
            <CapabilityList label="工具" values={plugin.capabilities?.tools} />
            <CapabilityList label="Channel" values={plugin.capabilities?.channels} />
            <CapabilityList label="Provider" values={plugin.capabilities?.providers} />
            <CapabilityList label="Hook" values={plugin.capabilities?.hooks} />
            <CapabilityList label="Command" values={plugin.capabilities?.commands} />
          </Accordion.Body></Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item id="metadata">
          <Accordion.Heading>
            <Accordion.Trigger>
              更多信息
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <ListView aria-label="插件更多信息" items={metadata} selectionMode="none" variant="secondary">
                {(item) => <ListView.Item id={item.label} textValue={`${item.label} ${item.value}`}><ListView.ItemContent><div><ListView.Title>{item.label}</ListView.Title><ListView.Description>{item.value}</ListView.Description></div></ListView.ItemContent></ListView.Item>}
              </ListView>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item id="raw-config">
          <Accordion.Heading>
            <Accordion.Trigger>
              原始配置
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <Tabs defaultSelectedKey="manifest">
                <Tabs.ListContainer><Tabs.List aria-label="插件原始配置"><Tabs.Tab id="manifest">Manifest<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="package">Package<Tabs.Indicator /></Tabs.Tab></Tabs.List></Tabs.ListContainer>
                <Tabs.Panel id="manifest"><CodeBlock><CodeBlock.Header><span>JSON</span><CodeBlock.CopyButton code={manifest} /></CodeBlock.Header><CodeBlock.Code code={manifest} language="json" /></CodeBlock></Tabs.Panel>
                <Tabs.Panel id="package"><CodeBlock><CodeBlock.Header><span>JSON</span><CodeBlock.CopyButton code={packageJson} /></CodeBlock.Header><CodeBlock.Code code={packageJson} language="json" /></CodeBlock></Tabs.Panel>
              </Tabs>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </>
  ) : null}
</Modal.Body>
```

- [ ] **Step 3: Hide empty capability categories and remove obsolete manual detail components**

```tsx
function CapabilityList({label, values}: {label: string; values?: string[]}) {
  if (!values?.length) return null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted text-xs">{label}</span>
      <div className="flex flex-wrap gap-1">
        {values.map((value) => <Chip key={value} size="sm" variant="soft">{value}</Chip>)}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify the modal is type-safe and formatted**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint .`

Expected: both commands exit with code `0`.

- [ ] **Step 5: Build and visually inspect**

Run: `pnpm build`

Expected: build exits with code `0`; opening a plugin detail shows only the identity, description, and non-empty capabilities until “更多信息” or “原始配置” is expanded.
