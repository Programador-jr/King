require("../handlers/discordCompat");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const command = require("../commands/Ticket/ticketadd");

test("ticketadd sends only supported discord.js v14 permission names", async () => {
  let overwrite;
  const member = { user: { tag: "member#0001" } };
  const replies = [];
  const message = {
    channel: {
      name: "ticket-7",
      permissionOverwrites: {
        create: async (_user, permissions) => { overwrite = permissions; },
      },
    },
    mentions: { members: { first: () => member } },
    guild: { members: { cache: new Map() } },
    reply: async (payload) => replies.push(payload),
  };

  await command.run({}, message, []);

  assert.deepEqual(overwrite, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });
  assert.equal(replies.length, 1);
});
