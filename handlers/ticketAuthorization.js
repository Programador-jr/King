function hasPermission(member, permission) {
  try {
    return Boolean(member?.permissions?.has?.(permission));
  } catch {
    return false;
  }
}

function canManageTicket(client, ticket, member, action) {
  if (!client || !ticket || !member || !member.guild?.id) return false;

  const isOwner = String(ticket.userId) === String(member.id);
  const isAdmin = hasPermission(member, "ADMINISTRATOR") || hasPermission(member, "MANAGE_GUILD");
  const configuredRoles = client.settings?.get(member.guild.id, "ticketRoles") || [];
  const hasSupportRole = Array.isArray(configuredRoles)
    && member.roles?.cache?.some((role) => configuredRoles.includes(role.id));
  const isStaff = isAdmin || hasSupportRole;

  if (action === "delete") return isStaff;
  if (action === "close" || action === "reopen") return isOwner || isStaff;
  return false;
}

function assertTicketAuthorization(client, ticket, member, action, logger = console) {
  if (canManageTicket(client, ticket, member, action)) return true;
  logger.warn?.(`[Tickets] Ação '${action}' negada para usuário ${member?.id || "desconhecido"} no ticket #${ticket?.ticketNumber || "?"}.`);
  return false;
}

module.exports = { canManageTicket, assertTicketAuthorization };
