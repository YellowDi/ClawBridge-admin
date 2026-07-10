import type {
  Agent,
  ControlOpenClawInstanceResult,
  KnowledgeBase,
  MCPServer,
  ModelProviderCatalogProvider,
  OpenClawInstanceDetail,
  OpenClawInstanceSummary,
  OpenClawPlugin,
  OpenClawPluginCapabilities,
  OpenClawPluginConfiguration,
  OpenClawPluginConfigurationInput,
  OpenClawPluginConfigurationValue,
  OpenClawPluginDeployment,
  OpenClawPluginInstall,
  OpenClawPluginInstallResult,
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
  controlOpenClawInstance,
  createMCPServer,
  createSubscriptionPlan,
  deleteMCPServer,
  deleteOpenClawPluginLibrary,
  disableOpenClawPlugin,
  enableOpenClawPlugin,
  deleteSubscriptionPlan,
  getCurrentSubscription,
  getMCPServerDetail,
  getOpenClawInstanceDetail,
  getOpenClawConfigSnapshot,
  getOpenClawPluginLibraryDetail,
  getSubscriptionPlanDetail,
  getTencentCosSts,
  grantUserSubscription,
  listModelProviderCatalog,
  listMCPServers,
  listOpenClawInstanceSummaries,
  listOpenClawPluginInstalls,
  listOpenClawPluginLibrary,
  listOpenClawRPCInstances,
  listSubscriptionPlans,
  listSubscriptionTransactions,
  updateMCPServer,
  updateOpenClawPluginLibrary,
  updateSubscriptionPlan,
  importOpenClawPluginPackage,
  installOpenClawPlugin,
  replaceOpenClawPluginAgents,
  uninstallOpenClawPlugin,
  uploadOpenClawPluginPackage,
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
expectType<string | undefined>({} as SubscriptionPlan["featureIntro"]);
expectType<Promise<SubscriptionPlan | undefined>>(getSubscriptionPlanDetail(1));
expectType<Promise<SubscriptionPlan | undefined>>(
  createSubscriptionPlan({
    enabled: true,
    featureIntro:
      "包含高级模型调用额度\n支持团队协作席位\n适合持续使用 OpenClaw 自动化能力",
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
expectType<string[] | undefined>({} as OpenClawPluginCapabilities["tools"]);
expectType<OpenClawPluginDeployment>({
  configurationRequired: true,
  configurationTargets: ["channel:telegram"],
  modes: ["channel"],
  postInstallAction: "configure_channel",
  supportsAgentScope: false,
  type: "channel",
});
expectType<"channel" | string | undefined>({} as OpenClawPlugin["pluginType"]);
expectType<OpenClawPluginConfiguration[] | undefined>(
  {} as OpenClawPlugin["configurations"],
);
expectType<OpenClawPluginConfiguration>({
  configPath: "channels.clawbridge",
  schema: { type: "object" },
  target: "channel:clawbridge",
  uiHints: { token: { label: "Token", sensitive: true } },
  value: { token: "********" },
});
expectType<OpenClawPluginConfigurationValue[] | undefined>(
  {} as OpenClawPluginInstall["configurations"],
);
expectType<OpenClawPluginConfigurationValue>({
  configured: true,
  configPath: "channels.clawbridge",
  schema: { type: "object" },
  target: "channel:clawbridge",
  value: { token: "********" },
});
expectType<OpenClawPluginConfigurationInput>({
  target: "channel:clawbridge",
  value: { enabled: true },
});
expectType<Promise<{ items?: OpenClawPlugin[] }>>(
  listOpenClawPluginLibrary({
    includeDeleted: true,
    page: 1,
    pageSize: 100,
    pluginType: "channel",
  }),
);
expectType<Promise<OpenClawPlugin | undefined>>(
  getOpenClawPluginLibraryDetail(1),
);
expectType<Promise<OpenClawPlugin | undefined>>(
  uploadOpenClawPluginPackage({} as File, true),
);
expectType<Promise<OpenClawPlugin | undefined>>(
  importOpenClawPluginPackage({
    force: false,
    url: "https://example.com/demo.tgz",
  }),
);
expectType<Promise<OpenClawPlugin | undefined>>(
  updateOpenClawPluginLibrary({
    configurations: [
      { target: "channel:clawbridge", value: { token: "********" } },
    ],
    description: "插件说明",
    id: 1,
    name: "Demo",
  }),
);
expectType<Promise<OpenClawPlugin | undefined>>(deleteOpenClawPluginLibrary(1));
expectType<Promise<OpenClawPluginInstall[]>>(listOpenClawPluginInstalls());
expectType<Promise<OpenClawPluginInstallResult | undefined>>(
  installOpenClawPlugin({
    agentIds: ["main", "coder"],
    dryRun: false,
    enabled: true,
    openclawPluginId: "clawcore-rpc",
    pluginRecordId: 1,
    scopeType: "agents",
    configurations: [
      { target: "channel:clawbridge", value: { enabled: true } },
    ],
  }),
);
expectType<Promise<OpenClawPluginInstallResult | undefined>>(
  replaceOpenClawPluginAgents({
    agentIds: ["main"],
    installId: 1,
    scopeType: "agents",
  }),
);
expectType<Promise<OpenClawPluginInstallResult | undefined>>(
  enableOpenClawPlugin({ installId: 1 }),
);
expectType<Promise<OpenClawPluginInstallResult | undefined>>(
  disableOpenClawPlugin({ installId: 1 }),
);
expectType<Promise<OpenClawPluginInstallResult | undefined>>(
  uninstallOpenClawPlugin({ installId: 1 }),
);
expectType<Promise<OpenClawInstanceSummary[]>>(
  listOpenClawInstanceSummaries({ skillMode: "none" }),
);
expectType<Promise<OpenClawInstanceDetail | undefined>>(
  getOpenClawInstanceDetail({
    includeSkills: false,
    pluginId: "clawcore-rpc",
    skillMode: "none",
  }),
);
expectType<Promise<ControlOpenClawInstanceResult | undefined>>(
  controlOpenClawInstance({
    action: "restart",
    dryRun: false,
    pluginId: "clawcore-rpc",
    reason: "manual restart",
  }),
);
expectType<string | undefined>(
  {} as NonNullable<OpenClawInstanceDetail["agents"]>[number]["agentId"],
);
expectType<boolean | undefined>({} as OpenClawPluginInstallResult["success"]);
expectType<string[] | undefined>({} as OpenClawPluginInstallResult["warnings"]);
expectType<boolean | undefined>(
  {} as OpenClawPluginInstallResult["restartRequired"],
);
expectType<OpenClawPluginDeployment | undefined>(
  {} as OpenClawPluginInstall["deployment"],
);
