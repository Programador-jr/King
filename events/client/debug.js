//here the event starts
module.exports = (client, info) => {
  const message = String(info || "").replace(/\s+/g, " ").trim();
  if (!message) return;
  if (message.startsWith("[VOICE]")) return;
  console.log(`[Debug] ${message.slice(0, 160)}`.grey);
}
