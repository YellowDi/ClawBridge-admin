"use client";

import type { ChangeEvent } from "react";
import type { PrivateSkill } from "@/lib/api";

import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { AdminPage } from "@/components/admin-page-kit";
import { ApiError, listPrivateSkills, uploadPrivateSkill } from "@/lib/api";

type SkillsLoadState = {
  error: string | null;
  isLoading: boolean;
  items: PrivateSkill[];
  page: number;
  pageSize: number;
  total: number;
};

const PAGE_SIZE = 12;
const SKILL_UPLOAD_ACCEPT = ".zip";
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("zh-CN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function AdminSkillsPage() {
  const isMountedRef = useRef(false);
  const requestRef = useRef(0);
  const [state, setState] = useState<SkillsLoadState>({
    error: null,
    isLoading: true,
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const { error, isLoading, items, page, pageSize, total } = state;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasNextPage = page < totalPages;

  const loadSkills = useCallback(async (nextPage: number) => {
    const requestId = requestRef.current + 1;

    requestRef.current = requestId;
    setState((current) => ({
      ...current,
      error: null,
      isLoading: true,
      page: nextPage,
    }));

    try {
      const response = await listPrivateSkills({
        page: nextPage,
        pageSize: PAGE_SIZE,
      });

      if (!isMountedRef.current || requestRef.current !== requestId) return;

      setState({
        error: null,
        isLoading: false,
        items: response.items ?? [],
        page: response.pagination?.page ?? nextPage,
        pageSize: response.pagination?.pageSize ?? PAGE_SIZE,
        total: response.pagination?.total ?? response.items?.length ?? 0,
      });
    } catch (error) {
      if (!isMountedRef.current || requestRef.current !== requestId) return;

      setState((current) => ({
        ...current,
        error: getSkillError(error, "私有 Skill 加载失败。"),
        isLoading: false,
        items: [],
      }));
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadSkills(1);

    return () => {
      isMountedRef.current = false;
    };
  }, [loadSkills]);

  const actions = useMemo(
    () => <UploadPrivateSkillDialog onUploaded={() => void loadSkills(1)} />,
    [loadSkills],
  );

  return (
    <AdminPage
      actions={actions}
      description="管理员上传的私有 Skill 归档库。"
      eyebrow="Skills"
      navbarCenter={<SkillsNavbarSegment activeKey="market" />}
      title="Skill 管理"
    >
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-foreground text-lg font-semibold">技能广场</h2>
            <p className="text-muted text-sm">
              当前只展示私有 Skill。搜索筛选等待后端开放字段后接入。
            </p>
          </div>
          <Button
            isDisabled={isLoading}
            size="sm"
            variant="secondary"
            onPress={() => void loadSkills(page)}
          >
            <AdminIcon className="size-4" name="refresh" />
            刷新
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <TextField fullWidth isDisabled value="" variant="secondary">
            <Label>搜索</Label>
            <Input
              disabled
              fullWidth
              placeholder="后端暂未开放筛选字段"
              value=""
              onChange={() => undefined}
            />
          </TextField>
          <div className="text-muted rounded-md border border-dashed border-default-300 px-3 py-2 text-xs">
            /private/list 当前仅支持 page、pageSize
          </div>
        </div>

        {error ? (
          <InlineError action={() => void loadSkills(page)}>
            {error}
          </InlineError>
        ) : null}

        {isLoading ? (
          <SkillGridSkeleton />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((skill) => (
              <PrivateSkillCard key={skill.id ?? rowKey(skill)} skill={skill} />
            ))}
          </div>
        ) : (
          <EmptyState
            description="上传 ZIP 归档后会出现在这里。"
            title="还没有私有 Skill"
          />
        )}

        <div className="flex flex-col gap-3 border-t border-default-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-muted text-sm">
            第 {page} / {totalPages} 页，共 {total} 条
          </span>
          <div className="flex items-center gap-2">
            <Button
              isDisabled={isLoading || page <= 1}
              size="sm"
              variant="secondary"
              onPress={() => void loadSkills(page - 1)}
            >
              上一页
            </Button>
            <Button
              isDisabled={isLoading || !hasNextPage}
              size="sm"
              variant="secondary"
              onPress={() => void loadSkills(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      </section>
    </AdminPage>
  );
}

export function SkillsAssignPage() {
  return (
    <AdminPage
      description="Skill 分配能力后续接入。"
      eyebrow="Skills"
      navbarCenter={<SkillsNavbarSegment activeKey="assign" />}
      title="Skill 管理"
    >
      <EmptyState
        description="分配页暂不接接口，后续再绑定 Agent 或用户授权。"
        title="分配功能待接入"
      />
    </AdminPage>
  );
}

function SkillsNavbarSegment({
  activeKey,
}: {
  activeKey: "assign" | "market";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const currentKey = pathname.startsWith("/skills/assign")
    ? "assign"
    : activeKey;

  return (
    <div
      aria-label="Skill 管理视图"
      className="bg-default-100 flex rounded-md p-1"
      role="tablist"
    >
      <Button
        aria-current={currentKey === "market" ? "page" : undefined}
        className="min-w-20"
        size="sm"
        variant={currentKey === "market" ? "secondary" : "tertiary"}
        onPress={() => router.push("/skills")}
      >
        技能广场
      </Button>
      <Button
        aria-current={currentKey === "assign" ? "page" : undefined}
        className="min-w-16"
        size="sm"
        variant={currentKey === "assign" ? "secondary" : "tertiary"}
        onPress={() => router.push("/skills/assign")}
      >
        分配
      </Button>
    </div>
  );
}

function PrivateSkillCard({ skill }: { skill: PrivateSkill }) {
  const title = skill.displayName || skill.slug || "未命名 Skill";
  const tags = skill.tags ?? [];

  return (
    <Card className="h-full">
      <Card.Header>
        <div className="flex w-full min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <Card.Title className="truncate text-base">{title}</Card.Title>
            <Card.Description className="truncate text-xs">
              {skill.slug || "无 slug"}
            </Card.Description>
          </div>
          <Chip className="shrink-0 whitespace-nowrap" size="sm" variant="soft">
            v{skill.version || "-"}
          </Chip>
        </div>
      </Card.Header>
      <Card.Content className="flex h-full flex-col gap-4">
        <p className="text-muted line-clamp-3 min-h-14 text-sm">
          {skill.description || "暂无说明"}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.length > 0 ? (
            tags.slice(0, 4).map((tag) => (
              <Chip key={tag} size="sm" variant="soft">
                {tag}
              </Chip>
            ))
          ) : (
            <span className="text-muted text-xs">无标签</span>
          )}
        </div>
        <dl className="mt-auto grid grid-cols-2 gap-3 text-xs">
          <SkillMeta label="存储" value={skill.storageType || "-"} />
          <SkillMeta label="大小" value={formatBytes(skill.sizeBytes)} />
          <SkillMeta label="更新时间" value={formatDate(skill.updatedAt)} />
          <SkillMeta label="ID" value={String(skill.id ?? "-")} />
        </dl>
      </Card.Content>
    </Card>
  );
}

function SkillMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

function UploadPrivateSkillDialog({ onUploaded }: { onUploaded: () => void }) {
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) reset();
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");

  function reset() {
    setError(null);
    setIsUploading(false);
    setSelectedFile(null);
    setVersion("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (file && !file.name.toLowerCase().endsWith(".zip")) {
      setError("仅支持 .zip 归档。");
      setSelectedFile(null);
      event.target.value = "";

      return;
    }

    setError(null);
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile || isUploading) return;

    setError(null);
    setIsUploading(true);

    try {
      await uploadPrivateSkill(selectedFile, version);
      toast.success("私有 Skill 已上传。");
      modal.close();
      onUploaded();
    } catch (error) {
      setError(getSkillError(error, "私有 Skill 上传失败。"));
      setIsUploading(false);
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">
          <AdminIcon className="size-4" name="upload" />
          上传 Skill
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isUploading}
        isKeyboardDismissDisabled={isUploading}
      >
        <Modal.Container placement="center" scroll="outside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>上传私有 Skill</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-4">
              <TextField
                fullWidth
                isDisabled={isUploading}
                value={version}
                variant="secondary"
                onChange={setVersion}
              >
                <Label>版本号（可选）</Label>
                <Input
                  fullWidth
                  placeholder="留空使用归档默认版本"
                  value={version}
                  onChange={(event) => setVersion(event.target.value)}
                />
              </TextField>
              <label className="flex cursor-pointer flex-col gap-3 rounded-md border border-dashed border-default-300 bg-content1 p-5 text-center">
                <AdminIcon
                  className="text-muted mx-auto size-8"
                  name="upload"
                />
                <span className="text-sm font-medium">选择 ZIP 归档</span>
                <span className="text-muted text-xs">
                  {selectedFile
                    ? `${selectedFile.name} · ${formatBytes(selectedFile.size)}`
                    : "后台会校验并保存到本地或 COS 私有库"}
                </span>
                <input
                  accept={SKILL_UPLOAD_ACCEPT}
                  className="sr-only"
                  disabled={isUploading}
                  type="file"
                  onChange={handleFileChange}
                />
              </label>
              {error ? <InlineError>{error}</InlineError> : null}
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
                {isUploading ? "上传中..." : "上传"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function SkillGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <Card.Content className="flex flex-col gap-4 p-5">
            <div className="bg-default-200 h-5 w-2/3 animate-pulse rounded" />
            <div className="bg-default-100 h-14 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-default-200 h-6 w-16 animate-pulse rounded" />
              <div className="bg-default-200 h-6 w-20 animate-pulse rounded" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-default-300 px-6 py-12 text-center">
      <AdminIcon className="text-muted size-9" name="skill" />
      <h2 className="text-foreground mt-4 text-base font-semibold">{title}</h2>
      <p className="text-muted mt-2 max-w-md text-sm">{description}</p>
    </div>
  );
}

function InlineError({
  action,
  children,
}: {
  action?: () => void;
  children: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{children}</span>
      {action ? (
        <Button size="sm" variant="danger-soft" onPress={action}>
          重试
        </Button>
      ) : null}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return DATE_TIME_FORMATTER.format(date);
}

function formatBytes(value?: number) {
  if (!value || value <= 0) return "-";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function rowKey(skill: PrivateSkill) {
  return `${skill.slug ?? "skill"}:${skill.version ?? "unknown"}`;
}

function getSkillError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
