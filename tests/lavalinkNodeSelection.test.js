const assert = require("node:assert/strict");
const { test } = require("node:test");
const LavalinkManagerWrapper = require("../handlers/lavalinkClient");

function withLavalinkEnv(values, callback) {
    const keys = [
        "LAVALINK_LOCAL",
        "LAVALINK_HOST",
        "LAVALINK_PORT",
        "LAVALINK_SECURE",
        "LAVALINK_PASSWORD",
    ];
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

    for (const key of keys) {
        delete process.env[key];
    }
    Object.assign(process.env, values);

    try {
        return callback();
    } finally {
        for (const key of keys) {
            if (typeof previous[key] === "undefined") delete process.env[key];
            else process.env[key] = previous[key];
        }
    }
}

test("explicit Lavalink host and password take precedence over lavalink.json", () => {
    withLavalinkEnv({
        LAVALINK_HOST: "127.0.0.1",
        LAVALINK_PORT: "2333",
        LAVALINK_PASSWORD: "local-test-password",
    }, () => {
        const wrapper = new LavalinkManagerWrapper({});
        const nodes = wrapper.getNodeOptionsList();

        assert.equal(nodes.length, 1);
        assert.equal(nodes[0].id, "king-lavalink-local");
        assert.equal(nodes[0].host, "127.0.0.1");
        assert.equal(nodes[0].port, 2333);
        assert.equal(nodes[0].authorization, "local-test-password");
        assert.equal(nodes[0].secure, false);
    });
});

test("LAVALINK_LOCAL=true requires explicit credentials and does not fall back to lavalink.json", () => {
    withLavalinkEnv({ LAVALINK_LOCAL: "true" }, () => {
        const wrapper = new LavalinkManagerWrapper({});
        assert.throws(() => wrapper.getNodeOptionsList(), /LAVALINK_HOST\/PORT\/PASSWORD/);
    });
});

test("local Lavalink mode rejects an invalid port", () => {
    withLavalinkEnv({
        LAVALINK_LOCAL: "true",
        LAVALINK_HOST: "127.0.0.1",
        LAVALINK_PORT: "2333abc",
        LAVALINK_PASSWORD: "local-test-password",
    }, () => {
        const wrapper = new LavalinkManagerWrapper({});
        assert.throws(() => wrapper.getNodeOptionsList(), /LAVALINK_HOST\/PORT\/PASSWORD/);
    });
});
