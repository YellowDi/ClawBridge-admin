import type { Agent, ReqAgentCreate, ReqAgentUpdate } from "@/lib/api";
import type { AgentForm } from "@/components/agent-form-types";
import type { EditableAgentSummary } from "@/components/agent-dialog-types";

export function toCreateAgentRequest(form: AgentForm): ReqAgentCreate {
  return {
    agentId: form.agentId.trim(),
    avatarUrl: toOptionalString(form.avatarUrl),
    defaultImageGenerationModelid: toOptionalString(
      form.defaultImageGenerationModelid,
    ),
    defaultImageModelid: toOptionalString(form.defaultImageModelid),
    defaultMusicGenerationModelid: toOptionalString(
      form.defaultMusicGenerationModelid,
    ),
    defaultModelid: toOptionalString(form.defaultModelid),
    defaultPdfModelid: toOptionalString(form.defaultPdfModelid),
    defaultVideoGenerationModelid: toOptionalString(
      form.defaultVideoGenerationModelid,
    ),
    description: toOptionalString(form.description),
    displayName: toOptionalString(form.displayName),
    enabled: form.enabled,
    reasoningLevel: toOptionalString(form.reasoningLevel),
    thinkingLevel: toOptionalString(form.thinkingLevel),
    verboseLevel: toOptionalString(form.verboseLevel),
  };
}

export function toUpdateAgentRequest(
  form: AgentForm,
  id: number,
): ReqAgentUpdate {
  return {
    ...toCreateAgentRequest(form),
    id,
  };
}

export function toAgentForm(agent: EditableAgentSummary): AgentForm {
  return {
    agentId: agent.agentId?.trim() ?? "",
    avatarUrl: agent.avatarUrl?.trim() ?? "",
    defaultImageGenerationModelid:
      agent.defaultImageGenerationModelid?.trim() ?? "",
    defaultImageModelid: agent.defaultImageModelid?.trim() ?? "",
    defaultMusicGenerationModelid:
      agent.defaultMusicGenerationModelid?.trim() ?? "",
    defaultModelid: agent.defaultModelid?.trim() ?? "",
    defaultPdfModelid: agent.defaultPdfModelid?.trim() ?? "",
    defaultVideoGenerationModelid:
      agent.defaultVideoGenerationModelid?.trim() ?? "",
    description: agent.description?.trim() ?? "",
    displayName: agent.displayName?.trim() ?? "",
    enabled: agent.enabled !== false,
    reasoningLevel: agent.reasoningLevel?.trim() ?? "",
    thinkingLevel: agent.thinkingLevel?.trim() ?? "",
    verboseLevel: agent.verboseLevel?.trim() ?? "",
  };
}

export function toLoadedAgentForm(
  summary: EditableAgentSummary,
  detail?: Agent,
): AgentForm {
  if (!detail) return toAgentForm(summary);

  return toAgentForm({
    ...summary,
    ...detail,
    id: summary.id,
  });
}

export function getAgentLabel(agent: Pick<Agent, "agentId" | "displayName">) {
  return agent.displayName?.trim() || agent.agentId?.trim() || "未命名 Agent";
}

export function getAgentActionError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}

function toOptionalString(value: string) {
  return value.trim() || undefined;
}
