import type {
  Agent,
  KnowledgeBase,
  MCPServer,
  OpenClawConfigSnapshot,
  OpenClawMCPApplyResult,
  OpenClawRPCInstance,
  TencentCosSts,
  User,
} from "@/lib/api";

import {
  applyOpenClawMCPConfig,
  createMCPServer,
  deleteMCPServer,
  getOpenClawConfigSnapshot,
  getTencentCosSts,
  listMCPServers,
  listOpenClawRPCInstances,
  updateMCPServer,
} from "@/lib/api";

function expectType<T>(_value: T) {}

expectType<KnowledgeBase[] | undefined>({} as User["knowledgeBases"]);
expectType<KnowledgeBase[] | undefined>({} as Agent["knowledgeBases"]);
expectType<Promise<TencentCosSts | undefined>>(getTencentCosSts());
expectType<Promise<MCPServer[]>>(listMCPServers());
expectType<Promise<OpenClawRPCInstance[]>>(listOpenClawRPCInstances());
expectType<Promise<OpenClawConfigSnapshot | undefined>>(
  getOpenClawConfigSnapshot({ pluginId: "clawcore-rpc" }),
);
expectType<Promise<MCPServer | undefined>>(
  createMCPServer({
    config: { command: "npx", transport: "stdio" },
    displayName: "GitHub MCP",
    enabled: true,
    serverName: "github",
  }),
);
expectType<Promise<MCPServer | undefined>>(
  updateMCPServer({
    config: { transport: "sse", url: "https://mcp.example.com/sse" },
    displayName: "Remote MCP",
    enabled: true,
    id: 1,
    serverName: "remote",
  }),
);
expectType<Promise<void>>(deleteMCPServer(1));
expectType<Promise<OpenClawMCPApplyResult | undefined>>(
  applyOpenClawMCPConfig({
    agentId: "coder",
    dryRun: true,
    mcpServerIds: [1],
    mode: "merge",
    pluginId: "clawcore-rpc",
    validateEnvRefs: true,
  }),
);
