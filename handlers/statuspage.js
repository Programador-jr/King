class StatuspageHandler {
    constructor(client) {
        this.client = client;
        this.apiKey = process.env.STATUSPAGE_API_KEY;
        this.baseUrl = "https://api.statuspage.io/v1";
        this.botComponentId = "5ln8yczrbdwr"; // ID do componente Bot
    }

    async load() {
        if (!this.apiKey) {
            console.log("[Statuspage] API key não configurada");
            return false;
        }

        this.attachBotListeners();
        this.attachProcessHandlers();
        
        console.log("[Statuspage] Handler carregado (eventos de Bot)");
        return true;
    }

    async request(method, endpoint, body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                "Authorization": `OAuth ${this.apiKey}`,
                "Content-Type": "application/json"
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`[Statuspage] Request erro: ${error.message}`);
            return null;
        }
    }

    async updateBotStatus(status) {
        try {
            await this.request(
                "PATCH",
                `/pages/qkyj1trlj8rg/components/${this.botComponentId}.json`,
                { component: { status } }
            );
            console.log(`[Statuspage] Bot -> ${status}`);
        } catch (error) {
            console.warn(`[Statuspage] Erro ao atualizar status: ${error.message}`);
        }
    }

    attachBotListeners() {
        if (!this.client) return;

        this.client.on("ready", () => {
            console.log("[Statuspage] Bot online");
            this.updateBotStatus("operational");
        });

        this.client.on("disconnect", () => {
            console.log("[Statuspage] Bot desconectado");
            this.updateBotStatus("major_outage");
        });

        this.client.on("shardDisconnect", () => {
            console.log("[Statuspage] Shard desconectado");
            this.updateBotStatus("major_outage");
        });

        this.client.on("shardResume", () => {
            console.log("[Statuspage] Shard reconectado");
            this.updateBotStatus("operational");
        });

        console.log("[Statuspage] Bot listeners attached");
    }

    attachProcessHandlers() {
        const handleShutdown = async (signal) => {
            console.log(`[Statuspage] Recebido ${signal}`);
            await this.updateBotStatus("major_outage");
            process.exit(0);
        };

        process.on("SIGINT", handleShutdown);
        process.on("SIGTERM", handleShutdown);
    }

    destroy() {
        this.updateBotStatus("major_outage");
    }
}

module.exports = (client) => {
    if (!client.statuspageInstance) {
        client.statuspageInstance = new StatuspageHandler(client);
    }
    return client.statuspageInstance;
};