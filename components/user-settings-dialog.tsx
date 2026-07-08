"use client";

import type { Key } from "react";
import type { EditableUserSummary } from "@/components/create-user-dialog";

import { Button, Modal, Tabs, useOverlayState } from "@heroui/react";
import { useState } from "react";

import { UserEditPanel } from "@/components/create-user-dialog";
import { KnowledgeAvailabilityPanel } from "@/components/knowledge-availability-dialog";
import {
  UserAuthorizationPanel,
  UserBalancePanel,
} from "@/components/user-access-dialog";
import { UserSubscriptionPanel } from "@/components/user-subscription-panel";

type UserSettingsTab =
  | "access"
  | "balance"
  | "edit"
  | "knowledge"
  | "subscription";

export function UserSettingsDialog({
  onUpdated,
  selectedKnowledgeBaseIds,
  user,
}: {
  onUpdated: () => void;
  selectedKnowledgeBaseIds: number[];
  user: EditableUserSummary;
}) {
  const [activeTab, setActiveTab] = useState<UserSettingsTab>("edit");
  const modal = useOverlayState({
    onOpenChange(isOpen) {
      if (isOpen) setActiveTab("edit");
    },
  });

  return (
    <Modal state={modal}>
      <Modal.Trigger>
        <Button size="sm" variant="tertiary">
          设置
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop isDismissable={false}>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog>
            <Modal.Header>
              <div className="flex min-w-0 flex-col gap-4">
                <Modal.Heading>用户设置</Modal.Heading>
                <Tabs
                  className="w-full"
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(toSettingsTab(key))}
                >
                  <Tabs.ListContainer className="w-full">
                    <Tabs.List
                      aria-label="用户设置"
                      className="grid w-full grid-cols-5"
                    >
                      <Tabs.Tab
                        className="justify-center whitespace-nowrap"
                        id="edit"
                      >
                        编辑
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab
                        className="justify-center whitespace-nowrap"
                        id="knowledge"
                      >
                        可用知识库
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab
                        className="justify-center whitespace-nowrap"
                        id="access"
                      >
                        授权
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab
                        className="justify-center whitespace-nowrap"
                        id="balance"
                      >
                        余额
                        <Tabs.Indicator />
                      </Tabs.Tab>
                      <Tabs.Tab
                        className="justify-center whitespace-nowrap"
                        id="subscription"
                      >
                        订阅
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    </Tabs.List>
                  </Tabs.ListContainer>
                </Tabs>
              </div>
            </Modal.Header>
            {activeTab === "edit" ? (
              <UserEditPanel
                isActive={modal.isOpen}
                user={user}
                onClose={() => modal.close()}
                onUpdated={onUpdated}
              />
            ) : null}
            {activeTab === "knowledge" ? (
              <KnowledgeAvailabilityPanel
                isActive={modal.isOpen}
                selectedKnowledgeBaseIds={selectedKnowledgeBaseIds}
                subjectId={user.id}
                subjectType="user"
                onClose={() => modal.close()}
                onSaved={onUpdated}
              />
            ) : null}
            {activeTab === "access" ? (
              <UserAuthorizationPanel
                isActive={modal.isOpen}
                user={user}
                onClose={() => modal.close()}
              />
            ) : null}
            {activeTab === "balance" ? (
              <UserBalancePanel
                isActive={modal.isOpen}
                showTransactions={false}
                user={user}
                onClose={() => modal.close()}
              />
            ) : null}
            {activeTab === "subscription" ? (
              <UserSubscriptionPanel
                isActive={modal.isOpen}
                user={user}
                onChanged={onUpdated}
                onClose={() => modal.close()}
              />
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function toSettingsTab(key: Key): UserSettingsTab {
  if (
    key === "access" ||
    key === "balance" ||
    key === "edit" ||
    key === "knowledge" ||
    key === "subscription"
  ) {
    return key;
  }

  return "edit";
}
