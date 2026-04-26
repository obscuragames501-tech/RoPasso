const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ActivityType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 1. WEB SERVER (7/24 AKTİF TUTAR) ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso Bot 7/24 Online!'));
app.listen(process.env.PORT || 3000, () => console.log('🌐 Web sunucusu aktif.'));

// --- 2. AYARLAR ---
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";
const PREFIX = "!"; // Slash çalışmazsa !setup yazabilirsin

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, // Mesaj komutları için şart!
        GatewayIntentBits.GuildMembers
    ]
});

// --- 3. KOMUT TANIMLARI ---
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
    if (!TOKEN) return console.log("❌ TOKEN EKSİK!");
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guildId),
            { body: readyCommands },
        );
        console.log(`✅ Komutlar Sunucuya Basıldı: ${guildId}`);
    } catch (e) {
        console.error(`❌ Komut Basma Hatası: ${e.message}`);
    }
}

// --- 5. BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`🚀 ROPasso Aktif: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    client.guilds.cache.forEach(async (guild) => {
        await forceDeploy(guild.id);

        // Bot girdiğinde bir kanala "Ben Buradayım" mesajı atar
        const channel = guild.channels.cache.find(ch => 
            ch.type === 0 && ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
        );
        
        if (channel) {
            const onlineEmbed = new EmbedBuilder()
                .setTitle("✅ ROPasso Sistemi Aktif!")
                .setDescription("JavaScript motoru başarıyla çalışıyor. \n\n🔹 **Slash Komutları:** `/setup` \n🔹 **Alternatif:** `!setup` (Slash gözükmezse kullanın)")
                .setColor(PASSO_RED)
                .setTimestamp();
            channel.send({ embeds: [onlineEmbed] }).catch(() => null);
        }
    });
});

// --- 6. MESAJ KOMUTLARI (SLASH ÇALIŞMAZSA DİYE SİGORTA) ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'setup' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const panel = new EmbedBuilder()
            .setTitle('🏟️ ROPasso Yönetim Paneli')
            .setDescription('Etkinlik oluşturmak için aşağıdaki butonları kullanın.')
            .setColor(PASSO_RED);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Kur').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
            new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
        );

        message.channel.send({ embeds: [panel], components: [row] });
    }
});

// --- 7. SLASH ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') {
            const panel = new EmbedBuilder()
                .setTitle('🏟️ ROPasso Yönetim Paneli')
                .setDescription('Etkinlik oluşturmak için aşağıdaki butonları kullanın.')
                .setColor(PASSO_RED);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Kur').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
                new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
            );

            await interaction.reply({ embeds: [panel], components: [row] });
        }
    }

    if (interaction.isButton()) {
        const isMatch = interaction.customId === 'm_kur';
        const modal = new ModalBuilder()
            .setCustomId(isMatch ? 'modal_m' : 'modal_k')
            .setTitle(isMatch ? '⚽ Maç Planla' : '🎤 Konser Planla');

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t').setLabel("Başlık").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('d').setLabel("Tarih").setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('l').setLabel("Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        await interaction.reply({ content: "✅ İşlem başarılı! Etkinlik sisteme kaydedildi.", ephemeral: true });
    }
});

client.login(TOKEN);
