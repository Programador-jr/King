const assert = require("node:assert/strict");
const { test } = require("node:test");
const TicketHandler = require("../handlers/tickets");
const { createSettingsStore } = require("./helpers/settingsStore");

function createHandler({ createChannel } = {}) {
  const settings = createSettingsStore();
  const guilds = new Map();
  let channelId = 0;
  const channels = new Map();
  const guild = {
    id: "guild-1",
    roles: { everyone: "everyone" },
    channels: {
      cache: channels,
      fetch: async (id) => channels.get(id) || null,
      create: createChannel || (async (options) => {
        const channel = {
          id: `channel-${++channelId}`,
          name: options.name,
          setName: async (name) => { channel.name = name; },
          permissionOverwrites: {
            edits: [],
            edit: async (id, permissions) => channel.permissionOverwrites.edits.push({ id, permissions }),
          },
          delete: async () => channels.delete(channel.id),
        };
        channels.set(channel.id, channel);
        return channel;
      }),
    },
  };
  guilds.set(guild.id, guild);
  const client = { settings, guilds: { cache: guilds }, user: { id: "bot" } };
  return { handler: new TicketHandler(client), client, guild, channels };
}

async function createOpenTicket(handler, guild, userId, reason) {
  const reserved = await handler.createTicket(guild.id, userId, reason);
  assert.ok(reserved);
  const channel = await handler.createTicketChannel(guild, reserved, null);
  return { ticket: handler.getTicket(guild.id, reserved.ticketNumber), channel };
}

test("ticket creation allocates unique numbers and rejects duplicate open tickets per user", async () => {
  const { handler, guild } = createHandler();

  const results = await Promise.all([
    handler.createTicket("guild-1", "user-1", "first"),
    handler.createTicket("guild-1", "user-1", "duplicate"),
    handler.createTicket("guild-1", "user-2", "second"),
  ]);

  const tickets = results.filter(Boolean);
  assert.equal(tickets.length, 2);
  assert.deepEqual(tickets.map((ticket) => ticket.ticketNumber).sort(), [1, 2]);
  assert.equal(tickets.every((ticket) => ticket.status === "creating"), true);
  await Promise.all(tickets.map((ticket) => handler.createTicketChannel(guild, ticket, null)));
  assert.equal(handler.getGuildTickets("guild-1").total, 2);
});

test("close and reopen update status, channel name, and the registered owner's permissions", async () => {
  const { handler, guild, channels } = createHandler();
  const { ticket, channel } = await createOpenTicket(handler, guild, "ticket-owner");

  const closed = await handler.closeTicket(guild.id, ticket.ticketNumber, "staff-1", "Staff#1");
  assert.equal(closed.status, "closed");
  assert.equal(channel.name, "closed-1");
  assert.deepEqual(channel.permissionOverwrites.edits.at(-1), {
    id: "ticket-owner",
    permissions: { ViewChannel: false, SendMessages: false },
  });
  assert.equal(await handler.closeTicket(guild.id, ticket.ticketNumber, "staff-1"), null);

  const reopened = await handler.reopenTicket(guild.id, ticket.ticketNumber);
  assert.equal(reopened.status, "open");
  assert.equal(channel.name, "ticket-1");
  assert.deepEqual(channel.permissionOverwrites.edits.at(-1), {
    id: "ticket-owner",
    permissions: { ViewChannel: true, SendMessages: true, ReadMessageHistory: true },
  });
  assert.equal(handler.getGuildTickets(guild.id).open[0].userId, "ticket-owner");
  assert.equal(handler.getGuildTickets(guild.id).closed.length, 0);
  assert.equal(channels.has(channel.id), true);
});

