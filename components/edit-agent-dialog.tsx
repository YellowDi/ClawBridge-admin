"use client";

import type { FormEvent } from "react";
import type { AgentForm } from "@/components/agent-form-types";
import type {
  AgentDialogProps,
  EditableAgentSummary,
} from "@/components/agent-dialog-types";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { useRef, useState } from "react";

import { AgentFormError } from "@/components/agent-form-error";
import { AgentFormFields } from "@/components/agent-form-fields";
import { EMPTY_MODEL_OPTIONS } from "@/components/agent-dialog-types";
import {
  getAgentActionError,
  toAgentForm,
  toLoadedAgentForm,
  toUpdateAgentRequest,
} from "@/components/agent-dialog-utils";
import { getAgentDetail, updateAgent } from "@/lib/api";

type EditAgentState = {
  error: string | null;
  form: AgentForm;
  isLoading: boolean;
  isSaving: boolean;
  loadedAgentId: number | null;
};

export function EditAgentDialog({
  agent,
  modelOptions = EMPTY_MODEL_OPTIONS,
  onUpdated,
}: {
  agent: EditableAgentSummary;
  onUpdated: () => void;
} & AgentDialogProps) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<EditAgentState>({
    error: null,
    form: toAgentForm(agent),
    isLoading: false,
    isSaving: false,
    loadedAgentId: null,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) {
        loadRequestRef.current += 1;

        return;
      }

      loadAgent();
    },
  });
  const { error, form, isLoading, isSaving, loadedAgentId } = state;
  const isBusy = isLoading || isSaving;

  function loadAgent() {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState({
      error: null,
      form: toAgentForm(agent),
      isLoading: true,
      isSaving: false,
      loadedAgentId: null,
    });

    void getAgentDetail(agent.id)
      .then((detail) => {
        if (loadRequestRef.current !== requestId) return;

        setState({
          error: null,
          form: toLoadedAgentForm(agent, detail),
          isLoading: false,
          isSaving: false,
          loadedAgentId: agent.id,
        });
      })
      .catch((error: unknown) => {
        if (loadRequestRef.current !== requestId) return;

        setState((current) => ({
          ...current,
          error: getAgentActionError(error, "Agent 详情加载失败。"),
          isLoading: false,
          loadedAgentId: null,
        }));
      });
  }

  function closeDialog() {
    if (isBusy) return;

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

    if (isLoading || loadedAgentId == null) return;

    const request = toUpdateAgentRequest(form, loadedAgentId);

    if (!request.agentId) {
      setState((current) => ({
        ...current,
        error: "请输入 Agent ID。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
    }));

    try {
      await updateAgent(request);
      modal.close();
      setState({
        error: null,
        form,
        isLoading: false,
        isSaving: false,
        loadedAgentId: null,
      });
      onUpdated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getAgentActionError(error, "更新 Agent 失败。"),
        isSaving: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">编辑配置</Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isBusy}
        isKeyboardDismissDisabled={isBusy}
      >
        <Modal.Container placement="center" scroll="outside" size="lg">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>编辑 Agent</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                {isLoading ? (
                  <div className="text-muted text-sm">
                    正在加载 Agent 详情...
                  </div>
                ) : null}
                <AgentFormFields
                  form={form}
                  isDisabled={isBusy || loadedAgentId == null}
                  modelOptions={modelOptions}
                  onChange={updateForm}
                />
                {error ? <AgentFormError>{error}</AgentFormError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isBusy}
                  type="button"
                  variant="tertiary"
                  onPress={closeDialog}
                >
                  取消
                </Button>
                <Button
                  isDisabled={isBusy || loadedAgentId == null}
                  type="submit"
                >
                  {isSaving ? "保存中..." : "保存修改"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
