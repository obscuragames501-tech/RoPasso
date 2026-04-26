/**
 * 🏟️ ROPasso Dijital Geçiş & Etkinlik Yönetim Sistemi
 * Version: 3.5.2 (Stable)
 * Developer: Gemini & Ibrahim Yigit Demirbas
 */

const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ActivityType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- [1] VERCEL SERVERLESS FIX & KEEPALIVE ---
const app = express();
const port = process.env.PORT || 3000;

// Vercel'in botu aktif tutması için gereken ana sayfa
app.get('/', (req, res) => {
    res.status(200).send(`
        <body style="background:#1f1f1f; color:#ffb300; font-family:sans-serif; text-align:center; padding-top:100px;">
            <h1 style="color:#E30613;">🏟️ ROPASSO CORE ACTIVE</h1>
            <p>Bot Status: 🟢 Online</p>
            <p>Last Sync: ${new Date().toLocaleTimeString()}</p>
            <hr style="width:200px; border:1px solid #333;">
            <small>Legacy Server Listening Mode: Bypass Success</small>
        </body>
    `);
});

// Express'i başlat (Loglarda "Legacy server" yerine bunu görmelisin)
app.listen(port, () => {
    console.log(`[WEB] Sunucu ${port} portunda gürlüyor...`);
});

// --- [2] BOT CONFIGURATION ---
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";
const AMBER = "#FFB300"; 
const PREFIX = "!"; 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

// --- [3] SLASH COMMAND DEFINITIONS ---
const slashCommands = [
    {
        name: 'setup',
        description: 'ROPasso yönetim panelini kurar.',
        default_member_permissions: String(PermissionFlagsBits.Administrator)
    },
    {
        name: 'setmatch',
        description: 'Hızlı maç etkinliği oluşturur.'
    },
    {
        name: 'setconcert',
        description: 'Konser organizasyonu başlatır.'
    },
    {
        name: 'yardim',
        description: 'Sistem komutlarını listeler.'
    }
];

// --- [4] COMMAND DEPLOYER (RESTART FIX) ---
async function deployCommands() {
    console.log(`[DEBUG] Token Check: ${TOKEN ? "OK (Length: " + TOKEN.length + ")" : "EKSİK!"}`);
    
    if (!TOKEN) {
        console.log("❌ KRİTİK HATA: DISCORD_TOKEN bulunamadı. Vercel Secrets ayarlarını kontrol et!");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('[SYSTEM] Slash komutları Discord API\'ye gönderiliyor...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: slashCommands },
        );
        console.log('✅ [SUCCESS] Slash komutları tüm sunucularda aktif edildi!');
    } catch (error) {
        console.error(`❌ [DEPLOY ERROR] ${error.message}`);
    }
}

