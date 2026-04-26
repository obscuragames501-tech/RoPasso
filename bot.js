const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ActivityType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 1. VERCEL/RAILWAY AKTİF TUTMA SİSTEMİ ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso Bot Durumu: AKTİF 🚀'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🌐 Web sunucusu ${port} portunda çalışıyor.`));

// --- 2. AYARLAR (OTOMATİK DOLDURULDU) ---
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613"; // ROPasso Kırmızısı
const PREFIX = "!"; 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

// --- 3. KOMUT TANIMLARI ---
const commands = [
    {
        name: 'setup',
        description: 'ROPasso Yönetim Panelini kurar.',
        default_member_permissions: String(PermissionFlagsBits.Administrator)
    },
    {
        name: 'setmatch',
        description: 'Hızlıca maç etkinliği oluşturur.'
    },
    {
        name: 'setconcert',
        description: 'Hızlıca konser etkinliği oluşturur.'
    },
    {
        name: 'yardim',
        description: 'Tüm komutları listeler.'
    }
];

// --- 4. KOMUTLARI SUNUCUYA ÇAKAN MOTOR ---
async function deployCommands(guildId) {
    if (!TOKEN) return console.log("❌ HATA: DISCORD_TOKEN bulunamadı!");
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, guildId),
            { body: commands },
        );
        console.log(`✅ Komutlar başarıyla yüklendi: ${guildId}`);
    } catch (e) {
        console.error(`❌ Komut yükleme hatası: ${e.message}`);
    }
}

// --- 5. BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`------------------------------------`);
    console.log(`🚀 ROPASSO ONLINE: ${client.user.tag}`);
    console.log(`------------------------------------`);

    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    client.guilds.cache.forEach(async (guild) => {
        await deployCommands(guild.id);
        
        // Kanala "aktifleştim" mesajı gönder
        const channel = guild.channels.cache.find(ch => 
            ch.type === 0 && ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
        );
        
        if (channel) {
            const welcome = new EmbedBuilder()
                .setTitle("🏟️ ROPasso Dijital Geçiş Sistemi")
                .setDescription("Sistem başarıyla yüklendi ve aktif edildi.\n\n🔹 **Slash:** `/setup` yazarak başlayın.\n🔹 **Prefix:** `/` gözükmezse `!setup` yazın.")
                .setColor(PASSO_RED)
                .setTimestamp();
            channel.send({ embeds: [welcome] }).catch(() => null);
        }
    });
});

// --- 6. MESAJ (PREFIX) KOMUTLARI ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const command = message.content.slice(PREFIX.length).trim().toLowerCase();

    if (command === 'sa') return message.reply("Aleykümselam kanka, ROPasso hizmetinde!");

    if (command === 'setup' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await sendSetupPanel(message.channel);
    }
});

// --- 7. ETKİLEŞİM YÖNETİMİ (SLASH, BUTTON, MODAL) ---
client.on('interactionCreate', async interaction => {
    
    // Slash Komutları
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') {
            await sendSetupPanel(interaction);
        }
        if (interaction.commandName === 'setmatch') await showModal(interaction, 'm_kur');
        if (interaction.commandName === 'setconcert') await showModal(interaction, 'k_kur');
        if (interaction.commandName === 'yardim') {
            await interaction.reply({ content: "📖 **Komutlar:** `/setup`, `/setmatch`, `/setconcert`, `/yardim`", ephemeral: true });
        }
    }

    // Butonlar
    if (interaction.isButton()) {
        await showModal(interaction, interaction.customId);
    }

    // Modal Form Gönderimi
    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        const date = interaction.fields.getTextInputValue('date');
        const link = interaction.fields.getTextInputValue('link');

        const success = new EmbedBuilder()
            .setTitle("✅ Etkinlik Oluşturuldu")
            .addFields(
                { name: 'Başlık', value: title, inline: true },
                { name: 'Tarih', value: date, inline: true },
                { name: 'Oyun', value: `[Tıkla ve Gir](${link})` }
            )
            .setColor("#2ECC71")
            .setFooter({ text: 'ROPasso Biletleme Sistemi' });

        await interaction.reply({ embeds: [success] });
    }
});

// --- YARDIMCI FONKSİYONLAR ---

async function sendSetupPanel(target) {
    const embed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription('Etkinlik türünü seçerek bilet satışlarını ve duyuruları başlatabilirsiniz.')
        .setColor(PASSO_RED)
                .setImage('https://i.ibb.co/V9XmN3Y/ropasso-banner.png'); // Varsa bir banner koyabilirsin

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Planla').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Planla').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
    );

    if (target.reply) {
        await target.reply({ embeds: [embed], components: [row] });
    } else {
        await target.send({ embeds: [embed], components: [row] });
    }
}

async function showModal(interaction, type) {
    const isMatch = type === 'm_kur';
    const modal = new ModalBuilder()
        .setCustomId(type)
        .setTitle(isMatch ? '⚽ Maç Planla' : '🎤 Konser Planla');

    const inputTitle = new TextInputBuilder().setCustomId('title').setLabel("Etkinlik İsmi").setPlaceholder("Örn: Ankaragücü vs Gençlerbirliği").setStyle(TextInputStyle.Short).setRequired(true);
    const inputDate = new TextInputBuilder().setCustomId('date').setLabel("Tarih & Saat").setPlaceholder("Örn: 20 Mayıs 20:00").setStyle(TextInputStyle.Short).setRequired(true);
    const inputLink = new TextInputBuilder().setCustomId('link').setLabel("Roblox Oyun Linki").setPlaceholder("https://www.roblox.com/games/...").setStyle(TextInputStyle.Short).setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(inputTitle),
        new ActionRowBuilder().addComponents(inputDate),
        new ActionRowBuilder().addComponents(inputLink)
    );

    await interaction.showModal(modal);
}

// BOTU BAŞLAT
if (TOKEN) {
    client.login(TOKEN).catch(e => console.error("❌ Login Hatası:", e.message));
} else {
    console.log("❌ KRİTİK: Vercel üzerinde DISCORD_TOKEN değişkeni tanımlı değil!");
}
