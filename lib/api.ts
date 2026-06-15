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

export interface ResUsers {
  data?: User[];
  [property: string]: unknown;
}

export interface ReqUserCreate {
  enabled?: boolean;
  isAdmin?: boolean;
  password?: string;
  username?: string;
  [property: string]: unknown;
}

export interface ResUser {
  data?: User;
  [property: string]: unknown;
}

export interface User {
  createdAt?: string;
  enabled?: boolean;
  id?: number;
  isAdmin?: boolean;
  password?: string;
  updatedAt?: string;
  username?: string;
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

export async function listUsers(): Promise<User[]> {
  const response = await requestJson<ResUsers | User[]>("/api/users/list", {
    body: JSON.stringify({}),
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

export async function apiFetch<T>(path: string, init: ApiRequestInit = {}) {
  return requestJson<T>(path, init);
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
