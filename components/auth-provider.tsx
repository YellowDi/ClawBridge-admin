"use client";

import type { ReactNode } from "react";
import type { AuthSession, ResLogin, User } from "@/lib/api";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiError,
  AUTH_STORAGE_KEY,
  login as requestLogin,
  readStoredAuthSession,
} from "@/lib/api";

type AuthContextValue = {
  initialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  session: AuthSession | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const storedSession = readStoredAuthSession();

    setSession(sanitizeSession(storedSession));
    setInitialized(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await requestLogin({ password, username });
    const nextSession = createSession(response);

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ initialized, login, logout, session }),
    [initialized, login, logout, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return value;
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
