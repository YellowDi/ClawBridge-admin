# Knowledge Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ClawBridge Admin support for `claw-core-admin` knowledge base management and sync changed API types.

**Architecture:** Keep the backend proxy unchanged and add thin typed helpers in `lib/api.ts`. Add one client page component for knowledge bases and one App Router page that renders it. Update navigation and icon typing only where required.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, HeroUI v3, HeroUI Pro `DataGrid`, existing `/api/backend` proxy.

---

## File Structure

- Modify `lib/api.ts`: add knowledge base DTOs/helpers and changed fields for model, usage, stats, and balance transactions.
- Create `components/admin-knowledge-page.tsx`: client UI for list, create-from-URL modal, retry action, local row mapping.
- Create `app/knowledge-bases/page.tsx`: thin route entry.
- Modify `components/admin-shell.tsx`: add nav item.
- Modify `components/admin-icons.tsx`: add a `knowledge` icon alias using existing `Database`.
- Modify `components/model-dialog.tsx`: add `billingUnit` and `unitPriceAmount` to the model form so the existing model modal matches backend DTOs.
- Modify `components/model-configuration-page.tsx`: add `billingUnit` and `unitPriceAmount` to the model configuration dialog request path.

## Task 1: API Contracts

**Files:**
- Modify: `lib/api.ts`

- [ ] **Step 1: Add backend-aligned knowledge and changed API types**

Add these fields to existing interfaces:

```ts
export interface ReqModelCreate {
  billingUnit?: string;
  unitPriceAmount?: string;
}

export interface ReqModelUpdate {
  billingUnit?: string;
  unitPriceAmount?: string;
}

export interface Model {
  billingUnit?: string;
  unitPriceAmount?: string;
}

export interface ReqTokenUsageCreate {
  billableQuantity?: number;
  usageType?: string;
}

export interface TokenUsage {
  billableQuantity?: number;
  unitCostAmount?: string;
  unitPriceAmount?: string;
  usageType?: string;
}

export interface TokenUsageStatsModel {
  billableQuantity?: number;
  unitCostAmount?: string;
  usageType?: string;
}

export interface UserBalanceTransaction {
  relatedId?: number | string;
}
```

Then add these new interfaces near the existing API DTOs:

```ts
export interface KnowledgeBase {
  activeEmbeddingModelId?: number;
  chunkCount?: number;
  createdAt?: string;
  description?: string;
  enabled?: boolean;
  errorMessage?: string;
  filename?: string;
  id?: number;
  isDelete?: number;
  mimeType?: string;
  name?: string;
  parserName?: string;
  parserVersion?: string;
  path?: string;
  sha256?: string;
  size?: number;
  status?: string;
  storageType?: string;
  updatedAt?: string;
  [property: string]: unknown;
}

export interface ResKnowledgeBaseList {
  items?: KnowledgeBase[];
  [property: string]: unknown;
}

export interface ReqCreateKnowledgeBaseUrl {
  description?: string;
  name?: string;
  url?: string;
  [property: string]: unknown;
}

export interface ReqRetryKnowledgeBase {
  knowledgeBaseId?: number;
  [property: string]: unknown;
}

export interface ReqReplaceUserKnowledgeBases {
  knowledgeBaseIds?: number[];
  userId?: number;
  [property: string]: unknown;
}

export interface ReqReplaceAgentKnowledgeBases {
  agentId?: number;
  knowledgeBaseIds?: number[];
  [property: string]: unknown;
}
```

- [ ] **Step 2: Add helper functions**

Add these functions next to the other endpoint helpers:

```ts
export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const response = await requestJson<
    ResKnowledgeBaseList | { data?: ResKnowledgeBaseList } | KnowledgeBase[]
  >("/api/knowledge-bases/list", {
    body: JSON.stringify({}),
    method: "POST",
  });

  if (Array.isArray(response)) return response;
  if ("items" in response) return response.items ?? [];

  return response.data?.items ?? [];
}

export async function createKnowledgeBaseFromUrl(
  request: ReqCreateKnowledgeBaseUrl,
): Promise<KnowledgeBase | undefined> {
  return requestJson<KnowledgeBase | undefined>(
    "/api/knowledge-bases/create-url",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function retryKnowledgeBase(
  knowledgeBaseId: number,
): Promise<KnowledgeBase | undefined> {
  return requestJson<KnowledgeBase | undefined>("/api/knowledge-bases/retry", {
    body: JSON.stringify({ knowledgeBaseId } satisfies ReqRetryKnowledgeBase),
    method: "POST",
  });
}

export async function replaceUserKnowledgeBases(
  request: ReqReplaceUserKnowledgeBases,
): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/knowledge-bases/users/replace",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function replaceAgentKnowledgeBases(
  request: ReqReplaceAgentKnowledgeBases,
): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/knowledge-bases/agents/replace",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}
```

