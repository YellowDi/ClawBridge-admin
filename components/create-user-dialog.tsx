"use client";

import type { FormEvent } from "react";
import type { User } from "@/lib/api";

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
import { useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import { createUser, deleteUser, getUserDetail, updateUser } from "@/lib/api";

type UserForm = {
  enabled: boolean;
  isAdmin: boolean;
  password: string;
  username: string;
};

type CreateUserState = {
  error: string | null;
  form: UserForm;
  isCreating: boolean;
};

type EditUserState = {
  error: string | null;
  form: UserForm;
  isLoading: boolean;
  isSaving: boolean;
  loadedUserId: number | null;
};

type DeleteUserState = {
  error: string | null;
  isDeleting: boolean;
};

export type EditableUserSummary = {
  enabled: boolean;
  id: number;
  isAdmin: boolean;
  username: string;
};

const DEFAULT_USER_FORM: UserForm = {
  enabled: true,
  isAdmin: false,
  password: "",
  username: "",
};

export function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [state, setState] = useState<CreateUserState>({
    error: null,
    form: DEFAULT_USER_FORM,
    isCreating: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: DEFAULT_USER_FORM,
        isCreating: false,
      });
    },
  });
  const { error, form, isCreating } = state;

  function closeDialog() {
    if (isCreating) return;

    modal.close();
  }

  function updateForm(patch: Partial<UserForm>) {
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
        form: DEFAULT_USER_FORM,
        isCreating: false,
      });
      onCreated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getUserActionError(error, "创建用户失败。"),
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
                <UserFormFields
                  form={form}
                  isDisabled={isCreating}
                  passwordAutoComplete="new-password"
                  onChange={updateForm}
                />

                {error ? <UserFormError>{error}</UserFormError> : null}
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

