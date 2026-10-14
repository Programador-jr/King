const assert = require("node:assert/strict");
const { test } = require("node:test");
const { canManageTicket, assertTicketAuthorization } = require("../handlers/ticketAuthorization");
const { createSettingsStore } = require("./helpers/settingsStore");

function makeMember(id, { permissions = [], roles = [] } = {}) {
  return {
    id,
    guild: { id: "guild-1" },
    permissions: { has: (permission) => permissions.includes(permission) },
    roles: { cache: roles.map((roleId) => ({ id: roleId })) },
  };
}

test("ticket owners and configured support staff can close and reopen; only staff can delete", () => {
  const settings = createSettingsStore();
  settings.set("guild-1", "ticketRoles", ["support-role"]);
  const client = { settings };
  const ticket = { ticketNumber: 7, userId: "owner" };
  const owner = makeMember("owner");
  const support = makeMember("support", { roles: ["support-role"] });
  const admin = makeMember("admin", { permissions: ["MANAGE_GUILD"] });
  const stranger = makeMember("stranger");

  for (const action of ["close", "reopen"]) {
    assert.equal(canManageTicket(client, ticket, owner, action), true);
    assert.equal(canManageTicket(client, ticket, support, action), true);
    assert.equal(canManageTicket(client, ticket, admin, action), true);
    assert.equal(canManageTicket(client, ticket, stranger, action), false);
  }
  assert.equal(canManageTicket(client, ticket, owner, "delete"), false);
  assert.equal(canManageTicket(client, ticket, support, "delete"), true);
  assert.equal(canManageTicket(client, ticket, stranger, "delete"), false);
});

test("denied ticket actions are logged", () => {
  const settings = createSettingsStore();
  const client = { settings };
  const warnings = [];
  const allowed = assertTicketAuthorization(
    client,
    { ticketNumber: 3, userId: "owner" },
    makeMember("stranger"),
    "delete",
    { warn: (message) => warnings.push(message) },
  );

  assert.equal(allowed, false);
  assert.match(warnings[0], /delete.*stranger.*#3/);
});
