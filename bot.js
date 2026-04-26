const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, ActivityType,
    Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 1. BOTUN UYUMASINI ENGELLEYEN WEB SERVER ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso 7/24 Aktif!'));
app.listen(process.env.PORT || 3000);

// --- 2. AYARLAR (OTOMATİK DOLDURULDU) ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ]
});

// BURASI SENİN BOTUNUN KİMLİĞİ - DEĞİŞTİRME
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";

// --- 3. KOMUTLAR ---
const commands = [
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('RoPasso Yönetim Panelini açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('yardim')
        .setDescription('Sistem rehberini gösterir.')
].map(command => command.toJSON());

// --- 4. KOMUTLARI ANINDA AKTİF ETME (GUILD REGISTER) ---
async function deployCommands(guildId) {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        // Bu satır komutları saniyeler içinde sunucuya yükler
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guildId),
            { body: commands },
        );
        console.log(`✅ Komutlar yüklendi: ${guildId}`);
    } catch (error) {
        console.error(`❌ Komut yükleme hatası:`, error);
    }
}

// --- 5. BOT HAZIR OLDUĞUNDA ---
client.once('ready', () => {
    console.log(`🚀 ${client.user.tag} girişi başarılı!`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    // Botun halihazırda olduğu tüm sunuculara komutları zorla yükle
    client.guilds.cache.forEach(guild => deployCommands(guild.id));
});

// Yeni sunucuya girince anında yükle
client.on('guildCreate', (guild) => deployCommands(guild.id));

// --- 6. ETKİLEŞİMLER ---
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') {
            const embed = new EmbedBuilder()
                .setTitle('🏟️ ROPasso Kontrol Paneli')
                .setDescription('Etkinlik oluşturmak ve bilet sistemini yönetmek için butonları kullanın.')
                .setColor(PASSO_RED);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Kur').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
                new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    if (interaction.isButton()) {
        const isMatch = interaction.customId === 'm_kur';
        const modal = new ModalBuilder()
            .setCustomId(isMatch ? 'modal_m' : 'modal_k')
            .setTitle(isMatch ? '⚽ Maç Oluştur' : '🎤 Konser Oluştur');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel("Başlık").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('d').setLabel("Tarih").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('l').setLabel("Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        await interaction.reply({ content: `✅ Etkinlik başarıyla oluşturuldu ve sisteme kaydedildi!`, ephemeral: true });
    }
});

client.login(TOKEN);
