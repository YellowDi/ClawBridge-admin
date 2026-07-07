"use client";

import type { EditableAgentSummary } from "@/components/agent-dialog-types";

import { Button, Modal, toast, useOverlayState } from "@heroui/react";
import { useEffect, useState } from "react";

import { AgentFormError } from "@/components/agent-form-error";
import {
  getAgentActionError,
  getAgentLabel,
} from "@/components/agent-dialog-utils";
import { deleteAgent } from "@/lib/api";

type DeleteAgentState = {
  error: string | null;
  isDeleting: boolean;
};
type DeleteAgentDialogState = ReturnType<typeof useOverlayState>;

export function DeleteAgentDialog({
  agent,
  hideTrigger = false,
  onDeleted,
  state: controlledModal,
}: {
  agent: EditableAgentSummary;
  hideTrigger?: boolean;
  onDeleted: () => void;
  state?: DeleteAgentDialogState;
}) {
  const [state, setState] = useState<DeleteAgentState>({
    error: null,
    isDeleting: false,
  });
  const internalModal = useOverlayState();
  const modal = controlledModal ?? internalModal;
  const { error, isDeleting } = state;
  const agentName = getAgentLabel(agent);

  useEffect(() => {
    if (!modal.isOpen) return;

    setState({
      error: null,
      isDeleting: false,
    });
  }, [modal.isOpen]);

  function closeDialog() {
    if (isDeleting) return;

    modal.close();
  }

  async function handleDelete() {
    setState({
      error: null,
      isDeleting: true,
    });

    try {
      await deleteAgent(agent.id);
      modal.close();
      setState({
        error: null,
        isDeleting: false,
      });
      onDeleted();
      toast.success("Agent 已删除。");
    } catch (error) {
      const message = getAgentActionError(error, "删除 Agent 失败。");

      setState({
        error: message,
        isDeleting: false,
      });
      toast.danger(message);
    }
  }

  return (
    <Modal state={modal}>
      {hideTrigger ? null : (
        <Modal.Trigger>
          <Button size="sm" variant="danger-soft">
            删除
          </Button>
        </Modal.Trigger>
      )}
      <Modal.Backdrop
        isDismissable={!isDeleting}
        isKeyboardDismissDisabled={isDeleting}
      >
        <Modal.Container placement="center" scroll="outside" size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>删除 Agent</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-3">
              <p className="text-muted text-sm">
                {"确认删除 Agent「"}
                <span className="break-all">{agentName}</span>
                {
                  "」？删除后 admin 后台会隐藏该 Agent，并会尝试彻底删除 dev 和已分发 OpenClaw 实例上的 Agent 配置与工作区。"
                }
              </p>
              {error ? <AgentFormError>{error}</AgentFormError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="tertiary"
                onPress={closeDialog}
              >
                取消
              </Button>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="danger"
                onPress={handleDelete}
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
