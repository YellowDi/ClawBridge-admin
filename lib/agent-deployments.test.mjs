import assert from "node:assert/strict";
import test from "node:test";

import { getCurrentAgentDeployments } from "./agent-deployments.ts";

test("keeps the latest deployment for each target instance", () => {
  assert.deepEqual(
    getCurrentAgentDeployments([
      { id: 100, status: "uninstalled", targetPluginId: "prod" },
      { id: 102, status: "deployed", targetPluginId: "prod" },
      { id: 101, status: "failed", targetPluginId: "staging" },
    ]).map(({ id, status }) => ({ id, status })),
    [
      { id: 102, status: "deployed" },
      { id: 101, status: "failed" },
    ],
  );
});
