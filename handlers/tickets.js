const { parsePanelButtonCustomId } = require("./ticketPanelIdentity");

class TicketHandler {
    constructor(client) {
        this.client = client;
        this.guildQueues = new Map();
        this.activeCreations = new Set();
    }

    _withGuildLock(guildId, operation) {
        const id = String(guildId);
        const previous = this.guildQueues.get(id) || Promise.resolve();
        const current = previous.catch(() => {}).then(operation);
        this.guildQueues.set(id, current);
        current.finally(() => {
            if (this.guildQueues.get(id) === current) this.guildQueues.delete(id);
        }).catch(() => {});
        return current;
    }

    async _resolveGuildChannel(guild, channelId) {
        if (!guild || !channelId) return null;
        let channel = guild.channels.cache.get(channelId);
        if (channel) return channel;
        try {
            channel = await guild.channels.fetch(channelId);
            return channel || null;
        } catch (error) {
            return null;
        }
    }

    _normalizeLogConfig(config = {}) {
        const source = config && typeof config === "object" ? config : {};
        const type = source.type === "webhook" ? "webhook" : "channel";
        const channelId = typeof source.channelId === "string" && source.channelId.trim()
            ? source.channelId.trim()
            : null;
        const webhookUrl = typeof source.webhookUrl === "string" && source.webhookUrl.trim()
            ? source.webhookUrl.trim()
            : null;
        const message = typeof source.message === "string" && source.message.trim()
            ? source.message.trim()
            : null;

        return {
            enabled: Boolean(source.enabled),
            type,
            channelId,
            webhookUrl,
            message
        };
    }

    _formatDuration(durationMs) {
        const safe = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;
        const totalMinutes = Math.floor(safe / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes} minutos`;
    }

    _buildLogMessage(logType, ticketData, actor, template = null) {
        const ticketNumber = ticketData?.ticketNumber ?? "?";
        const reason = ticketData?.reason || "Sem motivo especificado";
        const channelMention = ticketData?.channelId ? `<#${ticketData.channelId}>` : "canal desconhecido";
        const userId = ticketData?.userId || actor?.id || null;
        const userTag = ticketData?.userTag || actor?.tag || "Usuário desconhecido";
        const userMention = userId ? `<@${userId}>` : userTag;
        const closerId = ticketData?.closedBy || actor?.id || null;
        const closerTag = ticketData?.closedByTag || actor?.tag || "Staff desconhecida";
        const closerMention = closerId ? `<@${closerId}>` : closerTag;
        const durationText = this._formatDuration((ticketData?.closedAt || 0) - (ticketData?.createdAt || 0));
        const panelId = ticketData?.panelId || "N/A";

        const defaultOpen = `🎫 Ticket #${ticketNumber} aberto por ${userMention} em ${channelMention}. Motivo: ${reason}`;
        const defaultClose = `🔒 Ticket #${ticketNumber} fechado por ${closerMention} em ${channelMention}. Duração: ${durationText}`;
        const base = (typeof template === "string" && template.trim())
            ? template
            : (logType === "close" ? defaultClose : defaultOpen);

        return base
            .replace(/{ticket}/g, String(ticketNumber))
            .replace(/{reason}/g, String(reason))
            .replace(/{channel}/g, String(channelMention))
            .replace(/{user}/g, String(userMention))
            .replace(/{usertag}/g, String(userTag))
            .replace(/{closer}/g, String(closerMention))
            .replace(/{closertag}/g, String(closerTag))
            .replace(/{duration}/g, String(durationText))
            .replace(/{panel}/g, String(panelId));
    }

    _getPanelById(guildId, panelId) {
        if (!panelId) return null;
        const panels = this.getGuildPanels(guildId);
        const id = String(panelId);
        return panels.find((panel) => {
            const panelIdValue = String(panel?.id || "");
            const legacyPanelIdValue = String(panel?.panelId || "");
            return panelIdValue === id || legacyPanelIdValue === id;
        }) || null;
    }

