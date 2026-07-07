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
import { DropZone } from "@heroui-pro/react";

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

  function clearSelectedFile() {
    if (isUploading) return;

    setState({
      error: null,
      isUploading: false,
      progress: 0,
      selectedFile: null,
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
                <DropZone className="min-w-0">
                  <DropZone.Area className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-default-300 bg-content1/60 p-5 text-center transition-colors hover:bg-default-50">
                    <DropZone.Icon>
                      <AdminIcon className="text-muted size-8" name="upload" />
                    </DropZone.Icon>
                    <DropZone.Label>选择或拖放头像图片</DropZone.Label>
                    <DropZone.Description>
                      支持 {AVATAR_ACCEPT}
                    </DropZone.Description>
                    <DropZone.Trigger
                      className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                      isDisabled={isUploading}
                    >
                      选择图片
                    </DropZone.Trigger>
                  </DropZone.Area>
                  <DropZone.Input
                    accept={AVATAR_ACCEPT}
                    multiple={false}
                    onSelect={handleFileSelect}
                  />

                  {selectedFile ? (
                    <DropZone.FileList>
                      <DropZone.FileItem
                        status={isUploading ? "uploading" : undefined}
                      >
                        <DropZone.FileFormatIcon
                          color="green"
                          format={getFileFormatLabel(selectedFile.name)}
                        />
                        <DropZone.FileInfo>
                          <DropZone.FileName>
                            {selectedFile.name}
                          </DropZone.FileName>
                          <DropZone.FileMeta>
                            {isUploading
                              ? `上传中 ${progress}%`
                              : formatBytes(selectedFile.size)}
                          </DropZone.FileMeta>
                          {isUploading ? (
                            <DropZone.FileProgress
                              aria-label="上传进度"
                              value={progress}
                            >
                              <DropZone.FileProgressTrack>
                                <DropZone.FileProgressFill />
                              </DropZone.FileProgressTrack>
                            </DropZone.FileProgress>
                          ) : null}
                        </DropZone.FileInfo>
                        <DropZone.FileRemoveTrigger
                          aria-label="移除已选头像"
                          isDisabled={isUploading}
                          onPress={clearSelectedFile}
                        />
                      </DropZone.FileItem>
                    </DropZone.FileList>
                  ) : null}
                </DropZone>

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

function getFileFormatLabel(fileName: string) {
  const extension = fileName.trim().toLowerCase().split(".").pop();

  return extension ? extension.toUpperCase() : "FILE";
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
