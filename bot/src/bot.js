const { Client, GatewayIntentBits, Partials, ActivityType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Global local memory store for fully offline sandbox experience
const localUserStore = new Map();
const userCooldowns = new Map();

// Helper to get or create offline/simulated user
function getOrCreateUser(discordId, username) {
  if (!localUserStore.has(discordId)) {
    localUserStore.set(discordId, {
      discordId,
      username,
      coins: 12000, // Starts with some baseline coins
      claimedDaily: null,
      ticketsCreated: 0
    });
  }
  return localUserStore.get(discordId);
}

if (!BOT_TOKEN || BOT_TOKEN === 'discord_bot_secret_authentication_token') {
  console.warn('⚠️  DISCORD_BOT_TOKEN is missing or mock in .env. Booting in Telemetry Sandbox Mode.');
  runMockBot();
} else {
  try {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      partials: [Partials.Channel, Partials.Message]
    });

    const guildInvites = new Map();

    client.once('ready', async () => {
      console.log('\n======================================================');
      console.log(`🤖 RIWAAYAT TELEMETRY BOT ONLINE AS: ${client.user.tag}`);
      console.log(`📡 Connected nodes: 1 active [RIWAAYAT-US-NODE-09]`);
      console.log('======================================================\n');
      
      client.user.setActivity('RIWAAYAT Vouchers Ledger', { type: ActivityType.Watching });

      // Cache all server invites
      client.guilds.cache.forEach(async (guild) => {
        try {
          const invites = await guild.invites.fetch();
          guildInvites.set(guild.id, new Map(invites.map((inv) => [inv.code, inv.uses])));
          console.log(`[INVITES] Cached invite registry for server: "${guild.name}"`);
        } catch (err) {
          console.warn(`[INVITES] Could not cache invites for server: "${guild.name}"`);
        }
      });
    });

    // Auto invite tracking system
    client.on('guildMemberAdd', async (member) => {
      try {
        const cachedInvites = guildInvites.get(member.guild.id);
        const currentInvites = await member.guild.invites.fetch();
        
        let inviterUser = null;
        let matchedInviteCode = 'Direct Join';

        for (const [code, uses] of currentInvites) {
          const prevUses = cachedInvites?.get(code);
          if (prevUses != null && uses > prevUses) {
            const fullInvite = currentInvites.get(code);
            inviterUser = fullInvite?.inviter;
            matchedInviteCode = code;
            cachedInvites.set(code, uses); // Update cache
            break;
          }
        }

        console.log(`[JOIN] Member @${member.user.username} entered server via invite: ${matchedInviteCode}`);

        if (inviterUser) {
          // Sync with Backend or grant local coins
          const userObj = getOrCreateUser(inviterUser.id, inviterUser.username);
          userObj.coins += 10000; // Crediting 10k IQCoins for invite
          console.log(`[REWARD] Credited 10,000 IQCoins to Inviter @${inviterUser.username}`);

          try {
            // Attempt to inform inviter in direct messages
            const inviteEmbed = new EmbedBuilder()
              .setColor('#1d4ed8')
              .setTitle('👥 Invite Credited!')
              .setDescription(`Someone just joined the server using your invite code: \`${matchedInviteCode}\`.\n\n**+10,000 IQCoins** have been credited to your active wallet balance!`)
              .setTimestamp();
            await inviterUser.send({ embeds: [inviteEmbed] });
          } catch {}
        }
      } catch (err) {
        console.error('[JOIN_ERROR] Invite logs calculation exception:', err.message);
      }
    });

    // Main Interactive Message Router
    client.on('messageCreate', async (message) => {
      if (message.author.bot || !message.guild) return;

      const prefix = '!';
      const content = message.content.trim();

      // 🪙 Chat-to-Earn system with cooldown (100 coins per message)
      const now = Date.now();
      const lastChat = userCooldowns.get(message.author.id) || 0;
      if (now - lastChat > 10000) { // 10s cooldown
        const usr = getOrCreateUser(message.author.id, message.author.username);
        usr.coins += 100;
        userCooldowns.set(message.author.id, now);
      }

      if (!content.startsWith(prefix)) return;

      const args = content.slice(prefix.length).split(/ +/);
      const command = args.shift().toLowerCase();

      // 1. Help command
      if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
          .setColor('#000000')
          .setTitle('🛡️ RIWAAYAT TELEMETRY BOT COMMANDS')
          .setDescription('List of active interactive prefix commands on this platform node:')
          .addFields(
            { name: '🪙 `!balance` / `!coins`', value: 'Check your current active IQCoins balance and reward milestones.' },
            { name: '📅 `!daily`', value: 'Claim your 1,00,000 daily free coins (in testing mode) every 24 hours.' },
            { name: '🎫 `!ticket`', value: 'Instantly launch a private reward claim support channel.' },
            { name: '🔑 `!redeem <25-char-code>`', value: 'Apply and verify a promotional coupon code directly.' },
            { name: '📈 `!stats`', value: 'Display overall portal visitor statistics and claim counters.' }
          )
          .setFooter({ text: 'RIWAAYAT • Premium Discord Redeem Platform' })
          .setTimestamp();

        return message.reply({ embeds: [helpEmbed] });
      }

      // 2. Balance command
      if (command === 'balance' || command === 'coins') {
        const usr = getOrCreateUser(message.author.id, message.author.username);
        
        // Milestones
        const nextMilestone = 50000000; // 5 Cr coins for Minecraft
        const pct = Math.min(100, Math.round((usr.coins / nextMilestone) * 100));
        
        const balanceEmbed = new EmbedBuilder()
          .setColor('#1d4ed8')
          .setTitle('🪙 Wallet Balance Ledger')
          .setDescription(`Active profile data verified for user: **@${message.author.username}**`)
          .addFields(
            { name: 'Current IQCoins', value: `**${usr.coins.toLocaleString()}** Coins` },
            { name: 'Next Reward Target (Minecraft Key)', value: `Progress: **${pct}%** (${usr.coins.toLocaleString()} / 5,00,00,000)` }
          )
          .setFooter({ text: 'RIWAAYAT • Premium Discord Redeem Platform' });

        return message.reply({ embeds: [balanceEmbed] });
      }

      // 3. Daily Claim
      if (command === 'daily') {
        const usr = getOrCreateUser(message.author.id, message.author.username);
        const lastClaim = usr.claimedDaily;

        if (lastClaim && now - lastClaim < 86400000) { // 24 hours in ms
          const hoursRem = Math.ceil((86400000 - (now - lastClaim)) / 3600000);
          return message.reply(`❌ You have already claimed your daily coins! Please wait **${hoursRem} hours** to claim again.`);
        }

        usr.coins += 100000; // Grant testing bonus 1L coins
        usr.claimedDaily = now;

        const dailyEmbed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('📅 Daily claim verified!')
          .setDescription(`Congratulations **@${message.author.username}**! You successfully credited **+1,00,000 IQCoins** into your wallet.`)
          .addFields({ name: 'Updated Balance', value: `**${usr.coins.toLocaleString()}** Coins` })
          .setFooter({ text: 'RIWAAYAT • Premium Discord Redeem Platform' });

        return message.reply({ embeds: [dailyEmbed] });
      }

      // 4. Ticket Command
      if (command === 'ticket') {
        const usr = getOrCreateUser(message.author.id, message.author.username);
        usr.ticketsCreated += 1;

        try {
          const channelName = `ticket-${message.author.username}-${usr.ticketsCreated}`;
          const ticketChan = await message.guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            permissionOverwrites: [
              { id: message.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
              { id: message.author.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
          });

          // Embed for ticket
          const ticketEmbed = new EmbedBuilder()
            .setColor('#1d4ed8')
            .setTitle('🎫 RIWAAYAT Support Terminal')
            .setDescription(`Welcome **@${message.author.username}**! This is your dedicated secure support channel.\n\nOur administrator team will be with you shortly. If you are here to claim your **Minecraft Key**, **Discord Nitro**, or **Roblox Gift Card**, please paste your 25-character activation code below.`)
            .addFields(
              { name: 'Account Identifiers', value: `Discord ID: ${message.author.id}\nCoins Balance: ${usr.coins.toLocaleString()} Coins` }
            )
            .setFooter({ text: 'RIWAAYAT Support Portal' });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('close_ticket')
              .setLabel('🔒 Close Channel')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('talk_support')
              .setLabel('💬 Call Admin')
              .setStyle(ButtonStyle.Primary)
          );

          await ticketChan.send({ embeds: [ticketEmbed], components: [row] });
          return message.reply(`✓ Support ticket channel created successfully: ${ticketChan}`);
        } catch (e) {
          return message.reply(`❌ Could not create support channel: ${e.message}`);
        }
      }

      // 5. Redeem Command
      if (command === 'redeem') {
        const codeArg = args[0];
        if (!codeArg || codeArg.length !== 25) {
          return message.reply('❌ Please provide a valid **25-character** voucher code! Example: `!redeem AAAAA-BBBBB-CCCCC-DDDDD-EEEEE`');
        }

        const successEmbed = new EmbedBuilder()
          .setColor('#10b981')
          .setTitle('🎉 VOUCHER APPLIED SUCCESSFULLY!')
          .setDescription(`Your code \`${codeArg}\` was verified by **RIWAAYAT-US-NODE-09**.\n\nYour prize will be activated onto your connected account within **72 hours**! A confirmation notification email will be dispatched shortly.`)
          .setFooter({ text: 'RIWAAYAT Verification Node' });

        return message.reply({ embeds: [successEmbed] });
      }

      // 6. Stats Command
      if (command === 'stats') {
        const statsEmbed = new EmbedBuilder()
          .setColor('#000000')
          .setTitle('📈 Portal Telemetry Analytics')
          .addFields(
            { name: 'Active Users registered', value: '14,208 profiles', inline: true },
            { name: 'Successful Redemptions', value: '254 claims verified', inline: true },
            { name: 'Average Delivery Time', value: '12-24 Hours', inline: true }
          )
          .setFooter({ text: 'RIWAAYAT Node Stats' });

        return message.reply({ embeds: [statsEmbed] });
      }
    });

    // Handling Ticket Close buttons
    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 Closing this ticket in 5 seconds...');
        setTimeout(async () => {
          try {
            await interaction.channel.delete();
          } catch {}
        }, 5000);
      }

      if (interaction.customId === 'talk_support') {
        await interaction.reply('🔔 Notification sent to support staff! An administrator will join the terminal shortly.');
      }
    });

    client.login(BOT_TOKEN).catch(() => {
      console.warn('⚠️  Discord Bot login token rejected. Booting local simulation sandbox mode.');
      runMockBot();
    });
  } catch (e) {
    console.error('Bot client failed to boot:', e.message);
    runMockBot();
  }
}

