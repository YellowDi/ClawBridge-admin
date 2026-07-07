"use client";

import type { KnowledgeBase } from "@/lib/api";

import {
  Button,
  Checkbox,
  Description,
  Modal,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import {
  listKnowledgeBases,
  replaceAgentKnowledgeBases,
  replaceUserKnowledgeBases,
} from "@/lib/api";

type SubjectType = "agent" | "user";
const EMPTY_KNOWLEDGE_BASE_IDS: number[] = [];

type KnowledgeAvailabilityState = {
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  items: KnowledgeBase[];
  selectedIds: number[];
};

export function KnowledgeAvailabilityDialog({
  onSaved,
  selectedKnowledgeBaseIds = EMPTY_KNOWLEDGE_BASE_IDS,
  subjectId,
  subjectLabel,
  subjectType,
}: {
  onSaved?: () => void;
  selectedKnowledgeBaseIds?: number[];
  subjectId: number;
  subjectLabel: string;
  subjectType: SubjectType;
}) {
  const modal = useOverlayState();

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          可用知识库
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="inside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>可用知识库</Modal.Heading>
              <p className="text-muted text-sm">{subjectLabel}</p>
            </Modal.Header>
            <KnowledgeAvailabilityPanel
              isActive={modal.isOpen}
              selectedKnowledgeBaseIds={selectedKnowledgeBaseIds}
              subjectId={subjectId}
              subjectType={subjectType}
              onClose={() => modal.close()}
              onSaved={onSaved}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function KnowledgeAvailabilityPanel({
  isActive,
  onClose,
  onSaved,
  selectedKnowledgeBaseIds = EMPTY_KNOWLEDGE_BASE_IDS,
  subjectId,
  subjectType,
}: {
  isActive: boolean;
  onClose: () => void;
  onSaved?: () => void;
  selectedKnowledgeBaseIds?: number[];
  subjectId: number;
  subjectType: SubjectType;
}) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<KnowledgeAvailabilityState>({
    error: null,
    isLoading: false,
    isSaving: false,
    items: [],
    selectedIds: [],
  });
  const isBusy = state.isLoading || state.isSaving;

  useEffect(() => {
    if (!isActive) {
      loadRequestRef.current += 1;

      return;
    }

    void loadKnowledgeBases();

    return () => {
      loadRequestRef.current += 1;
    };
  }, [isActive, selectedKnowledgeBaseIds, subjectId, subjectType]);

  async function loadKnowledgeBases() {
    const requestId = loadRequestRef.current + 1;
    const selectedIds = normalizeIds(selectedKnowledgeBaseIds);

    loadRequestRef.current = requestId;
    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
      selectedIds,
    }));

    try {
      const items = await listKnowledgeBases();

      if (loadRequestRef.current !== requestId) return;

      setState({
        error: null,
        isLoading: false,
        isSaving: false,
        items,
        selectedIds,
      });
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;

      const message = getKnowledgeAvailabilityError(error, "知识库加载失败。");

      setState((current) => ({
        ...current,
        error: message,
        isLoading: false,
        isSaving: false,
      }));
      toast.danger(message);
    }
  }

  async function saveAvailability() {
    if (
      state.selectedIds.length === 0 &&
      !window.confirm("未选择任何知识库，保存后将没有可用知识库。继续保存？")
    ) {
      return;
    }

    setState((current) => ({ ...current, error: null, isSaving: true }));

    try {
      if (subjectType === "agent") {
        await replaceAgentKnowledgeBases({
          agentId: subjectId,
          knowledgeBaseIds: state.selectedIds,
        });
      } else {
        await replaceUserKnowledgeBases({
          knowledgeBaseIds: state.selectedIds,
          userId: subjectId,
        });
      }

      setState((current) => ({ ...current, isSaving: false }));
      onClose();
      onSaved?.();
      toast.success("可用知识库已保存。");
    } catch (error) {
      const message = getKnowledgeAvailabilityError(
        error,
        "可用知识库保存失败。",
      );

      setState((current) => ({
        ...current,
        error: message,
        isSaving: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <>
      <Modal.Body className="flex min-w-0 flex-col gap-4">
        <p className="text-muted text-sm">
          请选择本次生效的完整可用知识库列表。
        </p>
        {state.isLoading ? (
          <div className="text-muted text-sm">正在加载知识库...</div>
        ) : null}
        {state.error ? (
          <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </div>
        ) : null}
        <div className="max-h-72 overflow-auto pr-1">
          {state.items.length === 0 && !state.isLoading ? (
            <span className="text-muted text-sm">暂无知识库。</span>
          ) : null}
          <div className="grid gap-2">
            {state.items.map((item) => {
              const itemId = item.id;

              if (itemId == null) return null;

              return (
                <Checkbox
                  key={itemId}
                  isSelected={state.selectedIds.includes(itemId)}
                  onChange={(selected) =>
                    setState((current) => ({
                      ...current,
                      selectedIds: toggleId(
                        current.selectedIds,
                        itemId,
                        selected,
                      ),
                    }))
                  }
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <span className="truncate">{getKnowledgeLabel(item)}</span>
                  </Checkbox.Content>
                  <Description>{getKnowledgeDescription(item)}</Description>
                </Checkbox>
              );
            })}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button isDisabled={isBusy} variant="tertiary" onPress={onClose}>
          关闭
        </Button>
        <Button isDisabled={isBusy} onPress={saveAvailability}>
          {state.isSaving ? "保存中..." : "保存可用知识库"}
        </Button>
      </Modal.Footer>
    </>
  );
}

function normalizeIds(ids: number[]) {
  return Array.from(new Set(ids.filter((id) => Number.isFinite(id))));
}

function toggleId(ids: number[], id: number, selected: boolean) {
  if (selected) return ids.includes(id) ? ids : [...ids, id];

  return ids.filter((item) => item !== id);
}

function getKnowledgeLabel(item: KnowledgeBase) {
  return item.name?.trim() || item.filename?.trim() || `知识库 ${item.id}`;
}

function getKnowledgeDescription(item: KnowledgeBase) {
  return [item.status, item.storageType, item.path]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" / ");
}

function getKnowledgeAvailabilityError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