    _getResolvedLogConfig(guildId, ticketData, logType) {
        const panel = this._getPanelById(guildId, ticketData?.panelId);
        if (panel && panel.logs && typeof panel.logs === "object") {
            const panelLog = panel.logs[logType];
            if (panelLog && typeof panelLog === "object") {
                return {
                    source: "panel",
                    ...this._normalizeLogConfig(panelLog)
                };
            }
        }

        const isOpenLog = logType === "open";
        return {
            source: "global",
            ...this._normalizeLogConfig({
                enabled: this.client.settings.get(guildId, isOpenLog ? "ticketLogOpenEnabled" : "ticketLogCloseEnabled"),
                type: this.client.settings.get(guildId, isOpenLog ? "ticketLogOpenType" : "ticketLogCloseType"),
                channelId: this.client.settings.get(guildId, isOpenLog ? "ticketLogOpenChannel" : "ticketLogCloseChannel"),
                webhookUrl: this.client.settings.get(guildId, isOpenLog ? "ticketLogOpenWebhook" : "ticketLogCloseWebhook"),
                message: this.client.settings.get(guildId, isOpenLog ? "ticketLogOpenMessage" : "ticketLogCloseMessage")
            })
        };
    }

    getTicketsDb(guildId) {
        this.client.settings.ensure(guildId, {
            ticketCount: 0,
            openTickets: [],
            closedTickets: [],
            tickets: {},
            ticketHistory: []
        });
        
        const allData = this.client.settings.get(guildId);
        
        return {
            count: allData.ticketCount || 0,
            open: allData.openTickets || [],
            closed: allData.closedTickets || [],
            data: allData.tickets || {},
            history: allData.ticketHistory || []
        };
    }

    async _saveTicketsDb(guildId, data) {
        const current = this.client.settings.get(guildId) || {};

        // Converter tickets para objetoplain simples para evitar problemas com MongoDB
        const ticketsData = {};
        if (data.data && typeof data.data === 'object') {
            for (const [key, value] of Object.entries(data.data)) {
                ticketsData[key] = value;
            }
        }

        const newData = {
            ...current,
            ticketCount: data.count,
            openTickets: data.open,
            closedTickets: data.closed,
            tickets: ticketsData,
            ticketHistory: data.history
        };

        try {
            await this.client.settings.set(guildId, newData);
        } catch (error) {
            this.client.settings.set(guildId, current);
            throw error;
        }
    }

    _appendHistory(history, entry) {
        const next = [...(Array.isArray(history) ? history : []), entry];
        if (next.length > 1000) next.splice(0, next.length - 1000);
        return next;
    }

    async createTicket(guildId, userId, reason = "Sem motivo especificado", userTag = "Unknown") {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return null;
        return this._withGuildLock(guildId, async () => {
            let db = this.getTicketsDb(guildId);
            const data = { ...db.data };
            const incomplete = Object.entries(data).filter(([, ticket]) =>
                String(ticket?.userId) === String(userId)
                && ["creating", "open"].includes(ticket?.status)
                && !ticket?.channelId
                && !this.activeCreations.has(`${guildId}:${ticket.ticketNumber}`)
            );
            if (incomplete.length) {
                for (const [key] of incomplete) delete data[key];
                const incompleteNumbers = new Set(incomplete.map(([, ticket]) => ticket.ticketNumber));
                db = {
                    ...db,
                    open: db.open.filter((number) => !incompleteNumbers.has(number)),
                    closed: db.closed.filter((number) => !incompleteNumbers.has(number)),
                    data,
                    history: incomplete.reduce((history, [, ticket]) => this._appendHistory(history, {
                        action: "creation_recovered",
                        ticketNumber: ticket.ticketNumber,
                        userId,
                        timestamp: Date.now(),
                    }), db.history),
                };
                await this._saveTicketsDb(guildId, db);
            }
            const hasOpenTicket = Object.values(db.data).some((ticket) =>
                String(ticket?.userId) === String(userId)
                && ["creating", "open"].includes(ticket?.status)
            );
            if (hasOpenTicket) return null;

            const storedNumbers = Object.values(db.data)
                .map((ticket) => Number(ticket?.ticketNumber) || 0);
            const ticketNumber = Math.max(Number(db.count) || 0, ...storedNumbers) + 1;
            const ticketData = {
                id: `ticket-${ticketNumber}`,
                ticketNumber,
                guildId,
                userId,
                userTag,
                reason,
                channelId: null,
                messageId: null,
                status: "creating",
                createdAt: Date.now(),
                closedAt: null,
                closedBy: null,
                closedByTag: null,
                transcript: [],
                categoryId: null,
                panelId: null,
            };
            const ticketRecords = { ...db.data, [`ticket-${ticketNumber}`]: ticketData };
            await this._saveTicketsDb(guildId, {
                ...db,
                count: ticketNumber,
                data: ticketRecords,
                history: this._appendHistory(db.history, {
                    action: "creating",
                    ticketNumber,
                    userId,
                    userTag,
                    reason,
                    timestamp: Date.now(),
                }),
            });
            this.activeCreations.add(`${guildId}:${ticketNumber}`);
            return ticketData;
        });
    }

