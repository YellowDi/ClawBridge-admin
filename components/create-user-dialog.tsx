"use client";

import type { FormEvent } from "react";

import {
  Button,
  InputGroup,
  Modal,
  Switch,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { createUser } from "@/lib/api";

type CreateUserForm = {
  enabled: boolean;
  isAdmin: boolean;
  password: string;
  username: string;
};

type CreateUserState = {
  error: string | null;
  form: CreateUserForm;
  isCreating: boolean;
};

const DEFAULT_CREATE_USER_FORM: CreateUserForm = {
  enabled: true,
  isAdmin: false,
  password: "",
  username: "",
};

export function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const modal = useOverlayState();
  const [state, setState] = useState<CreateUserState>({
    error: null,
    form: DEFAULT_CREATE_USER_FORM,
    isCreating: false,
  });
  const { error, form, isCreating } = state;

  function openDialog() {
    setState({
      error: null,
      form: DEFAULT_CREATE_USER_FORM,
      isCreating: false,
    });
    modal.open();
  }

  function closeDialog() {
    if (isCreating) return;

    modal.close();
  }

  function updateForm(patch: Partial<CreateUserForm>) {
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        ...patch,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const username = form.username.trim();

    if (!username || !form.password) {
      setState((current) => ({
        ...current,
        error: "请输入用户名和密码。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isCreating: true,
    }));

    try {
      await createUser({
        enabled: form.enabled,
        isAdmin: form.isAdmin,
        password: form.password,
        username,
      });
      modal.close();
      setState({
        error: null,
        form: DEFAULT_CREATE_USER_FORM,
        isCreating: false,
      });
      onCreated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getCreateUserError(error),
        isCreating: false,
      }));
    }
  }

  return (
    <>
      <Button size="sm" onPress={openDialog}>
        <AdminIcon className="size-4" name="plus" />
        添加用户
      </Button>

      <Modal state={modal}>
        <Modal.Backdrop isDismissable={!isCreating}>
          <Modal.Container placement="center" size="md">
            <Modal.Dialog>
              <form onSubmit={handleSubmit}>
                <Modal.Header>
                  <Modal.Heading>添加用户</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-foreground text-sm font-medium"
                        htmlFor="create-user-username"
                      >
                        用户名
                      </label>
                      <TextField
                        aria-label="用户名"
                        isDisabled={isCreating}
                        variant="secondary"
                      >
                        <InputGroup variant="secondary">
                          <InputGroup.Input
                            autoComplete="username"
                            id="create-user-username"
                            value={form.username}
                            onChange={(event) =>
                              updateForm({ username: event.target.value })
                            }
                          />
                        </InputGroup>
                      </TextField>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        className="text-foreground text-sm font-medium"
                        htmlFor="create-user-password"
                      >
                        密码
                      </label>
                      <TextField
                        aria-label="密码"
                        isDisabled={isCreating}
                        variant="secondary"
                      >
                        <InputGroup variant="secondary">
                          <InputGroup.Input
                            autoComplete="new-password"
                            id="create-user-password"
                            type="password"
                            value={form.password}
                            onChange={(event) =>
                              updateForm({ password: event.target.value })
                            }
                          />
                        </InputGroup>
                      </TextField>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Switch
                      isDisabled={isCreating}
                      isSelected={form.enabled}
                      onChange={(enabled) => updateForm({ enabled })}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Content>
                        <span className="text-sm font-medium">启用账号</span>
                      </Switch.Content>
                    </Switch>
                    <Switch
                      isDisabled={isCreating}
                      isSelected={form.isAdmin}
                      onChange={(isAdmin) => updateForm({ isAdmin })}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                      <Switch.Content>
                        <span className="text-sm font-medium">管理员</span>
                      </Switch.Content>
                    </Switch>
                  </div>

                  {error ? (
                    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {error}
                    </div>
                  ) : null}
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    isDisabled={isCreating}
                    type="button"
                    variant="tertiary"
                    onPress={closeDialog}
                  >
                    取消
                  </Button>
                  <Button isDisabled={isCreating} type="submit">
                    {isCreating ? "创建中..." : "创建用户"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

function getCreateUserError(error: unknown) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return "创建用户失败。";
}
