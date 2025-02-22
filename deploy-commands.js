const { REST, Routes } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Carrega todos os comandos da pasta "commands"
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON()); // Converte o comando para JSON
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Registrando comandos slash globalmente...');

    // Registra os comandos globalmente
    await rest.put(
      Routes.applicationCommands(config.clientId), // Registro global
      { body: commands }
    );

    console.log('Comandos slash registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();