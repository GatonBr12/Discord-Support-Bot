const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { createTranscript } = require('discord-html-transcripts'); // Pacote para criar transcripts

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Textos em português e inglês
const ticketTexts = {
  encomendas: {
    title: {
      pt: '🛒 Encomendas',
      en: '🛒 Orders',
    },
    description: {
      pt: 'Olá! Abra um ticket para fazer uma **encomenda**. Nossa equipe entrará em contato em breve.',
      en: 'Hello! Open a ticket to place an **order**. Our team will contact you shortly.',
    },
  },
  suporte: {
    title: {
      pt: '🛠️ Suporte Técnico',
      en: '🛠️ Technical Support',
    },
    description: {
      pt: 'Olá! Você abriu um ticket de **suporte técnico**. Por favor, descreva o seu problema com detalhes para que possamos ajudá-lo(a). Nossa equipe entrará em contato em breve!',
      en: 'Hello! You have opened a **technical support** ticket. Please describe your issue in detail so we can assist you. Our team will contact you shortly!',
    },
  },
  financeiro: {
    title: {
      pt: '💸 Financeiro',
      en: '💸 Financial',
    },
    description: {
      pt: 'Olá! Abra um ticket para questões **financeiras**. Nossa equipe entrará em contato em breve.',
      en: 'Hello! Open a ticket for **financial** matters. Our team will contact you shortly.',
    },
  },
  outros: {
    title: {
      pt: '📦 Outros',
      en: '📦 Others',
    },
    description: {
      pt: 'Olá! Abra um ticket para **outros assuntos**. Nossa equipe está à disposição!',
      en: 'Hello! Open a ticket for **other matters**. Our team is here to assist you!',
    },
  },
};