    async createTicketChannel(guild, ticketData, categoryId, panelId = null) {
        return this._withGuildLock(guild.id, async () => {
            const ticketNumber = Number(ticketData?.ticketNumber);
            const key = `ticket-${ticketNumber}`;
            const db = this.getTicketsDb(guild.id);
            const reservation = db.data[key];
            if (!reservation || reservation.status !== "creating" || reservation.channelId) {
                throw new Error(`Ticket #${ticketNumber} não possui uma reserva válida.`);
            }
            const supportRoles = this.client.settings.get(guild.id, "ticketRoles") || [];
            const permissionOverwrites = [
                { id: guild.roles.everyone, deny: ["ViewChannel"] },
                { id: this.client.user.id, allow: ["ViewChannel", "SendMessages", "ManageMessages", "EmbedLinks"] },
                { id: reservation.userId, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
                ...supportRoles.map((roleId) => ({
                    id: roleId,
                    allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
                })),
            ];
            let channel;
            try {
                channel = await guild.channels.create({
                    name: `ticket-${ticketNumber}`,
                    type: 0,
                    parent: categoryId ? guild.channels.cache.get(categoryId) : null,
                    permissionOverwrites,
                });
                const updated = {
                    ...reservation,
                    status: "open",
                    channelId: channel.id,
                    categoryId,
                    panelId,
                };
                await this._saveTicketsDb(guild.id, {
                    ...db,
                    open: [...new Set([...db.open, ticketNumber])],
                    data: { ...db.data, [key]: updated },
                    history: this._appendHistory(db.history, {
                        action: "created",
                        ticketNumber,
                        userId: reservation.userId,
                        timestamp: Date.now(),
                    }),
                });
                Object.assign(ticketData, updated);
                this.activeCreations.delete(`${guild.id}:${ticketNumber}`);
                return channel;
            } catch (error) {
                if (channel) {
                    await channel.delete("Clean up ticket whose persistence failed").catch((cleanupError) => {
                        console.error(`[Tickets] Falha ao remover o canal ${channel.id} após erro ao persistir o ticket #${ticketNumber}:`, cleanupError);
                    });
                }
                const latest = this.getTicketsDb(guild.id);
                const data = { ...latest.data };
                delete data[key];
                await this._saveTicketsDb(guild.id, {
                    ...latest,
                    open: latest.open.filter((number) => number !== ticketNumber),
                    closed: latest.closed.filter((number) => number !== ticketNumber),
                    data,
                    history: this._appendHistory(latest.history, {
                        action: "creation_failed",
                        ticketNumber,
                        userId: reservation.userId,
                        error: error.message,
                        timestamp: Date.now(),
                    }),
                }).catch((cleanupError) => {
                    console.error(`[Tickets] Falha ao limpar reserva incompleta #${ticketNumber}:`, cleanupError);
                });
                this.activeCreations.delete(`${guild.id}:${ticketNumber}`);
                console.error(`[Tickets] Falha ao criar canal do ticket #${ticketNumber} no servidor ${guild.id}:`, error);
                throw error;
            }
        });
    }

    async closeTicket(guildId, ticketNumber, closedBy, closedByTag = "Unknown") {
        return this._withGuildLock(guildId, async () => {
            const db = this.getTicketsDb(guildId);
            const ticketKey = `ticket-${ticketNumber}`;
            const previous = db.data[ticketKey];
            if (!previous || previous.status !== "open" || previous.creationPending) return null;
            const channel = await this._getTicketChannel(guildId, previous);
            if (previous.channelId && !channel) return null;
            const priorName = channel?.name;
            try {
                if (channel) {
                    await channel.setName(`closed-${ticketNumber}`);
                    await channel.permissionOverwrites.edit(previous.userId, {
                        ViewChannel: false,
                        SendMessages: false,
                    });
                }
                const closedAt = Date.now();
                const ticketData = { ...previous, status: "closed", closedAt, closedBy, closedByTag };
                await this._saveTicketsDb(guildId, {
                    ...db,
                    open: db.open.filter((number) => number !== ticketNumber),
                    closed: [...new Set([...db.closed, ticketNumber])],
                    data: { ...db.data, [ticketKey]: ticketData },
                    history: this._appendHistory(db.history, {
                        action: "closed", ticketNumber, closedBy, closedByTag, timestamp: closedAt,
                    }),
                });
                return ticketData;
            } catch (error) {
                if (channel) {
                    await channel.setName(priorName).catch(() => {});
                    await channel.permissionOverwrites.edit(previous.userId, {
                        ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
                    }).catch(() => {});
                }
                throw error;
            }
        });
    }

    async reopenTicket(guildId, ticketNumber) {
        return this._withGuildLock(guildId, async () => {
            const db = this.getTicketsDb(guildId);
            const ticketKey = `ticket-${ticketNumber}`;
            const previous = db.data[ticketKey];
            if (!previous || previous.status !== "closed") return null;
            const channel = await this._getTicketChannel(guildId, previous);
            if (previous.channelId && !channel) return null;
            const priorName = channel?.name;
            try {
                if (channel) {
                    await channel.setName(`ticket-${ticketNumber}`);
                    await channel.permissionOverwrites.edit(previous.userId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                    });
                }
                const ticketData = { ...previous, status: "open", closedAt: null, closedBy: null, closedByTag: null };
                await this._saveTicketsDb(guildId, {
                    ...db,
                    closed: db.closed.filter((number) => number !== ticketNumber),
                    open: [...new Set([...db.open, ticketNumber])],
                    data: { ...db.data, [ticketKey]: ticketData },
                    history: this._appendHistory(db.history, { action: "reopened", ticketNumber, timestamp: Date.now() }),
                });
                return ticketData;
            } catch (error) {
                if (channel) {
                    await channel.setName(priorName).catch(() => {});
                    await channel.permissionOverwrites.edit(previous.userId, {
                        ViewChannel: false, SendMessages: false,
                    }).catch(() => {});
                }
                throw error;
            }
        });
    }

