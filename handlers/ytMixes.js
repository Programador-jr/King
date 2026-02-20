const YT_MIXES = Object.freeze([
  {
    key: "default",
    label: "Predefinido",
    aliases: ["default", "d"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "ncs",
    label: "NCS",
    aliases: ["ncs", "n"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "pop",
    label: "Pop",
    aliases: ["pop", "p"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "rock",
    label: "Rock",
    aliases: ["rock", "ro"],
    url: "https://youtube.com/playlist?list=PLnAYe9y3M4Cbf-PZCjEs9vJU-OAMqk4o6&si=wZSabnnDqJrsKsoa"
  },
  {
    key: "oldgaming",
    label: "Old Gaming",
    aliases: ["oldgaming", "old", "o"],
    url: "https://www.youtube.com/watch?v=iFOAJ12lDDU&list=PLYUn4YaogdahPQPTnBGCrytV97h8ABEav"
  },
  {
    key: "gaming",
    label: "Gaming",
    aliases: ["gaming", "g"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "charts",
    label: "Charts",
    aliases: ["charts", "cha"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "chill",
    label: "Chill",
    aliases: ["chill", "chi"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "jazz",
    label: "Jazz",
    aliases: ["jazz", "j"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "blues",
    label: "Blues",
    aliases: ["blues", "b"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "strange",
    label: "Strange",
    aliases: ["strange", "s"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "magic",
    label: "Magic",
    aliases: ["magic", "ma"],
    url: "https://www.youtube.com/watch?v=WvMc5_RbQNc&list=PLYUn4Yaogdagvwe69dczceHTNm0K_ZG3P"
  },
  {
    key: "metal",
    label: "Metal",
    aliases: ["metal", "me", "h"],
    url: "https://www.youtube.com/playlist?list=PLMC9KNkIncKvYin_USF1qoJQnIyMAfRxl"
  },
  {
    key: "remix",
    label: "Remix",
    aliases: ["remix", "re"],
    url: "https://www.youtube.com/watch?v=NX7BqdQ1KeU&list=PLYUn4YaogdahwfEkuu5V14gYtTqODx7R2"
  }
]);

const normalize = (value) => String(value || "").trim().toLowerCase();

const uniqueAliases = (mix) => {
  const set = new Set((mix.aliases || []).map(normalize).filter(Boolean));
  return [...set];
};

const selectYtMix = (input) => {
  const query = normalize(input);
  if (!query) return YT_MIXES[0];

  for (const mix of YT_MIXES) {
    const aliases = uniqueAliases(mix).sort((a, b) => b.length - a.length);
    if (aliases.some((alias) => query.startsWith(alias))) return mix;
  }
  return YT_MIXES[0];
};

const getMixKeys = () => YT_MIXES.map((mix) => mix.key);

const getMixUsage = () => `mix [${getMixKeys().join("|")}]`;

const getMixDescription = () =>
  "Toca uma mixagem do YouTube por categoria. Use help para ver todas as playlists disponiveis.";

const getMixHelpDetails = () =>
  [
    "Playlists disponiveis:",
    ...YT_MIXES.map((mix) => {
      const aliases = uniqueAliases(mix).join("/");
      return `- \`${mix.key}\` (${aliases})`;
    })
  ].join("\n");

module.exports = {
  YT_MIXES,
  selectYtMix,
  getMixUsage,
  getMixDescription,
  getMixHelpDetails
};
