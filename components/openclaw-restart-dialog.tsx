"use client";

import type {
  OpenClawInstanceDetail,
  OpenClawInstanceSummary,
} from "@/lib/api";

import { Button, Modal, Tooltip, toast } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import {
  ApiError,
  controlOpenClawInstance,
  getOpenClawInstanceDetail,
} from "@/lib/api";
import {
  getRestartDisabledReason,
  hasInstanceRestarted,
} from "@/lib/openclaw-instance-management";

const RESTART_REASON = "管理员在 OpenClaw 实例管理页面手动重启";
const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 60_000;

export function RestartButton({
  className,
  instance,
  isAnyRestartPending,
  isRestartPending,
  onPress,
}: {
  className?: string;
  instance: OpenClawInstanceSummary;
  isAnyRestartPending: boolean;
  isRestartPending: boolean;
  onPress: () => void;
}) {
  const disabledReason = getRestartDisabledReason(instance);
  const tooltip =
    disabledReason ??
    (isAnyRestartPending && !isRestartPending
      ? "请等待当前实例重启检查完成"
      : "重启实例");

  return (
    <Tooltip delay={0}>
      <Button
        className={className}
        isDisabled={Boolean(disabledReason) || isAnyRestartPending}
        isPending={isRestartPending}
        size="sm"
        variant="danger"
        onPress={onPress}
      >
        重启
      </Button>
      <Tooltip.Content>{tooltip}</Tooltip.Content>
    </Tooltip>
  );
}

export function RestartInstanceDialog({
  onOpenChange,
  onPendingChange,
  onRecovered,
  target,
}: {
  onOpenChange: (isOpen: boolean) => void;
  onPendingChange: (pluginId: string | null) => void;
  onRecovered: (detail: OpenClawInstanceDetail) => void;
  target: OpenClawInstanceSummary | null;
}) {
  const pollControllerRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousTarget, setPreviousTarget] = useState(target);

  if (target !== previousTarget) {
    setPreviousTarget(target);
    if (target) setError(null);
  }

  useEffect(
    () => () => {
      pollControllerRef.current?.abort();
    },
    [],
  );

  async function handleRestart() {
    const pluginId = target?.pluginId?.trim();

    if (!pluginId || !target || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await controlOpenClawInstance({
        action: "restart",
        dryRun: false,
        pluginId,
        reason: RESTART_REASON,
      });

      if (!result?.success) {
        throw new ApiError(
          result?.message?.trim() || "实例未接受重启请求。",
          200,
          result,
        );
      }

      toast.success("重启请求已受理");
      onOpenChange(false);
      onPendingChange(pluginId);
      pollControllerRef.current?.abort();
      pollControllerRef.current = new AbortController();
      void pollForRestartRecovery({
        baseline: target,
        controller: pollControllerRef.current,
        onPendingChange,
        onRecovered,
        pluginId,
      });
    } catch (error) {
      const message = getActionError(error, "实例重启失败。");

      setError(message);
      toast.danger(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal.Backdrop
      isDismissable={!isSubmitting}
      isKeyboardDismissDisabled={isSubmitting}
      isOpen={Boolean(target)}
      onOpenChange={onOpenChange}
    >
      <Modal.Container placement="center" scroll="outside" size="md">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>确认重启 OpenClaw 实例</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex min-w-0 flex-col gap-3">
            <div className="rounded-md bg-surface px-3 py-2 font-mono text-sm break-all">
              {target?.pluginId}
            </div>
            <p className="text-muted text-sm">
              实例重启期间可能暂时无法处理会话，是否继续？
            </p>
            {error ? (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button
              isDisabled={isSubmitting}
              variant="tertiary"
              onPress={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              isPending={isSubmitting}
              variant="danger"
              onPress={() => void handleRestart()}
            >
              确认重启
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

async function pollForRestartRecovery({
  baseline,
  controller,
  onPendingChange,
  onRecovered,
  pluginId,
}: {
  baseline: OpenClawInstanceSummary;
  controller: AbortController;
  onPendingChange: (pluginId: string | null) => void;
  onRecovered: (detail: OpenClawInstanceDetail) => void;
  pluginId: string;
}) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  try {
    while (Date.now() < deadline) {
      await wait(
        Math.min(POLL_INTERVAL_MS, deadline - Date.now()),
        controller.signal,
      );

      try {
        const remainingMs = deadline - Date.now();

        if (remainingMs <= 0) break;

        const detail = await getOpenClawInstanceDetail(
          {
            includeSkills: false,
            pluginId,
            skillMode: "none",
          },
          {
            signal: controller.signal,
            timeoutMs: remainingMs,
          },
        );

        if (controller.signal.aborted) return;
        if (!detail) continue;

        onRecovered(detail);

        if (hasInstanceRestarted(baseline, detail)) {
          toast.success("实例已恢复在线");

          return;
        }
      } catch {
        if (controller.signal.aborted) return;
      }
    }

    toast.warning("重启请求已受理，请稍后刷新查看实例状态");
  } catch {
    if (!controller.signal.aborted) {
      toast.warning("重启请求已受理，请稍后刷新查看实例状态");
    }
  } finally {
    if (!controller.signal.aborted) onPendingChange(null);
  }
}

function wait(duration: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(resolve, duration);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

function getActionError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