test("failed channel creation removes its reservation and records a recoverable failure", async () => {
  let attempts = 0;
  const { handler, guild } = createHandler({
    createChannel: async () => {
      if (attempts++ === 0) throw new Error("Discord unavailable");
      return {
        id: "channel-recovered",
        name: "ticket-2",
        setName: async () => {},
        permissionOverwrites: { edit: async () => {} },
        delete: async () => {},
      };
    },
  });

  const failedReservation = await handler.createTicket(guild.id, "user-1", "help");
  await assert.rejects(handler.createTicketChannel(guild, failedReservation, null), /Discord unavailable/);
  assert.equal(handler.getTicket(guild.id, failedReservation.ticketNumber), null);
  assert.equal(handler.getHistory(guild.id).some((entry) => entry.action === "creation_failed"), true);

  const retry = await handler.createTicket(guild.id, "user-1", "retry");
  const recoveredChannel = await handler.createTicketChannel(guild, retry, null);
  assert.equal(recoveredChannel.id, "channel-recovered");
  assert.equal(handler.getTicket(guild.id, retry.ticketNumber).status, "open");
});

test("a legacy ticket record without a channel is cleaned up before the owner retries", async () => {
  const { handler, client, guild } = createHandler();
  client.settings.set(guild.id, {
    ticketCount: 4,
    openTickets: [4],
    closedTickets: [],
    tickets: {
      "ticket-4": { ticketNumber: 4, userId: "user-1", status: "open", channelId: null },
    },
    ticketHistory: [],
  });

  const retry = await handler.createTicket(guild.id, "user-1", "retry");
  assert.equal(retry.ticketNumber, 5);
  assert.equal(handler.getTicket(guild.id, 4), null);
  assert.equal(handler.getHistory(guild.id).some((entry) => entry.action === "creation_recovered"), true);
});

test("ticket deletion can resume from a persisted deleting state", async () => {
  const { handler, guild, client } = createHandler();
  const { ticket, channel } = await createOpenTicket(handler, guild, "ticket-owner");
  await handler.closeTicket(guild.id, ticket.ticketNumber, "support");
  const set = client.settings.set.bind(client.settings);
  let failDeleteRecordOnce = true;
  client.settings.set = (guildId, value, key) => {
    if (!key && failDeleteRecordOnce && !value.tickets?.["ticket-1"]
      && value.ticketHistory?.some((entry) => entry.action === "deleted")) {
      failDeleteRecordOnce = false;
      throw new Error("temporary persistence error");
    }
    return set(guildId, value, key);
  };

  await assert.rejects(handler.deleteTicket(guild.id, ticket.ticketNumber), /temporary persistence error/);
  assert.equal(handler.getTicket(guild.id, ticket.ticketNumber).status, "deleting");
  assert.equal(channel.name, "closed-1");

  const deleted = await handler.deleteTicket(guild.id, ticket.ticketNumber);
  assert.ok(deleted);
  assert.equal(handler.getTicket(guild.id, ticket.ticketNumber), null);
  assert.equal(handler.getHistory(guild.id).some((entry) => entry.action === "deleted"), true);
});

test("concurrent close requests only apply one valid transition", async () => {
  const { handler, guild, channels } = createHandler();
  const { ticket, channel } = await createOpenTicket(handler, guild, "ticket-owner");

  const results = await Promise.all([
    handler.closeTicket(guild.id, ticket.ticketNumber, "staff-1"),
    handler.closeTicket(guild.id, ticket.ticketNumber, "staff-2"),
  ]);

  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(handler.getTicket(guild.id, ticket.ticketNumber).status, "closed");
  assert.equal(channel.name, "closed-1");
  assert.equal(channels.has(channel.id), true);
});

test("ticket operations return null for missing guilds and tickets", async () => {
  const { handler } = createHandler();
  assert.equal(await handler.createTicket("missing-guild", "user-1"), null);
  assert.equal(await handler.closeTicket("guild-1", 404, "staff-1"), null);
  assert.equal(await handler.reopenTicket("guild-1", 404), null);
  assert.equal(await handler.deleteTicket("guild-1", 404), null);
});
