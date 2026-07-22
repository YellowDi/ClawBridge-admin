"use client";

import type { FormEvent } from "react";

import Image from "next/image";
import {
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import { useState } from "react";

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
      const message = "请输入用户名和密码。";

      setError(message);
      toast.danger(message);

      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(normalizedUsername, password);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "登录失败，请稍后重试。";

      setError(message);
      toast.danger(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden p-4">
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        src="/media/brand-login.mp4"
        tabIndex={-1}
      />
      <Card className="relative z-10 w-full max-w-sm bg-card/90 backdrop-blur-xl">
        <Card.Header className="items-center text-center">
          <div className="mb-2 flex justify-center">
            <Image
              unoptimized
              alt="ClawBridge"
              className="h-10 w-auto max-w-[210px] dark:hidden"
              height={68}
              src="/sidebar-logo-light.svg"
              width={332}
            />
            <Image
              unoptimized
              alt="ClawBridge"
              className="hidden h-10 w-auto max-w-[210px] dark:block"
              height={68}
              src="/sidebar-logo-dark.svg"
              width={332}
            />
          </div>
        </Card.Header>
        <Card.Content>
          <Form className="grid gap-4" onSubmit={handleSubmit}>
            {error ? (
              <div className="text-sm text-danger" role="alert">
                {error}
              </div>
            ) : null}
            <TextField
              fullWidth
              isRequired
              isDisabled={isSubmitting}
              name="username"
              value={username}
              onChange={setUsername}
            >
              <Label>账号</Label>
              <Input
                autoComplete="username"
                placeholder="请输入账号"
                variant="secondary"
              />
              <FieldError />
            </TextField>

            <TextField
              fullWidth
              isRequired
              isDisabled={isSubmitting}
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
            >
              <Label>密码</Label>
              <Input
                autoComplete="current-password"
                placeholder="请输入密码"
                variant="secondary"
              />
              <FieldError />
            </TextField>

            <Button fullWidth isPending={isSubmitting} type="submit">
              {isSubmitting ? "验证中..." : "登录"}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </main>
  );
}
