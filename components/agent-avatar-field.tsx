"use client";

import { useState } from "react";
import {
  Avatar,
  Button,
  Input,
  Label,
  Modal,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";

import { AdminIcon } from "@/components/admin-icons";
import { AgentFormError } from "@/components/agent-form-error";
import { uploadAgentAvatarToCos } from "@/lib/tencent-cos-upload";

const AVATAR_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif";
const AVATAR_EXTENSIONS = AVATAR_ACCEPT.split(",");

type AgentAvatarUploadState = {
  error: string | null;
  isUploading: boolean;
  progress: number;
  selectedFile: File | null;
};

export function AgentAvatarField({
  agentId,
  displayName,
  isDisabled,
  onChange,
  value,
}: {
  agentId: string;
  displayName: string;
  isDisabled: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const [state, setState] = useState<AgentAvatarUploadState>({
    error: null,
    isUploading: false,
    progress: 0,
    selectedFile: null,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        isUploading: false,
        progress: 0,
        selectedFile: null,
      });
    },
  });
  const { error, isUploading, progress, selectedFile } = state;
  const fallback = getAgentInitials(displayName || agentId);

  function handleFileSelect(fileList: FileList | null) {
    const file = fileList?.[0] ?? null;

    if (file && !isAllowedAvatarFile(file)) {
      const message = `仅支持 ${AVATAR_ACCEPT} 格式。`;

      setState({
        error: message,
        isUploading: false,
        progress: 0,
        selectedFile: null,
      });
      toast.danger(message);

      return;
    }

    setState({
      error: null,
      isUploading: false,
      progress: 0,
      selectedFile: file,
    });
  }

  async function handleUpload() {
    if (!selectedFile || isUploading) return;

    setState((current) => ({
      ...current,
      error: null,
      isUploading: true,
      progress: 0,
    }));

    try {
      const result = await uploadAgentAvatarToCos(
        selectedFile,
        (nextProgress) => {
          setState((current) => ({
            ...current,
            progress: nextProgress,
          }));
        },
      );

      onChange(result.url);
      setState({
        error: null,
        isUploading: false,
        progress: 100,
        selectedFile: null,
      });
      modal.close();
      toast.success("Agent 头像已上传。");
    } catch (uploadError) {
      const message = getUploadError(uploadError);

      setState((current) => ({
        ...current,
        error: message,
        isUploading: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <>
      <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
        <Label>头像</Label>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
          <Avatar className="size-12 shrink-0">
            {value.trim() ? (
              <Avatar.Image
                alt={displayName || agentId || "Agent 头像"}
                src={value.trim()}
              />
            ) : null}
            <Avatar.Fallback>{fallback}</Avatar.Fallback>
          </Avatar>
          <TextField
            fullWidth
            className="min-w-0 flex-1"
            isDisabled={isDisabled}
            variant="secondary"
          >
            <Input
              fullWidth
              aria-label="头像 URL"
              placeholder="https://..."
              value={value}
              onChange={(event) => onChange(event.target.value)}
            />
          </TextField>
          <Button
            className="shrink-0"
            isDisabled={isDisabled}
            type="button"
            variant="secondary"
            onPress={modal.open}
          >
            <AdminIcon className="size-4" name="upload" />
            上传头像
          </Button>
        </div>
      </div>

      <Modal state={modal}>
        <Modal.Backdrop
          isDismissable={!isUploading}
          isKeyboardDismissDisabled={isUploading}
        >
          <Modal.Container placement="center" scroll="outside" size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>上传 Agent 头像</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed border-default-300 bg-content1/60 p-5 text-center transition-colors hover:bg-default-50">
                  <AdminIcon className="text-muted size-8" name="upload" />
                  <span className="text-sm font-medium">选择头像图片</span>
                  <span className="text-muted text-xs">
                    支持 {AVATAR_ACCEPT}
                  </span>
                  <input
                    accept={AVATAR_ACCEPT}
                    className="sr-only"
                    disabled={isUploading}
                    type="file"
                    onChange={(event) => handleFileSelect(event.target.files)}
                  />
                </label>

                {selectedFile ? (
                  <div className="rounded-md border border-default-200 bg-content1 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{selectedFile.name}</span>
                      <span className="text-muted shrink-0">
                        {isUploading
                          ? `${progress}%`
                          : formatBytes(selectedFile.size)}
                      </span>
                    </div>
                    {isUploading ? (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-default-200">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {error ? <AgentFormError>{error}</AgentFormError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isUploading}
                  type="button"
                  variant="tertiary"
                  onPress={modal.close}
                >
                  取消
                </Button>
                <Button
                  isDisabled={!selectedFile || isUploading}
                  type="button"
                  onPress={() => void handleUpload()}
                >
                  {isUploading ? "上传中..." : "上传并填入 URL"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

function isAllowedAvatarFile(file: File) {
  const name = file.name.trim().toLowerCase();

  return AVATAR_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function getAgentInitials(value: string) {
  const normalized = value.trim();

  if (!normalized) return "A";

  return normalized.slice(0, 2).toUpperCase();
}

function formatBytes(value: number) {
  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getUploadError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return "头像上传失败。";
}
