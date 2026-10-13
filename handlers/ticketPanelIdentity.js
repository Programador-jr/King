function makePanelButtonCustomId(panelId, buttonIndex) {
  return `ticket-panel:${String(panelId)}:${Number(buttonIndex)}`;
}

function parsePanelButtonCustomId(customId) {
  const match = String(customId || "").match(/^ticket-panel:(.+):(\d+)$/);
  return match ? { panelId: match[1], buttonIndex: Number(match[2]) } : null;
}

function getTicketReason(panel, answers) {
  const reasonQuestion = (panel?.questions || []).find((question) => question?.id === "reason");
  const reason = reasonQuestion ? answers?.[reasonQuestion.id] : "";
  return typeof reason === "string" && reason.trim() ? reason : "Ticket criado via painel";
}

module.exports = { makePanelButtonCustomId, parsePanelButtonCustomId, getTicketReason };
