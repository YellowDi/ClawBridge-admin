"use client";

import type { FormEvent } from "react";

import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
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
  const [state, setState] = useState<CreateUserState>({
    error: null,
    form: DEFAULT_CREATE_USER_FORM,
    isCreating: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: DEFAULT_CREATE_USER_FORM,
        isCreating: false,
      });
    },
  });
  const { error, form, isCreating } = state;

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
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm">
          <AdminIcon className="size-4" name="plus" />
          添加用户
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isCreating}
        isKeyboardDismissDisabled={isCreating}
      >
        <Modal.Container placement="center" scroll="outside" size="md">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>添加用户</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                <TextField
                  fullWidth
                  className="flex min-w-0 flex-col gap-2"
                  isDisabled={isCreating}
                  variant="secondary"
                >
                  <Label>用户名</Label>
                  <Input
                    fullWidth
                    autoComplete="username"
                    value={form.username}
                    onChange={(event) =>
                      updateForm({ username: event.target.value })
                    }
                  />
                </TextField>

                <TextField
                  fullWidth
                  className="flex min-w-0 flex-col gap-2"
                  isDisabled={isCreating}
                  variant="secondary"
                >
                  <Label>密码</Label>
                  <Input
                    fullWidth
                    autoComplete="new-password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateForm({ password: event.target.value })
                    }
                  />
                </TextField>

                <Select
                  fullWidth
                  className="min-w-0"
                  isDisabled={isCreating}
                  selectedKey={form.enabled ? "enabled" : "disabled"}
                  variant="secondary"
                  onSelectionChange={(key) =>
                    updateForm({ enabled: key === "enabled" })
                  }
                >
                  <Label>是否激活</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="enabled">激活</ListBox.Item>
                      <ListBox.Item id="disabled">停用</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  fullWidth
                  className="min-w-0"
                  isDisabled={isCreating}
                  selectedKey={form.isAdmin ? "admin" : "member"}
                  variant="secondary"
                  onSelectionChange={(key) =>
                    updateForm({ isAdmin: key === "admin" })
                  }
                >
                  <Label>是否为管理员</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="admin">管理员</ListBox.Item>
                      <ListBox.Item id="member">普通用户</ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

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
