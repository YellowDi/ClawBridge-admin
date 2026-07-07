import { notFound } from "next/navigation";

import { AgentDetailPage } from "@/components/agent-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agentRecordId = Number(id);

  if (!Number.isInteger(agentRecordId) || agentRecordId <= 0) {
    notFound();
  }

  return <AgentDetailPage agentRecordId={agentRecordId} />;
}
