import { notFound } from "next/navigation";

import { OpenClawInstanceDetailPage } from "@/components/openclaw-instances-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ pluginId?: string }>;
}) {
  const { pluginId } = await searchParams;
  const normalizedPluginId = pluginId?.trim();

  if (!normalizedPluginId) notFound();

  return <OpenClawInstanceDetailPage pluginId={normalizedPluginId} />;
}
