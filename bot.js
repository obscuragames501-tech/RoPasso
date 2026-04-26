const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ActivityType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 1. 7/24 AKTİF TUTMA (EXPRESS) ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso Bot 7/24 Online!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Web Server Hazır.'));

// --- 2. AYARLAR ---
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- 3. HAZIR KOMUTLAR (ÖNCEDEN YAZILDI) ---
const readyCommands = [
    {
        name: 'setup',
        description: 'RoPasso Yönetim Panelini kurar.',
        default_member_permissions: String(PermissionFlagsBits.Administrator)
    },
    {
        name: 'yardim',
        description: 'Sistem komutlarını gösterir.'
    }
];

// --- 4. KOMUTLARI SUNUCUYA ÇAKAN FONKSİYON ---
async function forceDeploy(guildId) {
    if (!TOKEN) return;
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guildId),
            { body: readyCommands },
        );
        console.log(`✅ Komutlar Sunucuya Basıldı: ${guildId}`);
    } catch (e) {
        console.error(`❌ Hata: ${guildId}`);
    }
}

// --- 5. BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`🚀 ROPasso Aktif: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    // Botun olduğu her sunucuda hem komut bas hem de mesaj at
    client.guilds.cache.forEach(async (guild) => {
        // 1. Komutları saniyeler içinde aktif et
        await forceDeploy(guild.id);

        // 2. Bot "Buradayım" Mesajı Atsın
        const channel = guild.channels.cache.find(ch => 
            ch.type === 0 && ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
        );
        
        if (channel) {
            const buradayim = new EmbedBuilder()
                .setTitle("✅ ROPasso Online!")
                .setDescription("Bot başarıyla aktif edildi. `/setup` komutu saniyeler içinde aktif olacaktır.\n\nEğer komutları hala göremiyorsan **Discord'u Yenile (Ctrl + R)**.")
                .setColor(PASSO_RED);
            channel.send({ embeds: [buradayim] }).catch(() => null);
        }
    });
});

// --- 6. ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') {
            const panel = new EmbedBuilder()
                .setTitle('🏟️ ROPasso Yönetim Paneli')
                .setDescription('Sunucu etkinliklerini biletlemek için butonları kullan.')
                .setColor(PASSO_RED);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Kur').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
                new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
            );

            await interaction.reply({ embeds: [panel], components: [row] });
        }
        
        if (interaction.commandName === 'yardim') {
            await interaction.reply({ content: "📖 **/setup** yazarak yönetim panelini açabilirsin.", ephemeral: true });
        }
    }

    // Buton ve Modal İşlemleri
    if (interaction.isButton()) {
        const isMatch = interaction.customId === 'm_kur';
        const modal = new ModalBuilder()
            .setCustomId(isMatch ? 'modal_m' : 'modal_k')
            .setTitle(isMatch ? 'Maç Planla' : 'Konser Planla');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel("Etkinlik Başlığı").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('d').setLabel("Tarih").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('l').setLabel("Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        await interaction.reply({ content: "✅ Etkinlik başarıyla oluşturuldu!", ephemeral: true });
    }
});

client.login(TOKEN);
