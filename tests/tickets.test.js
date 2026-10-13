const assert = require("node:assert/strict");
const { test } = require("node:test");
const TicketHandler = require("../handlers/tickets");
const { createSettingsStore } = require("./helpers/settingsStore");

function createHandler() {
  const settings = createSettingsStore();
  const guilds = new Map([
    ["guild-1", { id: "guild-1" }],
    ["guild-2", { id: "guild-2" }],
  ]);
  return new TicketHandler({ settings, guilds: { cache: guilds } });
}

test("ticket numbering and records stay isolated per guild", async () => {
  const handler = createHandler();

  const firstGuildTicket = await handler.createTicket("guild-1", "user-1", "help", "User#1");
  const secondGuildTicket = await handler.createTicket("guild-2", "user-2", "support", "User#2");
  const nextFirstGuildTicket = await handler.createTicket("guild-1", "user-3");

  assert.equal(firstGuildTicket.ticketNumber, 1);
  assert.equal(secondGuildTicket.ticketNumber, 1);
  assert.equal(nextFirstGuildTicket.ticketNumber, 2);
  assert.equal(handler.getTicket("guild-1", 1).userId, "user-1");
  assert.equal(handler.getTicket("guild-2", 1).userId, "user-2");
  assert.equal(handler.getGuildTickets("guild-1").total, 2);
  assert.equal(handler.getGuildTickets("guild-2").total, 1);
});

test("ticket lifecycle updates open and closed indexes", async () => {
  const handler = createHandler();
  const created = await handler.createTicket("guild-1", "user-1");

  const closed = await handler.closeTicket("guild-1", created.ticketNumber, "staff-1", "Staff#1");
  assert.equal(closed.status, "closed");
  assert.deepEqual(handler.getGuildTickets("guild-1").open.map((ticket) => ticket.ticketNumber), []);
  assert.deepEqual(handler.getGuildTickets("guild-1").closed.map((ticket) => ticket.ticketNumber), [1]);

  const reopened = await handler.reopenTicket("guild-1", created.ticketNumber);
  assert.equal(reopened.status, "open");
  assert.deepEqual(handler.getGuildTickets("guild-1").open.map((ticket) => ticket.ticketNumber), [1]);
  assert.deepEqual(handler.getGuildTickets("guild-1").closed.map((ticket) => ticket.ticketNumber), []);
});

test("ticket operations return null for missing guilds and tickets", async () => {
  const handler = createHandler();

  assert.equal(await handler.createTicket("missing-guild", "user-1"), null);
  assert.equal(await handler.closeTicket("guild-1", 404, "staff-1"), null);
  assert.equal(await handler.reopenTicket("guild-1", 404), null);
});
