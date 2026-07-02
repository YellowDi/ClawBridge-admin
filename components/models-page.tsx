"use client";

import { AdminPage } from "@/components/admin-page-kit";
import { ModelConfigurationPage } from "@/components/model-configuration-page";

export function ModelsPage() {
  return (
    <AdminPage
      description="保存可用模型，配置供应商、模型 ID 和模型能力。"
      eyebrow="Model Config"
      title="模型配置"
    >
      <ModelConfigurationPage />
    </AdminPage>
  );
}
