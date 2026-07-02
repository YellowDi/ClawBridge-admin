"use client";

import type { FormEvent } from "react";
import type { KnowledgeForm } from "@/components/knowledge-form-types";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { KnowledgeBaseFormFields } from "@/components/knowledge-base-form-fields";
import { KnowledgeFormError } from "@/components/knowledge-form-error";
import { DEFAULT_KNOWLEDGE_FORM } from "@/components/knowledge-form-types";
import { KnowledgeUploadModal } from "@/components/knowledge-upload-modal";
import { createKnowledgeBaseFromUrl } from "@/lib/api";
import { uploadKnowledgeFileToCos } from "@/lib/tencent-cos-upload";

type CreateKnowledgeState = {
  error: string | null;
  form: KnowledgeForm;
  isCreating: boolean;
  isUploading: boolean;
  selectedFile: File | null;
  uploadError: string | null;
  uploadedFileName: string | null;
  uploadProgress: number;
};

const KNOWLEDGE_UPLOAD_ACCEPT = {
  ".txt": {},
  ".md": {},
  ".markdown": {},
  ".csv": {},
  ".xlsx": {},
  ".xls": {},
  ".docx": {},
  ".doc": {},
  ".pdf": {},
} as const;
const KNOWLEDGE_UPLOAD_ACCEPT_TEXT = Object.keys(KNOWLEDGE_UPLOAD_ACCEPT).join(
  ",",
);

export function CreateKnowledgeBaseDialog({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [state, setState] = useState<CreateKnowledgeState>({
    error: null,
    form: DEFAULT_KNOWLEDGE_FORM,
    isCreating: false,
    isUploading: false,
    selectedFile: null,
    uploadError: null,
    uploadedFileName: null,
    uploadProgress: 0,
  });
  const uploadModal = useOverlayState({});
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      resetDialogState();
    },
  });
  const {
    error,
    form,
    isCreating,
    isUploading,
    selectedFile,
    uploadError,
    uploadedFileName,
    uploadProgress,
  } = state;
  const isBusy = isCreating || isUploading;

  function closeDialog() {
    if (isBusy) return;

    modal.close();
  }

  function resetDialogState() {
    setState({
      error: null,
      form: DEFAULT_KNOWLEDGE_FORM,
      isCreating: false,
      isUploading: false,
      selectedFile: null,
      uploadError: null,
      uploadedFileName: null,
      uploadProgress: 0,
    });
  }

  function openUploadDialog() {
    if (isBusy) return;

    setState((current) => ({
      ...current,
      selectedFile: null,
      uploadError: null,
      uploadProgress: 0,
    }));
    uploadModal.open();
  }

  function updateForm(patch: Partial<KnowledgeForm>) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        ...patch,
      },
    }));
  }

  function handleFileSelect(files: FileList) {
    const file = files[0] ?? null;

    if (file && !isAllowedKnowledgeFile(file)) {
      setState((current) => ({
        ...current,
        selectedFile: null,
        uploadError: `仅支持 ${KNOWLEDGE_UPLOAD_ACCEPT_TEXT} 格式。`,
        uploadProgress: 0,
      }));

      return;
    }

    setState((current) => ({
      ...current,
      selectedFile: file,
      uploadError: null,
      uploadedFileName: null,
      uploadProgress: 0,
    }));
  }

  function clearSelectedFile() {
    if (isUploading) return;

    setState((current) => ({
      ...current,
      selectedFile: null,
      uploadError: null,
      uploadProgress: 0,
    }));
  }

  async function handleUpload() {
    if (!selectedFile || isBusy) return;

    setState((current) => ({
      ...current,
      isUploading: true,
      uploadError: null,
      uploadProgress: 0,
    }));

    try {
      const result = await uploadKnowledgeFileToCos(selectedFile, (percent) => {
        setState((current) => ({
          ...current,
          uploadProgress: percent,
        }));
      });

      setState((current) => ({
        ...current,
        form: {
          ...current.form,
          url: result.url,
        },
        isUploading: false,
        uploadedFileName: selectedFile.name,
        uploadProgress: 100,
      }));
      uploadModal.close();
    } catch (error) {
      setState((current) => ({
        ...current,
        isUploading: false,
        uploadError: getKnowledgeError(error, "文件上传失败。"),
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) return;

    const request = {
      description: form.description.trim() || undefined,
      name: form.name.trim(),
      url: form.url.trim(),
    };

    if (!request.name || !request.url) {
      setState((current) => ({
        ...current,
        error: "请输入名称和 URL。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isCreating: true,
    }));

    try {
      await createKnowledgeBaseFromUrl(request);
      modal.close();
      resetDialogState();
      onCreated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getKnowledgeError(error, "知识库创建失败。"),
        isCreating: false,
      }));
    }
  }

  return (
    <>
      <Modal state={modal}>
        <Modal.Trigger>
          <Button size="sm">
            <AdminIcon className="size-4" name="plus" />
            新增知识库
          </Button>
        </Modal.Trigger>
        <Modal.Backdrop
          isDismissable={!isBusy}
          isKeyboardDismissDisabled={isBusy}
        >
          <Modal.Container placement="center" scroll="outside" size="lg">
            <Modal.Dialog>
              <form className="min-w-0" onSubmit={handleSubmit}>
                <Modal.Header>
                  <Modal.Heading>新增 URL 知识库</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                  <KnowledgeBaseFormFields
                    form={form}
                    isBusy={isBusy}
                    uploadedFileName={uploadedFileName}
                    onChange={updateForm}
                    onOpenUpload={openUploadDialog}
                  />

                  {error ? (
                    <KnowledgeFormError>{error}</KnowledgeFormError>
                  ) : null}
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
                  <Button isDisabled={isBusy} type="submit">
                    {isCreating ? "创建中..." : "创建知识库"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <KnowledgeUploadModal
        acceptText={KNOWLEDGE_UPLOAD_ACCEPT_TEXT}
        isUploading={isUploading}
        selectedFile={selectedFile}
        state={uploadModal}
        uploadError={uploadError}
        uploadProgress={uploadProgress}
        onClearSelectedFile={clearSelectedFile}
        onFileSelect={handleFileSelect}
        onUpload={() => void handleUpload()}
      />
    </>
  );
}

function isAllowedKnowledgeFile(file: File) {
  const fileName = file.name.trim().toLowerCase();

  return Object.keys(KNOWLEDGE_UPLOAD_ACCEPT).some((extension) =>
    fileName.endsWith(extension),
  );
}

function getKnowledgeError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
