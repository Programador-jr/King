class AutoModHandler {
    constructor(client) {
        this.client = client;
        this.messageCache = new Map();
        this.warnCache = new Map();
    }

    async getWordInfractions(guildId, userId) {
        const GuildSettings = require("../databases/settings");
        try {
            const settings = await GuildSettings.findById(guildId).lean();
            if (!settings || !settings.automodInfractions) return { count: 0, lastWarning: null };
            
            const infractions = settings.automodInfractions[userId];
            if (!infractions) return { count: 0, lastWarning: null };
            
            return {
                count: infractions.count || 0,
                lastWarning: infractions.lastWarning || null
            };
        } catch (e) {
            console.error("[AutoMod] Erro ao buscar infrações:", e);
            return { count: 0, lastWarning: null };
        }
    }

    async addWordInfraction(guildId, userId) {
        const GuildSettings = require("../databases/settings");
        
        try {
            const settings = await GuildSettings.findById(guildId);
            
            if (!settings) {
                const newSettings = new GuildSettings({ 
                    _id: guildId,
                    automodInfractions: {
                        [userId]: { count: 1, lastWarning: new Date() }
                    }
                });
                await newSettings.save();
                return 1;
            }
            
            const infractions = settings.automodInfractions || {};
            const currentCount = infractions[userId]?.count || 0;
            
            infractions[userId] = {
                count: currentCount + 1,
                lastWarning: new Date()
            };
            
            settings.automodInfractions = infractions;
            await settings.save();
            
            return currentCount + 1;
        } catch (e) {
            console.error("[AutoMod] Erro ao salvar infração:", e);
            const cacheKey = `${guildId}-${userId}`;
            const current = this.warnCache.get(cacheKey) || { count: 0 };
            const newCount = current.count + 1;
            this.warnCache.set(cacheKey, { count: newCount, lastWarning: Date.now() });
            return newCount;
        }
    }

    async resetWordInfractions(guildId, userId) {
        const GuildSettings = require("../databases/settings");
        try {
            const settings = await GuildSettings.findById(guildId);
            if (!settings || !settings.automodInfractions) return;
            
            delete settings.automodInfractions[userId];
            settings.markModified('automodInfractions');
            await settings.save();
        } catch (e) {
            console.error("[AutoMod] Erro ao resetar infrações:", e);
        }
    }

    getSettings(guildId) {
        const get = (key, defaultValue = null) => {
            const value = this.client.settings.get(guildId, key);
            if (value === undefined || value === null) return defaultValue;
            return value;
        };

        const getArray = (key, defaultValue = []) => {
            const value = this.client.settings.get(guildId, key);
            if (value === undefined || value === null) return defaultValue;
            if (!Array.isArray(value)) {
                if (typeof value === 'string') {
                    return value.split(',').map(w => w.trim()).filter(w => w);
                }
                return defaultValue;
            }
            return value;
        };

        return {
            enabled: Boolean(get("automodEnabled", false)),
            logChannelId: get("automodLogChannelId", null),
            logWebhook: get("automodLogWebhook", null),
            logType: get("automodLogType", "channel"),
            logMessage: get("automodLogMessage", '{user} | {type} | {reason}'),
            bypassRoles: getArray("automodBypassRoles", []),
            
            antiSpam: {
                enabled: Boolean(get("automodAntiSpamEnabled", false)),
                maxMessages: Number(get("automodAntiSpamMaxMessages", 5)),
                maxSeconds: Number(get("automodAntiSpamMaxSeconds", 3))
            },
            
            antiLinks: {
                enabled: Boolean(get("automodAntiLinksEnabled", false))
            },
            
            antiInvite: {
                enabled: Boolean(get("automodAntiInviteEnabled", false))
            },
            
            antiWords: {
                enabled: Boolean(get("automodAntiWordsEnabled", false)),
                list: getArray("automodAntiWordsList", []),
                warnMessage: get("automodAntiWordsWarnMessage", "Você usou palavras proibidas neste servidor.")
            },
            
            penalties: {
                muteRole: get("automodMuteRole", null),
                penalty1: get("automodPenalty1", "none"),
                penalty2: get("automodPenalty2", "mute"),
                penalty3: get("automodPenalty3", "kick")
            },
            
            antiNewAccounts: {
                enabled: Boolean(get("automodAntiNewAccountsEnabled", false)),
                minDays: Number(get("automodAntiNewAccountsMinDays", 1))
            }
        };
    }

    hasBypassRole(member, roles = []) {
        if (!member || !roles || roles.length === 0) return false;
        return roles.some(roleId => member.roles.cache.has(roleId));
    }

    _cleanCache() {
        const now = Date.now();
        const maxAge = 60000;
        
        for (const [key, messages] of this.messageCache.entries()) {
            const filtered = messages.filter(m => now - m.time < maxAge);
            if (filtered.length === 0) {
                this.messageCache.delete(key);
            } else {
                this.messageCache.set(key, filtered);
            }
        }
    }

    async checkMessage(message) {
        if (!message.guild || message.author.bot) return null;
        
        const settings = this.getSettings(message.guild.id);
        
        if (!settings.enabled) return null;
        
        if (this.hasBypassRole(message.member, settings.bypassRoles)) return null;

        const violations = [];
        const checks = [
            { check: () => this._checkAntiSpam(message, settings.antiSpam), rule: "antiSpam" },
            { check: () => this._checkAntiLinks(message), rule: "antiLinks" },
            { check: () => this._checkAntiInvite(message), rule: "antiInvite" },
            { check: () => this._checkAntiWords(message, settings.antiWords), rule: "antiWords" }
        ];

        for (const { check, rule } of checks) {
            const violation = check();
            if (violation) violations.push(violation);
        }

        return violations.length > 0 ? violations : null;
    }

    _checkAntiSpam(message, settings) {
        if (!settings.enabled) return null;
        
        const key = `${message.guild.id}-${message.author.id}`;
        const now = Date.now();
        
        if (!this.messageCache.has(key)) {
            this.messageCache.set(key, []);
        }
        
        const messages = this.messageCache.get(key);
        messages.push({ time: now, content: message.content });
        
        const cutoff = now - (settings.maxSeconds * 1000);
        const recentMessages = messages.filter(m => now - m.time < cutoff * 2);
        this.messageCache.set(key, recentMessages);
        
        const recent = recentMessages.filter(m => m.time > cutoff);
        if (recent.length > settings.maxMessages) {
            this.messageCache.delete(key);
            return {
                type: "antiSpam",
                reason: `Spam detectado: ${recent.length} mensagens em ${settings.maxSeconds} segundos`,
                action: "warn"
            };
        }
        
        return null;
    }

    _checkAntiLinks(message) {
        const linkRegex = /(https?:\/\/[^\s]+)/gi;
        if (linkRegex.test(message.content)) {
            return {
                type: "antiLinks",
                reason: "Links não permitidos neste servidor",
                action: "delete"
            };
        }
        return null;
    }

    _checkAntiInvite(message) {
        const inviteRegex = /(discord\.gg\/|discordapp\.com\/invite\/|discord\.com\/invite\/)[^\s]+/gi;
        if (inviteRegex.test(message.content)) {
            return {
                type: "antiInvite",
                reason: "Convites de outros servidores não são permitidos",
                action: "delete"
            };
        }
        return null;
    }

    _normalize(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
    }

    _compact(text) {
        if (!text || typeof text !== 'string') return '';
        return text.replace(/\s+/g, ' ').trim();
    }

    _cleanWord(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toLowerCase();
    }

    _removeCommonSubstitutes(text) {
        if (!text || typeof text !== 'string') return '';
        const substitutions = {
            '@': 'a', '4': 'a',
            '0': 'o',
            '3': 'e',
            '1': 'i', '!': 'i',
            '$': 's', '5': 's',
            '7': 't',
            '9': 'g',
            '6': 'g',
            '8': 'b',
        };
        let result = text.toLowerCase();
        for (const [char, replacement] of Object.entries(substitutions)) {
            result = result.split(char).join(replacement);
        }
        return result;
    }

    _containsBadWord(text, badWords) {
        if (!text || !badWords || !Array.isArray(badWords) || badWords.length === 0) {
            return { found: false, words: [] };
        }

        const cleanedText = this._cleanWord(this._removeCommonSubstitutes(text));
        const wordsFound = [];

        for (const badWord of badWords) {
            if (!badWord || typeof badWord !== 'string' || !badWord.trim()) continue;
            
            const cleanedBadWord = this._cleanWord(badWord);
            if (!cleanedBadWord) continue;

            if (cleanedText.includes(cleanedBadWord)) {
                wordsFound.push(badWord.trim());
            }
        }

        return {
            found: wordsFound.length > 0,
            words: wordsFound
        };
    }

    _checkAntiWords(message, settings) {
        if (!settings.enabled || !settings.list || !Array.isArray(settings.list) || settings.list.length === 0) {
            return null;
        }
        
        const result = this._containsBadWord(message.content, settings.list);
        
        if (result.found && result.words.length > 0) {
            const displayWords = result.words.slice(0, 5).map(w => `\`${w}\``).join(", ");
            const moreText = result.words.length > 5 ? ` e mais ${result.words.length - 5}...` : "";
            return {
                type: "antiWords",
                reason: `Palavras bloqueadas: ${displayWords}${moreText}`,
                action: "delete"
            };
        }
        return null;
    }

    async applyPenalty(member, violationType, customMessage = null) {
        const settings = this.getSettings(member.guild.id);
        const penalties = settings.penalties;
        
        const infractionCount = await this.addWordInfraction(member.guild.id, member.user.id);
        
        let penalty = null;
        let penaltyText = "";
        
        const penaltyNames = {
            none: "Nenhuma",
            warn: "Aviso",
            mute: "Mute",
            kick: "Kick",
            ban: "Ban"
        };
        
        if (infractionCount >= 3) {
            penalty = penalties.penalty3;
            penaltyText = `3ª infração → ${penaltyNames[penalty] || penalty}`;
        } else if (infractionCount >= 2) {
            penalty = penalties.penalty2;
            penaltyText = `2ª infração → ${penaltyNames[penalty] || penalty}`;
        } else {
            penalty = penalties.penalty1;
            penaltyText = `1ª infração → ${penaltyNames[penalty] || penalty}`;
        }
        
        const result = {
            infractionCount,
            penalty,
            penaltyText,
            message: customMessage || this.getViolationMessage(violationType)
        };
        
        switch (penalty) {
            case "mute":
                result.actionTaken = "warn";
                if (penalties.muteRole) {
                    const muteRole = member.guild.roles.cache.get(penalties.muteRole);
                    if (muteRole) {
                        const botMember = member.guild.members.cache.get(this.client.user.id);
                        const botHighestRole = botMember?.roles.highest;
                        
                        if (botHighestRole && muteRole.position >= botHighestRole.position) {
                            console.log(`[AutoMod] Não foi possível mutar ${member.user.tag}: cargo de mute está acima do cargo do bot`);
                        } else if (muteRole.position <= member.roles.highest.position && member.roles.highest.position > 0) {
                            console.log(`[AutoMod] Não foi possível mutar ${member.user.tag}: membro tem cargo igual ou superior ao de mute`);
                        } else {
                            await member.roles.add(muteRole, `AutoMod: ${violationType}`).catch((e) => {
                                console.log(`[AutoMod] Erro ao mutar ${member.user.tag}: ${e.message}`);
                            });
                            result.actionTaken = "mute";
                        }
                    } else {
                        console.log(`[AutoMod] Cargo de mute não encontrado: ${penalties.muteRole}`);
                    }
                }
                break;
            case "kick":
                await member.kick(`AutoMod: ${violationType}`).catch((e) => {
                    console.log(`[AutoMod] Erro ao kickar ${member.user.tag}: ${e.message}`);
                });
                result.actionTaken = "kick";
                break;
            case "ban":
                await member.ban({ reason: `AutoMod: ${violationType}` }).catch((e) => {
                    console.log(`[AutoMod] Erro ao banir ${member.user.tag}: ${e.message}`);
                });
                result.actionTaken = "ban";
                break;
            default:
                result.actionTaken = "warn";
        }
        
        return result;
    }
    
    getViolationMessage(violationType) {
        const messages = {
            antiSpam: "Você enviou muitas mensagens rapidamente.",
            antiLinks: "Links não são permitidos neste servidor.",
            antiInvite: "Convites de outros servidores não são permitidos.",
            antiWords: "Você usou palavras proibidas neste servidor."
        };
        return messages[violationType] || "Você violou uma regra do servidor.";
    }

    getWordInfractionStatus(guildId, userId, maxWarnings) {
        const infractions = this.getWordInfractions(guildId, userId);
        return {
            count: infractions.count,
            maxWarnings,
            remaining: Math.max(0, maxWarnings - infractions.count)
        };
    }

    async checkNewAccount(member) {
        const settings = this.getSettings(member.guild.id);
        
        if (!settings.antiNewAccounts.enabled) return null;
        
        const accountAge = Date.now() - member.user.createdTimestamp;
        const minAge = settings.antiNewAccounts.minDays * 86400000;
        
        if (accountAge < minAge) {
            const accountDays = Math.floor(accountAge / 86400000);
            return {
                type: "antiNewAccounts",
                reason: `Conta muito nova (${accountDays} dia(s), mínimo: ${settings.antiNewAccounts.minDays} dia(s))`,
                action: "kick"
            };
        }
        
        return null;
    }

    async logViolation(guild, violation, message = null, member = null) {
        const settings = this.getSettings(guild.id);
        
        if (!settings.logChannelId && !settings.logWebhook) return;
        
        const Discord = require("discord.js");
        
        let userInfo = "Desconhecido";
        let channelInfo = "N/A";
        
        if (member) {
            userInfo = member.user.tag;
        }
        if (message) {
            if (!member) userInfo = message.author.tag;
            if (message.channel) {
                channelInfo = message.channel.toString();
            }
        }
        
        const logTemplate = settings.logMessage || '{user} | {type} | {reason}';
        const logText = logTemplate
            .replace(/{user}/g, userInfo)
            .replace(/{type}/g, this._getRuleName(violation.type))
            .replace(/{reason}/g, violation.reason)
            .replace(/{guild}/g, guild.name)
            .replace(/{channel}/g, channelInfo);
        
        const embed = new Discord.EmbedBuilder()
            .setTitle(`⚠️ AutoMod: ${this._getRuleName(violation.type)}`)
            .setDescription(logText)
            .setColor("Yellow")
            .setTimestamp();

        if (member) {
            embed.addFields([
                { name: "Usuário", value: member.user.tag, inline: true },
                { name: "ID", value: member.user.id, inline: true }
            ]);
        }

        try {
            if (settings.logType === "webhook" && settings.logWebhook) {
                const webhookData = {
                    username: this.client.user.username,
                    avatarURL: this.client.user.displayAvatarURL(),
                    embeds: [embed]
                };
                
                await fetch(settings.logWebhook, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(webhookData)
                });
            } else if (settings.logChannelId) {
                const channel = guild.channels.cache.get(settings.logChannelId);
                if (channel && channel.isTextBased()) {
                    await channel.send({ embeds: [embed] });
                }
            }
        } catch (e) {
            console.error("[AutoMod] Erro ao enviar log:", e.message);
        }
    }

    _getRuleName(type) {
        const names = {
            antiSpam: "Anti-Spam",
            antiLinks: "Anti-Links",
            antiInvite: "Anti-Invite",
            antiWords: "Anti-Palavras",
            antiNewAccounts: "Anti-Contas Novas"
        };
        return names[type] || type;
    }

    async applyAction(member, violation) {
        try {
            switch (violation.action) {
                case "delete":
                    return { action: "message_deleted" };
                    
                case "warn":
                    this._addWarning(member, violation);
                    return { action: "warned", count: this.getWarningCount(member) };
                    
                case "kick":
                    await member.kick(violation.reason).catch(() => {});
                    return { action: "kicked" };
                    
                case "ban":
                    await member.ban({ reason: violation.reason }).catch(() => {});
                    return { action: "banned" };
                    
                default:
                    return { action: "none" };
            }
        } catch (e) {
            console.error("[AutoMod] Erro ao aplicar ação:", e.message);
            return { action: "error", error: e.message };
        }
    }

    _addWarning(member, violation) {
        const key = `${member.guild.id}-${member.id}`;
        
        if (!this.warnCache.has(key)) {
            this.warnCache.set(key, []);
        }
        
        const warnings = this.warnCache.get(key);
        warnings.push({
            reason: violation.reason,
            type: violation.type,
            date: Date.now()
        });
    }

    getWarnings(guildId, userId) {
        const key = `${guildId}-${userId}`;
        return this.warnCache.get(key) || [];
    }

    getWarningCount(member) {
        const key = `${member.guild.id}-${member.id}`;
        return (this.warnCache.get(key) || []).length;
    }

    clearWarnings(guildId, userId) {
        const key = `${guildId}-${userId}`;
        this.warnCache.delete(key);
        return true;
    }
}

module.exports = AutoModHandler;
