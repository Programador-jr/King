const Discord = require("discord.js");
const ee = require("../botconfig/embed.json");

const DEFAULT_PREFIX = "!";

const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []);

const buildMentions = ({ users, members, roles } = {}) => {
  const usersCol = new Discord.Collection();
  toArray(users).forEach((user) => {
    if (user?.id) usersCol.set(user.id, user);
  });

  const membersCol = new Discord.Collection();
  toArray(members).forEach((member) => {
    if (member?.id) membersCol.set(member.id, member);
  });

  const rolesCol = new Discord.Collection();
  toArray(roles).forEach((role) => {
    if (role?.id) rolesCol.set(role.id, role);
  });

  return {
    users: usersCol,
    members: membersCol,
    roles: rolesCol,
    channels: new Discord.Collection()
  };
};

const createMessageFromInteraction = (client, interaction, commandName, args, mentions) => {
  const prefix = client?.settings?.get(interaction.guildId, "prefix") || client?.config?.prefix || DEFAULT_PREFIX;
  const contentArgs = Array.isArray(args) && args.length ? ` ${args.join(" ")}` : "";
  const content = `${prefix}${commandName}${contentArgs}`.trim();

  const realChannel = interaction.channel;

  const channel = {
    ...realChannel,
    send: async (payload) => {
      const options = typeof payload === "string" ? { content: payload } : { ...payload };
      options.flags = options.flags || (options.ephemeral ? 64 : 0);
      delete options.ephemeral;
      delete options.fetchReply;
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(options);
      }
      return interaction.reply(options);
    },
    bulkDelete: async (amount, filterOld) => {
      return realChannel.bulkDelete(amount, filterOld);
    }
  };

  const msg = {
    id: interaction.id,
    client,
    guild: interaction.guild,
    guildId: interaction.guildId,
    channel: channel,
    channelId: interaction.channelId,
    member: interaction.member,
    author: interaction.user,
    user: interaction.user,
    mentions: mentions || buildMentions(),
    content,
    createdTimestamp: interaction.createdTimestamp,
    interaction: interaction,
    isInteraction: true,
    reply: async (payload) => {
      const options = typeof payload === "string" ? { content: payload } : { ...payload };
      options.flags = options.flags || (options.ephemeral ? 64 : 0);
      delete options.ephemeral;
      delete options.fetchReply;
      if (interaction.deferred || interaction.replied) {
        return interaction.followUp(options);
      }
      return interaction.reply(options);
    },
    react: async () => null,
    delete: async () => null
  };

  if (!client.slashCommandInteractions) {
    client.slashCommandInteractions = new Map();
  }
  client.slashCommandInteractions.set(interaction.id, interaction);

  return msg;
};

const runSlashCommand = async (client, interaction, commandName, args = [], mentions = null) => {
  const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
  if (!command) {
    return interaction.reply({
      embeds: [
        new Discord.MessageEmbed()
          .setColor(ee.wrongcolor || "#ff0000")
          .setTitle(`${client.allEmojis?.x || "❌"} Comando nao encontrado.`)
      ],
      flags: 64
    }).catch(() => {});
  }

  const safeArgs = Array.isArray(args) ? args.filter((arg) => arg !== undefined && arg !== null) : [];
  const message = createMessageFromInteraction(client, interaction, commandName, safeArgs, mentions || buildMentions());
  const prefix = client?.settings?.get(interaction.guildId, "prefix") || client?.config?.prefix || DEFAULT_PREFIX;

  return Promise.resolve(
    command.run(
      client,
      message,
      safeArgs,
      safeArgs.join(" ").split("++").filter(Boolean),
      message.member,
      safeArgs.join(" "),
      prefix
    )
  );
};

module.exports = {
  buildMentions,
  runSlashCommand
};
