"use client";

import type { FormEvent } from "react";

import { Button, Chip, InputGroup, TextField } from "@heroui/react";
import { useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { useAuth } from "@/components/auth-provider";
import { API_BASE_URL } from "@/lib/api";

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-lg border border-separator bg-surface shadow-xl lg:grid-cols-[1fr_420px]">
        <section className="flex min-h-[420px] flex-col justify-between bg-surface-secondary p-8 sm:p-10">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <AdminIcon className="size-5" name="shield" />
              </div>
              <div className="min-w-0">
                <h1 className="text-foreground text-xl font-semibold tracking-normal">
                  ClawBridge Admin
                </h1>
                <p className="text-muted mt-1 text-sm">管理后台登录</p>
              </div>
            </div>
            <p className="text-muted max-w-xl text-sm leading-6">
              当前处于接口开发阶段，登录成功后会保存
              JWT，用于后续接入用户、模型和审计接口。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip color="warning" size="sm" variant="soft">
              Dev API
            </Chip>
            <span className="text-muted text-xs">{API_BASE_URL}</span>
          </div>
        </section>

        <section className="bg-background p-6 sm:p-8">
          <form
            className="flex h-full flex-col justify-center gap-5"
            onSubmit={handleSubmit}
          >
            <div>
              <h2 className="text-foreground text-lg font-semibold">登录</h2>
              <p className="text-muted mt-1 text-sm">
                使用后台账号继续访问控制台。
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  className="text-foreground text-sm font-medium"
                  htmlFor="login-username"
                >
                  用户名
                </label>
                <TextField aria-label="用户名" isDisabled={isSubmitting}>
                  <InputGroup>
                    <InputGroup.Input
                      autoComplete="username"
                      id="login-username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                  </InputGroup>
                </TextField>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="text-foreground text-sm font-medium"
                  htmlFor="login-password"
                >
                  密码
                </label>
                <TextField aria-label="密码" isDisabled={isSubmitting}>
                  <InputGroup>
                    <InputGroup.Input
                      autoComplete="current-password"
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </InputGroup>
                </TextField>
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <Button fullWidth isDisabled={isSubmitting} type="submit">
              {isSubmitting ? "登录中..." : "登录"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
