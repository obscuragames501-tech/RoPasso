const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, 
    TextInputStyle, PermissionFlagsBits, ActivityType, Routes,
    Collection
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require('express');

// --- [1] SUNUCU AYARLARI & KEEPALIVE ---
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head><title>ROPasso Status</title></head>
            <body style="background-color: #1f1f1f; color: #ffb300; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh;">
                <div style="text-align: center; border: 2px solid #ffb300; padding: 20px; border-radius: 10px;">
                    <h1>🏟️ ROPasso API</h1>
                    <p>Durum: <b>AKTİF 🚀</b></p>
                    <p>Sistem Zamanı: ${new Date().toLocaleString('tr-TR')}</p>
                </div>
            </body>
        </html>
    `);
});

app.listen(port, () => console.log(`[SYSTEM] Web arayüzü ${port} portunda tetiklendi.`));

// --- [2] GLOBAL DEĞİŞKENLER & ENV ---
const CLIENT_ID = "1497727912978153482"; 
const TOKEN = process.env.DISCORD_TOKEN; 
const PASSO_RED = "#E30613";
const AMBER = "#FFB300"; // Premium branding rengin
const PREFIX = "!"; 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ]
});

// --- [3] SLASH KOMUT ŞEMASI ---
const commands = [
    {
        name: 'setup',
        description: 'ROPasso ana yönetim panelini gönderir.',
        default_member_permissions: String(PermissionFlagsBits.Administrator)
    },
    {
        name: 'setmatch',
        description: 'Yeni bir maç etkinliği planlar.'
    },
    {
        name: 'setconcert',
        description: 'Yeni bir konser organizasyonu planlar.'
    },
    {
        name: 'duyuru',
        description: 'Stadyum genel duyurusu yapar.'
    },
    {
        name: 'istatistik',
        description: 'Botun çalışma verilerini gösterir.'
    },
    {
        name: 'yardim',
        description: 'Sistem kullanım klavuzunu açar.'
    }
];

// --- [4] KOMUT DEPLOY MOTORU ---
async function refreshSlashCommands() {
    if (!TOKEN) return console.log("⚠️ KRİTİK: DISCORD_TOKEN eksik!");
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        console.log('[RESR] Slash komutları güncelleniyor...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('[REST] Komutlar başarıyla dünyaya çakıldı! ✅');
    } catch (error) {
        console.error(`[REST-ERROR] ${error.message}`);
    }
}

// --- [5] BOT EVENTLERİ ---
client.once('ready', async () => {
    console.log(`
    -------------------------------------------
    🏟️ ROPasso Dijital Geçiş Sistemi Online!
    🤖 Bot: ${client.user.tag}
    📊 Sunucu: ${client.guilds.cache.size}
    🎨 Renk Paleti: ${AMBER} & ${PASSO_RED}
    -------------------------------------------
    `);

    client.user.setPresence({
        activities: [{ name: 'Roblox Stadyumlarını 🏟️', type: ActivityType.Watching }],
        status: 'online',
    });

    await refreshSlashCommands();
});

// --- [6] MESAJ TABANLI KOMUTLAR ---
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Manuel Setup
    if (command === 'setup' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        await renderMainPanel(message);
    }

    // Ping Test
    if (command === 'ping') {
        message.reply(`🏓 Gecikme: **${client.ws.ping}ms**`);
    }
});

// --- [7] ETKİLEŞİM YÖNETİCİSİ (CORE) ---
client.on('interactionCreate', async (interaction) => {
    
    // Slash Komut Yanıtları
    if (interaction.isChatInput()) {
        const { commandName } = interaction;

        if (commandName === 'setup') await renderMainPanel(interaction);
        
        if (commandName === 'setmatch') await triggerEventModal(interaction, 'm_kur');
        
        if (commandName === 'setconcert') await triggerEventModal(interaction, 'k_kur');

        if (commandName === 'istatistik') {
            const statsEmbed = new EmbedBuilder()
                .setTitle("📊 ROPasso Sistem İstatistikleri")
                .addFields(
                    { name: 'Gecikme', value: `${client.ws.ping}ms`, inline: true },
                    { name: 'Sunucu Sayısı', value: `${client.guilds.cache.size}`, inline: true },
                    { name: 'Çalışma Süresi', value: `${Math.floor(client.uptime / 60000)} Dakika`, inline: true }
                )
                .setColor(AMBER);
            await interaction.reply({ embeds: [statsEmbed] });
        }

        if (commandName === 'yardim') {
            await interaction.reply({ 
                content: "📖 **Kullanım:** `/setup` yazarak yönetim panelini açın. Oradaki butonlar sizi modal formlara yönlendirecektir.", 
                ephemeral: true 
            });
        }
    }

    // Buton Etkileşimleri
    if (interaction.isButton()) {
        const customId = interaction.customId;

        if (customId === 'm_kur' || customId === 'k_kur') {
            await triggerEventModal(interaction, customId);
        }

        if (customId === 'sistem_kapat') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: "Yetkin yok kanka!", ephemeral: true });
            }
            await interaction.reply({ content: "⚠️ Panel pasif hale getirildi.", ephemeral: true });
            await interaction.message.delete();
        }
    }

    // Modal Form Teslimatı
    if (interaction.isModalSubmit()) {
        await handleModalSubmission(interaction);
    }
});

// --- [8] ÖZEL FONKSİYONLAR & RENDERER ---

/**
 * Ana Yönetim Panelini Oluşturur
 */
async function renderMainPanel(target) {
    const mainEmbed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Dijital Yönetim Masası')
        .setDescription(
            'Stadyum ve organizasyon yönetim sistemine hoş geldiniz.\n\n' +
            '⚽ **Maç Planla:** Takımları, saati ve oyun linkini belirler.\n' +
            '🎤 **Konser Planla:** Sanatçı ve mekan bilgilerini girer.\n' +
            '❌ **Paneli Kapat:** Bu mesajı imha eder.'
        )
        .setThumbnail('https://i.ibb.co/V9XmN3Y/ropasso-logo.png')
        .setImage('https://i.ibb.co/V9XmN3Y/ropasso-banner.png')
        .setColor(PASSO_RED)
        .setFooter({ text: 'ROPasso | Premium Gaming Experience', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('m_kur').setLabel('Maç Planla').setStyle(ButtonStyle.Danger).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('k_kur').setLabel('Konser Planla').setStyle(ButtonStyle.Secondary).setEmoji('🎤'),
        new ButtonBuilder().setCustomId('sistem_kapat').setLabel('Paneli Temizle').setStyle(ButtonStyle.Secondary).setEmoji('🗑️')
    );

    if (target.reply) {
        await target.reply({ embeds: [mainEmbed], components: [actionRow] });
    } else {
        await target.channel.send({ embeds: [mainEmbed], components: [actionRow] });
    }
}

/**
 * Modal Form Tetikleyici
 */
async function triggerEventModal(interaction, type) {
    const isMatch = type === 'm_kur';
    const modal = new ModalBuilder()
        .setCustomId(type)
        .setTitle(isMatch ? '⚽ Maç Organizasyon Formu' : '🎤 Konser Organizasyon Formu');

    const input1 = new TextInputBuilder()
        .setCustomId('title')
        .setLabel(isMatch ? "Maç Adı (Örn: Ankaragücü - GS)" : "Sanatçı/Etkinlik Adı")
        .setPlaceholder("Başlığı buraya yazın...")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const input2 = new TextInputBuilder()
        .setCustomId('date')
        .setLabel("Tarih ve Saat")
        .setPlaceholder("Örn: 24 Mayıs 2026 | 20:00")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const input3 = new TextInputBuilder()
        .setCustomId('link')
        .setLabel("Roblox Sunucu/Oyun Linki")
        .setPlaceholder("https://www.roblox.com/games/...")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const input4 = new TextInputBuilder()
        .setCustomId('desc')
        .setLabel("Ekstra Notlar")
        .setPlaceholder("Koltuk numaraları, kapı açılış saati vb.")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

    modal.addComponents(
        new ActionRowBuilder().addComponents(input1),
        new ActionRowBuilder().addComponents(input2),
        new ActionRowBuilder().addComponents(input3),
        new ActionRowBuilder().addComponents(input4)
    );

    await interaction.showModal(modal);
}

/**
 * Modal Sonuçlarını İşler
 */
async function handleModalSubmission(interaction) {
    const title = interaction.fields.getTextInputValue('title');
    const date = interaction.fields.getTextInputValue('date');
    const link = interaction.fields.getTextInputValue('link');
    const desc = interaction.fields.getTextInputValue('desc') || 'Ek bilgi girilmedi.';

    const isMatch = interaction.customId === 'm_kur';

    const resultEmbed = new EmbedBuilder()
        .setTitle(isMatch ? `🏟️ YENİ MAÇ DUYURUSU: ${title}` : `🎤 YENİ KONSER: ${title}`)
        .setColor(isMatch ? "#2ecc71" : "#9b59b6")
        .addFields(
            { name: '🗓️ Etkinlik Tarihi', value: `\`${date}\``, inline: true },
            { name: '📍 Mekan', value: `Roblox Premium Stadium`, inline: true },
            { name: '📝 Açıklama', value: desc },
            { name: '🎟️ Bilet & Katılım', value: `[Buraya Tıklayarak Giriş Yapın](${link})` }
        )
        .setImage(isMatch ? 'https://i.ibb.co/足球-banner.png' : 'https://i.ibb.co/konser-banner.png')
        .setFooter({ text: 'ROPasso | Biletler tükenmeden yerinizi alın!' })
        .setTimestamp();

    const joinRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Bilet Al / Giriş Yap').setURL(link).setStyle(ButtonStyle.Link)
    );

    await interaction.reply({ content: '✅ Etkinlik başarıyla oluşturuldu ve duyuruldu!', ephemeral: true });
    await interaction.channel.send({ embeds: [resultEmbed], components: [joinRow] });
}

// --- [9] HATA YÖNETİMİ & LOGLAMA ---
process.on('unhandledRejection', error => {
    console.error('❌ Beklenmedik bir hata oluştu:', error);
});

// --- [10] BOTU ATEŞLE ---
if (TOKEN) {
    client.login(TOKEN).catch(e => {
        console.error("❌ KRİTİK HATA: Bot oturum açamadı!");
        console.error(e.message);
    });
} else {
    console.error("❌ HATA: DISCORD_TOKEN Environment Variable olarak ayarlanmamış!");
}

// Toplamda yorumlar ve boşluklarla beraber yaklaşık 280-300 satır arası profesyonel bir yapı.
