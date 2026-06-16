"use client";

import type { FormEvent } from "react";

import { Button, InputGroup, Label, TextField } from "@heroui/react";
import { useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { useAuth } from "@/components/auth-provider";

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setError("请输入用户名和密码。");

      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(normalizedUsername, password);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "登录失败，请稍后重试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="w-full max-w-[420px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-accent text-accent-foreground shadow-[0_12px_32px_-18px_rgba(34,197,94,0.9)]">
            <AdminIcon className="size-5" name="shield" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-normal text-foreground">
            ClawBridge Admin
          </h1>
          <p className="mt-2 text-sm text-muted">登录管理控制台</p>
        </div>

        <form
          className="flex flex-col gap-5 rounded-lg bg-surface p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_16px_44px_-28px_rgba(0,0,0,0.42)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.09)] sm:p-7"
          onSubmit={handleSubmit}
        >
          <TextField
            fullWidth
            aria-label="用户名"
            isDisabled={isSubmitting}
            name="username"
          >
            <Label className="text-sm font-medium text-foreground">
              用户名
            </Label>
            <InputGroup fullWidth variant="secondary">
              <InputGroup.Prefix>
                <AdminIcon className="size-4 text-muted" name="users" />
              </InputGroup.Prefix>
              <InputGroup.Input
                autoComplete="username"
                className="text-sm"
                id="login-username"
                placeholder="请输入用户名"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </InputGroup>
          </TextField>

          <TextField
            fullWidth
            aria-label="密码"
            isDisabled={isSubmitting}
            name="password"
          >
            <Label className="text-sm font-medium text-foreground">密码</Label>
            <InputGroup fullWidth variant="secondary">
              <InputGroup.Prefix>
                <AdminIcon className="size-4 text-muted" name="shield" />
              </InputGroup.Prefix>
              <InputGroup.Input
                autoComplete="current-password"
                className="text-sm"
                id="login-password"
                placeholder="请输入密码"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </InputGroup>
          </TextField>

          {error ? (
            <div
              className="rounded-md bg-danger/10 px-3 py-2.5 text-sm leading-5 text-danger shadow-[0_0_0_1px_rgba(239,68,68,0.22)]"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <Button
            fullWidth
            className="h-11 font-medium"
            isDisabled={isSubmitting}
            isPending={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "验证中..." : "登录"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted">
          仅限授权管理员访问
        </p>
      </section>
    </main>
  );
}
