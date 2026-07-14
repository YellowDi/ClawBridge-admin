import type { AgentDeployment } from "@/lib/api";

export function getCurrentAgentDeployments(deployments: AgentDeployment[]) {
  const current = new Map<string, AgentDeployment>();

  deployments.forEach((deployment, index) => {
    const key =
      deployment.targetPluginId ?? `missing-${deployment.id ?? index}`;
    const existing = current.get(key);

    if (!existing || (deployment.id ?? 0) > (existing.id ?? 0)) {
      current.set(key, deployment);
    }
  });

  return Array.from(current.values()).sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
}
