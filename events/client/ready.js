//here the event starts
const config = require("../../botconfig/config.json")
const { change_status } = require("../../handlers/functions");
const BotMetrics = require("../../databases/botMetrics");
const GuildStats = require("../../databases/infos");

module.exports = client => {
  //SETTING ALL GUILD DATA FOR THE DJ ONLY COMMANDS for the DEFAULT
  //client.guilds.cache.forEach(guild=>client.settings.set(guild.id, ["autoplay", "clearqueue", "forward", "loop", "jump", "loopqueue", "loopsong", "move", "pause", "resume", "removetrack", "removedupes", "restart", "rewind", "seek", "shuffle", "skip", "stop", "volume"], "djonlycmds"))
  try{
    try{
      const stringlength = 69;
      console.log("\n")
      console.log(`     ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓`.bold.brightGreen)
      console.log(`     ┃ `.bold.brightGreen + " ".repeat(-1+stringlength-` ┃ `.length)+ "┃".bold.brightGreen)
      console.log(`     ┃ `.bold.brightGreen + `O Bot está online!`.bold.brightGreen + " ".repeat(-1+stringlength-` ┃ `.length-`O Bot está online!`.length)+ "┃".bold.brightGreen)
      console.log(`     ┃ `.bold.brightGreen + ` /--/ ${client.user.tag} /--/ `.bold.brightGreen+ " ".repeat(-1+stringlength-` ┃ `.length-` /--/ ${client.user.tag} /--/ `.length)+ "┃".bold.brightGreen)
      console.log(`     ┃ `.bold.brightGreen + " ".repeat(-1+stringlength-` ┃ `.length)+ "┃".bold.brightGreen)
      console.log(`     ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`.bold.brightGreen)
    }catch{ /* */ }
    // Presença configurada no index.js
  
    // Start collecting bot metrics every 5 minutes
    const collectMetrics = async () => {
      try {
        const stats = await GuildStats.aggregate([
          { $group: { _id: null, totalCommands: { $sum: "$commandsUsed" } } }
        ]);
        const totalCommands = stats[0]?.totalCommands || 0;
        const uptimeMinutes = process.uptime() / 60;
        const commandsPerMinute = uptimeMinutes > 0 ? totalCommands / uptimeMinutes : 0;

        await BotMetrics.create({
          uptime: Math.floor(process.uptime()),
          ping: client.ws.ping,
          memoryUsed: process.memoryUsage().heapUsed,
          memoryTotal: process.memoryUsage().heapTotal,
          guildCount: client.guilds.cache.size,
          commandsPerMinute: Math.round(commandsPerMinute * 100) / 100
        });
      } catch (err) {
        console.log('[BotMetrics] Erro ao coletar métricas:', err.message);
      }
    };

    // Collect immediately on startup
    collectMetrics();

    // Then every 5 minutes
    setInterval(collectMetrics, 300000);
  } catch (e){
    console.log(String(e.stack).grey.italic.dim.bgRed)
  }
}
