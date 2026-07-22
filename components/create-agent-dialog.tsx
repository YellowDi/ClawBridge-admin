"use client";

import type { FormEvent } from "react";
import type { AgentForm } from "@/components/agent-form-types";
import type { AgentDialogProps } from "@/components/agent-dialog-types";
import type { Agent } from "@/lib/api";

import { Button, Modal, toast, useOverlayState } from "@heroui/react";
import { useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AgentFormError } from "@/components/agent-form-error";
import { AgentFormFields } from "@/components/agent-form-fields";
import { DEFAULT_AGENT_FORM } from "@/components/agent-form-types";
import {
  EMPTY_MODEL_OPTIONS,
  EMPTY_SANDBOX_OPTIONS,
} from "@/components/agent-dialog-types";
import {
  getAgentActionError,
  toCreateAgentRequest,
} from "@/components/agent-dialog-utils";
import { createAgent } from "@/lib/api";

type CreateAgentState = {
  error: string | null;
  form: AgentForm;
  isCreating: boolean;
};

export function CreateAgentDialog({
  modelOptions = EMPTY_MODEL_OPTIONS,
  sandboxOptions = EMPTY_SANDBOX_OPTIONS,
  onCreated,
}: AgentDialogProps & { onCreated: (agent?: Agent) => void }) {
  const [state, setState] = useState<CreateAgentState>({
    error: null,
    form: DEFAULT_AGENT_FORM,
    isCreating: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: DEFAULT_AGENT_FORM,
        isCreating: false,
      });
    },
  });
  const { error, form, isCreating } = state;

  function closeDialog() {
    if (isCreating) return;

    modal.close();
  }

  function updateForm(patch: Partial<AgentForm>) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        ...patch,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const request = toCreateAgentRequest(form);

    if (!request.agentId) {
      const message = "请输入 Agent ID。";

      setState((current) => ({
        ...current,
        error: message,
      }));
      toast.danger(message);

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isCreating: true,
    }));

    try {
      const agent = await createAgent(request);

      modal.close();
      setState({
        error: null,
        form: DEFAULT_AGENT_FORM,
        isCreating: false,
      });
      onCreated(agent);
      toast.success("Agent 已创建。");
    } catch (error) {
      const message = getAgentActionError(error, "创建 Agent 失败。");

      setState((current) => ({
        ...current,
        error: message,
        isCreating: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">
          <AdminIcon className="size-4" name="plus" />
          新建 Agent
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isCreating}
        isKeyboardDismissDisabled={isCreating}
      >
        <Modal.Container placement="center" scroll="outside" size="lg">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>新建 Agent</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                <AgentFormFields
                  form={form}
                  isDisabled={isCreating}
                  modelOptions={modelOptions}
                  sandboxOptions={sandboxOptions}
                  onChange={updateForm}
                />

                {error ? <AgentFormError>{error}</AgentFormError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isCreating}
                  type="button"
                  variant="tertiary"
                  onPress={closeDialog}
                >
                  取消
                </Button>
                <Button isDisabled={isCreating} type="submit">
                  {isCreating ? "创建中..." : "创建 Agent"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
