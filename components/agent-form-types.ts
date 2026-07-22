export type AgentForm = {
  agentId: string;
  avatarUrl: string;
  defaultImageGenerationModelid: string;
  defaultImageModelid: string;
  defaultMusicGenerationModelid: string;
  defaultModelid: string;
  defaultPdfModelid: string;
  defaultVideoGenerationModelid: string;
  description: string;
  displayName: string;
  enabled: boolean;
  reasoningLevel: string;
  sandboxConfigId: number;
  thinkingLevel: string;
  verboseLevel: string;
};

export const DEFAULT_AGENT_FORM: AgentForm = {
  agentId: "",
  avatarUrl: "",
  defaultImageGenerationModelid: "",
  defaultImageModelid: "",
  defaultMusicGenerationModelid: "",
  defaultModelid: "",
  defaultPdfModelid: "",
  defaultVideoGenerationModelid: "",
  description: "",
  displayName: "",
  enabled: true,
  reasoningLevel: "",
  sandboxConfigId: 0,
  thinkingLevel: "",
  verboseLevel: "",
};

export const REASONING_LEVELS = [
  { id: "__unset", label: "不设置" },
  { id: "off", label: "off" },
  { id: "on", label: "on" },
  { id: "stream", label: "stream" },
] as const;

export const THINKING_LEVELS = [
  { id: "__unset", label: "不设置" },
  { id: "off", label: "off" },
  { id: "minimal", label: "minimal" },
  { id: "low", label: "low" },
  { id: "medium", label: "medium" },
  { id: "high", label: "high" },
  { id: "xhigh", label: "xhigh" },
  { id: "adaptive", label: "adaptive" },
  { id: "max", label: "max" },
] as const;

export const VERBOSE_LEVELS = [
  { id: "__unset", label: "不设置" },
  { id: "off", label: "off" },
  { id: "on", label: "on" },
  { id: "full", label: "full" },
] as const;