- [ ] **Step 3: Verify type compilation**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 4: Commit API contract changes**

```bash
git add lib/api.ts
git commit -m "feat: add knowledge base api helpers"
```

## Task 2: Knowledge Base Page

**Files:**
- Create: `components/admin-knowledge-page.tsx`
- Create: `app/knowledge-bases/page.tsx`

- [ ] **Step 1: Create the route entry**

Create `app/knowledge-bases/page.tsx`:

```ts
import { KnowledgeBasesPage } from "@/components/admin-knowledge-page";

export default function Page() {
  return <KnowledgeBasesPage />;
}
```

- [ ] **Step 2: Create the page component skeleton**

Create `components/admin-knowledge-page.tsx` with:

```tsx
"use client";

import type { DataGridColumn } from "@heroui-pro/react";
import type { FormEvent } from "react";
import type { KnowledgeBase } from "@/lib/api";

import {
  Button,
  Chip,
  Input,
  Label,
  Modal,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { DataGrid } from "@heroui-pro/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage, StatGrid } from "@/components/admin-page-kit";
import {
  createKnowledgeBaseFromUrl,
  listKnowledgeBases,
  retryKnowledgeBase,
} from "@/lib/api";
```

- [ ] **Step 3: Add state and columns**

Add page state:

```ts
type KnowledgeStatus =
  | "pending"
  | "extracting"
  | "chunking"
  | "embedding"
  | "indexed"
  | "failed"
  | string;

type KnowledgeRow = {
  chunkCount: number;
  createdAt: string;
  description: string;
  errorMessage: string;
  id: string;
  knowledgeBaseId: number | null;
  name: string;
  path: string;
  status: KnowledgeStatus;
  storageType: string;
  updatedAt: string;
};

type KnowledgeLoadState = {
  error: string | null;
  isLoading: boolean;
  items: KnowledgeBase[];
};

const KNOWLEDGE_STATUS_LABEL: Record<string, string> = {
  chunking: "切片中",
  embedding: "向量化",
  extracting: "抽取中",
  failed: "失败",
  indexed: "已入库",
  pending: "待处理",
};
```

Add `KNOWLEDGE_COLUMNS` with columns for name, status, storageType, chunkCount, path, updatedAt, and actions. The action cell renders `RetryKnowledgeBaseButton` only when `item.status === "failed"` and `item.knowledgeBaseId != null`.

- [ ] **Step 4: Implement list loading**

Add `KnowledgeBasesPage` using existing page patterns:

```tsx
export function KnowledgeBasesPage() {
  const isMountedRef = useRef(false);
  const [loadState, setLoadState] = useState<KnowledgeLoadState>({
    error: null,
    isLoading: true,
    items: [],
  });

  const loadKnowledgeBases = useCallback(async () => {
    setLoadState((current) => ({ ...current, error: null, isLoading: true }));

    try {
      const items = await listKnowledgeBases();
      if (isMountedRef.current) {
        setLoadState({ error: null, isLoading: false, items });
      }
    } catch (error) {
      if (isMountedRef.current) {
        setLoadState({
          error: getKnowledgeError(error, "知识库列表加载失败。"),
          isLoading: false,
          items: [],
        });
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadKnowledgeBases();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadKnowledgeBases]);

  const rows = useMemo(
    () => loadState.items.map(toKnowledgeRow),
    [loadState.items],
  );

  const stats = useMemo(() => getKnowledgeStats(rows), [rows]);

  return (
    <AdminPage
      actions={<CreateKnowledgeBaseDialog onCreated={loadKnowledgeBases} />}
      description="管理后台知识库来源、入库状态和失败重试。"
      eyebrow="Knowledge"
      title="知识库管理"
    >
      <StatGrid stats={stats} />
      <DataGrid
        aria-label="知识库列表"
        className="[&_.table__cell]:py-2 [&_.table__column]:text-xs"
        columns={getKnowledgeColumns(loadKnowledgeBases)}
        contentClassName="min-w-[980px]"
        data={rows}
        defaultSortDescriptor={{ column: "updatedAt", direction: "descending" }}
        getRowId={(item) => item.id}
        renderEmptyState={() => getKnowledgeEmptyState(loadState)}
      />
    </AdminPage>
  );
}
```

- [ ] **Step 5: Implement URL create modal**

Add `CreateKnowledgeBaseDialog` with `name`, `description`, `url`, `isCreating`, and `error` state. Submit calls:

```ts
await createKnowledgeBaseFromUrl({
  description: form.description.trim() || undefined,
  name: form.name.trim(),
  url: form.url.trim(),
});
```

