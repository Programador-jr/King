const { 
  MessageEmbed, 
  MessageActionRow, 
  MessageButton,
  StringSelectMenuBuilder,
  RoleSelectMenuBuilder
} = require("discord.js");

const ee = require("../../botconfig/embed.json");

module.exports = {
  name: "dj",
  category: "Configurações",
  aliases: ["djrole", "drole", "djs", "dj-role"],
  usage: "dj",
  cooldown: 3,
  description: "Gerencia os DJs do servidor.",
  memberpermissions: ["MANAGE_GUILD"],

  run: async (client, message) => {

    client.settings.ensure(message.guild.id, {
      djroles: []
    });

    let currentDJsArr = client.settings.get(message.guild.id, "djroles");
    if (!Array.isArray(currentDJsArr)) currentDJsArr = [];

    const getEmbed = () => {
      let djs = client.settings.get(message.guild.id, "djroles");
      if (!Array.isArray(djs)) djs = [];
      
      const roles = djs.length > 0 
        ? djs.map(r => {
          const role = message.guild.roles.cache.get(r);
          return role ? `<@&${r}>` : r;
        }).join(", ")
        : "Nenhum cargo configurado";
      
      return new MessageEmbed()
        .setColor(ee.color)
        .setTitle("🎧 Configuração de DJs")
        .setDescription(
          "Cargos DJ podem usar comandos de música mesmo sem ser o solicitante.\n\n" +
          `**Cargos DJ atuais:** ${roles}`
        )
        .setFooter(ee.footertext, ee.footericon);
    };

    const mainRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("dj_add")
        .setLabel("Adicionar DJ")
        .setStyle("SUCCESS")
        .setEmoji("➕"),
      new MessageButton()
        .setCustomId("dj_remove")
        .setLabel("Remover DJ")
        .setStyle("DANGER")
        .setEmoji("➖"),
      new MessageButton()
        .setCustomId("dj_clear")
        .setLabel("Limpar Todos")
        .setStyle("SECONDARY")
        .setEmoji("🗑️")
    );

    const msg = await message.reply({
      embeds: [getEmbed()],
      components: [mainRow]
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 120000
    });

    collector.on("collect", async (interaction) => {
      try {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({ content: "❌ Você não pode usar isso!", ephemeral: true });
        }

        await interaction.deferUpdate();

        if (interaction.customId === "dj_add") {
          const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId("dj_role_add")
            .setPlaceholder("Selecione um cargo")
            .setMinValues(1)
            .setMaxValues(10);

          return interaction.editReply({
            content: "Selecione o(s) cargo(s) para adicionar como DJ:",
            embeds: [],
            components: [
              new MessageActionRow().addComponents(roleSelect),
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId("dj_back")
                  .setLabel("Voltar")
                  .setStyle("SECONDARY")
                  .setEmoji("⬅️")
              )
            ]
          });
        }

        if (interaction.customId === "dj_remove") {
          let djs = client.settings.get(message.guild.id, "djroles");
          if (!Array.isArray(djs)) djs = [];
          
          if (djs.length === 0) {
            return interaction.editReply({
              content: "❌ Nenhum cargo DJ configurado para remover!",
              embeds: [],
              components: []
            });
          }

          const roleOptions = djs.map(r => {
            const role = message.guild.roles.cache.get(r);
            return {
              label: role ? role.name : "Cargo não encontrado",
              value: r
            };
          });

          const roleSelect = new StringSelectMenuBuilder()
            .setCustomId("dj_role_remove")
            .setPlaceholder("Selecione cargos para remover")
            .setMinValues(1)
            .setMaxValues(roleOptions.length)
            .addOptions(roleOptions);

          return interaction.editReply({
            content: "Selecione o(s) cargo(s) para remover:",
            embeds: [],
            components: [
              new MessageActionRow().addComponents(roleSelect),
              new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId("dj_back")
                  .setLabel("Voltar")
                  .setStyle("SECONDARY")
                  .setEmoji("⬅️")
              )
            ]
          });
        }

        if (interaction.customId === "dj_clear") {
          client.settings.set(message.guild.id, [], "djroles");
          
          return interaction.editReply({
            content: "✅ Todos os cargos DJ foram removidos!",
            embeds: [getEmbed()],
            components: [mainRow]
          });
        }

        if (interaction.customId === "dj_back") {
          return interaction.editReply({
            content: null,
            embeds: [getEmbed()],
            components: [mainRow]
          });
        }

        if (interaction.customId === "dj_role_add") {
          const roleIds = interaction.values;
          let currentDJsArr = client.settings.get(message.guild.id, "djroles");
          if (!Array.isArray(currentDJsArr)) currentDJsArr = [];
          const newDJs = [...new Set([...currentDJsArr, ...roleIds])];
          
          client.settings.set(message.guild.id, newDJs, "djroles");

          return interaction.editReply({
            content: `✅ ${roleIds.length} cargo(s) adicionado(s) como DJ!`,
            embeds: [getEmbed()],
            components: [mainRow]
          });
        }

        if (interaction.customId === "dj_role_remove") {
          const roleIdsToRemove = interaction.values;
          let currentDJsArr = client.settings.get(message.guild.id, "djroles");
          if (!Array.isArray(currentDJsArr)) currentDJsArr = [];
          const newDJs = currentDJsArr.filter(r => !roleIdsToRemove.includes(r));
          
          client.settings.set(message.guild.id, newDJs, "djroles");

          return interaction.editReply({
            content: `✅ ${roleIdsToRemove.length} cargo(s) removido(s) dos DJs!`,
            embeds: [getEmbed()],
            components: [mainRow]
          });
        }

      } catch (e) {
        console.log("DJ collector error:", e);
      }
    });

    collector.on("end", async () => {
      try {
        await msg.edit({ components: [] }).catch(() => {});
      } catch (e) {}
    });
  }
};
