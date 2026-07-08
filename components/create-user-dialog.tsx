"use client";

import type { FormEvent, Key } from "react";
import type { User } from "@/lib/api";

import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
  toast,
  useOverlayState,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { AdminIcon } from "@/components/admin-icons";
import {
  createUser,
  deleteUser,
  getUserDetail,
  listUsers,
  updateUser,
} from "@/lib/api";

type UserForm = {
  accountNature: "personal" | "team";
  accountType: "main" | "sub";
  adminSeatLimit: string;
  displayName: string;
  enabled: boolean;
  isAdmin: boolean;
  parentUserId: string;
  password: string;
  username: string;
};

type CreateUserState = {
  error: string | null;
  form: UserForm;
  isCreating: boolean;
  isLoadingParents: boolean;
  parentCandidates: User[];
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
  accountNature?: string;
  accountType?: string;
  adminSeatLimit?: number;
  billingMode?: string;
  displayName?: string;
  enabled: boolean;
  id: number;
  isAdmin: boolean;
  parentUserId?: number;
  seatLimit?: number;
  usedSeats?: number;
  username: string;
};

type UserDeleteDialogState = ReturnType<typeof useOverlayState>;

const DEFAULT_USER_FORM: UserForm = {
  accountNature: "personal",
  accountType: "main",
  adminSeatLimit: "0",
  displayName: "",
  enabled: true,
  isAdmin: false,
  parentUserId: "",
  password: "",
  username: "",
};