export function EditUserDialog({
  onUpdated,
  user,
}: {
  onUpdated: () => void;
  user: EditableUserSummary;
}) {
  const loadRequestRef = useRef(0);
  const [state, setState] = useState<EditUserState>({
    error: null,
    form: toUserForm(user),
    isLoading: false,
    isSaving: false,
    loadedUserId: null,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) {
        loadRequestRef.current += 1;

        return;
      }

      loadUser();
    },
  });
  const { error, form, isLoading, isSaving, loadedUserId } = state;
  const isBusy = isLoading || isSaving;

  function loadUser() {
    const requestId = loadRequestRef.current + 1;

    loadRequestRef.current = requestId;
    setState({
      error: null,
      form: toUserForm(user),
      isLoading: true,
      isSaving: false,
      loadedUserId: null,
    });

    void getUserDetail(user.id)
      .then((detail) => {
        if (loadRequestRef.current !== requestId) return;

        setState({
          error: null,
          form: toLoadedUserForm(user, detail),
          isLoading: false,
          isSaving: false,
          loadedUserId: user.id,
        });
      })
      .catch((error: unknown) => {
        if (loadRequestRef.current !== requestId) return;

        setState((current) => ({
          ...current,
          error: getUserActionError(error, "用户详情加载失败。"),
          isLoading: false,
          loadedUserId: null,
        }));
      });
  }

  function closeDialog() {
    if (isBusy) return;

    modal.close();
  }

  function updateForm(patch: Partial<UserForm>) {
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

    if (isLoading || loadedUserId == null) return;

    const username = form.username.trim();

    if (!username) {
      setState((current) => ({
        ...current,
        error: "请输入用户名。",
      }));

      return;
    }

    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
    }));

    try {
      await updateUser({
        enabled: form.enabled,
        id: loadedUserId,
        isAdmin: form.isAdmin,
        password: form.password,
        username,
      });
      modal.close();
      setState({
        error: null,
        form: toUserForm({
          ...user,
          enabled: form.enabled,
          isAdmin: form.isAdmin,
          username,
        }),
        isLoading: false,
        isSaving: false,
        loadedUserId: null,
      });
      onUpdated();
    } catch (error) {
      setState((current) => ({
        ...current,
        error: getUserActionError(error, "更新用户失败。"),
        isSaving: false,
      }));
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          编辑
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isBusy}
        isKeyboardDismissDisabled={isBusy}
      >
        <Modal.Container placement="center" scroll="outside" size="md">
          <Modal.Dialog>
            <form className="min-w-0" onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>编辑用户</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
                {isLoading ? (
                  <div className="text-muted text-sm">正在加载用户详情...</div>
                ) : null}
                <UserFormFields
                  form={form}
                  isDisabled={isBusy || loadedUserId == null}
                  passwordAutoComplete="new-password"
                  passwordPlaceholder="留空则不修改密码"
                  onChange={updateForm}
                />
                {error ? <UserFormError>{error}</UserFormError> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  isDisabled={isBusy}
                  type="button"
                  variant="tertiary"
                  onPress={closeDialog}
                >
                  取消
                </Button>
                <Button
                  isDisabled={isBusy || loadedUserId == null}
                  type="submit"
                >
                  {isSaving ? "保存中..." : "保存修改"}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function DeleteUserDialog({
  onDeleted,
  user,
}: {
  onDeleted: () => void;
  user: EditableUserSummary;
}) {
  const [state, setState] = useState<DeleteUserState>({
    error: null,
    isDeleting: false,
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        isDeleting: false,
      });
    },
  });
  const { error, isDeleting } = state;

  function closeDialog() {
    if (isDeleting) return;

    modal.close();
  }

  async function handleDelete() {
    setState({
      error: null,
      isDeleting: true,
    });

    try {
      await deleteUser(user.id);
      modal.close();
      setState({
        error: null,
        isDeleting: false,
      });
      onDeleted();
    } catch (error) {
      setState({
        error: getUserActionError(error, "删除用户失败。"),
        isDeleting: false,
      });
    }
  }

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="danger-soft">
          删除
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop
        isDismissable={!isDeleting}
        isKeyboardDismissDisabled={isDeleting}
      >
        <Modal.Container placement="center" scroll="outside" size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>删除用户</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex min-w-0 flex-col gap-3">
              <p className="text-muted text-sm">
                确认删除用户「{user.username}」？删除后该账号将无法继续登录。
              </p>
              {error ? <UserFormError>{error}</UserFormError> : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="tertiary"
                onPress={closeDialog}
              >
                取消
              </Button>
              <Button
                isDisabled={isDeleting}
                type="button"
                variant="danger"
                onPress={handleDelete}
              >
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function UserFormFields({
  form,
  isDisabled,
  onChange,
  passwordAutoComplete,
  passwordPlaceholder,
}: {
  form: UserForm;
  isDisabled: boolean;
  onChange: (patch: Partial<UserForm>) => void;
  passwordAutoComplete: string;
  passwordPlaceholder?: string;
}) {
  return (
    <>
      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Label>用户名</Label>
        <Input
          fullWidth
          autoComplete="username"
          value={form.username}
          onChange={(event) => onChange({ username: event.target.value })}
        />
      </TextField>

      <TextField
        fullWidth
        className="flex min-w-0 flex-col gap-2"
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Label>密码</Label>
        <Input
          fullWidth
          autoComplete={passwordAutoComplete}
          placeholder={passwordPlaceholder}
          type="password"
          value={form.password}
          onChange={(event) => onChange({ password: event.target.value })}
        />
      </TextField>

      <Select
        fullWidth
        className="min-w-0"
        isDisabled={isDisabled}
        selectedKey={form.enabled ? "enabled" : "disabled"}
        variant="secondary"
        onSelectionChange={(key) => onChange({ enabled: key === "enabled" })}
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
        isDisabled={isDisabled}
        selectedKey={form.isAdmin ? "admin" : "member"}
        variant="secondary"
        onSelectionChange={(key) => onChange({ isAdmin: key === "admin" })}
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
    </>
  );
}

function UserFormError({ children }: { children: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </div>
  );
}

function toUserForm(user: Pick<User, "enabled" | "isAdmin" | "username">) {
  return {
    enabled: user.enabled !== false,
    isAdmin: user.isAdmin === true,
    password: "",
    username: user.username?.trim() ?? "",
  };
}

function toLoadedUserForm(summary: EditableUserSummary, detail?: User) {
  if (!detail) return toUserForm(summary);

  return {
    enabled: detail.enabled ?? summary.enabled,
    isAdmin: detail.isAdmin ?? summary.isAdmin,
    password: "",
    username: detail.username?.trim() || summary.username,
  };
}

function getUserActionError(error: unknown, fallback: string) {
  if (
    error instanceof Error &&
    error.message.trim() &&
    error.message !== "登录失败，请检查用户名或密码。"
  ) {
    return error.message;
  }

  return fallback;
}