    async deleteTicket(guildId, ticketNumber) {
        return this._withGuildLock(guildId, async () => {
            const db = this.getTicketsDb(guildId);
            const ticketKey = `ticket-${ticketNumber}`;
            let ticketData = db.data[ticketKey];
            if (!ticketData || !["closed", "deleting"].includes(ticketData.status)) return null;
            if (ticketData.status === "closed") {
                ticketData = { ...ticketData, status: "deleting" };
                await this._saveTicketsDb(guildId, {
                    ...db,
                    closed: db.closed.filter((number) => number !== ticketNumber),
                    data: { ...db.data, [ticketKey]: ticketData },
                });
            }
            const channel = await this._getTicketChannel(guildId, ticketData);
            if (ticketData.channelId && !channel) {
                console.warn(`[Tickets] Canal ${ticketData.channelId} do ticket #${ticketNumber} não encontrado; removendo registro incompleto.`);
            }
            try {
                if (channel) await channel.delete(`Ticket #${ticketNumber} deleted by authorized staff`);
            } catch (error) {
                const latest = this.getTicketsDb(guildId);
                const restored = { ...ticketData, status: "closed" };
                await this._saveTicketsDb(guildId, {
                    ...latest,
                    closed: [...new Set([...latest.closed, ticketNumber])],
                    data: { ...latest.data, [ticketKey]: restored },
                }).catch((restoreError) => {
                    console.error(`[Tickets] Falha ao restaurar o estado do ticket #${ticketNumber}:`, restoreError);
                });
                throw error;
            }
            const latest = this.getTicketsDb(guildId);
            const data = { ...latest.data };
            delete data[ticketKey];
            await this._saveTicketsDb(guildId, {
                ...latest,
                open: latest.open.filter((number) => number !== ticketNumber),
                closed: latest.closed.filter((number) => number !== ticketNumber),
                data,
                history: this._appendHistory(latest.history, {
                    action: "deleted", ticketNumber, userId: ticketData.userId,
                    userTag: ticketData.userTag, timestamp: Date.now(),
                }),
            });
            return ticketData;
        });
    }

