"use strict";

const fs = require("node:fs");
const path = require("node:path");

const siftDir = path.join(__dirname, "..", "node_modules", "sift");
const siftEntry = path.join(siftDir, "index.js");
const siftLibEntry = path.join(siftDir, "lib", "index.js");

const gopdDir = path.join(__dirname, "..", "node_modules", "gopd");
const gopdEntry = path.join(gopdDir, "gOPD.js");

try {
    if (!fs.existsSync(siftEntry)) {
        if (!fs.existsSync(siftLibEntry)) {
            console.warn("[postinstall] sift: lib/index.js nao encontrado, nada a corrigir.");
        } else {
            fs.writeFileSync(
                siftEntry,
                "\"use strict\";\nmodule.exports = require(\"./lib/index.js\");\n",
                "utf8",
            );
            console.log("[postinstall] sift: index.js criado com sucesso.");
        }
    }

    if (!fs.existsSync(gopdEntry)) {
        if (!fs.existsSync(gopdDir)) {
            console.warn("[postinstall] gopd: pacote nao encontrado, nada a corrigir.");
        } else {
            fs.writeFileSync(
                gopdEntry,
                "\"use strict\";\nmodule.exports = Object.getOwnPropertyDescriptor;\n",
                "utf8",
            );
            console.log("[postinstall] gopd: gOPD.js criado com sucesso.");
        }
    }
} catch (error) {
    console.warn(`[postinstall] fix-modules: falha (${error?.message || error})`);
}
