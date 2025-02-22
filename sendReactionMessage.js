const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const reactionRoles = require('./reactionRoles');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} está online!`);
  await reactionRoles(client);
  process.exit(); // Encerra o script após enviar a mensagem
});

client.login(config.token);