Validate `name` and `url` before calling the API. On success, close the modal and call `onCreated()`.

- [ ] **Step 6: Implement retry button and mappers**

Add `RetryKnowledgeBaseButton`:

```tsx
function RetryKnowledgeBaseButton({
  id,
  onRetried,
}: {
  id: number;
  onRetried: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    setError(null);
    setIsRetrying(true);
    try {
      await retryKnowledgeBase(id);
      onRetried();
    } catch (error) {
      setError(getKnowledgeError(error, "重试知识库失败。"));
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button isDisabled={isRetrying} size="sm" variant="tertiary" onPress={handleRetry}>
        {isRetrying ? "重试中..." : "重试"}
      </Button>
      {error ? <span className="max-w-40 text-right text-xs text-danger">{error}</span> : null}
    </div>
  );
}
```

Add helpers: `toKnowledgeRow`, `getKnowledgeStats`, `formatDateTime`, `formatBytes`, `getStatusLabel`, `getStatusColor`, `getKnowledgeError`, and `getKnowledgeEmptyState`.

- [ ] **Step 7: Verify page type compilation**

Run:

```bash
pnpm exec tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 8: Commit knowledge page**

```bash
git add app/knowledge-bases/page.tsx components/admin-knowledge-page.tsx
git commit -m "feat: add knowledge base admin page"
```

## Task 3: Navigation and Existing Model Fields

**Files:**
- Modify: `components/admin-icons.tsx`
- Modify: `components/admin-shell.tsx`
- Modify: `components/model-dialog.tsx`
- Modify: `components/model-configuration-page.tsx`

- [ ] **Step 1: Add a knowledge icon alias**

In `components/admin-icons.tsx`, add `"knowledge"` to `AdminIconName` and map it to the existing `Database` icon:

```ts
export type AdminIconName =
  | "knowledge";

const ICONS: Record<AdminIconName, ComponentType<SVGProps<SVGSVGElement>>> = {
  knowledge: Database,
};
```

Keep the existing union members and map entries.

- [ ] **Step 2: Add nav item**

In `components/admin-shell.tsx`, add this item to `OPS_ITEMS` after conversations:

```ts
{
  href: "/knowledge-bases",
  icon: "knowledge",
  key: "knowledge-bases",
  label: "知识库",
},
```

- [ ] **Step 3: Add billing fields to model modal form**

In `components/model-dialog.tsx`, extend `ModelForm`, `EditableModelSummary`, `DEFAULT_MODEL_FORM`, `toCreateModelRequest`, and `toModelForm` with:

```ts
billingUnit: string;
unitPriceAmount: string;
```

Use defaults:

```ts
billingUnit: "token",
unitPriceAmount: "",
```

Add a `Select` for billing unit with `token` and `image`, and add a `PriceField` labelled `单价 / 次数单位` for `unitPriceAmount`.

- [ ] **Step 4: Add billing fields to model configuration form**

In `components/model-configuration-page.tsx`, add local state for:

```ts
const [billingUnit, setBillingUnit] = useState("token");
const [unitPriceAmount, setUnitPriceAmount] = useState("");
```

Reset them in `openCreateDialog`, hydrate them in `openEditDialog`, pass them through `buildModelRequest`, and include non-empty `unitPriceAmount` plus `billingUnit` in the API request.

- [ ] **Step 5: Verify types and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint .
```

Expected: both exit code 0.

- [ ] **Step 6: Commit navigation and model field updates**

```bash
git add components/admin-icons.tsx components/admin-shell.tsx components/model-dialog.tsx components/model-configuration-page.tsx
git commit -m "feat: expose knowledge navigation and billing fields"
```

## Task 4: Final Verification

**Files:**
- Read: `git status --short`

- [ ] **Step 1: Run final validation**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint .
```

Expected: both exit code 0.

- [ ] **Step 2: Confirm no stray files**

Run:

```bash
git status --short
```

Expected: either clean, or only files intentionally changed by the active task before its commit.

- [ ] **Step 3: Report skipped scope**

Final report must state:

```text
Skipped user/Agent knowledge binding UI because claw-core-admin has replace-only endpoints and no admin read endpoint for current bindings.
Skipped local file upload because this task uses create-url as the creation path.
```

## Self-Review

- Spec coverage: API helpers, knowledge page, navigation, old type updates, and validation are covered.
- Placeholder scan: no placeholder work remains; binding UI and upload are explicitly skipped scope.
- Type consistency: frontend names match `claw-core-admin` JSON fields: `knowledgeBaseId`, `knowledgeBaseIds`, `billingUnit`, `unitPriceAmount`, `usageType`, `billableQuantity`, `unitCostAmount`.
