const assert = require("node:assert/strict");
const { test } = require("node:test");
require("../handlers/discordCompat");
const {
  assertModerationPermission,
  extractId,
  hasModerationPermission,
} = require("../handlers/moderationUtils");
const { createSettingsStore } = require("./helpers/settingsStore");

function createClient(moderationRoles = []) {
  const settings = createSettingsStore();
  settings.set("guild-1", "moderationRoles", moderationRoles);
  return { settings, allEmojis: { x: "no" } };
}

function createMember({ administrator = false, roleIds = [] } = {}) {
  return {
    guild: { id: "guild-1" },
    permissions: { has: (permission) => permission === "ADMINISTRATOR" && administrator },
    roles: { cache: roleIds.map((id) => ({ id })) },
  };
}

test("moderation authorization allows administrators and configured roles only", () => {
  const client = createClient(["moderator-role"]);

  assert.equal(hasModerationPermission(client, createMember({ administrator: true })), true);
  assert.equal(hasModerationPermission(client, createMember({ roleIds: ["moderator-role"] })), true);
  assert.equal(hasModerationPermission(client, createMember({ roleIds: ["member-role"] })), false);
  assert.equal(hasModerationPermission(client, null), false);
});

test("moderation command gate rejects unauthorized users and accepts allowed users", () => {
  const client = createClient(["moderator-role"]);
  const replies = [];
  const deniedMessage = {
    guild: { id: "guild-1" },
    member: createMember({ roleIds: ["member-role"] }),
    reply: async (payload) => replies.push(payload),
  };
  const allowedMessage = {
    guild: { id: "guild-1" },
    member: createMember({ roleIds: ["moderator-role"] }),
    reply: async (payload) => replies.push(payload),
  };

  assert.equal(assertModerationPermission(client, deniedMessage), false);
  assert.equal(assertModerationPermission(client, allowedMessage), true);
  assert.equal(replies.length, 1);
});

test("moderation target IDs accept Discord IDs and reject malformed input", () => {
  assert.equal(extractId("<@!123456789012345678>"), "123456789012345678");
  assert.equal(extractId("not-an-id"), null);
  assert.equal(extractId("123"), null);
});
