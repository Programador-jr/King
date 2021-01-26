const { readdirSync } = require("fs");

const ascii = require("ascii-table");

// Crie uma nova tabela Ascii
let table = new ascii("Comandos");
table.setHeading("Comando", "Status");

module.exports = (client) => {
    // Leia cada subpasta de comandos
    readdirSync("./commands/").forEach(dir => {
        // Filtre para termos apenas arquivos de comando .js
        const commands = readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"));
    
        // Faça um loop nos comandos e adicione todos eles a uma coleção
        // Se nenhum nome for encontrado, evite que ele retorne um erro,
        // Usando uma cruz na tabela que fizemos
        for (let file of commands) {
            let pull = require(`../commands/${dir}/${file}`);
    
            if (pull.name) {
                client.commands.set(pull.name, pull);
                table.addRow(file, '✅');
            } else {
                table.addRow(file, `❌  -> falta um help.name ou help.name não é uma string.`);
                continue;
            }
    
            // Se houver uma chave de aliases, leia os aliases.
            if (pull.aliases && Array.isArray(pull.aliases)) pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
        }
    });
    //Registrar a mesa
    console.log(table.toString());
}