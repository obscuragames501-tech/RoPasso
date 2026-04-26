const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, ActivityType,
    ChannelType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 7/24 AKTİF TUTMA (EXPRESS SERVER) ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso Sistemi Aktif!'));
app.listen(3000, () => console.log('🌐 Web Server 3000 portunda hazır.'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- AYARLAR ---
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";

const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('RoPasso Kontrol Panelini bu kanala kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('setmatch')
        .setDescription('Yeni bir maç etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('setconcert')
        .setDescription('Yeni bir konser etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('passoyardim')
        .setDescription('Tüm komutların listesini gösterir.')
].map(command => command.toJSON());

// --- KOMUTLARI ANINDA KAYDETME FONKSİYONU ---
async function registerToGuild(guildId) {
    if (!TOKEN) return;
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, guildId),
            { body: commands },
        );
        console.log(`✅ Komutlar Sunucuda Aktif: ${guildId}`);
    } catch (error) {
        console.error(`❌ Register Hatası (${guildId}):`, error);
    }
}

// --- BOT HAZIR ---
client.once('ready', async () => {
    console.log(`🚀 ROPasso Online! Giriş yapıldı: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    // Mevcut tüm sunucuları tara ve komutları bas
    client.guilds.cache.forEach(guild => {
        registerToGuild(guild.id);
    });
});

// --- YENİ SUNUCUYA KATILMA ---
client.on('guildCreate', async (guild) => {
    console.log(`🏠 Yeni Sunucuya Girildi: ${guild.name}`);
    await registerToGuild(guild.id);

    const channel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && 
        ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
    );

    if (channel) {
        const welcome = new EmbedBuilder()
            .setTitle('🏟️ RoPasso | Kurulum Başarılı')
            .setDescription('Sistem bu sunucu için aktif edildi. Başlamak için `/setup` yazabilirsin.')
            .setColor(PASSO_RED);
        channel.send({ embeds: [welcome] }).catch(() => null);
    }
});

// --- ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async interaction => {
    // 1. SLASH KOMUTLAR
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') await sendControlPanel(interaction);
        if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
            await openEventModal(interaction, interaction.commandName === 'setmatch');
        }
        if (interaction.commandName === 'passoyardim') {
            const help = new EmbedBuilder()
                .setTitle('📖 ROPasso Rehber')
                .addFields(
                    { name: '/setup', value: 'Yönetim panelini kurar.' },
                    { name: '/setmatch', value: 'Maç oluşturur.' }
                ).setColor(PASSO_RED);
            await interaction.reply({ embeds: [help], ephemeral: true });
        }
    }

    // 2. BUTONLAR
    if (interaction.isButton()) {
        if (interaction.customId === 'auto_setup' || interaction.customId === 'refresh_panel') {
            await sendControlPanel(interaction);
        }
        if (interaction.customId === 'btn_match') await openEventModal(interaction, true);
        if (interaction.customId === 'btn_concert') await openEventModal(interaction, false);
    }

    // 3. MODAL SUBMIT
    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        await interaction.reply({ 
            content: `✅ **${title}** etkinliği bu sunucuda başarıyla oluşturuldu!`, 
            ephemeral: true 
        });
    }
});

// --- PANEL FONKSİYONU ---
async function sendControlPanel(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription(`Sunucu: **${interaction.guild.name}**\nBiletleme ve stadyum yönetimini buradan yapın.`)
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(PASSO_RED);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_match').setLabel('Maç Kur').setStyle(ButtonStyle.Secondary).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('btn_concert').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
    );

    if (interaction.isButton()) await interaction.update({ embeds: [embed], components: [row] });
    else await interaction.reply({ embeds: [embed], components: [row] });
}

// --- MODAL FONKSİYONU ---
async function openEventModal(interaction, isMatch) {
    const modal = new ModalBuilder()
        .setCustomId(isMatch ? 'modal_match' : 'modal_concert')
        .setTitle(isMatch ? 'Maç Oluştur' : 'Konser Oluştur');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel("Etkinlik Başlığı").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Tarih").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Roblox Linki").setStyle(TextInputStyle.Short).setRequired(true))
    );

    await interaction.showModal(modal);
}

// BOTU ÇALIŞTIR
if (TOKEN) {
    client.login(TOKEN);
} else {
    console.error("❌ TOKEN EKSİK! Vercel Environment Variables'ı kontrol et.");
}
