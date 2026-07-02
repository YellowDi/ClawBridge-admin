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
  enabled?: boolean;
  isAdmin?: boolean;
  password?: string;
  username?: string;
  [property: string]: unknown;
}

export interface ReqUserDetail {
  id?: number;
  [property: string]: unknown;
}

export interface ReqUserUpdate {
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
  createdAt?: string;
  enabled?: boolean;
  id?: number;
  isAdmin?: boolean;
  isDelete?: number;
  knowledgeBases?: KnowledgeBase[];
  password?: string;
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
  outputPricePerMillion?: string;
  provider?: string;
  unitPriceAmount?: string;
  updatedAt?: string;
  [property: string]: unknown;
}

export interface ReqAgentCreate {
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
  status?: string;
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

export type AuthSession = {
  expireAt?: string;
  token: string;
  user?: User;
};

type ApiRequestInit = RequestInit & {
  auth?: boolean;
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
  const { auth = true, headers, ...requestInit } = init;
  const requestHeaders = new Headers(headers);

  if (requestInit.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = readStoredAuthSession()?.token;

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(toApiUrl(path), {
    ...requestInit,
    headers: requestHeaders,
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
