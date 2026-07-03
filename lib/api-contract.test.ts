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
    config: {
      args: ["-y", "@modelcontextprotocol/server-github"],
      auth: "oauth",
      clientCert: "/etc/ssl/client.crt",
      clientKey: "/etc/ssl/client.key",
      codex: { approvalPolicy: "never" },
      command: "npx",
      connectTimeout: 10,
      connectionTimeoutMs: 10000,
      cwd: "/srv/mcp",
      enabled: true,
      env: {
        GITHUB_TOKEN: { envName: "GITHUB_TOKEN", type: "env_ref" },
      },
      extra: { customField: "value" },
      headers: {
        Authorization: { type: "secret", value: "******" },
      },
      oauth: {
        clientMetadataUrl: "https://example.com/.well-known/oauth-client",
        redirectUrl: "http://127.0.0.1:1455/oauth/callback",
        scope: "repo read:user",
      },
      requestTimeoutMs: 30000,
      sslVerify: true,
      supportsParallelToolCalls: true,
      timeout: 30,
      toolFilter: { exclude: ["delete_*"], include: ["search", "fetch"] },
      transport: "stdio",
      workingDirectory: "/srv/mcp",
    },
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
