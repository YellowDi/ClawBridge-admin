import type { OpenClawInstanceSummary } from "./api.ts";

export const MIN_CONFIG_PLUGIN_VERSION = "0.8.9";

export function getRestartDisabledReason(
  instance: OpenClawInstanceSummary,
): string | null {
  if (!instance.online) return "离线实例无法重启";

  if (!instance.runtime?.supportedActions?.includes("restart")) {
    return "当前 RPC 插件不支持实例重启";
  }

  const methods = instance.runtime.pluginAllowedMethods ?? [];

  if (!methods.includes("instance.control") && !methods.includes("*")) {
    return "当前 RPC 插件未允许实例控制";
  }

  return null;
}

export function hasInstanceRestarted(
  previous: OpenClawInstanceSummary,
  current: OpenClawInstanceSummary,
): boolean {
  if (!current.online) return false;

  return (
    changedString(previous.connectedAt, current.connectedAt) ||
    changedString(previous.runtime?.startedAt, current.runtime?.startedAt) ||
    decreasedNumber(
      previous.runtime?.uptimeSeconds,
      current.runtime?.uptimeSeconds,
    )
  );
}

export function isVersionAtLeast(
  version: string | undefined,
  minimum: string,
): boolean | null {
  const currentParts = parseVersion(version);
  const minimumParts = parseVersion(minimum);

  if (!currentParts || !minimumParts) return null;

  for (let index = 0; index < minimumParts.length; index += 1) {
    const difference = currentParts[index] - minimumParts[index];

    if (difference !== 0) return difference > 0;
  }

  return true;
}

export type JsonSearchIndex = {
  expandedPaths: Set<string>;
  matchCount: number;
  visiblePaths: Set<string>;
};

export function buildJsonSearchIndex(
  value: unknown,
  query: string,
): JsonSearchIndex {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const index: JsonSearchIndex = {
    expandedPaths: new Set<string>(),
    matchCount: 0,
    visiblePaths: new Set<string>(),
  };

  if (!normalizedQuery) return index;

  visitJsonValue(value, "", "$", normalizedQuery, index);
  index.visiblePaths.add("$");
  index.expandedPaths.add("$");

  return index;
}

export function getDefaultJsonExpandedPaths(value: unknown): Set<string> {
  const paths = new Set<string>();

  if (!isContainer(value)) return paths;

  for (const [key, child] of getEntries(value)) {
    if (isContainer(child)) paths.add(getJsonChildPath("$", key));
  }

  return paths;
}

export function getAllJsonContainerPaths(value: unknown): Set<string> {
  const paths = new Set<string>();

  collectContainerPaths(value, "$", paths);
  paths.delete("$");

  return paths;
}

export function getJsonChildPath(parentPath: string, key: string): string {
  return `${parentPath}/${JSON.stringify(key)}`;
}

function visitJsonValue(
  value: unknown,
  key: string,
  path: string,
  query: string,
  index: JsonSearchIndex,
): boolean {
  const keyMatches = key.toLocaleLowerCase().includes(query);
  const valueMatches =
    !isContainer(value) && formatSearchValue(value).includes(query);
  const ownMatch = keyMatches || valueMatches;
  let childVisible = false;

  if (ownMatch) index.matchCount += 1;

  if (isContainer(value)) {
    for (const [childKey, child] of getEntries(value)) {
      childVisible =
        visitJsonValue(
          child,
          childKey,
          getJsonChildPath(path, childKey),
          query,
          index,
        ) || childVisible;
    }
  }

  const visible = ownMatch || childVisible;

  if (visible) index.visiblePaths.add(path);
  if (isContainer(value) && childVisible) index.expandedPaths.add(path);

  return visible;
}

function collectContainerPaths(
  value: unknown,
  path: string,
  paths: Set<string>,
) {
  if (!isContainer(value)) return;

  paths.add(path);

  for (const [key, child] of getEntries(value)) {
    collectContainerPaths(child, getJsonChildPath(path, key), paths);
  }
}

function getEntries(value: unknown): [string, unknown][] {
  if (Array.isArray(value)) {
    return value.map((item, index) => [String(index), item]);
  }

  return Object.entries(value as Record<string, unknown>);
}

function isContainer(
  value: unknown,
): value is unknown[] | Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function formatSearchValue(value: unknown): string {
  if (value === "********") return "******** 已脱敏";

  return String(value).toLocaleLowerCase();
}

function parseVersion(
  version: string | undefined,
): [number, number, number] | null {
  const match = version?.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/i);

  if (!match) return null;

  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function changedString(previous?: string, current?: string) {
  const previousValue = previous?.trim();
  const currentValue = current?.trim();

  return Boolean(
    previousValue && currentValue && previousValue !== currentValue,
  );
}

function decreasedNumber(previous?: number, current?: number) {
  return (
    Number.isFinite(previous) &&
    Number.isFinite(current) &&
    (current as number) < (previous as number)
  );
}
