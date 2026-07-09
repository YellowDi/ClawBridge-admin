import type {
  Agent,
  KnowledgeBase,
  MCPServer,
  ModelProviderCatalogProvider,
  OpenClawConfigSnapshot,
  OpenClawMCPApplyResult,
  OpenClawRPCInstance,
  SubscriptionPlan,
  SubscriptionTransaction,
  TencentCosSts,
  User,
  UserSubscriptionView,
} from "@/lib/api";

import {
  applyOpenClawMCPConfig,
  createMCPServer,
  createSubscriptionPlan,
  deleteMCPServer,
  deleteSubscriptionPlan,
  getCurrentSubscription,
  getMCPServerDetail,
  getOpenClawConfigSnapshot,
  getSubscriptionPlanDetail,
  getTencentCosSts,
  grantUserSubscription,
  listModelProviderCatalog,
  listMCPServers,
  listOpenClawRPCInstances,
  listSubscriptionPlans,
  listSubscriptionTransactions,
  updateMCPServer,
  updateSubscriptionPlan,
} from "@/lib/api";

function expectType<T>(_value: T) {}

expectType<KnowledgeBase[] | undefined>({} as User["knowledgeBases"]);
expectType<"main" | "sub" | string | undefined>({} as User["accountType"]);
expectType<"personal" | "team" | string | undefined>(
  {} as User["accountNature"],
);
expectType<"metered" | "subscription" | string | undefined>(
  {} as User["billingMode"],
);
expectType<KnowledgeBase[] | undefined>({} as Agent["knowledgeBases"]);
expectType<string | undefined>({} as ModelProviderCatalogProvider["provider"]);
expectType<string | undefined>(
  {} as NonNullable<ModelProviderCatalogProvider["models"]>[number]["model"],
);
expectType<Promise<ModelProviderCatalogProvider[]>>(listModelProviderCatalog());
expectType<Promise<TencentCosSts | undefined>>(getTencentCosSts());
expectType<Promise<SubscriptionPlan[]>>(listSubscriptionPlans());
expectType<Promise<SubscriptionPlan | undefined>>(getSubscriptionPlanDetail(1));
expectType<Promise<SubscriptionPlan | undefined>>(
  createSubscriptionPlan({
    enabled: true,
    monthlyPriceAmount: "300.0000000000",
    name: "pro",
    seatLimit: 3,
    windows: [
      {
        enabled: true,
        quotaAmount: "500.0000000000",
        sortOrder: 1,
        windowHours: 5,
      },
    ],
  }),
);
expectType<Promise<SubscriptionPlan | undefined>>(
  updateSubscriptionPlan({ id: 1, name: "pro" }),
);
expectType<Promise<void>>(deleteSubscriptionPlan(1));
expectType<Promise<UserSubscriptionView | undefined>>(
  getCurrentSubscription({ userId: 1 }),
);
expectType<Promise<UserSubscriptionView | undefined>>(
  grantUserSubscription({ grantDays: 30, planId: 1, userId: 1 }),
);
expectType<Promise<SubscriptionTransaction[]>>(
  listSubscriptionTransactions({ page: 1, pageSize: 20, userId: 1 }),
);
expectType<Promise<MCPServer[]>>(listMCPServers());
expectType<Promise<OpenClawRPCInstance[]>>(listOpenClawRPCInstances());
expectType<Promise<OpenClawConfigSnapshot | undefined>>(
  getOpenClawConfigSnapshot({ pluginId: "clawcore-rpc" }),
);
expectType<Promise<MCPServer | undefined>>(getMCPServerDetail(1));
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
