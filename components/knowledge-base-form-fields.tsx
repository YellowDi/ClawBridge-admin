"use client";

import type { KnowledgeForm } from "@/components/knowledge-form-types";

import { Button, Input, Label, TextField } from "@heroui/react";

import { AdminIcon } from "@/components/admin-icons";

export function KnowledgeBaseFormFields({
  form,
  isBusy,
  onChange,
  onOpenUpload,
  uploadedFileName,
}: {
  form: KnowledgeForm;
  isBusy: boolean;
  onChange: (patch: Partial<KnowledgeForm>) => void;
  onOpenUpload: () => void;
  uploadedFileName: string | null;
}) {
  return (
    <>
      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isBusy}
        variant="secondary"
      >
        <Label>名称</Label>
        <Input
          fullWidth
          value={form.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </TextField>
      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isBusy}
        variant="secondary"
      >
        <Label>描述</Label>
        <Input
          fullWidth
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </TextField>
      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isBusy}
        variant="secondary"
      >
        <Label>URL</Label>
        <Input
          fullWidth
          type="url"
          value={form.url}
          onChange={(event) => onChange({ url: event.target.value })}
        />
      </TextField>
      <div className="flex min-w-0 flex-col gap-2">
        <Label>上传文件</Label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            isDisabled={isBusy}
            type="button"
            variant="secondary"
            onPress={onOpenUpload}
          >
            <AdminIcon className="size-4" name="upload" />
            打开上传
          </Button>
          {uploadedFileName ? (
            <span className="text-muted line-clamp-1 text-xs">
              已上传 {uploadedFileName}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
