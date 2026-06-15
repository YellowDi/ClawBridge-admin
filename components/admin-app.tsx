"use client";

import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin-shell";
import { useAuth } from "@/components/auth-provider";
import { LoginPage } from "@/components/login-page";

export function AdminApp({ children }: { children: ReactNode }) {
  const { initialized, session } = useAuth();

  if (!initialized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-muted text-sm">正在恢复登录状态...</div>
      </main>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <AdminShell>{children}</AdminShell>;
}
