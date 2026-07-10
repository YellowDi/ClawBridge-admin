import type { OpenClawPluginInstall } from "./api.ts";

const INSTALL_STATUS_ORDER: Record<string, number> = {
  failed: 0,
  pending: 1,
  installed: 2,
  removed: 3,
};

export function groupPluginInstalls(
  installs: OpenClawPluginInstall[],
): Map<string, OpenClawPluginInstall[]> {
  const groups = new Map<string, OpenClawPluginInstall[]>();

  installs.forEach((install) => {
    const pluginId = install.pluginId?.trim();

    if (!pluginId) return;
    groups.set(pluginId, [...(groups.get(pluginId) ?? []), install]);
  });

  return groups;
}

export function getUnavailablePluginGroups(
  installs: OpenClawPluginInstall[],
  availablePluginIds: Set<string>,
  query = "",
  pluginType = "",
) {
  const normalizedQuery = query.trim().toLowerCase();
  const result: Array<{
    installs: OpenClawPluginInstall[];
    pluginId: string;
  }> = [];

  groupPluginInstalls(installs).forEach((groupedInstalls, pluginId) => {
    if (availablePluginIds.has(pluginId)) return;
    if (
      pluginType &&
      !groupedInstalls.some((install) => install.pluginType === pluginType)
    ) {
      return;
    }
    if (normalizedQuery && !pluginId.toLowerCase().includes(normalizedQuery)) {
      return;
    }

    result.push({ installs: sortPluginInstalls(groupedInstalls), pluginId });
  });

  return result;
}

export function sortPluginInstalls(
  installs: OpenClawPluginInstall[],
): OpenClawPluginInstall[] {
  return [...installs].sort(comparePluginInstalls);
}

export function comparePluginInstalls(
  left: OpenClawPluginInstall,
  right: OpenClawPluginInstall,
) {
  const statusDifference =
    (INSTALL_STATUS_ORDER[left.installStatus ?? ""] ?? 4) -
    (INSTALL_STATUS_ORDER[right.installStatus ?? ""] ?? 4);

  if (statusDifference !== 0) return statusDifference;

  return (right.updatedAt || right.installedAt || "").localeCompare(
    left.updatedAt || left.installedAt || "",
  );
}

export function isActivePluginInstall(install: OpenClawPluginInstall) {
  return (
    install.installStatus === "installed" || install.installStatus === "pending"
  );
}

export function getPluginVersionInstallCounts(
  installs: OpenClawPluginInstall[],
  pluginRecordId?: number,
) {
  const matching = installs.filter(
    (install) => install.pluginRecordId === pluginRecordId,
  );

  return {
    active: matching.filter(isActivePluginInstall).length,
    inactive: matching.filter((install) => !isActivePluginInstall(install))
      .length,
  };
}
