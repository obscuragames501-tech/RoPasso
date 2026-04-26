const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, ActivityType,
    ChannelType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 1. BOTUN UYUMASINI ENGELLEYEN WEB SERVER ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso Bot 7/24 Online!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Web sunucusu aktif.'));

// --- 2. BOTU BAŞLAT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.DISCORD_TOKEN; // Vercel/Railway'e bu isimle ekle
const PASSO_RED = "#E30613";

// --- 3. KOMUT TANIMLARI ---
const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('RoPasso Kontrol Panelini kurar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('setmatch')
        .setDescription('Maç etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('setconcert')
        .setDescription('Konser etkinliği planlar.'),
    new SlashCommandBuilder()
        .setName('yardim')
        .setDescription('Komut listesini gösterir.')
].map(command => command.toJSON());

// --- 4. KOMUTLARI SUNUCULARA BASAN FONKSİYON (NET ÇÖZÜM) ---
async function deployCommands(guildId) {
    if (!TOKEN) return console.error("❌ Token bulunamadı!");
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        // GuildCommands kullanarak komutların ANINDA gelmesini sağlıyoruz
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, guildId),
            { body: commands },
        );
        console.log(`✅ Komutlar yüklendi: ${guildId}`);
    } catch (error) {
        console.error(`❌ Hata (${guildId}):`, error);
    }
}

// --- 5. EVENT: BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`🤖 Bot Aktif: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    // Botun içindeki tüm sunucuları tara ve komutları tek tek bas
    client.guilds.cache.forEach(guild => {
        deployCommands(guild.id);
    });
});

// --- 6. EVENT: YENİ SUNUCUYA KATILINCA ---
client.on('guildCreate', async (guild) => {
    console.log(`🏠 Yeni sunucu: ${guild.name}`);
    await deployCommands(guild.id); // Yeni sunucuya girer girmez komutları yükle
});

// --- 7. ETKİLEŞİM YÖNETİMİ (SLASH, BUTON, MODAL) ---
client.on('interactionCreate', async interaction => {
    
    // Slash Komutları
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') {
            const embed = new EmbedBuilder()
                .setTitle('🕹️ ROPasso Yönetim Paneli')
                .setDescription('Sunucudaki etkinlikleri yönetmek için aşağıdaki butonları kullanın.')
                .setColor(PASSO_RED);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_match').setLabel('Maç Kur').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
                new ButtonBuilder().setCustomId('btn_concert').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
        
        if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
            await showEventModal(interaction, interaction.commandName === 'setmatch');
        }
    }

    // Buton Tıklamaları
    if (interaction.isButton()) {
        if (interaction.customId === 'btn_match') await showEventModal(interaction, true);
        if (interaction.customId === 'btn_concert') await showEventModal(interaction, false);
    }

    // Modal Form Gönderimi
    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        await interaction.reply({ content: `✅ **${title}** başarıyla sisteme eklendi!`, ephemeral: true });
    }
});

// --- MODAL YARDIMCI FONKSİYONU ---
async function showEventModal(interaction, isMatch) {
    const modal = new ModalBuilder()
        .setCustomId(isMatch ? 'm_match' : 'm_concert')
        .setTitle(isMatch ? 'Maç Planla' : 'Konser Planla');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel("Başlık").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Tarih/Saat").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
    );

    await interaction.showModal(modal);
}

// BOTU ÇALIŞTIR
client.login(TOKEN);