// Carrega os comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Evento para interações de comandos, botões e Select Menus
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;

  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Ocorreu um erro ao executar o comando!',
        ephemeral: true,
      });
    }
  }

  if (interaction.isButton()) {
    const { customId, member, guild } = interaction;

    // Cargo PT-BR
    if (customId === 'ptbr') {
      const role = guild.roles.cache.get(config.ptbrRoleId);
      if (!role) return;

      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        await interaction.reply({
          content: 'Cargo PT-BR removido!',
          ephemeral: true,
        });
      } else {
        await member.roles.add(role);
        await interaction.reply({
          content: 'Cargo PT-BR adicionado!',
          ephemeral: true,
        });
      }
    }

    // Cargo ENG
    if (customId === 'eng') {
      const role = guild.roles.cache.get(config.engRoleId);
      if (!role) return;

      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
        await interaction.reply({
          content: 'Cargo ENG removido!',
          ephemeral: true,
        });
      } else {
        await member.roles.add(role);
        await interaction.reply({
          content: 'Cargo ENG adicionado!',
          ephemeral: true,
        });
      }
    }

    // Botão para fechar o ticket
    if (customId === 'close-ticket') {
      const ticketChannel = interaction.channel;

      // Verifica se o canal é um ticket
      if (!ticketChannel.name.startsWith('ticket-')) {
        return interaction.reply({
          content: 'Este comando só pode ser usado em tickets.',
          ephemeral: true,
        });
      }

      // Envia uma mensagem de confirmação
      await interaction.reply({
        content: 'O ticket será fechado em 5 segundos...',
        ephemeral: true,
      });

      // Cria o transcript
      const transcript = await createTranscript(ticketChannel, {
        limit: -1, // Coleta todas as mensagens
        returnType: 'string', // Retorna o transcript como uma string
      });

      // Envia o transcript para o canal de logs
      const logChannel = guild.channels.cache.get(config.ticketLogChannelId);
      if (logChannel) {
        await logChannel.send({
          content: `Transcript do ticket ${ticketChannel.name}:`,
          files: [{
            attachment: Buffer.from(transcript),
            name: `transcript-${ticketChannel.name}.html`,
          }],
        });
      }

      // Espera 5 segundos antes de fechar o canal
      setTimeout(async () => {
        await ticketChannel.delete('Ticket fechado pelo usuário.');
      }, 5000);
    }

    // Botão para adicionar usuário ao ticket
    if (customId === 'add-user') {
      const ticketChannel = interaction.channel;

      // Verifica se o canal é um ticket
      if (!ticketChannel.name.startsWith('ticket-')) {
        return interaction.reply({
          content: 'Este comando só pode ser usado em tickets.',
          ephemeral: true,
        });
      }

      // Solicita o ID do usuário
      await interaction.reply({
        content: 'Por favor, insira o ID do usuário que deseja adicionar ao ticket.',
        ephemeral: true,
      });

      // Coleta a resposta do usuário
      const filter = (response) => interaction.user.id === response.author.id;
      const collector = ticketChannel.createMessageCollector({ filter, time: 60000, max: 1 });

      collector.on('collect', async (message) => {
        const userId = message.content.trim();
        const user = await guild.members.fetch(userId).catch(() => null);

        if (!user) {
          return interaction.followUp({
            content: 'Usuário não encontrado. Verifique o ID e tente novamente.',
            ephemeral: true,
          });
        }

        // Adiciona o usuário ao ticket
        await ticketChannel.permissionOverwrites.edit(user, {
          ViewChannel: true,
          SendMessages: true,
        });

        await interaction.followUp({
          content: `Usuário ${user.user.tag} adicionado ao ticket com sucesso!`,
          ephemeral: true,
        });
      });

      collector.on('end', (collected) => {
        if (collected.size === 0) {
          interaction.followUp({
            content: 'Tempo esgotado. Nenhum ID foi fornecido.',
            ephemeral: true,
          });
        }
      });
    }
  }

  if (interaction.isStringSelectMenu()) {
    const { member, guild, values } = interaction;

    // Verifica se a interação é do menu de tickets
    if (interaction.customId === 'ticket-category') {
      const selectedCategory = values[0]; // Pega a opção selecionada

      // Puxa o ID da categoria de tickets do config.js
      const category = guild.channels.cache.get(config.ticketCategoryId);

      if (!category) {
        return interaction.reply({
          content: 'A categoria de tickets não foi encontrada. Contate um administrador.',
          ephemeral: true,
        });
      }

      const supportRole = guild.roles.cache.get(config.supportRoleId);

      if (!supportRole) {
        return interaction.reply({
          content: 'O cargo de suporte não foi encontrado. Contate um administrador.',
          ephemeral: true,
        });
      }

      const username = member.user.username || 'usuário';
      const channelName = config.ticketChannelName.replace('{username}', username);

      if (!channelName || typeof channelName !== 'string') {
        return interaction.reply({
          content: 'Ocorreu um erro ao criar o ticket. Contate um administrador.',
          ephemeral: true,
        });
      }

      const cleanedChannelName = channelName.replace(/[^a-zA-Z0-9\-_]/g, '');

      // Cria o canal de ticket
      const channel = await guild.channels.create({
        name: cleanedChannelName,
        type: 0, // Tipo de canal (0 = GUILD_TEXT)
        parent: category,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: ['ViewChannel'], // Todos os membros não podem ver o canal
          },
          {
            id: member.id,
            allow: ['ViewChannel', 'SendMessages'], // O membro que abriu o ticket pode ver e enviar mensagens
          },
          {
            id: client.user.id, // O bot pode ver e gerenciar o canal
            allow: ['ViewChannel', 'ManageChannels'],
          },
          {
            id: supportRole.id, // A equipe de suporte pode ver e gerenciar o canal
            allow: ['ViewChannel', 'SendMessages', 'ManageMessages'],
          },
        ],
      });

      // Textos para o ticket
      const ticketText = ticketTexts[selectedCategory];
      const title = `${ticketText.title.pt} | ${ticketText.title.en}`; // Título em PT e EN
      const description = `🇧🇷 **Português:**\n${ticketText.description.pt}\n\n🇺🇸 **English:**\n${ticketText.description.en}`; // Descrição em PT e EN

      // Envia uma mensagem no canal de ticket
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(title)
        .setDescription(description)
        .setFooter({ text: 'Obrigado por entrar em contato! | Thank you for contacting us!' });

      // Adiciona os botões
      const closeButton = new ButtonBuilder()
        .setCustomId('close-ticket')
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger);

      const addUserButton = new ButtonBuilder()
        .setCustomId('add-user')
        .setLabel('Adicionar Usuário')
        .setStyle(ButtonStyle.Success);

      const buttonRow = new ActionRowBuilder().addComponents(closeButton, addUserButton);

      await channel.send({
        content: `📢 ${supportRole.toString()} - Um novo ticket foi aberto por ${member.user.tag}!`,
        embeds: [embed],
        components: [buttonRow],
      });

      // Responde ao usuário
      await interaction.reply({
        content: `Seu ticket foi criado em ${channel}. | Your ticket has been created in ${channel}.`,
        ephemeral: true,
      });

      // Log do ticket
      const logChannel = guild.channels.cache.get(config.ticketLogChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('🎫 Novo Ticket Criado')
          .addFields(
            { name: 'Criado por', value: `${member.user.tag} (${member.user.id})` },
            { name: 'Categoria', value: selectedCategory },
            { name: 'Canal', value: channel.toString() }
          )
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] });
      }
    }
  }
});

