const { EmbedBuilder } = require('discord.js');
const config = require('./config');

module.exports = (client) => {
  // Log de Mensagens Apagadas
  client.on('messageDelete', async (message) => {
    if (message.author.bot) return; // Ignora mensagens de outros bots

    const logChannel = message.guild.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor('#ff0000') // Vermelho para mensagens apagadas
      .setTitle('Mensagem Apagada')
      .addFields(
        { name: 'Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Canal', value: `${message.channel.name}`, inline: true },
        { name: 'Conteúdo', value: message.content || 'Nenhum conteúdo de texto.' }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });

  // Log de Mensagens Editadas
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (oldMessage.author.bot) return; // Ignora mensagens de outros bots

    const logChannel = oldMessage.guild.channels.cache.get(config.logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor('#ffff00') // Amarelo para mensagens editadas
      .setTitle('Mensagem Editada')
      .addFields(
        { name: 'Autor', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
        { name: 'Canal', value: `${oldMessage.channel.name}`, inline: true },
        { name: 'Antigo Conteúdo', value: oldMessage.content || 'Nenhum conteúdo de texto.' },
        { name: 'Novo Conteúdo', value: newMessage.content || 'Nenhum conteúdo de texto.' }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] });
  });
};