import type { Agent, Model } from "@/lib/api";

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
  | "thinkingLevel"
  | "verboseLevel"
> & {
  id: number;
};

export type AgentDialogProps = {
  modelOptions?: Model[];
};

export const EMPTY_MODEL_OPTIONS: Model[] = [];
