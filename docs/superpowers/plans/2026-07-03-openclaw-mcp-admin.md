# OpenClaw MCP Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent `/mcp` admin page for MCP server configuration and OpenClaw RPC MCP application.

**Architecture:** Extend the existing frontend API layer with typed MCP/OpenClaw helpers, then build one client page that owns loading, editing, deleting, snapshot, and apply state. Keep the route thin and add one sidebar item.

**Tech Stack:** Next.js App Router, React 19, TypeScript, HeroUI v3, HeroUI Pro DataGrid, existing `/api/backend` proxy.

---

### Task 1: Add Type Contract Coverage

**Files:**
- Modify: `lib/api-contract.test.ts`

- [ ] **Step 1: Write the failing type contract**

```ts
import type {
  MCPServer,
  OpenClawConfigSnapshot,
  OpenClawMCPApplyResult,
  OpenClawRPCInstance,
} from "@/lib/api";

import {
  applyOpenClawMCPConfig,
  createMCPServer,
  deleteMCPServer,
  getOpenClawConfigSnapshot,
  listMCPServers,
  listOpenClawRPCInstances,
  updateMCPServer,
} from "@/lib/api";

expectType<Promise<MCPServer[]>>(listMCPServers());
expectType<Promise<OpenClawRPCInstance[]>>(listOpenClawRPCInstances());
expectType<Promise<OpenClawConfigSnapshot | undefined>>(
  getOpenClawConfigSnapshot({ pluginId: "clawcore-rpc" }),
);
expectType<Promise<MCPServer | undefined>>(
  createMCPServer({
    config: { command: "npx", transport: "stdio" },
    displayName: "GitHub MCP",
    enabled: true,
    serverName: "github",
  }),
);
expectType<Promise<MCPServer | undefined>>(
  updateMCPServer({
    config: { url: "https://mcp.example.com/sse", transport: "sse" },
    displayName: "Remote MCP",
    enabled: true,
    id: 1,
    serverName: "remote",
  }),
);
expectType<Promise<void>>(deleteMCPServer(1));
expectType<Promise<OpenClawMCPApplyResult | undefined>>(
  applyOpenClawMCPConfig({
    agentId: "coder",
    dryRun: true,
    mcpServerIds: [1],
    mode: "merge",
    pluginId: "clawcore-rpc",
    validateEnvRefs: true,
  }),
);
```

- [ ] **Step 2: Run type check to verify RED**

Run: `pnpm exec tsc --noEmit`

Expected: FAIL because MCP/OpenClaw types and helpers are not exported from `lib/api.ts`.

### Task 2: Add MCP API Types And Helpers

**Files:**
- Modify: `lib/api.ts`

- [ ] **Step 1: Add DTO types matching clawcore**

Add `MCPServerConfig`, `MCPConfigValue`, `MCPServer`, `ReqMCPServerCreate`, `ReqMCPServerUpdate`, `OpenClawRPCInstance`, `OpenClawConfigSnapshot`, `ReqApplyOpenClawMCPConfig`, and `OpenClawMCPApplyResult`.

- [ ] **Step 2: Add helper functions**

Add `listMCPServers`, `createMCPServer`, `getMCPServerDetail`, `updateMCPServer`, `deleteMCPServer`, `listOpenClawRPCInstances`, `getOpenClawConfigSnapshot`, and `applyOpenClawMCPConfig`.

- [ ] **Step 3: Run type check to verify GREEN for API contract**

Run: `pnpm exec tsc --noEmit`

Expected: PASS or only reveal missing UI files not yet added.

### Task 3: Add Route And Navigation

**Files:**
- Create: `app/mcp/page.tsx`
- Modify: `components/admin-shell.tsx`

- [ ] **Step 1: Add thin route**

```ts
import { AdminMCPPage } from "@/components/admin-mcp-page";

export default function Page() {
  return <AdminMCPPage />;
}
```

- [ ] **Step 2: Add sidebar item**

Add `{ href: "/mcp", icon: "tool", key: "mcp", label: "OpenClaw MCP" }` to the operations nav group.

### Task 4: Build Admin MCP Page

**Files:**
- Create: `components/admin-mcp-page.tsx`

- [ ] **Step 1: Add page state and loaders**

Use `useEffect`, `useCallback`, and existing API helpers to load MCP servers and RPC instances. When a plugin is selected, load its snapshot.

- [ ] **Step 2: Add MCP config list and dialog**

Use HeroUI `Modal`, `TextField`, `Select`, `Checkbox`, and `Button`. Cover `serverName`, `displayName`, `description`, `enabled`, `transport`, `command`, `args`, `url`, `cwd`, `env`, `headers`, `toolFilter`, and timeout fields.

- [ ] **Step 3: Add delete confirmation**

Use a small `Modal` and call `deleteMCPServer(id)`, then refresh the list.

- [ ] **Step 4: Add RPC snapshot and apply controls**

Use `Select` for plugin, agent, and mode; checkboxes for selected MCP configs, dry run, and env ref validation. Call `applyOpenClawMCPConfig`, show changed paths/warnings/follow-up, and update snapshot from the response.

### Task 5: Validate And Clean Up

**Files:**
- Modify only files touched above.

- [ ] **Step 1: Run TypeScript**

Run: `pnpm exec tsc --noEmit`

Expected: PASS.

- [ ] **Step 2: Run ESLint**

Run: `pnpm exec eslint .`

Expected: PASS.

- [ ] **Step 3: Check worktree**

Run: `git status --short`

Expected: only intended implementation files are changed.