export function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const [state, setState] = useState<CreateUserState>({
    error: null,
    form: DEFAULT_USER_FORM,
    isCreating: false,
    isLoadingParents: false,
    parentCandidates: [],
  });
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (!isOpen) return;

      setState({
        error: null,
        form: DEFAULT_USER_FORM,
        isCreating: false,
        isLoadingParents: false,
        parentCandidates: [],
      });
    },
  });
  const { error, form, isCreating, isLoadingParents, parentCandidates } = state;

  useEffect(() => {
    if (!modal.isOpen) return;

    let cancelled = false;

    setState((current) => ({
      ...current,
      isLoadingParents: true,
    }));

    void listUsers({ pageSize: 500 })
      .then((users) => {
        if (cancelled) return;

        setState((current) => ({
          ...current,
          isLoadingParents: false,
          parentCandidates: users,
        }));
      })
      .catch(() => {
        if (cancelled) return;

        setState((current) => ({
          ...current,
          isLoadingParents: false,
          parentCandidates: [],
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [modal.isOpen]);

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
    const displayName = form.displayName.trim();
    const isSubAccount = form.accountType === "sub";
    const parentUserId = Number(form.parentUserId);

    if (!username || !form.password) {
      const message = "请输入用户名和密码。";

      setState((current) => ({
        ...current,
        error: message,
      }));
      toast.danger(message);

      return;
    }

    if (isSubAccount) {
      const parent = parentCandidates.find((user) => user.id === parentUserId);

      if (!parent) {
        const message = "请选择所属主账号。";

        setState((current) => ({
          ...current,
          error: message,
        }));
        toast.danger(message);

        return;
      }

      const parentCheck = validateParentForSubAccount(parent, parentCandidates);

      if (parentCheck) {
        setState((current) => ({
          ...current,
          error: parentCheck,
        }));
        toast.danger(parentCheck);

        return;
      }
    }

    let adminSeatLimit = 0;

    if (!isSubAccount && form.accountNature === "team") {
      try {
        adminSeatLimit = parseAdminSeatLimit(form.adminSeatLimit);
      } catch (error) {
        const message = getUserActionError(error, "管理员席位无效。");

        setState((current) => ({
          ...current,
          error: message,
        }));
        toast.danger(message);

        return;
      }
    }

    setState((current) => ({
      ...current,
      error: null,
      isCreating: true,
    }));

    try {
      await createUser({
        ...(displayName ? { displayName } : {}),
        enabled: form.enabled,
        ...(isSubAccount
          ? { isAdmin: false, parentUserId }
          : {
              accountNature: form.accountNature,
              adminSeatLimit,
              isAdmin: form.isAdmin,
            }),
        password: form.password,
        username,
      });
      modal.close();
      setState({
        error: null,
        form: DEFAULT_USER_FORM,
        isCreating: false,
        isLoadingParents: false,
        parentCandidates: [],
      });
      onCreated();
      toast.success("用户已创建。");
    } catch (error) {
      const message = getUserActionError(error, "创建用户失败。");

      setState((current) => ({
        ...current,
        error: message,
        isCreating: false,
      }));
      toast.danger(message);
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
                  isLoadingParents={isLoadingParents}
                  mode="create"
                  parentCandidates={parentCandidates}
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
  const modal = useOverlayState();

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          编辑
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="outside" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>编辑用户</Modal.Heading>
            </Modal.Header>
            <UserEditPanel
              isActive={modal.isOpen}
              user={user}
              onClose={() => modal.close()}
              onUpdated={onUpdated}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export function UserEditPanel({
  isActive,
  onClose,
  onUpdated,
  user,
}: {
  isActive: boolean;
  onClose: () => void;
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
  const { error, form, isLoading, isSaving, loadedUserId } = state;
  const isBusy = isLoading || isSaving;

  useEffect(() => {
    if (!isActive) {
      loadRequestRef.current += 1;

      return;
    }

    loadUser();

    return () => {
      loadRequestRef.current += 1;
    };
  }, [isActive, user.id]);

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

        const message = getUserActionError(error, "用户详情加载失败。");

        setState((current) => ({
          ...current,
          error: message,
          isLoading: false,
          loadedUserId: null,
        }));
        toast.danger(message);
      });
  }

  function closeDialog() {
    if (isBusy) return;

    onClose();
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
    const displayName = form.displayName.trim();
    const isSubAccount = isSubAccountForm(form);

    if (!username) {
      const message = "请输入用户名。";

      setState((current) => ({
        ...current,
        error: message,
      }));
      toast.danger(message);

      return;
    }

    let adminSeatLimit = 0;

    if (!isSubAccount) {
      const usedSeats = user.usedSeats ?? 0;

      if (form.accountNature === "personal" && usedSeats > 0) {
        const message = "该团队账号已有子账号，不能切换为个人账号。";

        setState((current) => ({
          ...current,
          error: message,
        }));
        toast.danger(message);

        return;
      }

      if (form.accountNature === "team") {
        try {
          adminSeatLimit = parseAdminSeatLimit(form.adminSeatLimit);
        } catch (error) {
          const message = getUserActionError(error, "管理员席位无效。");

          setState((current) => ({
            ...current,
            error: message,
          }));
          toast.danger(message);

          return;
        }
      }
    }

    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
    }));

    try {
      await updateUser({
        accountNature: isSubAccount ? undefined : form.accountNature,
        adminSeatLimit: isSubAccount ? undefined : adminSeatLimit,
        displayName,
        enabled: form.enabled,
        id: loadedUserId,
        isAdmin: isSubAccount ? false : form.isAdmin,
        password: form.password,
        username,
      });
      onClose();
      setState({
        error: null,
        form: toUserForm({
          ...user,
          enabled: form.enabled,
          isAdmin: isSubAccount ? false : form.isAdmin,
          username,
        }),
        isLoading: false,
        isSaving: false,
        loadedUserId: null,
      });
      onUpdated();
      toast.success("用户已更新。");
    } catch (error) {
      const message = getUserActionError(error, "更新用户失败。");

      setState((current) => ({
        ...current,
        error: message,
        isSaving: false,
      }));
      toast.danger(message);
    }
  }

  return (
    <form className="min-w-0" onSubmit={handleSubmit}>
      <Modal.Body className="-mx-1 flex min-w-0 flex-col gap-4 px-1 py-1">
        {isLoading ? (
          <div className="text-muted text-sm">正在加载用户详情...</div>
        ) : null}
        <UserFormFields
          form={form}
          isDisabled={isBusy || loadedUserId == null}
          isLoadingParents={false}
          mode="edit"
          parentCandidates={[]}
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
        <Button isDisabled={isBusy || loadedUserId == null} type="submit">
          {isSaving ? "保存中..." : "保存修改"}
        </Button>
      </Modal.Footer>
    </form>
  );
}

export function DeleteUserDialog({
  hideTrigger = false,
  onDeleted,
  state: controlledModal,
  user,
}: {
  hideTrigger?: boolean;
  onDeleted: () => void;
  state?: UserDeleteDialogState;
  user: EditableUserSummary;
}) {
  const [state, setState] = useState<DeleteUserState>({
    error: null,
    isDeleting: false,
  });
  const internalModal = useOverlayState();
  const modal = controlledModal ?? internalModal;
  const { error, isDeleting } = state;

  useEffect(() => {
    if (!modal.isOpen) return;

    setState({
      error: null,
      isDeleting: false,
    });
  }, [modal.isOpen]);

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
      toast.success("用户已删除。");
    } catch (error) {
      const message = getUserActionError(error, "删除用户失败。");

      setState({
        error: message,
        isDeleting: false,
      });
      toast.danger(message);
    }
  }

  return (
    <Modal state={modal}>
      {hideTrigger ? null : (
        <Modal.Trigger>
          <Button size="sm" variant="danger-soft">
            删除
          </Button>
        </Modal.Trigger>
      )}
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
  isLoadingParents,
  mode,
  onChange,
  passwordAutoComplete,
  passwordPlaceholder,
  parentCandidates,
}: {
  form: UserForm;
  isDisabled: boolean;
  isLoadingParents: boolean;
  mode: "create" | "edit";
  onChange: (patch: Partial<UserForm>) => void;
  passwordAutoComplete: string;
  passwordPlaceholder?: string;
  parentCandidates: User[];
}) {
  const isSubAccount = isSubAccountForm(form);
  const isTeam = form.accountNature === "team";

  return (
    <>
      <Select
        fullWidth
        className="min-w-0"
        isDisabled={isDisabled || mode === "edit"}
        selectedKey={form.accountType}
        variant="secondary"
        onSelectionChange={(key) => {
          const accountType = toAccountType(key);

          onChange({
            accountType,
            isAdmin: accountType === "sub" ? false : form.isAdmin,
            parentUserId: accountType === "sub" ? form.parentUserId : "",
          });
        }}
      >
        <Label>账号类型</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="main" textValue="主账号">
              主账号
            </ListBox.Item>
            <ListBox.Item id="sub" textValue="子账号">
              子账号
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>

      {mode === "create" && isSubAccount ? (
        <Select
          fullWidth
          className="min-w-0"
          isDisabled={isDisabled || isLoadingParents}
          selectedKey={form.parentUserId || null}
          variant="secondary"
          onSelectionChange={(key) =>
            onChange({ parentUserId: key == null ? "" : String(key) })
          }
        >
          <Label>所属主账号</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {parentCandidates.filter(isEligibleParentAccount).map((user) => {
                const id = user.id;

                if (id == null) return null;

                return (
                  <ListBox.Item
                    key={id}
                    id={String(id)}
                    textValue={getUserName(user)}
                  >
                    {getUserName(user)}
                  </ListBox.Item>
                );
              })}
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}

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
        <Label>展示名</Label>
        <Input
          fullWidth
          value={form.displayName}
          onChange={(event) => onChange({ displayName: event.target.value })}
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
            <ListBox.Item id="enabled" textValue="激活">
              激活
            </ListBox.Item>
            <ListBox.Item id="disabled" textValue="停用">
              停用
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>

      <Select
        fullWidth
        className="min-w-0"
        isDisabled={isDisabled || isSubAccount}
        selectedKey={
          isSubAccount ? "member" : form.isAdmin ? "admin" : "member"
        }
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
            <ListBox.Item id="admin" textValue="管理员">
              管理员
            </ListBox.Item>
            <ListBox.Item id="member" textValue="普通用户">
              普通用户
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>

      {!isSubAccount ? (
        <Select
          fullWidth
          className="min-w-0"
          isDisabled={isDisabled}
          selectedKey={form.accountNature}
          variant="secondary"
          onSelectionChange={(key) => {
            const accountNature = toAccountNature(key);

            onChange({
              accountNature,
              adminSeatLimit:
                accountNature === "personal" ? "0" : form.adminSeatLimit,
            });
          }}
        >
          <Label>账号性质</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="personal" textValue="个人">
                个人
              </ListBox.Item>
              <ListBox.Item id="team" textValue="团队">
                团队
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}

      {!isSubAccount ? (
        <TextField
          fullWidth
          className="flex min-w-0 flex-col gap-2"
          isDisabled={isDisabled || !isTeam}
          variant="secondary"
        >
          <Label>管理员席位</Label>
          <Input
            fullWidth
            inputMode="numeric"
            min={0}
            type="number"
            value={isTeam ? form.adminSeatLimit : "0"}
            onChange={(event) =>
              onChange({ adminSeatLimit: event.target.value })
            }
          />
        </TextField>
      ) : null}
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

function toUserForm(
  user: Partial<User> & Partial<EditableUserSummary>,
): UserForm {
  const accountType: UserForm["accountType"] = isSubAccountUser(user)
    ? "sub"
    : "main";
  const accountNature: UserForm["accountNature"] =
    user.accountNature === "team" ? "team" : "personal";

  return {
    accountNature,
    accountType,
    adminSeatLimit:
      accountNature === "team" ? String(user.adminSeatLimit ?? 0) : "0",
    displayName: user.displayName?.trim() ?? "",
    enabled: user.enabled !== false,
    isAdmin: user.isAdmin === true,
    parentUserId: user.parentUserId ? String(user.parentUserId) : "",
    password: "",
    username: user.username?.trim() ?? "",
  };
}

function toLoadedUserForm(summary: EditableUserSummary, detail?: User) {
  return toUserForm(detail ? { ...summary, ...detail } : summary);
}

function isSubAccountForm(form: UserForm) {
  return form.accountType === "sub";
}

function isSubAccountUser(user: Partial<User> | Partial<EditableUserSummary>) {
  return user.accountType === "sub" && (user.parentUserId ?? 0) > 0;
}

function isMainAccountUser(user: Partial<User>) {
  return user.accountType === "main" || (user.parentUserId ?? 0) === 0;
}

function isEligibleParentAccount(user: User) {
  return isMainAccountUser(user) && user.accountNature === "team";
}

function validateParentForSubAccount(parent: User, users: User[]) {
  if (!isMainAccountUser(parent)) return "子账号不能再创建子账号。";
  if (parent.accountNature !== "team") return "个人账号不能创建子账号。";

  const seatLimit = parent.seatLimit ?? 0;
  const usedSeats = getUsedSeatCount(parent, users);

  if (seatLimit <= usedSeats) return "团队账号子账号数量不能超过席位数量。";

  return null;
}

function getUsedSeatCount(parent: User, users: User[]) {
  if (parent.id == null) return 0;

  return users.filter(
    (user) => user.parentUserId === parent.id && user.accountType === "sub",
  ).length;
}

function parseAdminSeatLimit(value: string) {
  const adminSeatLimit = Number(value.trim() || "0");

  if (!Number.isInteger(adminSeatLimit) || adminSeatLimit < 0) {
    throw new Error("管理员席位必须是大于等于 0 的整数。");
  }

  return adminSeatLimit;
}

function toAccountType(key: Key | null): UserForm["accountType"] {
  return key === "sub" ? "sub" : "main";
}

function toAccountNature(key: Key | null): UserForm["accountNature"] {
  return key === "team" ? "team" : "personal";
}

function getUserName(user: Pick<User, "displayName" | "id" | "username">) {
  return user.displayName?.trim() || user.username?.trim() || `用户 ${user.id}`;
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
