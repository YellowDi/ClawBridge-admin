"use client";

import type { ReactNode } from "react";

import { Button, Chip, SearchField, toast } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

import {
  buildJsonSearchIndex,
  getAllJsonContainerPaths,
  getDefaultJsonExpandedPaths,
  getJsonChildPath,
  isVersionAtLeast,
  MIN_CONFIG_PLUGIN_VERSION,
} from "@/lib/openclaw-instance-management";

export function OpenClawJsonTree({
  config,
  pluginVersion,
}: {
  config?: Record<string, unknown>;
  pluginVersion?: string;
}) {
  const [query, setQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    getDefaultJsonExpandedPaths(config),
  );
  const searchIndex = useMemo(
    () => buildJsonSearchIndex(config, query),
    [config, query],
  );
  const hasQuery = Boolean(query.trim());

  useEffect(() => {
    setExpandedPaths(getDefaultJsonExpandedPaths(config));
    setQuery("");
  }, [config]);

  if (!config || Object.keys(config).length === 0) {
    const versionSupport = isVersionAtLeast(
      pluginVersion,
      MIN_CONFIG_PLUGIN_VERSION,
    );

    return (
      <LocalEmpty>
        {versionSupport === false
          ? `当前实例需要升级 openclaw-plugin-rpc 至 ${MIN_CONFIG_PLUGIN_VERSION} 或更高版本`
          : "当前实例未返回 openclaw.json 配置"}
      </LocalEmpty>
    );
  }

  const effectiveExpandedPaths = hasQuery
    ? searchIndex.expandedPaths
    : expandedPaths;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <SearchField
          aria-label="搜索 openclaw.json"
          className="w-full lg:w-[360px]"
          value={query}
          onChange={setQuery}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="搜索字段或配置值" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <div className="flex flex-wrap items-center gap-2">
          {hasQuery ? (
            <span className="text-muted mr-1 text-xs">
              {searchIndex.matchCount} 个匹配
            </span>
          ) : null}
          <Button
            isDisabled={hasQuery}
            size="sm"
            variant="secondary"
            onPress={() => setExpandedPaths(getAllJsonContainerPaths(config))}
          >
            全部展开
          </Button>
          <Button
            isDisabled={hasQuery}
            size="sm"
            variant="secondary"
            onPress={() => setExpandedPaths(new Set())}
          >
            全部收起
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => void copyJson(config)}
          >
            复制完整 JSON
          </Button>
        </div>
      </div>
      {hasQuery && searchIndex.matchCount === 0 ? (
        <LocalEmpty>未找到匹配配置</LocalEmpty>
      ) : (
        <div className="max-h-[720px] overflow-auto rounded-lg border border-default bg-surface p-3 font-mono text-xs leading-6">
          <JsonTreeEntries
            expandedPaths={effectiveExpandedPaths}
            path="$"
            query={query}
            value={config}
            visiblePaths={searchIndex.visiblePaths}
            onToggle={(path, isExpanded) => {
              if (hasQuery) return;

              setExpandedPaths((current) => {
                const next = new Set(current);

                if (isExpanded) next.add(path);
                else next.delete(path);

                return next;
              });
            }}
          />
        </div>
      )}
    </div>
  );
}

function JsonTreeEntries({
  expandedPaths,
  onToggle,
  path,
  query,
  value,
  visiblePaths,
}: {
  expandedPaths: Set<string>;
  onToggle: (path: string, isExpanded: boolean) => void;
  path: string;
  query: string;
  value: unknown[] | Record<string, unknown>;
  visiblePaths: Set<string>;
}) {
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value);
  const hasQuery = Boolean(query.trim());

  return (
    <ul className="flex min-w-max flex-col">
      {entries.map(([key, item]) => {
        const childPath = getJsonChildPath(path, key);

        if (hasQuery && !visiblePaths.has(childPath)) return null;

        return (
          <JsonTreeNode
            key={childPath}
            expandedPaths={expandedPaths}
            itemKey={key}
            path={childPath}
            query={query}
            value={item}
            visiblePaths={visiblePaths}
            onToggle={onToggle}
          />
        );
      })}
    </ul>
  );
}

function JsonTreeNode({
  expandedPaths,
  itemKey,
  onToggle,
  path,
  query,
  value,
  visiblePaths,
}: {
  expandedPaths: Set<string>;
  itemKey: string;
  onToggle: (path: string, isExpanded: boolean) => void;
  path: string;
  query: string;
  value: unknown;
  visiblePaths: Set<string>;
}) {
  const isArray = Array.isArray(value);
  const isObject = value !== null && typeof value === "object";
  const isContainer = isArray || isObject;
  const count = isArray
    ? value.length
    : isObject
      ? Object.keys(value as Record<string, unknown>).length
      : 0;
  const label = /^\d+$/.test(itemKey) ? `[${itemKey}]` : itemKey;

  if (!isContainer) {
    return (
      <li className="flex min-w-0 items-start gap-2 pl-5">
        <span className="text-accent shrink-0">{label}:</span>
        <JsonScalar value={value} />
      </li>
    );
  }

  const containerValue = value as unknown[] | Record<string, unknown>;
  const marker = isArray ? `[${count}]` : `{${count}}`;

  if (count === 0) {
    return (
      <li className="flex min-w-0 items-start gap-2 pl-5">
        <span className="text-accent shrink-0">{label}:</span>
        <span className="text-muted">{isArray ? "[]" : "{}"}</span>
      </li>
    );
  }

  return (
    <li>
      <details
        open={expandedPaths.has(path)}
        onToggle={(event) => onToggle(path, event.currentTarget.open)}
      >
        <summary className="cursor-pointer select-none rounded px-1 hover:bg-default/50">
          <span className="text-accent">{label}</span>
          <span className="text-muted ml-2">{marker}</span>
        </summary>
        <div className="ml-3 border-l border-default pl-2">
          <JsonTreeEntries
            expandedPaths={expandedPaths}
            path={path}
            query={query}
            value={containerValue}
            visiblePaths={visiblePaths}
            onToggle={onToggle}
          />
        </div>
      </details>
    </li>
  );
}

function JsonScalar({ value }: { value: unknown }) {
  if (value === "********") {
    return (
      <Chip color="warning" size="sm" variant="soft">
        已脱敏
      </Chip>
    );
  }

  if (typeof value === "string") {
    return <span className="text-success">{JSON.stringify(value)}</span>;
  }

  if (typeof value === "number") {
    return <span className="text-accent">{String(value)}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-warning">{String(value)}</span>;
  }

  if (value === null) return <span className="text-muted">null</span>;

  return <span className="text-muted">{String(value)}</span>;
}

function LocalEmpty({ children }: { children: ReactNode }) {
  return <div className="text-muted py-6 text-center text-sm">{children}</div>;
}

async function copyJson(config: Record<string, unknown>) {
  try {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success("完整 JSON 已复制");
  } catch {
    toast.danger("复制 JSON 失败，请检查浏览器剪贴板权限。");
  }
}