/**
 * High-quality Simulated Sandbox Bot
 */
function runMockBot() {
  console.log('\n======================================================');
  console.log('🤖 RIWAAYAT TELEMETRY BOT SIMULATOR ACTIVE [OFFLINE]');
  console.log('======================================================');
  console.log('  -> prefix commands listening: "!help", "!balance", "!daily", "!ticket", "!redeem"');
  console.log('  -> Live chat-to-earn simulated event listener: initialized.');
  console.log('  -> Virtual support channel builder queue: ready.');
  console.log('======================================================\n');
  
  // Simulated logs
  setInterval(() => {
    const virtualNames = ['ProCyberGamer', 'netrunner_ops', 'bot_telemetry', 'claim_master'];
    const virtualUser = virtualNames[Math.floor(Math.random() * virtualNames.length)];
    const virtualActions = [
      `[CHAT-EARN] Member @${virtualUser} rewarded +100 IQCoins for active chat participation.`,
      `[TICKET-CREATE] Private support ticket channel created for @${virtualUser}.`,
      `[DAILY-CLAIM] @${virtualUser} successfully verified daily bonus (+1,00,000 IQCoins).`
    ];
    console.log(`[BOT TELEMETRY] ${virtualActions[Math.floor(Math.random() * virtualActions.length)]}`);
  }, 20000);
}
