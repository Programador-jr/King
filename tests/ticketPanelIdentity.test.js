const assert = require("node:assert/strict");
const { test } = require("node:test");
const TicketHandler = require("../handlers/tickets");
const { createSettingsStore } = require("./helpers/settingsStore");
const {
  getTicketReason,
  makePanelButtonCustomId,
  parsePanelButtonCustomId,
} = require("../handlers/ticketPanelIdentity");

function createHandler(panels) {
  const settings = createSettingsStore();
  settings.set("guild-1", { ticketPanels: panels });
  return new TicketHandler({ settings });
}

test("ticket button ids identify the configured panel and button uniquely", () => {
  const handler = createHandler([
    { id: "panel-1", messageId: "message-1", buttons: [{ customId: "old" }] },
    { id: "panel-2", messageId: "message-2", buttons: [{ customId: "old" }, { customId: "other" }] },
  ]);
  const customId = makePanelButtonCustomId("panel-2", 1);

  assert.equal(customId.length <= 100, true);
  assert.deepEqual(parsePanelButtonCustomId(customId), { panelId: "panel-2", buttonIndex: 1 });
  assert.equal(handler.findPanelByButtonId("guild-1", customId).id, "panel-2");
  assert.equal(handler.findPanelByButtonId("guild-1", makePanelButtonCustomId("missing", 0)), null);
});

test("legacy generic custom ids resolve only from their own panel message", () => {
  const handler = createHandler([
    { id: "panel-1", messageId: "message-1", buttons: [{ customId: "create_ticket" }] },
    { id: "panel-2", messageId: "message-2", buttons: [{ customId: "create_ticket" }] },
  ]);

  assert.equal(handler.findPanelByButtonId("guild-1", "create_ticket", "message-2").id, "panel-2");
  assert.equal(handler.findPanelByButtonId("guild-1", "create_ticket"), null);
  assert.equal(handler.findPanelByButtonId("guild-1", "unknown"), null);
});

test("ticket reason comes only from the configured reason question", () => {
  const panel = { questions: [{ id: "details" }, { id: "reason" }] };
  assert.equal(getTicketReason(panel, { details: "Details answer", reason: "Need help" }), "Need help");
  assert.equal(getTicketReason(panel, { reason: "  Need help  " }), "  Need help  ");
  assert.equal(getTicketReason(panel, { details: "Only answer" }), "Ticket criado via painel");
});
