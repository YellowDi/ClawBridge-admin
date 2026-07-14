export const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://192.168.2.2:8090";

export const AUTH_STORAGE_KEY = "clawbridge-admin.auth";
const API_PROXY_BASE_URL = "/api/backend";

export interface ReqLogin {
  password?: string;
  username?: string;
  [property: string]: unknown;
}

export interface ResLogin {
  expireAt?: string;
  token?: string;
  user?: User;
  [property: string]: unknown;
}

export interface ReqPagination {
  page?: number;
  pageSize?: number;
  [property: string]: unknown;
}

export interface Pagination {
  page?: number;
  pageSize?: number;
  total?: number;
  [property: string]: unknown;
}

export interface ReqUserList extends ReqPagination {}

export interface ResUsers {
  data?: User[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface ReqUserCreate {
  accountNature?: "personal" | "team" | (string & {});
  adminSeatLimit?: number;
  displayName?: string;
  enabled?: boolean;
  isAdmin?: boolean;
  parentUserId?: number;
  password?: string;
  username?: string;
  [property: string]: unknown;
}

export interface ReqUserDetail {
  id?: number;
  [property: string]: unknown;
}

export interface ReqUserUpdate {
  accountNature?: "personal" | "team" | (string & {});
  adminSeatLimit?: number;
  displayName?: string;
  enabled?: boolean;
  id?: number;
  isAdmin?: boolean;
  password?: string;
  username?: string;
  [property: string]: unknown;
}

export interface ResUser {
  data?: User;
  [property: string]: unknown;
}

export interface ControllerResponse {
  code?: number;
  data?: unknown;
  message?: string;
  success?: boolean;
  [property: string]: unknown;
}

export interface HealthStatus {
  ok?: boolean;
  service?: string;
  timestamp?: string;
  [property: string]: unknown;
}

export interface User {
  accountNature?: "personal" | "team" | (string & {});
  accountType?: "main" | "sub" | (string & {});
  adminSeatLimit?: number;
  billingMode?: "metered" | "subscription" | (string & {});
  createdAt?: string;
  displayName?: string;
  avatarUrl?: string;
  enabled?: boolean;
  id?: number;
  isAdmin?: boolean;
  isDelete?: number;
  knowledgeBases?: KnowledgeBase[];
  parentUserId?: number;
  password?: string;
  seatLimit?: number;
  updatedAt?: string;
  username?: string;
  [property: string]: unknown;
}

export interface ReqModelCreate {
  billingUnit?: string;
  cacheReadPricePerMillion?: string;
  cacheWritePricePerMillion?: string;
  capabilities?: string[];
  currency?: string;
  displayName?: string;
  enabled?: boolean;
  inputPricePerMillion?: string;
  modelid?: string;
  openClawContextTokens?: number;
  openClawContextWindow?: number;
  openClawMaxTokens?: number;
  openClawProviderApi?: string;
  openClawProviderApiKeyRef?: string;
  openClawProviderBaseUrl?: string;
  openClawReasoning?: boolean;
  openClawSyncProviderCatalog?: boolean;
  outputPricePerMillion?: string;
  provider?: string;
  unitPriceAmount?: string;
  [property: string]: unknown;
}

export interface ReqModelList extends ReqPagination {}

export interface ReqModelDelete {
  id?: number;
  [property: string]: unknown;
}

export interface ReqModelUpdate {
  billingUnit?: string;
  cacheReadPricePerMillion?: string;
  cacheWritePricePerMillion?: string;
  capabilities?: string[];
  currency?: string;
  displayName?: string;
  enabled?: boolean;
  id?: number;
  inputPricePerMillion?: string;
  modelid?: string;
  openClawContextTokens?: number;
  openClawContextWindow?: number;
  openClawMaxTokens?: number;
  openClawProviderApi?: string;
  openClawProviderApiKeyRef?: string;
  openClawProviderBaseUrl?: string;
  openClawReasoning?: boolean;
  openClawSyncProviderCatalog?: boolean;
  outputPricePerMillion?: string;
  provider?: string;
  unitPriceAmount?: string;
  [property: string]: unknown;
}

export interface ResModel {
  data?: Model;
  [property: string]: unknown;
}

export interface ResModels {
  data?: Model[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface ModelProviderCatalogModel {
  mode?: string;
  model?: string;
  name?: string;
  [property: string]: unknown;
}

export interface ModelProviderCatalogProvider {
  api_base?: string;
  documentation?: string;
  logo?: string;
  models?: ModelProviderCatalogModel[];
  name?: string;
  prefix?: string;
  provider?: string;
  website?: string;
  [property: string]: unknown;
}

export interface ResModelProviderCatalog {
  providers?: ModelProviderCatalogProvider[];
  [property: string]: unknown;
}

export interface Model {
  billingUnit?: string;
  cacheReadPricePerMillion?: string;
  cacheWritePricePerMillion?: string;
  capabilities?: string[];
  createdAt?: string;
  currency?: string;
  displayName?: string;
  enabled?: boolean;
  id?: number;
  inputPricePerMillion?: string;
  isDelete?: number;
  modelid?: string;
  openClawContextTokens?: number;
  openClawContextWindow?: number;
  openClawMaxTokens?: number;
  openClawProviderApi?: string;
  openClawProviderApiKeyRef?: string;
  openClawProviderBaseUrl?: string;
  openClawReasoning?: boolean;
  openClawSyncProviderCatalog?: boolean;
  outputPricePerMillion?: string;
  provider?: string;
  unitPriceAmount?: string;
  updatedAt?: string;
  [property: string]: unknown;
}

export interface ReqAgentCreate {
  agentId?: string;
  avatarUrl?: string;
  defaultImageGenerationModelid?: string;
  defaultImageModelid?: string;
  defaultMusicGenerationModelid?: string;
  defaultModelid?: string;
  defaultPdfModelid?: string;
  defaultVideoGenerationModelid?: string;
  description?: string;
  displayName?: string;
  enabled?: boolean;
  reasoningLevel?: string;
  thinkingLevel?: string;
  verboseLevel?: string;
  [property: string]: unknown;
}

export interface ReqAgentList extends ReqPagination {}

export interface ReqAgentDelete {
  id?: number;
  [property: string]: unknown;
}

export interface ReqAgentDetail {
  id?: number;
  [property: string]: unknown;
}

export interface ReqAgentUpdate {
  agentId?: string;
  avatarUrl?: string;
  defaultImageGenerationModelid?: string;
  defaultImageModelid?: string;
  defaultMusicGenerationModelid?: string;
  defaultModelid?: string;
  defaultPdfModelid?: string;
  defaultVideoGenerationModelid?: string;
  description?: string;
  displayName?: string;
  enabled?: boolean;
  id?: number;
  reasoningLevel?: string;
  thinkingLevel?: string;
  verboseLevel?: string;
  [property: string]: unknown;
}

export interface ReqAgentInitDev {
  agentId?: number;
  force?: boolean;
  [property: string]: unknown;
}

export interface ReqAgentMarkdownRead {
  agentId?: number;
  paths?: string[];
  pluginId?: string;
  [property: string]: unknown;
}

export interface AgentMarkdownFile {
  content?: string;
  path?: string;
  [property: string]: unknown;
}

export interface ResAgentMarkdownFiles {
  agentId?: string;
  files?: AgentMarkdownFile[];
  workspaceName?: string;
  [property: string]: unknown;
}

export interface ReqAgentMarkdownSave {
  agentId?: number;
  files?: AgentMarkdownFile[];
  pluginId?: string;
  [property: string]: unknown;
}

export interface ResAgentMarkdownSave {
  agentId?: string;
  changed?: string[];
  workspaceName?: string;
  [property: string]: unknown;
}

export interface ReqAgentExportCreate {
  agentId?: number;
  [property: string]: unknown;
}

export interface ReqAgentExportList extends ReqPagination {
  agentId?: number;
  [property: string]: unknown;
}

export interface ReqAgentExportDeploy {
  exportId?: number;
  force?: boolean;
  targetPluginIds?: string[];
  [property: string]: unknown;
}

export interface ReqAgentDeploymentList {
  agentId?: number;
  [property: string]: unknown;
}

export interface ReqAgentDeploymentUninstall {
  agentId: number;
  force: boolean;
  targetPluginId: string;
  [property: string]: unknown;
}

export interface AgentExport {
  agentCode?: string;
  agentId?: number;
  artifactPath?: string;
  artifactUrl?: string;
  createdAt?: string;
  errorMessage?: string;
  id?: number;
  isDelete?: number;
  manifestJson?: string;
  sha256?: string;
  sizeBytes?: number;
  sourcePluginId?: string;
  status?: string;
  updatedAt?: string;
  version?: number;
  workspaceName?: string;
  [property: string]: unknown;
}

export interface ResAgentExports {
  items?: AgentExport[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface AgentDeployment {
  agentCode?: string;
  agentId?: number;
  createdAt?: string;
  errorMessage?: string;
  exportId?: number;
  id?: number;
  isDelete?: number;
  remoteAgentJson?: string;
  remoteConfigHash?: string;
  remoteVersion?: number;
  status?: string;
  targetPluginId?: string;
  updatedAt?: string;
  version?: number;
  workspaceName?: string;
  [property: string]: unknown;
}

export interface ResAgentDeployments {
  items?: AgentDeployment[];
  [property: string]: unknown;
}

export interface ReqAgentImport {
  agentId?: string;
  artifactPath?: string;
  artifactUrl?: string;
  defaultModelid?: string;
  description?: string;
  displayName?: string;
  manifestJson?: string;
  sha256?: string;
  sizeBytes?: number;
  [property: string]: unknown;
}

export interface ResAgentImport {
  agent?: Agent;
  export?: AgentExport;
  [property: string]: unknown;
}

export interface ResAgent {
  data?: Agent;
  [property: string]: unknown;
}

export interface ResAgents {
  data?: Agent[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface Agent {
  agentId?: string;
  avatarUrl?: string;
  createdAt?: string;
  defaultImageGenerationModel?: Model;
  defaultImageGenerationModelid?: string;
  defaultImageModel?: Model;
  defaultImageModelid?: string;
  defaultMusicGenerationModel?: Model;
  defaultMusicGenerationModelid?: string;
  defaultModel?: Model;
  defaultModelid?: string;
  defaultPdfModel?: Model;
  defaultPdfModelid?: string;
  defaultVideoGenerationModel?: Model;
  defaultVideoGenerationModelid?: string;
  description?: string;
  devInitialized?: boolean;
  displayName?: string;
  enabled?: boolean;
  id?: number;
  isDelete?: number;
  knowledgeBases?: KnowledgeBase[];
  reasoningLevel?: string;
  thinkingLevel?: string;
  updatedAt?: string;
  verboseLevel?: string;
  [property: string]: unknown;
}

export interface ReqUserModelsList extends ReqPagination {
  userId?: number;
  [property: string]: unknown;
}

export interface ReqUserModelsReplace {
  modelIds?: number[];
  userId?: number;
  [property: string]: unknown;
}

export interface ReqUserAgentsList extends ReqPagination {
  userId?: number;
  [property: string]: unknown;
}

export interface ReqUserAgentsReplace {
  agentIds?: number[];
  userId?: number;
  [property: string]: unknown;
}

export type KnowledgeBaseStatus =
  | "pending"
  | "extracting"
  | "embedding"
  | "indexed"
  | "failed"
  | "deleting"
  | "delete_failed";

export interface KnowledgeBase {
  activeEmbeddingModelId?: number;
  chunkCount?: number;
  createdAt?: string;
  description?: string;
  enabled?: boolean;
  errorMessage?: string;
  filename?: string;
  id?: number;
  isDelete?: number;
  mimeType?: string;
  name?: string;
  parserName?: string;
  parserVersion?: string;
  path?: string;
  sha256?: string;
  size?: number;
  status?: KnowledgeBaseStatus | (string & {});
  storageType?: string;
  updatedAt?: string;
  [property: string]: unknown;
}

export interface ResKnowledgeBaseList {
  items?: KnowledgeBase[];
  [property: string]: unknown;
}

export interface ReqCreateKnowledgeBaseUrl {
  description?: string;
  name?: string;
  url?: string;
  [property: string]: unknown;
}

export interface ReqRetryKnowledgeBase {
  knowledgeBaseId?: number;
  [property: string]: unknown;
}

export interface ReqDeleteKnowledgeBase {
  knowledgeBaseId: number;
  [property: string]: unknown;
}

export interface ReqReplaceUserKnowledgeBases {
  knowledgeBaseIds: number[];
  userId: number;
  [property: string]: unknown;
}

export interface ReqReplaceAgentKnowledgeBases {
  agentId: number;
  knowledgeBaseIds: number[];
  [property: string]: unknown;
}

export interface TencentCosCredentials {
  accessKeyId?: string;
  accessKeySecret?: string;
  expiration?: string;
  securityToken?: string;
  [property: string]: unknown;
}

export interface TencentCosSts {
  bucketName?: string;
  domain?: string;
  endPoint?: string;
  region?: string;
  sts?: TencentCosCredentials;
  [property: string]: unknown;
}

export interface ReqUserBalanceDetail {
  currency?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface ReqUserBalanceTransactionsList extends ReqPagination {
  currency?: string;
  type?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface ReqUserBalanceAdjust {
  amount?: string;
  currency?: string;
  description?: string;
  direction?: "credit" | "debit" | string;
  type?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface UserBalance {
  availableAmount?: string;
  createdAt?: string;
  currency?: string;
  frozenAmount?: string;
  id?: number;
  isDelete?: number;
  totalConsumedAmount?: string;
  totalRechargedAmount?: string;
  updatedAt?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface UserBalanceTransaction {
  amount?: string;
  balanceAfter?: string;
  balanceBefore?: string;
  createdAt?: string;
  currency?: string;
  description?: string;
  direction?: string;
  id?: number;
  isDelete?: number;
  metadataJson?: string;
  relatedId?: number | string;
  relatedType?: string;
  type?: string;
  updatedAt?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface UserBalanceAdjustResult {
  balance?: UserBalance;
  transaction?: UserBalanceTransaction;
  [property: string]: unknown;
}

export interface SubscriptionPlanWindow {
  enabled?: boolean;
  id?: number;
  planId?: number;
  quotaAmount?: string;
  sortOrder?: number;
  windowHours?: number;
  [property: string]: unknown;
}

export interface SubscriptionPlan {
  createdAt?: string;
  description?: string;
  enabled?: boolean;
  featureIntro?: string;
  id?: number;
  isDelete?: number;
  monthlyPriceAmount?: string;
  name?: string;
  remark?: string;
  seatLimit?: number;
  updatedAt?: string;
  windows?: SubscriptionPlanWindow[];
  [property: string]: unknown;
}

export interface ReqSubscriptionPlanWindow {
  enabled?: boolean;
  id?: number;
  quotaAmount?: string;
  sortOrder?: number;
  windowHours?: number;
  [property: string]: unknown;
}

export interface ReqSubscriptionPlanList extends ReqPagination {
  enabled?: boolean;
  [property: string]: unknown;
}

export interface ReqSubscriptionPlanCreate {
  description?: string;
  enabled?: boolean;
  featureIntro?: string;
  monthlyPriceAmount?: string;
  name?: string;
  remark?: string;
  seatLimit?: number;
  windows?: ReqSubscriptionPlanWindow[];
  [property: string]: unknown;
}

export interface ReqSubscriptionPlanDetail {
  id?: number;
  [property: string]: unknown;
}

export interface ReqSubscriptionPlanUpdate
  extends ReqSubscriptionPlanCreate,
    ReqSubscriptionPlanDetail {}

export interface ResSubscriptionPlan {
  data?: SubscriptionPlan;
  [property: string]: unknown;
}

export interface ResSubscriptionPlans {
  data?: SubscriptionPlan[];
  items?: SubscriptionPlan[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface ReqSubscriptionGrant {
  grantDays?: number;
  planId?: number;
  userId?: number;
  [property: string]: unknown;
}

export interface ReqCurrentSubscription {
  userId?: number;
  [property: string]: unknown;
}

export interface AdminUserSubscription {
  autoRenew?: boolean;
  billingUserId?: number;
  createdAt?: string;
  expiresAt?: string;
  id?: number;
  isDelete?: number;
  originalPriceAmount?: string;
  paidPriceAmount?: string;
  planId?: number;
  source?: string;
  startsAt?: string;
  status?: string;
  updatedAt?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface AdminSubscriptionWallet {
  createdAt?: string;
  id?: number;
  isDelete?: number;
  periodEnd?: string;
  periodStart?: string;
  planId?: number;
  status?: string;
  subscriptionId?: number;
  updatedAt?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface SubscriptionWalletWindow {
  createdAt?: string;
  id?: number;
  isExceeded?: boolean;
  isDelete?: number;
  lastResetAt?: string;
  nextResetAt?: string;
  overageAmount?: string;
  planWindowId?: number;
  quotaAmount?: string;
  remainingAmount?: string;
  remainingPercent?: string;
  usedAmount?: string;
  usedPercent?: string;
  updatedAt?: string;
  walletId?: number;
  windowHours?: number;
  [property: string]: unknown;
}

export interface UserSubscriptionView {
  balanceTransaction?: UserBalanceTransaction;
  billingMode?: "metered" | "subscription" | (string & {});
  plan?: SubscriptionPlan;
  subscription?: AdminUserSubscription;
  wallet?: AdminSubscriptionWallet;
  windows?: SubscriptionWalletWindow[];
  [property: string]: unknown;
}

export interface ReqSubscriptionTransactionsList extends ReqPagination {
  userId?: number;
  [property: string]: unknown;
}

export interface SubscriptionTransaction {
  amount?: string;
  billingUserId?: number;
  createdAt?: string;
  description?: string;
  id?: number;
  isDelete?: number;
  metadataJson?: string;
  planId?: number;
  subscriptionId?: number;
  tokenUsageId?: number | string;
  type?: "grant" | "purchase" | "usage" | "reset" | "adjust" | (string & {});
  updatedAt?: string;
  userId?: number;
  usedAfter?: string;
  usedBefore?: string;
  walletId?: number;
  walletWindowId?: number;
  [property: string]: unknown;
}

export interface ResSubscriptionTransactions {
  data?: SubscriptionTransaction[];
  items?: SubscriptionTransaction[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface ReqConversationList extends ReqPagination {
  archiveStatus?: number;
  userId?: number;
  [property: string]: unknown;
}

export interface ReqConversationDetail {
  conversationId?: string;
  [property: string]: unknown;
}

export interface ReqConversationArchive {
  conversationId?: string;
  [property: string]: unknown;
}

export interface BridgeConversation {
  agentId?: string;
  archivedAt?: string | null;
  conversationId?: string;
  createdAt?: string;
  defaultModelid?: string;
  id?: number;
  isArchived?: number;
  isDelete?: number;
  lastMessageAt?: string;
  lastModelid?: string;
  pluginId?: string;
  title?: string;
  updatedAt?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface ReqMessageList extends ReqPagination {
  conversationId?: string;
  [property: string]: unknown;
}

export interface BridgeMessage {
  agentId?: string;
  conversationId?: string;
  createdAt?: string;
  id?: number;
  isDelete?: number;
  messageId?: string;
  metadataJson?: string;
  modelid?: string;
  pluginId?: string;
  provider?: string;
  replyTo?: string;
  role?: string;
  state?: string;
  text?: string;
  updatedAt?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface ReqContextSnapshotCreate {
  agentId?: string;
  contextBudgetTokens?: number;
  contextFresh?: boolean;
  contextUsedRatio?: number;
  contextUsedTokens?: number;
  conversationId?: string;
  createdAt?: string;
  pluginId?: string;
  sessionId?: string;
  sessionKey?: string;
  source?: string;
  [property: string]: unknown;
}

export interface ReqConversationContext {
  conversationId?: string;
  pluginId?: string;
  [property: string]: unknown;
}

export interface ContextSnapshot {
  agentId?: string;
  contextBudgetTokens?: number;
  contextFresh?: boolean;
  contextUsedPercent?: number;
  contextUsedRatio?: number;
  contextUsedTokens?: number;
  conversationId?: string;
  createdAt?: string;
  id?: number;
  isDelete?: number;
  pluginId?: string;
  rawPayloadJson?: string;
  sessionId?: string;
  sessionKey?: string;
  snapshotCreatedAt?: string;
  source?: string;
  updatedAt?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface TokenUsageNumbers {
  cacheRead?: number;
  cacheWrite?: number;
  input?: number;
  output?: number;
  total?: number;
  [property: string]: unknown;
}

export interface ReqTokenUsageCreate {
  agentId?: string;
  billableQuantity?: number;
  contextTokenBudget?: number;
  conversationId?: string;
  createdAt?: string;
  model?: string;
  modelid?: string;
  pluginId?: string;
  provider?: string;
  resolvedRef?: string;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  usage?: TokenUsageNumbers;
  usageId?: string;
  usageType?: string;
  [property: string]: unknown;
}

export interface TokenUsage {
  agentId?: string;
  balanceTransactionId?: number;
  billableQuantity?: number;
  billingCurrency?: string;
  billingError?: string;
  billingStatus?: string;
  cacheReadCostAmount?: string;
  cacheReadTokens?: number;
  cacheReadUnitPricePerMillion?: string;
  cacheWriteCostAmount?: string;
  cacheWriteTokens?: number;
  cacheWriteUnitPricePerMillion?: string;
  contextTokenBudget?: number;
  conversationId?: string;
  createdAt?: string;
  id?: number;
  inputCostAmount?: string;
  inputTokens?: number;
  inputUnitPricePerMillion?: string;
  isDelete?: number;
  modelKey?: string;
  modelid?: string;
  outputCostAmount?: string;
  outputTokens?: number;
  outputUnitPricePerMillion?: string;
  pluginId?: string;
  provider?: string;
  rawPayloadJson?: string;
  resolvedRef?: string;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  totalCostAmount?: string;
  totalTokens?: number;
  unitCostAmount?: string;
  unitPriceAmount?: string;
  updatedAt?: string;
  usageCreatedAt?: string;
  usageId?: string;
  usageType?: string;
  userId?: number;
  [property: string]: unknown;
}

export type UsageStatsBucket = "hour" | "day" | "week" | "month" | "year";

export interface ReqTokenUsageStatsConversation {
  conversationId?: string;
  [property: string]: unknown;
}

export interface ReqTokenUsageStatsTime {
  bucket?: UsageStatsBucket | string;
  endDate?: string;
  modelKey?: string;
  startDate?: string;
  userId?: number;
  [property: string]: unknown;
}

export interface ReqTokenUsageStatsUsers extends ReqTokenUsageStatsTime {}

export interface TokenUsageStatsModel {
  billableQuantity?: number;
  cacheReadCostAmount?: string;
  cacheReadTokens?: number;
  cacheWriteCostAmount?: string;
  cacheWriteTokens?: number;
  currency?: string;
  inputCostAmount?: string;
  inputTokens?: number;
  modelKey?: string;
  modelid?: string;
  outputCostAmount?: string;
  outputTokens?: number;
  provider?: string;
  totalCostAmount?: string;
  totalTokens?: number;
  unitCostAmount?: string;
  usageCount?: number;
  usageType?: string;
  [property: string]: unknown;
}

export interface TokenUsageStatsTimeBucket {
  bucketStartAt?: string;
  models?: TokenUsageStatsModel[];
  [property: string]: unknown;
}

export interface TokenUsageStatsUser extends TokenUsageStatsModel {
  bucketStartAt?: string;
  userId?: number;
  username?: string;
}

export interface TokenUsageStatsConversation {
  conversationId?: string;
  items?: TokenUsageStatsModel[];
  [property: string]: unknown;
}

export interface TokenUsageStatsTime {
  bucket?: string;
  endDate?: string;
  items?: TokenUsageStatsTimeBucket[];
  startDate?: string;
  [property: string]: unknown;
}

export interface TokenUsageStatsUsers {
  bucket?: string;
  endDate?: string;
  items?: TokenUsageStatsUser[];
  startDate?: string;
  [property: string]: unknown;
}

export interface ReqOpenClawModelConfig {
  capabilities?: string[];
  displayName?: string;
  enabled?: boolean;
  modelid?: string;
  provider?: string;
  [property: string]: unknown;
}

export interface ReqOpenClawAgentConfig {
  agentId?: string;
  defaultImageGenerationModelid?: string;
  defaultImageModelid?: string;
  defaultMusicGenerationModelid?: string;
  defaultModelid?: string;
  defaultPdfModelid?: string;
  defaultVideoGenerationModelid?: string;
  description?: string;
  displayName?: string;
  enabled?: boolean;
  reasoningLevel?: string;
  thinkingLevel?: string;
  verboseLevel?: string;
  [property: string]: unknown;
}

export interface ReqApplyOpenClawConfig {
  agents?: ReqOpenClawAgentConfig[];
  dryRun?: boolean;
  models?: ReqOpenClawModelConfig[];
  pluginId?: string;
  [property: string]: unknown;
}

export interface ApplyOpenClawConfigResult {
  changed?: string[];
  dryRun?: boolean;
  message?: string;
  success?: boolean;
  [property: string]: unknown;
}

export interface ReqSyncOpenClawModels {
  dryRun?: boolean;
  modelIds?: number[];
  pluginId?: string;
  syncProviderCatalog?: boolean;
  [property: string]: unknown;
}

export interface SyncOpenClawModelsResult {
  changed?: unknown[];
  dryRun?: boolean;
  message?: string;
  success?: boolean;
  [property: string]: unknown;
}

export type MCPTransport = "sse" | "stdio" | "streamable-http" | string;

export type MCPConfigValueType = "env_ref" | "literal" | "secret" | string;

export interface MCPConfigValue {
  envName?: string;
  type?: MCPConfigValueType;
  value?: string;
  [property: string]: unknown;
}

export interface MCPOAuthConfig {
  clientMetadataUrl?: string;
  redirectUrl?: string;
  scope?: string;
  [property: string]: unknown;
}

export interface MCPToolFilterConfig {
  exclude?: string[];
  include?: string[];
  [property: string]: unknown;
}

export interface MCPServerConfig {
  args?: string[];
  auth?: string;
  clientCert?: string;
  clientKey?: string;
  codex?: Record<string, unknown>;
  command?: string;
  connectTimeout?: number;
  connectionTimeoutMs?: number;
  cwd?: string;
  enabled?: boolean;
  env?: Record<string, MCPConfigValue>;
  extra?: Record<string, unknown>;
  headers?: Record<string, MCPConfigValue>;
  oauth?: MCPOAuthConfig;
  requestTimeoutMs?: number;
  sslVerify?: boolean;
  supportsParallelToolCalls?: boolean;
  timeout?: number;
  toolFilter?: MCPToolFilterConfig;
  transport?: MCPTransport;
  url?: string;
  workingDirectory?: string;
  [property: string]: unknown;
}

export interface MCPServer {
  config?: MCPServerConfig;
  createdAt?: string;
  description?: string;
  displayName?: string;
  enabled?: boolean;
  id?: number;
  serverName?: string;
  transportType?: string;
  updatedAt?: string;
  [property: string]: unknown;
}

export interface ReqMCPServerList extends ReqPagination {}

export interface ReqMCPServerCreate {
  config?: MCPServerConfig;
  description?: string;
  displayName?: string;
  enabled?: boolean;
  serverName?: string;
  [property: string]: unknown;
}

export interface ReqMCPServerDetail {
  id?: number;
  [property: string]: unknown;
}

export interface ReqMCPServerUpdate extends ReqMCPServerCreate {
  id?: number;
}

export interface ResMCPServer extends MCPServer {}

export interface ResMCPServers {
  items?: MCPServer[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface OpenClawRPCInstance {
  pluginId?: string;
  [property: string]: unknown;
}

export interface ResOpenClawRPCInstances {
  items?: OpenClawRPCInstance[];
  [property: string]: unknown;
}

export interface OpenClawPluginCapabilities {
  channels?: string[];
  commands?: string[];
  hooks?: string[];
  providers?: string[];
  toolMetadata?: Record<string, unknown>;
  tools?: string[];
  types?: string[];
  [property: string]: unknown;
}

export type PluginJsonSchema = Record<string, unknown>;

export interface OpenClawPluginConfigurationUIHint {
  label?: string;
  placeholder?: string;
  sensitive?: boolean;
  [property: string]: unknown;
}

export interface OpenClawPluginConfiguration {
  configPath?: string;
  schema: PluginJsonSchema;
  target: string;
  uiHints?: Record<string, OpenClawPluginConfigurationUIHint>;
  value?: Record<string, unknown>;
}

export interface OpenClawPluginConfigurationValue
  extends OpenClawPluginConfiguration {
  configured?: boolean;
  value: Record<string, unknown>;
}

export interface OpenClawPluginConfigurationInput {
  target: string;
  value: Record<string, unknown>;
}

export type OpenClawPluginType =
  | "tool"
  | "channel"
  | "provider"
  | "memory"
  | "mixed"
  | "extension"
  | (string & {});

export interface OpenClawPluginDeployment {
  configurationRequired?: boolean;
  configurationTargets?: string[];
  modes?: string[];
  postInstallAction?:
    | "none"
    | "configure_channel"
    | "configure_provider"
    | "configure_plugin"
    | "configure_multiple"
    | (string & {});
  supportsAgentScope?: boolean;
  type?: OpenClawPluginType;
  [property: string]: unknown;
}

export interface OpenClawPlugin {
  capabilities?: OpenClawPluginCapabilities;
  configurations?: OpenClawPluginConfiguration[];
  createdAt?: string;
  deployment?: OpenClawPluginDeployment;
  description?: string;
  errorMessage?: string;
  id?: number;
  isDelete?: number;
  latest?: boolean;
  manifest?: Record<string, unknown>;
  name?: string;
  objectKey?: string;
  package?: Record<string, unknown>;
  pluginId?: string;
  pluginType?: OpenClawPluginType;
  sha256?: string;
  sizeBytes?: number;
  sourceType?: "local" | "url" | (string & {});
  sourceUrl?: string;
  status?: string;
  storageType?: string;
  updatedAt?: string;
  version?: string;
  [property: string]: unknown;
}

export interface ReqOpenClawPluginLibraryList extends ReqPagination {
  includeDeleted?: boolean;
  pluginType?: OpenClawPluginType;
  query?: string;
}

export interface ReqOpenClawPluginLibraryUpdate {
  configurations?: OpenClawPluginConfigurationInput[];
  description?: string;
  id?: number;
  name?: string;
  [property: string]: unknown;
}

export interface ReqOpenClawPluginLibraryImport {
  force?: boolean;
  url?: string;
  [property: string]: unknown;
}

export interface ResOpenClawPluginLibrary {
  items?: OpenClawPlugin[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export type OpenClawPluginScopeType = "global" | "agents" | (string & {});

export interface OpenClawPluginInstall {
  agentIds?: string[];
  configurations?: OpenClawPluginConfigurationValue[];
  createdAt?: string;
  deployment?: OpenClawPluginDeployment;
  enabled?: boolean;
  id?: number;
  installStatus?: string;
  installedAt?: string;
  isDelete?: number;
  lastError?: string;
  openclawPluginId?: string;
  pluginId?: string;
  pluginRecordId?: number;
  pluginType?: OpenClawPluginType;
  pluginVersion?: string;
  scopeType?: OpenClawPluginScopeType;
  updatedAt?: string;
  [property: string]: unknown;
}

export interface OpenClawPluginInstallResult extends OpenClawPluginInstall {
  message?: string;
  restartRequired?: boolean;
  success?: boolean;
  warnings?: string[];
}

export interface ReqOpenClawPluginInstall {
  agentIds?: string[];
  configurations?: OpenClawPluginConfigurationInput[];
  dryRun?: boolean;
  enabled?: boolean;
  openclawPluginId?: string;
  pluginRecordId?: number;
  scopeType?: OpenClawPluginScopeType;
  [property: string]: unknown;
}

export interface ReqOpenClawPluginInstanceAction {
  dryRun?: boolean;
  installId?: number;
  [property: string]: unknown;
}

export interface ReqOpenClawPluginAgentsReplace
  extends ReqOpenClawPluginInstanceAction {
  agentIds?: string[];
  scopeType?: OpenClawPluginScopeType;
}

export interface ReqOpenClawPluginInstallsList {
  openclawPluginId?: string;
  [property: string]: unknown;
}

export interface OpenClawAgentToolSummary {
  defaultProfiles?: string[];
  description?: string;
  enabled?: boolean;
  groupId?: string;
  groupLabel?: string;
  label?: string;
  optional?: boolean;
  pluginId?: string;
  source?: string;
  toolKey?: string;
  [property: string]: unknown;
}

export interface OpenClawInstanceAgent {
  activeSessionCount?: number;
  agentId?: string;
  defaultModelId?: string;
  description?: string;
  displayName?: string;
  enabled?: boolean;
  enabledToolCount?: number;
  skillCount?: number;
  skillError?: string;
  toolCount?: number;
  toolSummaries?: OpenClawAgentToolSummary[];
  [property: string]: unknown;
}

export interface OpenClawInstanceHealthCheck {
  available?: boolean;
  message?: string;
  name?: string;
  status?: string;
  [property: string]: unknown;
}

export interface OpenClawInstanceLastControl {
  action?: string;
  at?: string;
  followUpMode?: string;
  followUpReason?: string;
  reason?: string;
  success?: boolean;
  [property: string]: unknown;
}

export interface OpenClawInstanceRuntime {
  arch?: string;
  configSource?: string;
  configUpdatedAt?: string;
  healthChecks?: OpenClawInstanceHealthCheck[];
  hostname?: string;
  lastControl?: OpenClawInstanceLastControl;
  lastError?: string;
  openclawVersion?: string;
  pendingFollowUp?: boolean;
  pendingFollowUpMode?: string;
  pendingFollowUpReason?: string;
  platform?: string;
  pluginAllowedMethods?: string[];
  pluginVersion?: string;
  startedAt?: string;
  supportedActions?: string[];
  uptimeSeconds?: number;
  [property: string]: unknown;
}

export interface OpenClawInstanceMCPServer {
  authType?: string;
  enabled?: boolean;
  envRefMissing?: string[];
  hasSecret?: boolean;
  lastProbeStatus?: string;
  serverName?: string;
  toolCount?: number;
  toolsPreview?: string[];
  transport?: string;
  [property: string]: unknown;
}

export interface OpenClawInstanceModel {
  alias?: string;
  allowed: boolean;
  api?: string;
  auth?: string;
  baseUrl?: string;
  cacheReadCost: number;
  cacheWriteCost: number;
  contextTokens: number;
  contextWindow: number;
  displayName: string;
  hasApiKey: boolean;
  input: string[];
  inputCost: number;
  maxTokens: number;
  modelId: string;
  modelRef: string;
  outputCost: number;
  providerId: string;
  reasoning: boolean;
  source: "provider_catalog" | "allowlist";
}

export interface OpenClawInstancePlugin {
  allowed: boolean;
  config: Record<string, unknown>;
  configured: boolean;
  denied: boolean;
  enabled: boolean;
  hasConfig: boolean;
  hasSecret: boolean;
  pluginId: string;
  slots: string[];
}

export interface OpenClawInstanceChannel {
  accountCount: number;
  channelId: string;
  config: Record<string, unknown>;
  enabled: boolean;
  hasSecret: boolean;
}

export interface OpenClawInstanceSkill {
  bundledAllowed: boolean;
  configured: boolean;
  enabled: boolean;
  hasApiKey: boolean;
  hasConfig: boolean;
  hasEnv: boolean;
  skillKey: string;
}

export interface OpenClawInstanceToolConfig {
  allow: string[];
  alsoAllow: string[];
  config: Record<string, unknown>;
  deny: string[];
  profile?: string;
}

export interface OpenClawInstanceSummary {
  agents?: OpenClawInstanceAgent[];
  channels?: OpenClawInstanceChannel[];
  config?: Record<string, unknown>;
  configHash?: string;
  connectedAt?: string;
  lastSeenAt?: string;
  latencyMs?: number;
  mcpServers?: OpenClawInstanceMCPServer[];
  models?: OpenClawInstanceModel[];
  online?: boolean;
  plugins?: OpenClawInstancePlugin[];
  pluginId?: string;
  runtime?: OpenClawInstanceRuntime;
  skills?: OpenClawInstanceSkill[];
  status?: string;
  toolConfig?: OpenClawInstanceToolConfig;
  warnings?: string[];
  [property: string]: unknown;
}

export type OpenClawInstanceDetail = OpenClawInstanceSummary;

export interface ReqOpenClawInstanceList {
  includeSkills?: boolean;
  skillMode?: "none" | "summary" | "full" | (string & {});
  [property: string]: unknown;
}

export interface ReqOpenClawInstanceDetail extends ReqOpenClawInstanceList {
  pluginId?: string;
}

export interface ReqControlOpenClawInstance {
  action?: "restart" | "reload" | (string & {});
  dryRun?: boolean;
  pluginId?: string;
  reason?: string;
  [property: string]: unknown;
}

export interface ControlOpenClawInstanceResult {
  acceptedAt?: string;
  action?: string;
  dryRun?: boolean;
  followUpMode?: string;
  followUpReason?: string;
  message?: string;
  success?: boolean;
  [property: string]: unknown;
}

export interface ResOpenClawInstanceSummaries {
  items?: OpenClawInstanceSummary[];
  [property: string]: unknown;
}

export interface OpenClawAgentConfigSnapshot {
  agentId?: string;
  description?: string;
  displayName?: string;
  sandboxToolsAlsoAllow?: string[];
  toolsAlsoAllow?: string[];
  [property: string]: unknown;
}

export interface OpenClawMCPServerSnapshot {
  enabled?: boolean;
  hasCommand?: boolean;
  hasUrl?: boolean;
  serverName?: string;
  toolFilterExclude?: string[];
  toolFilterInclude?: string[];
  transport?: string;
  [property: string]: unknown;
}

export interface OpenClawConfigSnapshot {
  agents?: OpenClawAgentConfigSnapshot[];
  channels?: OpenClawInstanceChannel[];
  configHash?: string;
  config?: Record<string, unknown>;
  mcpServers?: OpenClawMCPServerSnapshot[];
  models?: OpenClawInstanceModel[];
  plugins?: OpenClawInstancePlugin[];
  runtime?: OpenClawInstanceRuntime;
  skills?: OpenClawInstanceSkill[];
  toolConfig?: OpenClawInstanceToolConfig;
  [property: string]: unknown;
}

export interface ReqOpenClawConfigSnapshot {
  pluginId?: string;
  [property: string]: unknown;
}

export type OpenClawMCPApplyMode = "merge" | "replace_agent_mcp" | string;

export interface ReqApplyOpenClawMCPConfig {
  agentId?: string;
  dryRun?: boolean;
  mcpServerIds?: number[];
  mode?: OpenClawMCPApplyMode;
  pluginId?: string;
  validateEnvRefs?: boolean;
  [property: string]: unknown;
}

export interface OpenClawMCPApplyResult {
  changed?: string[];
  dryRun?: boolean;
  followUpMode?: string;
  followUpReason?: string;
  message?: string;
  snapshot?: OpenClawConfigSnapshot;
  success?: boolean;
  warnings?: string[];
  [property: string]: unknown;
}

export type SkillSource = "private" | "public" | "system" | string;

export interface SkillCatalogItem {
  description?: string;
  displayName?: string;
  eligible?: boolean;
  enabled?: boolean;
  groupName?: string;
  id?: number;
  installed?: boolean;
  readonly?: boolean;
  skillKey?: string;
  slug?: string;
  source?: SkillSource;
  sourceId?: string;
  sourceType?: string;
  tags?: string[];
  version?: string;
  visibleName?: string;
  visibleToAgent?: boolean;
  warnings?: string[];
  [property: string]: unknown;
}

export interface PrivateSkill {
  createdAt?: string;
  description?: string;
  displayName?: string;
  groupName?: string;
  id?: number;
  objectKey?: string;
  sha256?: string;
  sizeBytes?: number;
  slug?: string;
  storageType?: string;
  tags?: string[];
  updatedAt?: string;
  version?: string;
  visibleName?: string;
  [property: string]: unknown;
}

export interface PublicSkillSource {
  displayName?: string;
  enabled?: boolean;
  id?: string;
  indexUrl?: string;
  timeoutMs?: number;
  type?: string;
  [property: string]: unknown;
}

export interface PublicSkillSearchItem {
  archiveUrl?: string;
  description?: string;
  displayName?: string;
  homepage?: string;
  security?: Record<string, string>;
  sha256?: string;
  slug?: string;
  sourceId?: string;
  sourceType?: string;
  tags?: string[];
  version?: string;
  warnings?: string[];
  [property: string]: unknown;
}

export interface AgentSkill {
  description?: string;
  displayName?: string;
  eligible?: boolean;
  enabled?: boolean;
  installed?: boolean;
  name?: string;
  origin?: Record<string, string>;
  readonly?: boolean;
  skillKey?: string;
  source?: SkillSource;
  version?: string;
  visibleToAgent?: boolean;
  warnings?: string[];
  [property: string]: unknown;
}

export interface ReqSkillCatalogList extends ReqPagination {
  agentId?: string;
  pluginId?: string;
  query?: string;
  [property: string]: unknown;
}

export interface ResSkillCatalog {
  privateItems?: PrivateSkill[];
  privatePagination?: Pagination;
  publicItems?: SkillCatalogItem[];
  publicSources?: PublicSkillSource[];
  systemItems?: SkillCatalogItem[];
  warnings?: string[];
  [property: string]: unknown;
}

export interface ReqPrivateSkillList extends ReqPagination {
  query?: string;
}

export interface ResPrivateSkills {
  items?: PrivateSkill[];
  pagination?: Pagination;
  [property: string]: unknown;
}

export interface ResPrivateSkillGroups {
  groups?: string[];
  [property: string]: unknown;
}

export interface ReqPrivateSkillUpdate {
  description?: string;
  groupName?: string;
  id: number;
  visibleName?: string;
  [property: string]: unknown;
}

export interface ReqAgentSkillList {
  agentId?: string;
  pluginId?: string;
  [property: string]: unknown;
}

export interface ResAgentSkills {
  configHash?: string;
  items?: AgentSkill[];
  warnings?: string[];
  [property: string]: unknown;
}

export interface ReqAgentSkillApply {
  agentId?: string;
  dryRun?: boolean;
  force?: boolean;
  pluginId?: string;
  privateSkillId?: number;
  skillKey?: string;
  slug?: string;
  source?: SkillSource;
  sourceId?: string;
  sourceType?: string;
  timeoutMs?: number;
  version?: string;
  [property: string]: unknown;
}

export interface AgentSkillActionResult {
  changed?: string[];
  configHash?: string;
  dryRun?: boolean;
  followUpMode?: string;
  followUpReason?: string;
  message?: string;
  success?: boolean;
  warnings?: string[];
  [property: string]: unknown;
}

export interface ReqAgentSkillState {
  agentId?: string;
  dryRun?: boolean;
  enabled?: boolean;
  instanceScope?: boolean;
  pluginId?: string;
  skillKey?: string;
  [property: string]: unknown;
}

export interface ReqAgentSkillRemove {
  agentId?: string;
  dryRun?: boolean;
  pluginId?: string;
  skillKey?: string;
  [property: string]: unknown;
}

export interface ReqPrivateSkillDelete {
  id?: number;
  [property: string]: unknown;
}

export interface ReqPublicSkillSearch {
  limit?: number;
  pluginId?: string;
  query?: string;
  sourceId?: string;
  [property: string]: unknown;
}

export interface ResPublicSkillSearch {
  items?: PublicSkillSearchItem[];
  warnings?: string[];
  [property: string]: unknown;
}

export interface ReqPublicSkillDetail {
  pluginId?: string;
  slug?: string;
  sourceId?: string;
  version?: string;
  [property: string]: unknown;
}

export interface ReqPublicSkillSourcesList {
  onlyEnabled?: boolean;
  [property: string]: unknown;
}

export interface ResPublicSkillSources {
  items?: PublicSkillSource[];
  [property: string]: unknown;
}

export type AuthSession = {
  expireAt?: string;
  token: string;
  user?: User;
};

type ApiRequestInit = RequestInit & {
  auth?: boolean;
  timeoutMs?: number;
};

type ApiEnvelope<T> = {
  code?: number;
  data?: T;
  message?: string;
  success?: boolean;
};

export class ApiError extends Error {
  readonly payload: unknown;
  readonly status: number;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.payload = payload;
    this.status = status;
  }
}

export async function login(request: ReqLogin): Promise<ResLogin> {
  return requestJson<ResLogin>("/api/auth/login", {
    auth: false,
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function listUsers(request: ReqUserList = {}): Promise<User[]> {
  const response = await requestJson<ResUsers | User[]>("/api/users/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function createUser(
  request: ReqUserCreate,
): Promise<User | undefined> {
  const response = await requestJson<ResUser | User | undefined>(
    "/api/users/create",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResUser).data;

  return response;
}

export async function getUserDetail(id: number): Promise<User | undefined> {
  const response = await requestJson<ResUser | User | undefined>(
    "/api/users/detail",
    {
      body: JSON.stringify({ id } satisfies ReqUserDetail),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResUser).data;

  return response;
}

export async function updateUser(
  request: ReqUserUpdate,
): Promise<User | undefined> {
  const response = await requestJson<ResUser | User | undefined>(
    "/api/users/update",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResUser).data;

  return response;
}

export async function deleteUser(id: number): Promise<void> {
  await requestJson<ControllerResponse | unknown>("/api/users/delete", {
    body: JSON.stringify({ id } satisfies ReqUserDetail),
    method: "POST",
  });
}

export async function listModels(request: ReqModelList = {}): Promise<Model[]> {
  const response = await requestJson<ResModels | Model[]>("/api/models/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function listModelProviderCatalog(): Promise<
  ModelProviderCatalogProvider[]
> {
  const response = await requestJson<
    ResModelProviderCatalog | ModelProviderCatalogProvider[]
  >("/api/models/providers/catalog", {
    body: JSON.stringify({}),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.providers ?? [];
}

export async function createModel(
  request: ReqModelCreate,
): Promise<Model | undefined> {
  const response = await requestJson<ResModel | Model | undefined>(
    "/api/models/create",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResModel).data;

  return response;
}

export async function updateModel(
  request: ReqModelUpdate,
): Promise<Model | undefined> {
  const response = await requestJson<ResModel | Model | undefined>(
    "/api/models/update",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResModel).data;

  return response;
}

export async function deleteModel(id: number): Promise<void> {
  await requestJson<ControllerResponse | unknown>("/api/models/delete", {
    body: JSON.stringify({ id } satisfies ReqModelDelete),
    method: "POST",
  });
}

export async function syncModelsToOpenClaw(
  request: ReqSyncOpenClawModels,
): Promise<SyncOpenClawModelsResult | undefined> {
  return requestJson<SyncOpenClawModelsResult | undefined>(
    "/api/models/sync-openclaw",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listAgents(request: ReqAgentList = {}): Promise<Agent[]> {
  const response = await requestJson<ResAgents | Agent[]>("/api/agents/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function createAgent(
  request: ReqAgentCreate,
): Promise<Agent | undefined> {
  const response = await requestJson<ResAgent | Agent | undefined>(
    "/api/agents/create",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResAgent).data;

  return response;
}

export async function getAgentDetail(id: number): Promise<Agent | undefined> {
  const response = await requestJson<ResAgent | Agent | undefined>(
    "/api/agents/detail",
    {
      body: JSON.stringify({ id } satisfies ReqAgentDetail),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResAgent).data;

  return response;
}

export async function updateAgent(
  request: ReqAgentUpdate,
): Promise<Agent | undefined> {
  const response = await requestJson<ResAgent | Agent | undefined>(
    "/api/agents/update",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (!response) return undefined;
  if ("data" in response) return (response as ResAgent).data;

  return response;
}

export async function deleteAgent(id: number): Promise<void> {
  await requestJson<ControllerResponse | unknown>("/api/agents/delete", {
    body: JSON.stringify({ id } satisfies ReqAgentDelete),
    method: "POST",
  });
}

export async function initDevAgent(
  request: ReqAgentInitDev,
): Promise<AgentDeployment | undefined> {
  return requestJson<AgentDeployment | undefined>("/api/agents/init-dev", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function readAgentMarkdown(
  request: ReqAgentMarkdownRead,
): Promise<ResAgentMarkdownFiles> {
  return requestJson<ResAgentMarkdownFiles>("/api/agents/markdown/read", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function saveAgentMarkdown(
  request: ReqAgentMarkdownSave,
): Promise<ResAgentMarkdownSave | undefined> {
  return requestJson<ResAgentMarkdownSave | undefined>(
    "/api/agents/markdown/save",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function createAgentExport(
  request: ReqAgentExportCreate,
): Promise<AgentExport | undefined> {
  return requestJson<AgentExport | undefined>("/api/agents/exports/create", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function listAgentExports(
  request: ReqAgentExportList,
): Promise<ResAgentExports> {
  return requestJson<ResAgentExports>("/api/agents/exports/list", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function deployAgentExport(
  request: ReqAgentExportDeploy,
): Promise<ResAgentDeployments> {
  return requestJson<ResAgentDeployments>("/api/agents/exports/deploy", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function listAgentDeployments(
  request: ReqAgentDeploymentList,
): Promise<AgentDeployment[]> {
  const response = await requestJson<ResAgentDeployments | AgentDeployment[]>(
    "/api/agents/deployments/list",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.items ?? [];
}

export async function uninstallAgentDeployment(
  request: ReqAgentDeploymentUninstall,
): Promise<AgentDeployment | undefined> {
  return requestJson<AgentDeployment | undefined>(
    "/api/agents/deployments/uninstall",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function importAgent(
  request: ReqAgentImport,
): Promise<ResAgentImport | undefined> {
  return requestJson<ResAgentImport | undefined>("/api/agents/import", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function listUserModels(
  request: ReqUserModelsList,
): Promise<Model[]> {
  const response = await requestJson<ResModels | Model[]>(
    "/api/users/models/list",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function replaceUserModels(
  request: ReqUserModelsReplace,
): Promise<Model[]> {
  const response = await requestJson<ResModels | Model[]>(
    "/api/users/models/replace",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function listUserAgents(
  request: ReqUserAgentsList,
): Promise<Agent[]> {
  const response = await requestJson<ResAgents | Agent[]>(
    "/api/users/agents/list",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function replaceUserAgents(
  request: ReqUserAgentsReplace,
): Promise<Agent[]> {
  const response = await requestJson<ResAgents | Agent[]>(
    "/api/users/agents/replace",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const response = await requestJson<ResKnowledgeBaseList | KnowledgeBase[]>(
    "/api/knowledge-bases/list",
    {
      body: JSON.stringify({}),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.items ?? [];
}

export async function createKnowledgeBaseFromUrl(
  request: ReqCreateKnowledgeBaseUrl,
): Promise<KnowledgeBase | undefined> {
  return requestJson<KnowledgeBase | undefined>(
    "/api/knowledge-bases/create-url",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function retryKnowledgeBase(
  knowledgeBaseId: number,
): Promise<KnowledgeBase | undefined> {
  return requestJson<KnowledgeBase | undefined>("/api/knowledge-bases/retry", {
    body: JSON.stringify({ knowledgeBaseId } satisfies ReqRetryKnowledgeBase),
    method: "POST",
  });
}

export async function deleteKnowledgeBase(
  knowledgeBaseId: number,
): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/knowledge-bases/delete",
    {
      body: JSON.stringify({
        knowledgeBaseId,
      } satisfies ReqDeleteKnowledgeBase),
      method: "POST",
    },
  );
}

export async function replaceUserKnowledgeBases(
  request: ReqReplaceUserKnowledgeBases,
): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/knowledge-bases/users/replace",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function replaceAgentKnowledgeBases(
  request: ReqReplaceAgentKnowledgeBases,
): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/knowledge-bases/agents/replace",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function getTencentCosSts(): Promise<TencentCosSts | undefined> {
  return requestJson<TencentCosSts | undefined>("/api/cos/sts", {
    method: "POST",
  });
}

export async function getUserBalance(
  request: ReqUserBalanceDetail,
): Promise<UserBalance | undefined> {
  return requestJson<UserBalance | undefined>("/api/users/balances/detail", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function listUserBalanceTransactions(
  request: ReqUserBalanceTransactionsList,
): Promise<UserBalanceTransaction[]> {
  const response = await requestJson<
    { data?: UserBalanceTransaction[] } | UserBalanceTransaction[]
  >("/api/users/balances/transactions/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function adjustUserBalance(
  request: ReqUserBalanceAdjust,
): Promise<UserBalanceAdjustResult | undefined> {
  return requestJson<UserBalanceAdjustResult | undefined>(
    "/api/users/balances/adjust",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listSubscriptionPlans(
  request: ReqSubscriptionPlanList = {},
): Promise<SubscriptionPlan[]> {
  const response = await requestJson<ResSubscriptionPlans | SubscriptionPlan[]>(
    "/api/subscriptions/plans/list",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.data ?? response.items ?? [];
}

export async function createSubscriptionPlan(
  request: ReqSubscriptionPlanCreate,
): Promise<SubscriptionPlan | undefined> {
  const response = await requestJson<
    ResSubscriptionPlan | SubscriptionPlan | undefined
  >("/api/subscriptions/plans/create", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (!response) return undefined;
  if ("data" in response) return (response as ResSubscriptionPlan).data;

  return response;
}

export async function getSubscriptionPlanDetail(
  id: number,
): Promise<SubscriptionPlan | undefined> {
  const response = await requestJson<
    ResSubscriptionPlan | SubscriptionPlan | undefined
  >("/api/subscriptions/plans/detail", {
    body: JSON.stringify({ id } satisfies ReqSubscriptionPlanDetail),
    method: "POST",
  });

  if (!response) return undefined;
  if ("data" in response) return (response as ResSubscriptionPlan).data;

  return response;
}

export async function updateSubscriptionPlan(
  request: ReqSubscriptionPlanUpdate,
): Promise<SubscriptionPlan | undefined> {
  const response = await requestJson<
    ResSubscriptionPlan | SubscriptionPlan | undefined
  >("/api/subscriptions/plans/update", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (!response) return undefined;
  if ("data" in response) return (response as ResSubscriptionPlan).data;

  return response;
}

export async function deleteSubscriptionPlan(id: number): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/subscriptions/plans/delete",
    {
      body: JSON.stringify({ id } satisfies ReqSubscriptionPlanDetail),
      method: "POST",
    },
  );
}

export async function grantUserSubscription(
  request: ReqSubscriptionGrant,
): Promise<UserSubscriptionView | undefined> {
  return requestJson<UserSubscriptionView | undefined>(
    "/api/subscriptions/grant",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function getCurrentSubscription(
  request: ReqCurrentSubscription,
): Promise<UserSubscriptionView | undefined> {
  return requestJson<UserSubscriptionView | undefined>(
    "/api/subscriptions/current",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listSubscriptionTransactions(
  request: ReqSubscriptionTransactionsList,
): Promise<SubscriptionTransaction[]> {
  const response = await requestJson<
    ResSubscriptionTransactions | SubscriptionTransaction[]
  >("/api/subscriptions/transactions/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.data ?? response.items ?? [];
}

export async function listConversations(
  request: ReqConversationList = {},
): Promise<BridgeConversation[]> {
  const response = await requestJson<
    { data?: BridgeConversation[] } | BridgeConversation[]
  >("/api/conversations/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function getConversationDetail(
  conversationId: string,
): Promise<BridgeConversation | undefined> {
  return requestJson<BridgeConversation | undefined>(
    "/api/conversations/detail",
    {
      body: JSON.stringify({ conversationId } satisfies ReqConversationDetail),
      method: "POST",
    },
  );
}

export async function archiveConversation(
  conversationId: string,
): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/conversations/archive",
    {
      body: JSON.stringify({ conversationId } satisfies ReqConversationArchive),
      method: "POST",
    },
  );
}

export async function unarchiveConversation(
  conversationId: string,
): Promise<void> {
  await requestJson<ControllerResponse | unknown>(
    "/api/conversations/unarchive",
    {
      body: JSON.stringify({ conversationId } satisfies ReqConversationArchive),
      method: "POST",
    },
  );
}

export async function listMessages(
  request: ReqMessageList,
): Promise<BridgeMessage[]> {
  const response = await requestJson<
    { data?: BridgeMessage[] } | BridgeMessage[]
  >("/api/messages/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.data ?? [];
}

export async function getConversationContext(
  request: ReqConversationContext,
): Promise<ContextSnapshot | undefined> {
  return requestJson<ContextSnapshot | undefined>(
    "/api/conversations/context",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function getTokenUsageStatsByConversation(
  conversationId: string,
): Promise<TokenUsageStatsConversation | undefined> {
  return requestJson<TokenUsageStatsConversation | undefined>(
    "/api/token-usages/stats/conversation",
    {
      body: JSON.stringify({
        conversationId,
      } satisfies ReqTokenUsageStatsConversation),
      method: "POST",
    },
  );
}

export async function getTokenUsageStatsByTime(
  request: ReqTokenUsageStatsTime,
): Promise<TokenUsageStatsTime | undefined> {
  return requestJson<TokenUsageStatsTime | undefined>(
    "/api/token-usages/stats/time",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function getTokenUsageStatsByUsers(
  request: ReqTokenUsageStatsUsers,
): Promise<TokenUsageStatsUsers | undefined> {
  return requestJson<TokenUsageStatsUsers | undefined>(
    "/api/token-usages/stats/users",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function applyOpenClawConfig(
  request: ReqApplyOpenClawConfig,
): Promise<ApplyOpenClawConfigResult | undefined> {
  return requestJson<ApplyOpenClawConfigResult | undefined>(
    "/api/openclaw/config/apply",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listMCPServers(
  request: ReqMCPServerList = {},
): Promise<MCPServer[]> {
  const response = await requestJson<ResMCPServers | MCPServer[]>(
    "/api/mcp-servers/list",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );

  if (Array.isArray(response)) return response;

  return response.items ?? [];
}

export async function createMCPServer(
  request: ReqMCPServerCreate,
): Promise<MCPServer | undefined> {
  return requestJson<ResMCPServer | undefined>("/api/mcp-servers/create", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function getMCPServerDetail(
  id: number,
): Promise<MCPServer | undefined> {
  return requestJson<ResMCPServer | undefined>("/api/mcp-servers/detail", {
    body: JSON.stringify({ id } satisfies ReqMCPServerDetail),
    method: "POST",
  });
}

export async function updateMCPServer(
  request: ReqMCPServerUpdate,
): Promise<MCPServer | undefined> {
  return requestJson<ResMCPServer | undefined>("/api/mcp-servers/update", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function deleteMCPServer(id: number): Promise<void> {
  await requestJson<ControllerResponse | unknown>("/api/mcp-servers/delete", {
    body: JSON.stringify({ id } satisfies ReqMCPServerDetail),
    method: "POST",
  });
}

export async function listOpenClawPluginLibrary(
  request: ReqOpenClawPluginLibraryList = {},
): Promise<ResOpenClawPluginLibrary> {
  return requestJson<ResOpenClawPluginLibrary>(
    "/api/openclaw/plugins/library/list",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function getOpenClawPluginLibraryDetail(
  id: number,
): Promise<OpenClawPlugin | undefined> {
  return requestJson<OpenClawPlugin | undefined>(
    "/api/openclaw/plugins/library/detail",
    {
      body: JSON.stringify({ id }),
      method: "POST",
    },
  );
}

export async function uploadOpenClawPluginPackage(
  file: File,
  force = false,
): Promise<OpenClawPlugin | undefined> {
  const formData = new FormData();

  formData.set("file", file);
  formData.set("force", String(force));

  return requestJson<OpenClawPlugin | undefined>(
    "/api/openclaw/plugins/library/upload",
    {
      body: formData,
      method: "POST",
    },
  );
}

export async function importOpenClawPluginPackage(
  request: ReqOpenClawPluginLibraryImport,
): Promise<OpenClawPlugin | undefined> {
  return requestJson<OpenClawPlugin | undefined>(
    "/api/openclaw/plugins/library/import-url",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function updateOpenClawPluginLibrary(
  request: ReqOpenClawPluginLibraryUpdate,
): Promise<OpenClawPlugin | undefined> {
  return requestJson<OpenClawPlugin | undefined>(
    "/api/openclaw/plugins/library/update",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function deleteOpenClawPluginLibrary(
  id: number,
): Promise<OpenClawPlugin | undefined> {
  return requestJson<OpenClawPlugin | undefined>(
    "/api/openclaw/plugins/library/delete",
    {
      body: JSON.stringify({ id }),
      method: "POST",
    },
  );
}

export async function listOpenClawPluginInstalls(
  request: ReqOpenClawPluginInstallsList = {},
): Promise<OpenClawPluginInstall[]> {
  const response = await requestJson<
    { items?: OpenClawPluginInstall[] } | OpenClawPluginInstall[]
  >("/api/openclaw/plugins/instances/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.items ?? [];
}

export async function installOpenClawPlugin(
  request: ReqOpenClawPluginInstall,
): Promise<OpenClawPluginInstallResult | undefined> {
  return requestJson<OpenClawPluginInstallResult | undefined>(
    "/api/openclaw/plugins/instances/install",
    {
      body: JSON.stringify(request),
      method: "POST",
      timeoutMs: 650_000,
    },
  );
}

export async function uninstallOpenClawPlugin(
  request: ReqOpenClawPluginInstanceAction,
): Promise<OpenClawPluginInstallResult | undefined> {
  return requestJson<OpenClawPluginInstallResult | undefined>(
    "/api/openclaw/plugins/instances/uninstall",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function enableOpenClawPlugin(
  request: ReqOpenClawPluginInstanceAction,
): Promise<OpenClawPluginInstallResult | undefined> {
  return requestJson<OpenClawPluginInstallResult | undefined>(
    "/api/openclaw/plugins/instances/enable",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function disableOpenClawPlugin(
  request: ReqOpenClawPluginInstanceAction,
): Promise<OpenClawPluginInstallResult | undefined> {
  return requestJson<OpenClawPluginInstallResult | undefined>(
    "/api/openclaw/plugins/instances/disable",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function replaceOpenClawPluginAgents(
  request: ReqOpenClawPluginAgentsReplace,
): Promise<OpenClawPluginInstallResult | undefined> {
  return requestJson<OpenClawPluginInstallResult | undefined>(
    "/api/openclaw/plugins/instances/agents/replace",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listOpenClawInstanceSummaries(
  request: ReqOpenClawInstanceList = {},
): Promise<OpenClawInstanceSummary[]> {
  const response = await requestJson<
    ResOpenClawInstanceSummaries | OpenClawInstanceSummary[]
  >("/api/openclaw/instances/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.items ?? [];
}

export async function getOpenClawInstanceDetail(
  request: ReqOpenClawInstanceDetail,
  options: Pick<ApiRequestInit, "signal" | "timeoutMs"> = {},
): Promise<OpenClawInstanceDetail | undefined> {
  return requestJson<OpenClawInstanceDetail | undefined>(
    "/api/openclaw/instances/detail",
    {
      body: JSON.stringify(request),
      method: "POST",
      ...options,
    },
  );
}

export async function controlOpenClawInstance(
  request: ReqControlOpenClawInstance,
): Promise<ControlOpenClawInstanceResult | undefined> {
  return requestJson<ControlOpenClawInstanceResult | undefined>(
    "/api/openclaw/instances/control",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listOpenClawRPCInstances(): Promise<
  OpenClawRPCInstance[]
> {
  const response = await requestJson<
    ResOpenClawRPCInstances | OpenClawRPCInstance[]
  >("/api/openclaw/instances/list", {
    body: JSON.stringify({}),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.items ?? [];
}

export async function getOpenClawConfigSnapshot(
  request: ReqOpenClawConfigSnapshot,
): Promise<OpenClawConfigSnapshot | undefined> {
  return requestJson<OpenClawConfigSnapshot | undefined>(
    "/api/openclaw/config/snapshot",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function applyOpenClawMCPConfig(
  request: ReqApplyOpenClawMCPConfig,
): Promise<OpenClawMCPApplyResult | undefined> {
  return requestJson<OpenClawMCPApplyResult | undefined>(
    "/api/openclaw/mcp/apply",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listSkillCatalog(
  request: ReqSkillCatalogList = {},
): Promise<ResSkillCatalog> {
  return requestJson<ResSkillCatalog>("/api/openclaw/skills/catalog/list", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function listPrivateSkills(
  request: ReqPrivateSkillList = {},
): Promise<ResPrivateSkills> {
  return requestJson<ResPrivateSkills>("/api/openclaw/skills/private/list", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function listPrivateSkillGroups(): Promise<ResPrivateSkillGroups> {
  return requestJson<ResPrivateSkillGroups>(
    "/api/openclaw/skills/private/groups",
    {
      method: "POST",
    },
  );
}

export async function listAgentSkills(
  request: ReqAgentSkillList,
): Promise<ResAgentSkills> {
  return requestJson<ResAgentSkills>("/api/openclaw/skills/agent/list", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function applyAgentSkill(
  request: ReqAgentSkillApply,
): Promise<AgentSkillActionResult | undefined> {
  return requestJson<AgentSkillActionResult | undefined>(
    "/api/openclaw/skills/agent/apply",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function enableAgentSkill(
  request: ReqAgentSkillState,
): Promise<AgentSkillActionResult | undefined> {
  return requestJson<AgentSkillActionResult | undefined>(
    "/api/openclaw/skills/agent/enable",
    {
      body: JSON.stringify({ ...request, enabled: true }),
      method: "POST",
    },
  );
}

export async function disableAgentSkill(
  request: ReqAgentSkillState,
): Promise<AgentSkillActionResult | undefined> {
  return requestJson<AgentSkillActionResult | undefined>(
    "/api/openclaw/skills/agent/disable",
    {
      body: JSON.stringify({ ...request, enabled: false }),
      method: "POST",
    },
  );
}

export async function removeAgentSkill(
  request: ReqAgentSkillRemove,
): Promise<AgentSkillActionResult | undefined> {
  return requestJson<AgentSkillActionResult | undefined>(
    "/api/openclaw/skills/agent/remove",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function uploadPrivateSkill(
  file: File,
  version?: string,
  groupName?: string,
  visibleName?: string,
): Promise<PrivateSkill | undefined> {
  const formData = new FormData();

  formData.set("file", file);
  if (version?.trim()) formData.set("version", version.trim());
  if (groupName?.trim()) formData.set("groupName", groupName.trim());
  if (visibleName?.trim()) formData.set("visibleName", visibleName.trim());

  return requestJson<PrivateSkill | undefined>(
    "/api/openclaw/skills/private/upload",
    {
      body: formData,
      method: "POST",
    },
  );
}

export async function updatePrivateSkill(
  request: ReqPrivateSkillUpdate,
): Promise<PrivateSkill> {
  return requestJson<PrivateSkill>("/api/openclaw/skills/private/update", {
    body: JSON.stringify(request),
    method: "POST",
  });
}

export async function deletePrivateSkill(id: number): Promise<PrivateSkill> {
  return requestJson<PrivateSkill>("/api/openclaw/skills/private/delete", {
    body: JSON.stringify({ id } satisfies ReqPrivateSkillDelete),
    method: "POST",
  });
}

export async function searchPublicSkills(
  request: ReqPublicSkillSearch,
): Promise<ResPublicSkillSearch> {
  return requestJson<ResPublicSkillSearch>(
    "/api/openclaw/skills/public/search",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function getPublicSkillDetail(
  request: ReqPublicSkillDetail,
): Promise<PublicSkillSearchItem | undefined> {
  return requestJson<PublicSkillSearchItem | undefined>(
    "/api/openclaw/skills/public/detail",
    {
      body: JSON.stringify(request),
      method: "POST",
    },
  );
}

export async function listPublicSkillSources(
  request: ReqPublicSkillSourcesList = {},
): Promise<PublicSkillSource[]> {
  const response = await requestJson<
    ResPublicSkillSources | PublicSkillSource[]
  >("/api/openclaw/skills/public/sources/list", {
    body: JSON.stringify(request),
    method: "POST",
  });

  if (Array.isArray(response)) return response;

  return response.items ?? [];
}

export function readStoredAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!value) return null;

    const session = JSON.parse(value) as Partial<AuthSession>;

    if (!session.token || isExpired(session.expireAt)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);

      return null;
    }

    return {
      expireAt: session.expireAt,
      token: session.token,
      user: session.user,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);

    return null;
  }
}

async function requestJson<T>(path: string, init: ApiRequestInit): Promise<T> {
  const { auth = true, headers, signal, timeoutMs, ...requestInit } = init;
  const requestHeaders = new Headers(headers);
  const timeoutController = timeoutMs ? new AbortController() : undefined;
  const abortOnCallerSignal = () => timeoutController?.abort(signal?.reason);
  const timeoutId = timeoutController
    ? setTimeout(() => timeoutController.abort(), timeoutMs)
    : undefined;

  if (signal?.aborted) {
    abortOnCallerSignal();
  } else {
    signal?.addEventListener("abort", abortOnCallerSignal, { once: true });
  }

  if (
    requestInit.body &&
    !(requestInit.body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = readStoredAuthSession()?.token;

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(toApiUrl(path), {
      ...requestInit,
      headers: requestHeaders,
      signal: timeoutController?.signal ?? signal,
    });

    const payload = await readPayload(response);
    const envelopeError = getEnvelopeError(payload);

    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }

    if (!response.ok || envelopeError) {
      throw new ApiError(
        envelopeError ?? getErrorMessage(payload),
        response.status,
        payload,
      );
    }

    return unwrapPayload<T>(payload);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);

    signal?.removeEventListener("abort", abortOnCallerSignal);
  }
}

async function readPayload(response: globalThis.Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(payload: unknown): string {
  if (typeof payload === "string" && payload.trim()) return payload;

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;

    for (const key of ["message", "error", "msg"]) {
      const value = record[key];

      if (typeof value === "string" && value.trim()) return value;
    }
  }

  return "登录失败，请检查用户名或密码。";
}

function getEnvelopeError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const envelope = payload as ApiEnvelope<unknown>;

  if (envelope.success === false) {
    return envelope.message?.trim() || "请求失败。";
  }

  return null;
}

function unwrapPayload<T>(payload: unknown): T {
  if (payload && typeof payload === "object") {
    const envelope = payload as ApiEnvelope<T>;

    if ("data" in envelope) return envelope.data as T;
  }

  return payload as T;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isExpired(expireAt?: string) {
  if (!expireAt) return false;

  const expiresAt = new Date(expireAt).getTime();

  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

function toApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const normalizedPath = `/${path.replace(/^\/+/, "")}`;

  if (typeof window !== "undefined") {
    return `${API_PROXY_BASE_URL}${normalizedPath}`;
  }

  return `${trimTrailingSlash(API_BASE_URL)}${normalizedPath}`;
}
