import assert from "node:assert/strict";

import {
  buildJsonSearchIndex,
  getDefaultJsonExpandedPaths,
  getRestartDisabledReason,
  hasInstanceRestarted,
  isVersionAtLeast,
} from "./openclaw-instance-management.ts";

const restartable = {
  connectedAt: "2026-07-11T10:00:00Z",
  online: true,
  runtime: {
    pluginAllowedMethods: ["instance.control"],
    startedAt: "2026-07-11T09:00:00Z",
    supportedActions: ["restart"],
    uptimeSeconds: 3600,
  },
};

assert.equal(getRestartDisabledReason(restartable), null);
assert.equal(
  getRestartDisabledReason({
    ...restartable,
    runtime: { ...restartable.runtime, pluginAllowedMethods: ["*"] },
  }),
  null,
);
assert.equal(
  getRestartDisabledReason({ ...restartable, online: false }),
  "离线实例无法重启",
);
assert.equal(
  hasInstanceRestarted(restartable, {
    ...restartable,
    connectedAt: "2026-07-11T10:01:00Z",
  }),
  true,
);
assert.equal(
  hasInstanceRestarted(restartable, {
    ...restartable,
    runtime: { ...restartable.runtime, uptimeSeconds: 2 },
  }),
  true,
);
assert.equal(hasInstanceRestarted(restartable, restartable), false);

assert.equal(isVersionAtLeast("0.8.9", "0.8.9"), true);
assert.equal(isVersionAtLeast("v0.9.0", "0.8.9"), true);
assert.equal(isVersionAtLeast("0.8.8", "0.8.9"), false);
assert.equal(isVersionAtLeast("unknown", "0.8.9"), null);

const config = {
  agents: { coder: { model: "gpt-test" } },
  models: { providers: { openai: { apiKey: "********" } } },
};
const search = buildJsonSearchIndex(config, "已脱敏");

assert.equal(search.matchCount, 1);
assert.equal(search.visiblePaths.has('$/"models"'), true);
assert.equal(search.visiblePaths.has('$/"agents"'), false);
const containerKeySearch = buildJsonSearchIndex(config, "agents");
assert.equal(containerKeySearch.visiblePaths.has('$/"agents"'), true);
assert.equal(containerKeySearch.visiblePaths.has('$/"agents"/"coder"'), false);
assert.deepEqual([...getDefaultJsonExpandedPaths(config)].sort(), [
  '$/"agents"',
  '$/"models"',
]);

console.log("OpenClaw instance management assertions passed");
