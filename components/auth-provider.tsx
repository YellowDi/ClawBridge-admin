"use client";

import type { ReactNode } from "react";
import type { AuthSession, ResLogin, User } from "@/lib/api";

import {
  createContext,
  useCallback,
  use,
  useMemo,
  useSyncExternalStore,
} from "react";

import { ApiError, AUTH_STORAGE_KEY, login as requestLogin } from "@/lib/api";

type AuthContextValue = {
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  session: AuthSession | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_SESSION_CHANGED_EVENT = "clawbridge-admin.auth.changed";

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionSnapshot = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getServerAuthSessionSnapshot,
  );
  const session = useMemo(
    () =>
      sessionSnapshot === null
        ? null
        : sanitizeSession(parseAuthSessionSnapshot(sessionSnapshot)),
    [sessionSnapshot],
  );
  const initialized = sessionSnapshot !== null;

  const login = useCallback(async (username: string, password: string) => {
    const response = await requestLogin({ password, username });
    const nextSession = createSession(response);

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    notifyAuthSessionChanged();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    notifyAuthSessionChanged();
  }, []);

  const value = useMemo(
    () => ({ initialized, login, logout, session }),
    [initialized, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = use(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
}

function subscribeAuthSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onStoreChange);
  };
}

function getAuthSessionSnapshot() {
  return localStorage.getItem(AUTH_STORAGE_KEY) ?? "";
}

function getServerAuthSessionSnapshot() {
  return null;
}

function notifyAuthSessionChanged() {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function parseAuthSessionSnapshot(value: string): AuthSession | null {
  if (!value) return null;

  try {
    const session = JSON.parse(value) as Partial<AuthSession>;

    if (!session.token || isAuthSessionExpired(session.expireAt)) return null;

    return {
      expireAt: session.expireAt,
      token: session.token,
      user: session.user,
    };
  } catch {
    return null;
  }
}

function createSession(response: ResLogin): AuthSession {
  if (!response.token) {
    throw new ApiError("登录响应缺少 token。", 200, response);
  }

  return {
    expireAt: response.expireAt,
    token: response.token,
    user: sanitizeUser(response.user),
  };
}

function sanitizeUser(user?: User): User | undefined {
  if (!user) return undefined;

  const safeUser = { ...user };

  delete safeUser.password;

  return safeUser;
}

function sanitizeSession(session: AuthSession | null): AuthSession | null {
  if (!session) return null;

  return {
    expireAt: session.expireAt,
    token: session.token,
    user: sanitizeUser(session.user),
  };
}

function isAuthSessionExpired(expireAt?: string) {
  if (!expireAt) return false;

  const expiresAt = new Date(expireAt).getTime();

  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}
