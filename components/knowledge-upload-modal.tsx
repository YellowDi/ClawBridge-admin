"use client";

import type { ComponentProps } from "react";

import { DropZone } from "@heroui-pro/react";
import { Button, Modal } from "@heroui/react";

import { AdminIcon } from "@/components/admin-icons";
import { KnowledgeFormError } from "@/components/knowledge-form-error";

type KnowledgeUploadModalState = NonNullable<
  ComponentProps<typeof Modal>["state"]
>;

export function KnowledgeUploadModal({
  acceptText,
  isUploading,
  onClearSelectedFile,
  onFileSelect,
  onUpload,
  selectedFile,
  state,
  uploadError,
  uploadProgress,
}: {
  acceptText: string;
  isUploading: boolean;
  onClearSelectedFile: () => void;
  onFileSelect: (files: FileList) => void;
  onUpload: () => void;
  selectedFile: File | null;
  state: KnowledgeUploadModalState;
  uploadError: string | null;
  uploadProgress: number;
}) {
  return (
    <Modal state={state}>
      <Modal.Backdrop
        isDismissable={!isUploading}
        isKeyboardDismissDisabled={isUploading}
      >
        <Modal.Container placement="center" scroll="outside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>上传资料文件</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
              <DropZone className="min-w-0">
                <DropZone.Area className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-default-300 bg-content1/60 p-5 text-center transition-colors hover:bg-default-50">
                  <DropZone.Icon>
                    <AdminIcon className="text-muted size-8" name="upload" />
                  </DropZone.Icon>
                  <DropZone.Label>选择或拖放资料文件</DropZone.Label>
                  <DropZone.Description>支持 {acceptText}</DropZone.Description>
                  <DropZone.Trigger
                    className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                    isDisabled={isUploading}
                  >
                    选择文件
                  </DropZone.Trigger>
                </DropZone.Area>
                <DropZone.Input
                  accept={acceptText}
                  multiple={false}
                  onSelect={onFileSelect}
                />
                {selectedFile ? (
                  <DropZone.FileList>
                    <DropZone.FileItem
                      status={
                        isUploading
                          ? "uploading"
                          : uploadError
                            ? "failed"
                            : undefined
                      }
                    >
                      <DropZone.FileFormatIcon
                        color="blue"
                        format={getFileFormatLabel(
                          selectedFile.name,
                          acceptText,
                        )}
                      />
                      <DropZone.FileInfo>
                        <DropZone.FileName>
                          {selectedFile.name}
                        </DropZone.FileName>
                        <DropZone.FileMeta>
                          {isUploading
                            ? `上传中 ${uploadProgress}%`
                            : formatBytes(selectedFile.size)}
                        </DropZone.FileMeta>
                        {isUploading ? (
                          <DropZone.FileProgress
                            aria-label="上传进度"
                            value={uploadProgress}
                          >
                            <DropZone.FileProgressTrack>
                              <DropZone.FileProgressFill />
                            </DropZone.FileProgressTrack>
                          </DropZone.FileProgress>
                        ) : null}
                      </DropZone.FileInfo>
                      <DropZone.FileRemoveTrigger
                        aria-label="移除已选文件"
                        isDisabled={isUploading}
                        onPress={onClearSelectedFile}
                      />
                    </DropZone.FileItem>
                  </DropZone.FileList>
                ) : null}
              </DropZone>

              {uploadError ? (
                <KnowledgeFormError>{uploadError}</KnowledgeFormError>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isUploading}
                type="button"
                variant="tertiary"
                onPress={state.close}
              >
                取消
              </Button>
              <Button
                isDisabled={!selectedFile || isUploading}
                type="button"
                onPress={onUpload}
              >
                {isUploading ? "上传中..." : "上传并填入 URL"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function getFileFormatLabel(fileName: string, acceptText: string) {
  const normalizedFileName = fileName.trim().toLowerCase();
  const extension = acceptText
    .split(",")
    .find((item) => normalizedFileName.endsWith(item));

  return extension ? extension.slice(1).toUpperCase() : "FILE";
}

function formatBytes(value?: number) {
  if (value == null) return "-";
  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
