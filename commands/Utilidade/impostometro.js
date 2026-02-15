const axios = require("axios");
const { MessageEmbed } = require("discord.js");
const ee = require("../../botconfig/embed.json");
const OFFICIAL_URL = "https://impostometro.com.br/";

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function formatInt(value) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nao informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo"
  }).format(date);
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractCuriosities(html) {
  const curiosities = [];
  const regex = /<input[^>]*class="textoCuriosidade"[^>]*value="([^"]+)"[^>]*>[\s\S]*?<input[^>]*class="valorUnitario"[^>]*value="([^"]+)"[^>]*>/gi;

  let match = null;
  while ((match = regex.exec(html)) !== null) {
    const template = decodeHtmlEntities(match[1]).replace(/\s+/g, " ").trim();
    const unitValue = Number(String(match[2]).replace(/\./g, "").replace(",", "."));

    if (!template || !Number.isFinite(unitValue) || unitValue <= 0) continue;
    curiosities.push({ template, unitValue });
  }

  return curiosities;
}

function buildCuriosity(totalValue, curiosities) {
  if (!Number.isFinite(totalValue) || totalValue <= 0) return null;

  const fallbackCuriosity = [{
    template: "Com esse dinheiro voce poderia comprar #$# cestas basicas.",
    unitValue: 435.51
  }];
  const source = Array.isArray(curiosities) && curiosities.length ? curiosities : fallbackCuriosity;
  const random = source[Math.floor(Math.random() * source.length)];
  const quantity = Math.floor(totalValue / random.unitValue);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const text = random.template.includes("#$#")
    ? random.template.replace("#$#", formatInt(quantity))
    : `${random.template} (${formatInt(quantity)})`;

  return text.slice(0, 1024);
}

module.exports = {
  name: "impostometro",
  aliases: ["imposto", "impostos"],
  usage: "impostometro",
  description: "Mostra o valor atual acumulado no Impostometro do Brasil.",
  category: "Utilidade",
  cooldown: 5,
  run: async (client, message) => {
    try {
      const [counterResponse, homeResponse] = await Promise.all([
        axios.get("https://impostometro.com.br/Contador/Brasil", {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Referer: OFFICIAL_URL
          },
          timeout: 10000
        }),
        axios.get(OFFICIAL_URL, { timeout: 10000 }).catch(() => null)
      ]);

      const data = counterResponse.data;
      const curiosities = extractCuriosities(homeResponse?.data || "");

      const total = formatMoney(data?.Valor);
      const incremento = formatMoney(data?.Incremento);
      const atualizadoEm = formatDateTime(data?.Data);
      const curiosity = buildCuriosity(Number(data?.Valor), curiosities);

      const embed = new MessageEmbed()
        .setColor(ee.color)
        .setTitle("Impostometro - Brasil")
        .setURL(OFFICIAL_URL)
        .setDescription("Total estimado de impostos arrecadados.")
        .addField("Valor acumulado", `**${total}**`, false)
        .addField("Incremento por segundo", incremento, true)
        .addField("Atualizado em", atualizadoEm, true)
        .addField("Site oficial", `[impostometro.com.br](${OFFICIAL_URL})`, false)
        .setFooter(ee.footertext, ee.footericon);

      if (curiosity) {
        embed.addField("Curiosidade", curiosity, false);
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      return message
        .reply({
          embeds: [
            new MessageEmbed()
              .setColor(ee.wrongcolor)
              .setFooter(ee.footertext, ee.footericon)
              .setTitle(`${client.allEmojis.x} Nao foi possivel obter os dados do Impostometro agora.`)
          ]
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete().catch(() => {});
          }, 4000);
        })
        .catch(() => {});
    }
  }
};
