import assert from "node:assert/strict";
import test from "node:test";

import {
  toCreateAgentRequest,
  toUpdateAgentRequest,
} from "../components/agent-dialog-utils.ts";

const form = {
  agentId: "coder",
  avatarUrl: "",
  defaultImageGenerationModelid: "",
  defaultImageModelid: "",
  defaultMusicGenerationModelid: "",
  defaultModelid: "",
  defaultPdfModelid: "",
  defaultVideoGenerationModelid: "",
  description: "",
  displayName: "Coder",
  enabled: true,
  reasoningLevel: "",
  sandboxConfigId: 0,
  thinkingLevel: "",
  verboseLevel: "",
};

test("preserves Agent sandbox bind and unbind request semantics", () => {
  assert.equal(toCreateAgentRequest(form).sandboxConfigId, 0);
  assert.equal(
    "sandboxConfigId" in toUpdateAgentRequest({ ...form, sandboxConfigId: 7 }, 1, 7),
    false,
  );
  assert.equal(toUpdateAgentRequest(form, 1, 7).sandboxConfigId, 0);
  assert.equal(
    toUpdateAgentRequest({ ...form, sandboxConfigId: 9 }, 1, 7).sandboxConfigId,
    9,
  );
});
