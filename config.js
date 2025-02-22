module.exports = {
  // Bot token (required) | Token do bot (obrigatório)
  token: 'YOUR_BOT_TOKEN_HERE', // Substitua pelo token do seu bot

  // Role IDs for automatic roles (PT-BR and ENG) | IDs dos cargos automáticos (PT-BR e ENG)
  ptbrRoleId: 'PT_BR_ROLE_ID_HERE', // Substitua pelo ID do cargo PT-BR
  engRoleId: 'ENG_ROLE_ID_HERE', // Substitua pelo ID do cargo ENG

  // Ticket category ID (where tickets will be created) | ID da categoria de tickets (onde os tickets serão criados)
  ticketCategoryId: 'TICKET_CATEGORY_ID_HERE', // Substitua pelo ID da categoria de tickets

  // Welcome/Goodbye channel ID (logs) | ID do canal de boas-vindas/saídas (logs)
  welcomeChannelId: 'WELCOME_CHANNEL_ID_HERE', // Substitua pelo ID do canal de boas-vindas

  // Reaction role channel ID (where language buttons will be sent) | ID do canal de reação de cargos (onde os botões de idioma serão enviados)
  reactionRoleChannelId: 'REACTION_ROLE_CHANNEL_ID_HERE', // Substitua pelo ID do canal de reação de cargos

  // Ticket channel ID (where the ticket menu will be sent) | ID do canal de tickets (onde o menu de tickets será enviado)
  ticketChannelId: 'TICKET_CHANNEL_ID_HERE', // Substitua pelo ID do canal de tickets

  // Ticket channel name (can include {username} to replace with the user's name) | Nome do canal de ticket (pode incluir {username} para substituir pelo nome do usuário)
  ticketChannelName: 'ticket-{username}',

  // Logs channel ID | ID do canal de logs
  logChannelId: 'LOG_CHANNEL_ID_HERE', // Substitua pelo ID do canal de logs

  // Support role ID | ID do cargo de suporte
  supportRoleId: 'SUPPORT_ROLE_ID_HERE', // Substitua pelo ID do cargo de suporte

  // Ticket logs channel ID | ID do canal de logs de tickets
  ticketLogChannelId: 'TICKET_LOG_CHANNEL_ID_HERE', // Substitua pelo ID do canal de logs de tickets
};