import assert from "node:assert/strict";

import {
  comparePluginInstalls,
  getUnavailablePluginGroups,
  getPluginVersionInstallCounts,
  groupPluginInstalls,
  isActivePluginInstall,
  sortPluginInstalls,
} from "./plugin-install-management.ts";

const installs = [
  {
    id: 1,
    installStatus: "removed",
    pluginId: "demo",
    pluginRecordId: 10,
    updatedAt: "2026-07-10T10:00:00Z",
  },
  {
    id: 2,
    installStatus: "installed",
    pluginId: "demo",
    pluginRecordId: 10,
    updatedAt: "2026-07-11T10:00:00Z",
  },
  {
    id: 3,
    installStatus: "failed",
    pluginId: "other",
    pluginRecordId: 20,
    updatedAt: "2026-07-09T10:00:00Z",
  },
  {
    id: 4,
    installStatus: "pending",
    pluginId: "demo",
    pluginRecordId: 11,
    updatedAt: "2026-07-12T10:00:00Z",
  },
];

assert.deepEqual(
  [...groupPluginInstalls(installs).entries()].map(([pluginId, items]) => [
    pluginId,
    items.map((item) => item.id),
  ]),
  [
    ["demo", [1, 2, 4]],
    ["other", [3]],
  ],
);
assert.deepEqual(
  sortPluginInstalls(installs).map((item) => item.id),
  [3, 4, 2, 1],
);
assert.equal(comparePluginInstalls(installs[2], installs[0]) < 0, true);
assert.equal(isActivePluginInstall(installs[1]), true);
assert.equal(isActivePluginInstall(installs[0]), false);
assert.deepEqual(getPluginVersionInstallCounts(installs, 10), {
  active: 1,
  inactive: 1,
});
assert.deepEqual(
  getUnavailablePluginGroups(
    installs,
    new Set(["demo"]),
    "oth",
    "",
  ).map((group) => group.pluginId),
  ["other"],
);

console.log("plugin install management assertions passed");
