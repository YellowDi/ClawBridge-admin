import type { Agent, Model, SandboxConfig } from "@/lib/api";

export type EditableAgentSummary = Pick<
  Agent,
  | "agentId"
  | "avatarUrl"
  | "defaultImageGenerationModelid"
  | "defaultImageModelid"
  | "defaultMusicGenerationModelid"
  | "defaultModelid"
  | "defaultPdfModelid"
  | "defaultVideoGenerationModelid"
  | "description"
  | "displayName"
  | "enabled"
  | "id"
  | "reasoningLevel"
  | "sandboxConfigId"
  | "thinkingLevel"
  | "verboseLevel"
> & {
  id: number;
};

export type AgentDialogProps = {
  modelOptions?: Model[];
  sandboxOptions?: SandboxConfig[];
};

export const EMPTY_MODEL_OPTIONS: Model[] = [];
export const EMPTY_SANDBOX_OPTIONS: SandboxConfig[] = [];
