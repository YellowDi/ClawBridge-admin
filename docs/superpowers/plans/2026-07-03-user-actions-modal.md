# User Actions Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Combine the user row edit, knowledge availability, authorization, and balance actions into one tabbed modal, with delete moved under an icon-only more action.

**Architecture:** Keep the user table as the owner of row actions. Reuse existing API calls and form bodies by moving the existing dialog bodies into one `UserSettingsDialog`. Keep delete as a separate confirmation dialog, triggered from a compact row action.

**Tech Stack:** Next.js App Router, React 19, TypeScript, HeroUI v3, HeroUI Pro DataGrid, Tailwind CSS v4.

---

### Task 1: Combine User Row Actions

**Files:**
- Modify: `components/create-user-dialog.tsx`
- Modify: `components/user-access-dialog.tsx`
- Modify: `components/knowledge-availability-dialog.tsx`
- Modify: `components/admin-primary-pages.tsx`
- Modify: `components/admin-icons.tsx`

- [ ] Add an icon key for the pure icon more button.
- [ ] Export reusable panel components for edit, knowledge availability, authorization, and balance.
- [ ] Create `UserSettingsDialog` with four tabs: `编辑`, `可用知识库`, `授权`, `余额`.
- [ ] Replace four row buttons with one `UserSettingsDialog`.
- [ ] Move `DeleteUserDialog` behind an icon-only more action.
- [ ] Run `pnpm exec tsc --noEmit`.
- [ ] Run `pnpm exec eslint .`.
