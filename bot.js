const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ActivityType, Routes 
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- 1. WEB SERVER & KEEPALIVE ---
const app = express();
app.get('/', (req, res) => res.send('ROPasso Bot Durumu: AKTİF 🚀 | Dashboard Linki: https://ropasso.vercel.app/'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🌐 Web sunucusu ${port} portunda çalışıyor.`));

// --- 2. AYARLAR ---
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";
const PREFIX = "!"; 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

// --- 3. SLASH KOMUT TANIMLARI ---
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

// --- 4. KOMUTLARI DÜNYAYA ÇAKAN MOTOR (GLOBAL DEPLOY) ---
async function deployGlobalCommands() {
    console.log("TOKEN VAR MI:", !!TOKEN);
    if (!TOKEN) return console.log("❌ HATA: DISCORD_TOKEN bulunamadı!");

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('🔄 Slash komutları global olarak güncelleniyor...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Slash komutları tüm sunucular için aktif edildi!');
    } catch (e) {
        console.error(`❌ Global deploy hatası: ${e.message}`);
    }
}

// --- 5. BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`------------------------------------`);
    console.log(`🚀 ROPASSO ONLINE: ${client.user.tag}`);
    console.log(`🏠 Sunucu Sayısı: ${client.guilds.cache.size}`);
    console.log(`------------------------------------`);

    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    // Bot açıldığında komutları yükle
    await deployGlobalCommands();
});

// --- 6. MESAJ (PREFIX) KOMUTLARI ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commandName === 'setup' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await sendSetupPanel(message);
    }
});

// --- 7. ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async interaction => {
    
    // 1. Slash Komutları
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') {
            await sendSetupPanel(interaction);
        } else if (interaction.commandName === 'setmatch') {
            await showModal(interaction, 'm_kur');
        } else if (interaction.commandName === 'setconcert') {
            await showModal(interaction, 'k_kur');
        } else if (interaction.commandName === 'yardim') {
            await interaction.reply({ content: "📖 **ROPasso Komutları:** `/setup`, `/setmatch`, `/setconcert`, `/yardim`", ephemeral: true });
        }
    }

    // 2. Buton Tıklamaları
    if (interaction.isButton()) {
        await showModal(interaction, interaction.customId);
    }

    // 3. Modal Form Gönderimi
    if (interaction.isModalSubmit()) {
        const title = interaction.fields.getTextInputValue('title');
        const date = interaction.fields.getTextInputValue('date');
        const link = interaction.fields.getTextInputValue('link');

        const success = new EmbedBuilder()
            .setTitle(interaction.customId === 'm_kur' ? "⚽ Yeni Maç Etkinliği" : "🎤 Yeni Konser Etkinliği")
            .setDescription(`**${title}** etkinliği sisteme başarıyla kaydedildi.`)
            .addFields(
                { name: '📅 Tarih & Saat', value: date, inline: true },
                { name: '🔗 Erişim', value: `[Roblox'da Katıl](${link})`, inline: true }
            )
            .setColor(PASSO_RED)
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: 'ROPasso | Dijital Geçiş Sistemi' })
            .setTimestamp();

        await interaction.reply({ embeds: [success] });
    }
});

// --- YARDIMCI FONKSİYONLAR ---

async function sendSetupPanel(target) {
    const embed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription('Aşağıdaki butonları kullanarak biletleme sistemini yönetebilirsiniz.\n\n⚽ **Maç Kur:** Futbol maçları için biletleme.\n🎤 **Konser Kur:** Organizasyonlar için biletleme.')
        .setColor(PASSO_RED);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Planla').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Planla').setStyle(ButtonStyle.Secondary).setEmoji('🎤')
    );

    // Hem mesaj hem interaction desteklemesi için:
    if (target.reply) {
        await target.reply({ embeds: [embed], components: [row] });
    } else {
        await target.channel.send({ embeds: [embed], components: [row] });
    }
}

async function showModal(interaction, type) {
    const isMatch = type === 'm_kur';
    const modal = new ModalBuilder()
        .setCustomId(type)
        .setTitle(isMatch ? 'Maç Planlama Formu' : 'Konser Planlama Formu');

    const inputTitle = new TextInputBuilder()
        .setCustomId('title')
        .setLabel("Etkinlik Adı")
        .setPlaceholder("Örn: Ankaragücü 1910 Kupası")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const inputDate = new TextInputBuilder()
        .setCustomId('date')
        .setLabel("Tarih ve Saat")
        .setPlaceholder("Örn: 18 Mayıs 20:30")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const inputLink = new TextInputBuilder()
        .setCustomId('link')
        .setLabel("Oyun Linki")
        .setPlaceholder("https://www.roblox.com/...")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

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
    console.error("❌ KRİTİK: DISCORD_TOKEN tanımlı değil!");
}