// Sistema de Recepção (Boas-vindas e Saídas)
client.on('guildMemberAdd', async (member) => {
  console.log(`Novo membro adicionado: ${member.user.tag}`); // Log para depuração

  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (!channel) {
    console.error('Canal de boas-vindas não encontrado. Verifique o ID no config.js.');
    return;
  }

  // Verifica se o bot tem permissão para enviar mensagens no canal
  if (!channel.permissionsFor(member.guild.members.me).has('SendMessages')) {
    console.error('O bot não tem permissão para enviar mensagens no canal de boas-vindas.');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('🎉 Bem-vindo(a) ao servidor! 🎉')
    .setDescription(`${member.user.username} acabou de entrar no servidor.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
    .addFields(
      { name: 'Membro', value: `${member.user.tag}`, inline: true },
      { name: 'Contagem de membros', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] })
    .catch((error) => {
      console.error('Erro ao enviar mensagem de boas-vindas:', error);
    });
});

client.on('guildMemberRemove', async (member) => {
  console.log(`Membro removido: ${member.user.tag}`); // Log para depuração

  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (!channel) {
    console.error('Canal de boas-vindas não encontrado. Verifique o ID no config.js.');
    return;
  }

  // Verifica se o bot tem permissão para enviar mensagens no canal
  if (!channel.permissionsFor(member.guild.members.me).has('SendMessages')) {
    console.error('O bot não tem permissão para enviar mensagens no canal de boas-vindas.');
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('😢 Adeus... 😢')
    .setDescription(`${member.user.username} saiu do servidor.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
    .addFields(
      { name: 'Membro', value: `${member.user.tag}`, inline: true },
      { name: 'Contagem de membros', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();

  channel.send({ embeds: [embed] })
    .catch((error) => {
      console.error('Erro ao enviar mensagem de saída:', error);
    });
});

// Sistema de Logs para Mensagens Apagadas e Editadas
client.on('messageDelete', async (message) => {
  const logChannel = message.guild.channels.cache.get(config.logChannelId);
  if (!logChannel) {
    console.error('Canal de logs não encontrado. Verifique o ID no config.js.');
    return;
  }

  // Ignora mensagens de bots
  if (message.author.bot) return;

  const embed = new EmbedBuilder()
    .setColor('#ff0000') // Vermelho para mensagens apagadas
    .setTitle('🚫 Mensagem Apagada')
    .addFields(
      { name: 'Autor', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: 'Canal', value: `${message.channel.name}`, inline: true },
      { name: 'Conteúdo', value: message.content || 'Nenhum conteúdo de texto.' }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] })
    .catch((error) => {
      console.error('Erro ao enviar log de mensagem apagada:', error);
    });
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  const logChannel = oldMessage.guild.channels.cache.get(config.logChannelId);
  if (!logChannel) {
    console.error('Canal de logs não encontrado. Verifique o ID no config.js.');
    return;
  }

  // Ignora mensagens de bots
  if (oldMessage.author.bot) return;

  // Verifica se o conteúdo da mensagem foi alterado
  if (oldMessage.content === newMessage.content) return;

  const embed = new EmbedBuilder()
    .setColor('#ffff00') // Amarelo para mensagens editadas
    .setTitle('✏️ Mensagem Editada')
    .addFields(
      { name: 'Autor', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
      { name: 'Canal', value: `${oldMessage.channel.name}`, inline: true },
      { name: 'Antes', value: oldMessage.content || 'Nenhum conteúdo de texto.' },
      { name: 'Depois', value: newMessage.content || 'Nenhum conteúdo de texto.' }
    )
    .setTimestamp();

  logChannel.send({ embeds: [embed] })
    .catch((error) => {
      console.error('Erro ao enviar log de mensagem editada:', error);
    });
});

// Envia a mensagem de cargos automáticos e tickets automaticamente
client.once('ready', async () => {
  console.log(`Bot ${client.user.tag} está online!`);

  // Define o status do bot
  const statusList = [
    { name: 'D&G Developments', type: 'WATCHING' },
    { name: 'D&G Developments', type: 'LISTENING' },
    { name: 'D&G Developments', type: 'PLAYING' },
  ];

  let index = 0;
  setInterval(() => {
    const status = statusList[index];
    client.user.setPresence({
      activities: [{
        name: status.name,
        type: status.type,
      }],
      status: 'dnd', // Status do bot (online, idle, dnd, invisible)
    });

    // Avança para o próximo status
    index = (index + 1) % statusList.length;
  }, 10000); // Muda o status a cada 10 segundos

  // Envia a mensagem de cargos automáticos
  const reactionRoleChannel = client.channels.cache.get(config.reactionRoleChannelId);
  if (reactionRoleChannel) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🌍 Escolha seu idioma / 🌍 Choose your language')
      .setDescription('\n')
      .addFields(
        { name: '🇧🇷 PT-BR', value: 'Clique no botão abaixo para escolher o cargo PT-BR!' },
        { name: '🇺🇸 ENG', value: 'Click the button below to choose the ENG role!' }
      )
      .setFooter({ text: 'Escolha seu idioma. | Choose your language.' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ptbr')
        .setLabel('PT-BR')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🇧🇷'),
      new ButtonBuilder()
        .setCustomId('eng')
        .setLabel('ENG')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🇺🇸')
    );

    await reactionRoleChannel.send({ embeds: [embed], components: [row] });
    console.log('Mensagem de cargos automáticos enviada com sucesso!');
  } else {
    console.error('Canal de reação de cargos não encontrado. Verifique o ID no config.js.');
  }

  // Envia a mensagem de tickets automaticamente
  const ticketChannel = client.channels.cache.get(config.ticketChannelId);
  if (ticketChannel) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🎫 Sistema de Tickets | Ticket System')
      .setDescription('Selecione uma categoria abaixo para abrir um ticket: | Select a category below to open a ticket:')
      .setFooter({ text: 'Escolha uma opção no menu. | Choose an option from the menu.' });

    // Cria o Select Menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket-category')
      .setPlaceholder('Selecione uma categoria | Select a category')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('🛒 Encomendas | Orders')
          .setValue('encomendas'),
        new StringSelectMenuOptionBuilder()
          .setLabel('🛠️ Suporte | Support')
          .setValue('suporte'),
        new StringSelectMenuOptionBuilder()
          .setLabel('💸 Financeiro | Financial')
          .setValue('financeiro'),
        new StringSelectMenuOptionBuilder()
          .setLabel('📦 Outros | Others')
          .setValue('outros')
      );

    // Cria a Action Row para o Select Menu
    const row = new ActionRowBuilder().addComponents(selectMenu);

    await ticketChannel.send({ embeds: [embed], components: [row] });
    console.log('Mensagem de tickets enviada com sucesso!');
  } else {
    console.error('Canal de tickets não encontrado. Verifique o ID no config.js.');
  }
});

// Inicia o bot
client.login(config.token);