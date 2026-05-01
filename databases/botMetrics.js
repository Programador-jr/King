const { Schema, model } = require('mongoose');

const BotMetricsSchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    uptime: { type: Number },
    ping: { type: Number },
    memoryUsed: { type: Number },
    memoryTotal: { type: Number },
    guildCount: { type: Number },
    commandsPerMinute: { type: Number }
}, { timestamps: true });

module.exports = model('BotMetrics', BotMetricsSchema);