// --- [5] BOT EVENTS ---
client.once('ready', async () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 ROPASSO SISTEMI DEVREDE: ${client.user.tag}`);
    console.log(`📊 Aktif Sunucu Sayısı: ${client.guilds.cache.size}`);
    console.log(`-------------------------------------------`);

    client.user.setActivity('Roblox Stadyumlarını 🏟️', { type: ActivityType.Watching });
    
    // Bot açılır açılmaz komutları çak
    await deployCommands();
});

// Prefix komutu (Yedek sistem)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;
    const command = message.content.slice(PREFIX.length).trim().toLowerCase();

    if (command === 'setup' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await sendManagerPanel(message);
    }
});

// --- [6] INTERACTION HANDLER ---
client.on('interactionCreate', async (interaction) => {
    
    // Slash Komut Yönetimi
    if (interaction.isChatInput()) {
        const { commandName } = interaction;

        if (commandName === 'setup') await sendManagerPanel(interaction);
        if (commandName === 'setmatch') await openEventModal(interaction, 'm_kur');
        if (commandName === 'setconcert') await openEventModal(interaction, 'k_kur');
        if (commandName === 'yardim') {
            await interaction.reply({ 
                content: "🛠️ **ROPasso Destek:**\n`/setup` - Paneli açar\n`/setmatch` - Maç kurar\n`/setconcert` - Konser kurar", 
                ephemeral: true 
            });
        }
    }

    // Buton Yönetimi
    if (interaction.isButton()) {
        if (interaction.customId === 'm_kur' || interaction.customId === 'k_kur') {
            await openEventModal(interaction, interaction.customId);
        }
        if (interaction.customId === 'panel_sil') {
            await interaction.message.delete().catch(() => null);
        }
    }

    // Modal Form Yanıtı
    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        const date = interaction.fields.getTextInputValue('date');
        const link = interaction.fields.getTextInputValue('link');
        const notes = interaction.fields.getTextInputValue('notes') || "Ek bilgi yok.";

        const type = interaction.customId === 'm_kur' ? "⚽ MAÇ ETKİNLİĞİ" : "🎤 KONSER ETKİNLİĞİ";

        const resultEmbed = new EmbedBuilder()
            .setTitle(`${type}: ${title}`)
            .setDescription(`Yeni bir etkinlik planlandı! Detaylar aşağıdadır.`)
            .addFields(
                { name: '📅 Tarih & Saat', value: `\`${date}\``, inline: true },
                { name: '🔗 Erişim', value: `[Roblox'a Bağlan](${link})`, inline: true },
                { name: '📝 Notlar', value: notes }
            )
            .setColor(interaction.customId === 'm_kur' ? PASSO_RED : AMBER)
            .setFooter({ text: 'ROPasso | Dijital Biletleme Sistemi' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('Etkinliğe Git').setURL(link).setStyle(ButtonStyle.Link)
        );

        await interaction.reply({ content: '✅ Etkinlik başarıyla yayınlandı!', ephemeral: true });
        await interaction.channel.send({ embeds: [resultEmbed], components: [row] });
    }
});

// --- [7] HELPER FUNCTIONS ---

async function sendManagerPanel(target) {
    const embed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription('Bilet satışlarını başlatmak veya etkinlik duyurmak için aşağıdaki butonları kullanın.')
        .setColor(PASSO_RED)
        .setImage('https://i.ibb.co/V9XmN3Y/ropasso-banner.png');

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Planla').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Planla').setStyle(ButtonStyle.Secondary).setEmoji('🎤'),
        new ButtonBuilder().setCustomId('panel_sil').setLabel('Temizle').setStyle(ButtonStyle.Secondary).setEmoji('🗑️')
    );

    if (target.reply) {
        await target.reply({ embeds: [embed], components: [row] });
    } else {
        await target.channel.send({ embeds: [embed], components: [row] });
    }
}

async function openEventModal(interaction, type) {
    const isMatch = type === 'm_kur';
    const modal = new ModalBuilder()
        .setCustomId(type)
        .setTitle(isMatch ? '⚽ Maç Planlama' : '🎤 Konser Planlama');

    const titleInput = new TextInputBuilder().setCustomId('title').setLabel("Etkinlik Başlığı").setPlaceholder("Örn: Ankaragücü vs Real Madrid").setStyle(TextInputStyle.Short).setRequired(true);
    const dateInput = new TextInputBuilder().setCustomId('date').setLabel("Tarih & Saat").setPlaceholder("20 Mayıs | 20:00").setStyle(TextInputStyle.Short).setRequired(true);
    const linkInput = new TextInputBuilder().setCustomId('link').setLabel("Roblox Oyun Linki").setPlaceholder("https://www.roblox.com/...").setStyle(TextInputStyle.Short).setRequired(true);
    const notesInput = new TextInputBuilder().setCustomId('notes').setLabel("Ekstra Bilgiler").setPlaceholder("Kapı açılışı, kurallar vb.").setStyle(TextInputStyle.Paragraph).setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(dateInput),
        new ActionRowBuilder().addComponents(linkInput),
        new ActionRowBuilder().addComponents(notesInput)
    );

    await interaction.showModal(modal);
}

// --- [8] ERROR CATCHER ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [HATA] Yakalanmayan Reddetme:', promise, 'neden:', reason);
});

// --- [9] FINAL LOGIN ---
if (TOKEN) {
    client.login(TOKEN).catch(err => {
        console.log("❌ LOGIN BAŞARISIZ! Tokenini kontrol et.");
    });
} else {
    console.log("❌ DISCORD_TOKEN TANIMLANMAMIŞ!");
}
