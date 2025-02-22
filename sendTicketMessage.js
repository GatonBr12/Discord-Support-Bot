const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const tickets = require('./tickets');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} está online!`);
  await tickets(client);
  process.exit(); // Encerra o script após enviar a mensagem
});

client.login(config.token);