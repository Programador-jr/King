const Discord = require("discord.js");
const ee = require("../../botconfig/embed.json");
const activeSessions = new Map();

const lastAnswers = new Map();

const RESPONSES = {
  classicas: [
  "Sim, com certeza.",
  "Não.",
  "Talvez.",
  "Sem duvida.",
  "Melhor não contar com isso.",
  "As chances são boas.",
  "As chances são baixas.",
  "Pergunte novamente mais tarde.",
  "Sinais apontam que sim.",
  "Meu palpite é não."
  ],

  amor: [
    "O amor está ao seu favor 💘",
    "Existe sentimento envolvido.",
    "Há química, mas precisa de coragem.",
    "Talvez o coração dela(e) já tenha escolhido.",
    "O destino pode surpreender, mas seja paciente.",
    "As estrelas indicam que é complicado.",
    "A resposta é tão incerta quanto o amor em si."

  ],

  probabilidades: [
    "Estatisticamente, é improvável.",
    "Com base nas probabilidades, sim.",
    "Os dados indicam que não.",
    "Há 73% de chance disso acontecer.",
    "As variáveis não favorecem isso.",
    "O cenário atual não é promissor.",
    "As probabilidades estão contra isso, mas nunca se sabe.",
  ],

  misteriosas: [
    "Os espíritos ainda estão decidindo...",
    "O futuro está nebuloso.",
    "As energias estão instáveis.",
    "Algo está sendo ocultado.",
    "A resposta virá em breve.",
    "O destino ainda não escolheu.",
    "Há forças interferindo.",
    "Não é o momento certo para saber.",
],

  engracadas: [
    "Pergunta isso pra sua mãe.",
    "Nem se você pagar.",
    "Só se Mercúrio estiver retrógrado.",
    "Se você lavar a louça hoje, talvez.",
    "Depende... você merece?",
    "Sim, mas vai dar errado depois.",
    "Confia no processo."
],

  sarcasticas: [
    "Ah claro, porque eu sou uma bola de cristal ambulante.",
    "Sim, e amanhã o céu vai cair também.",
    "Não, e os unicórnios vão dominar o mundo.",
    "Talvez, mas só se você acreditar muito.",
    "Com certeza, e os porcos vão voar.",
    "As chances são tão boas quanto um gato entender física quântica.",
    "Claro... confia.",
    "Você realmente precisava perguntar?",
    "Isso foi uma pergunta séria?",
    "Talvez no universo paralelo.",
    "Nem os deuses sabem disso.",
  ],

  raras: [
    "Você já sabe a resposta.",
    "Eu vou fingir que não li isso.",
    "Isso depende mais de você do que de mim."
  ]
};

const ALL_DEFAULT = [
  ...RESPONSES.classicas,
  ...RESPONSES.probabilidades,
  ...RESPONSES.misteriosas,
  ...RESPONSES.engracadas,
  ...RESPONSES.sarcasticas
];

function detectCategory(question) {
  const q = question.toLowerCase();

  const loveKeywords = [
    "amor", "namoro", "namorada", "namorado",
    "gosta", "ficar", "casar", "relacionamento",
    "crush", "beijar", "coração"
  ];

  if (loveKeywords.some(word => q.includes(word))) {
    return "amor";
  }

  return "default";
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomAnswer(userId, question) {
  const category = detectCategory(question);

  let pool;

  // 5% chance de resposta rara
  if (Math.random() < 0.05) {
    pool = RESPONSES.raras;
  } else {
    switch (category) {
      case "amor":
        pool = RESPONSES.amor;
        break;
      case "dinheiro":
        pool = RESPONSES.dinheiro;
        break;
      default:
        pool = ALL_DEFAULT;
    }
  }

  let answer;

  do {
    answer = pool[Math.floor(Math.random() * pool.length)];
  } while (pool.length > 1 && lastAnswers.get(userId) === answer);

  lastAnswers.set(userId, answer);
  return answer;
}

module.exports = {
  name: "8ball",
  aliases: ["oraculo", "bola8", "guru"],
  category: "Diversão",
  description: "Modo conversa com a bola mágica.",
  usage: "8ball",
  cooldown: "3",

  run: async (client, message) => {

    const userId = message.author.id;

    if (activeSessions.has(userId)) {
      const activeEmbed = new Discord.MessageEmbed()
        .setColor(ee.color)
        .setTitle("🎱 Bola Mágica")
        .setDescription("⚠️ Você já está em uma sessão ativa.\nDigite `sair` para encerrar.")
        .setFooter(ee.footertext, ee.footericon);

      return message.reply({ embeds: [activeEmbed] });
    }

    const startEmbed = new Discord.MessageEmbed()
      .setColor(ee.color)
      .setTitle("🎱 Modo Bola 8 Ativado")
      .setDescription(
        "Faça sua pergunta.\nDigite `sair` para encerrar.\n\n⏳ Encerra após 60 segundos sem mensagem."
      )
      .setFooter(ee.footertext, ee.footericon);

    await message.reply({ embeds: [startEmbed] });

    const filter = m => m.author.id === userId;

    const collector = message.channel.createMessageCollector({
      filter,
      idle: 60000
    });

    activeSessions.set(userId, collector);

    collector.on("collect", async (msg) => {

      if (msg.content.toLowerCase() === "sair") {
        collector.stop("user_exit");
        return;
      }

      const answer = getRandomAnswer(userId, msg.content);

      await message.channel.sendTyping();

      const delay = Math.floor(Math.random() * 2000) + 1000;
      await sleep(delay);

      await msg.reply(`🎱 ${answer}`);
    });

    collector.on("end", async (_, reason) => {

      activeSessions.delete(userId);

      const endEmbed = new Discord.MessageEmbed()
        .setColor(ee.color)
        .setTitle("🎱 Bola Mágica")
        .setFooter(ee.footertext, ee.footericon);

      if (reason === "user_exit") {
        endEmbed.setDescription("👋 Sessão encerrada com sucesso.");
      } else if (reason === "idle") {
        endEmbed.setDescription("⏳ Sessão encerrada por inatividade.");
      }

      await message.channel.send({ embeds: [endEmbed] });
    });
  }
};