    async _getTicketChannel(guildId, ticketData) {
        if (!ticketData?.channelId) return null;
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return null;
        return this._resolveGuildChannel(guild, ticketData.channelId);
    }

    async addToHistory(guildId, entry) {
        const db = this.getTicketsDb(guildId);
        const history = [...db.history, entry];
        
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }
        
        await this._saveTicketsDb(guildId, {
            ...db,
            history: history
        });
    }

    getTicket(guildId, ticketNumber) {
        const db = this.getTicketsDb(guildId);
        return db.data[`ticket-${ticketNumber}`] || null;
    }

    getGuildTickets(guildId) {
        const db = this.getTicketsDb(guildId);
        
        return {
            open: Array.isArray(db.open) ? db.open.map(t => db.data[`ticket-${t}`]).filter(Boolean) : [],
            closed: Array.isArray(db.closed) ? db.closed.map(t => db.data[`ticket-${t}`]).filter(Boolean) : [],
            total: (Array.isArray(db.open) ? db.open.length : 0) + (Array.isArray(db.closed) ? db.closed.length : 0)
        };
    }

    getHistory(guildId, limit = 50) {
        const db = this.getTicketsDb(guildId);
        const history = db.history || [];
        return history.slice(-limit).reverse();
    }

    async createPanel(guildId, panelData) {
        this.client.settings.ensure(guildId, {
            ticketPanels: []
        });

        const allData = this.client.settings.get(guildId);
        const panels = allData.ticketPanels || [];

        const panelId = panelData.id || panelData.panelId || `panel-${Date.now()}`;
        const panel = {
            id: panelId,
            guildId,
            ...panelData,
            panelId: panelData.panelId || panelId,
            createdAt: Date.now(),
            ticketsCreated: 0
        };

        panels.push(panel);
        
        this.client.settings.set(guildId, {
            ...allData,
            ticketPanels: panels
        });

        return panel;
    }

    async updatePanel(guildId, panelId, updateData) {
        this.client.settings.ensure(guildId, {
            ticketPanels: []
        });

        const allData = this.client.settings.get(guildId);
        const panels = allData.ticketPanels || [];
        const panelIndex = panels.findIndex(p => p.id === panelId);
        
        if (panelIndex === -1) {
            throw new Error('Painel não encontrado');
        }

        // Atualizar dados do painel
        panels[panelIndex] = {
            ...panels[panelIndex],
            ...updateData,
            updatedAt: Date.now()
        };

        this.client.settings.set(guildId, {
            ...allData,
            ticketPanels: panels
        });

        return panels[panelIndex];
    }

    async incrementPanelTickets(guildId, panelId) {
        const allData = this.client.settings.get(guildId) || {};
        const panels = Array.isArray(allData.ticketPanels) ? allData.ticketPanels : [];
        const panel = panels.find(p => p.id === panelId);
        if (panel) {
            panel.ticketsCreated = (panel.ticketsCreated || 0) + 1;
            this.client.settings.set(guildId, {
                ...allData,
                ticketPanels: panels
            });
        }
    }

    getPanel(guildId, messageId) {
        const allData = this.client.settings.get(guildId) || {};
        const panels = Array.isArray(allData.ticketPanels) ? allData.ticketPanels : [];
        return panels.find(p => p.messageId === messageId) || null;
    }

    getPanelByButtonId(guildId, customId, messageId = null) {
        const allData = this.client.settings.get(guildId) || {};
        const panels = Array.isArray(allData.ticketPanels) ? allData.ticketPanels : [];
        
        // Primeiro tenta encontrar pelo customId exato do botão
        let panel = panels.find(p => (p.buttons || []).some(btn => btn.customId === customId));
        if (panel) return panel;
        
        // Se não encontrar, tenta encontrar pelo padrão create_ticket_panelId
        if (customId.startsWith("create_ticket_")) {
            const panelId = customId.replace("create_ticket_", "");
            panel = panels.find(p => p.panelId === panelId);
            if (panel) return panel;
        }

        // Fallback: tenta pelo messageId da própria mensagem do painel
        if (messageId) {
            panel = panels.find(p => p.messageId === messageId);
            if (panel) return panel;
        }
        
        return null;
    }

    getGuildPanels(guildId) {
        const allData = this.client.settings.get(guildId) || {};
        return Array.isArray(allData.ticketPanels) ? allData.ticketPanels : [];
    }

    async deletePanel(guildId, panelId) {
        const allData = this.client.settings.get(guildId) || {};
        const panels = Array.isArray(allData.ticketPanels) ? allData.ticketPanels : [];

        // Tentar encontrar por panelId primeiro
        let filteredPanels = panels.filter(p => p.id !== panelId && p.panelId !== panelId);

        // Se não encontrou por panelId, tentar por messageId
        if (filteredPanels.length === panels.length) {
            filteredPanels = panels.filter(p => p.messageId !== panelId);
        }

        this.client.settings.set(guildId, {
            ...allData,
            ticketPanels: filteredPanels
        });
    }

    async sendWebhookNotification(webhookUrl, ticketData, guild, user, message = null) {
        if (!webhookUrl) return;

        const axios = require("axios");
        const { MessageEmbed } = require("discord.js");

        const embed = new MessageEmbed()
            .setColor("#00BFFF")
            .setTitle("🎫 Novo Ticket Criado")
            .addField("Servidor", guild.name, true)
            .addField("Ticket", `#${ticketData.ticketNumber}`, true)
            .addField("Usuário", user.tag, true)
            .addField("Motivo", ticketData.reason, true)
            .setTimestamp()
            .setFooter({ text: "King Bot Tickets" });

        try {
            await axios.post(webhookUrl, {
                content: message || undefined,
                embeds: [embed]
            });
        } catch (error) {
            console.error("[Webhook] Erro ao enviar notificação:", error.message);
        }
    }

    async sendCloseWebhookNotification(webhookUrl, ticketData, guild, closedBy, message = null) {
        if (!webhookUrl) return;

        const axios = require("axios");
        const { MessageEmbed } = require("discord.js");

        const duration = ticketData.closedAt - ticketData.createdAt;
        const durationText = Math.floor(duration / 60000) + " minutos";

        const embed = new MessageEmbed()
            .setColor("#FF6B6B")
            .setTitle("🎫 Ticket Fechado")
            .addField("Servidor", guild.name, true)
            .addField("Ticket", `#${ticketData.ticketNumber}`, true)
            .addField("Fechado por", closedBy.tag, true)
            .addField("Duração", durationText, true)
            .setTimestamp()
            .setFooter({ text: "King Bot Tickets" });

        try {
            await axios.post(webhookUrl, {
                content: message || undefined,
                embeds: [embed]
            });
        } catch (error) {
            console.error("[Webhook] Erro ao enviar notificação:", error.message);
        }
    }

    async sendOpenLog(guildId, ticketData, guild, user) {
        try {
            await this.client.settings.fetch(guildId);
            const logConfig = this._getResolvedLogConfig(guildId, ticketData, "open");
            const openMessage = this._buildLogMessage("open", ticketData, user, logConfig.message);

            if (logConfig.enabled) {
                if (logConfig.type === "webhook" && logConfig.webhookUrl) {
                    await this.sendWebhookNotification(logConfig.webhookUrl, ticketData, guild, user, openMessage);
                    return;
                }

                if (logConfig.type === "channel" && logConfig.channelId) {
                    const channel = await this._resolveGuildChannel(guild, logConfig.channelId);
                    if (channel && channel.isTextBased()) {
                        try {
                            const { MessageEmbed } = require("discord.js");
                            const embed = new MessageEmbed()
                                .setColor("#00BFFF")
                                .setTitle("🎫 Novo Ticket Criado")
                                .addField("Servidor", guild.name, true)
                                .addField("Ticket", `#${ticketData.ticketNumber}`, true)
                                .addField("Usuário", user.tag, true)
                                .addField("Motivo", ticketData.reason, true)
                                .setTimestamp()
                                .setFooter({ text: "King Bot Tickets" });
                            await channel.send({ content: openMessage, embeds: [embed] });
                        } catch (error) {
                            console.error("[Ticket] Erro ao enviar log de abertura no canal:", error.message);
                        }
                    }
                    return;
                }
            }

            if (logConfig.source === "global") {
                const legacyWebhook = this.client.settings.get(guildId, "ticketWebhook");
                if (legacyWebhook) {
                    await this.sendWebhookNotification(legacyWebhook, ticketData, guild, user, openMessage);
                }
            }
        } catch (error) {
            console.error("[Ticket] Erro ao processar log de abertura:", error.message);
        }
    }

    async sendCloseLog(guildId, ticketData, guild, closedBy) {
        try {
            await this.client.settings.fetch(guildId);
            const logConfig = this._getResolvedLogConfig(guildId, ticketData, "close");
            const closeMessage = this._buildLogMessage("close", ticketData, closedBy, logConfig.message);

            if (logConfig.enabled) {
                if (logConfig.type === "webhook" && logConfig.webhookUrl) {
                    await this.sendCloseWebhookNotification(logConfig.webhookUrl, ticketData, guild, closedBy, closeMessage);
                    return;
                }

                if (logConfig.type === "channel" && logConfig.channelId) {
                    const channel = await this._resolveGuildChannel(guild, logConfig.channelId);
                    if (channel && channel.isTextBased()) {
                        try {
                            const { MessageEmbed } = require("discord.js");
                            const duration = ticketData.closedAt - ticketData.createdAt;
                            const durationText = Math.floor(duration / 60000) + " minutos";
                            const embed = new MessageEmbed()
                                .setColor("#FF6B6B")
                                .setTitle("🎫 Ticket Fechado")
                                .addField("Servidor", guild.name, true)
                                .addField("Ticket", `#${ticketData.ticketNumber}`, true)
                                .addField("Fechado por", closedBy.tag, true)
                                .addField("Duração", durationText, true)
                                .setTimestamp()
                                .setFooter({ text: "King Bot Tickets" });
                            await channel.send({ content: closeMessage, embeds: [embed] });
                        } catch (error) {
                            console.error("[Ticket] Erro ao enviar log de fechamento no canal:", error.message);
                        }
                    }
                    return;
                }
            }

            if (logConfig.source === "global") {
                const legacyWebhook = this.client.settings.get(guildId, "ticketWebhook");
                if (legacyWebhook) {
                    await this.sendCloseWebhookNotification(legacyWebhook, ticketData, guild, closedBy, closeMessage);
                }
            }
        } catch (error) {
            console.error("[Ticket] Erro ao processar log de fechamento:", error.message);
        }
    }

    getUserTicket(guildId, userId) {
        try {
            const db = this.getTicketsDb(guildId);
            const tickets = db.data;

            // Procurar nos tickets abertos
            for (const [key, ticket] of Object.entries(tickets)) {
                if (ticket.userId === userId &&
                    ticket.status === 'open' &&
                    ticket.channelId) {
                    return ticket;
                }
            }
            return null;
        } catch (error) {
            console.error("[Ticket] Erro ao buscar ticket do usuário:", error);
            return null;
        }
    }

    findPanelByCustomId(guildId, customId) {
        return this.findPanelByButtonId(guildId, customId);
    }

    findPanelByButtonId(guildId, customId, messageId = null) {
        try {
            const panels = this.getGuildPanels(guildId);
            const parsed = parsePanelButtonCustomId(customId);
            if (parsed) {
                return panels.find((panel) =>
                    String(panel.id || panel.panelId) === parsed.panelId
                    && (panel.buttons || [])[parsed.buttonIndex]
                ) || null;
            }

            if (String(customId).startsWith("create_ticket_")) {
                const panelId = String(customId).slice("create_ticket_".length);
                const panel = panels.find((item) =>
                    String(item.panelId || item.id) === panelId
                    || String(item.id || item.panelId) === panelId
                );
                if (panel) return panel;
            }

            const matches = panels.filter((panel) =>
                (panel.buttons || []).some((button) => button.customId === customId)
            );
            if (messageId) {
                return panels.find((panel) => String(panel.messageId) === String(messageId)
                    && (panel.buttons || []).some((button) => button.customId === customId)) || null;
            }
            return matches.length === 1 ? matches[0] : null;
        } catch (error) {
            console.error("[Ticket] Erro ao encontrar painel:", error);
            return null;
        }
    }
}

module.exports = TicketHandler;
