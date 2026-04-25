const { 
    Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, 
    TextInputBuilder, TextInputStyle, PermissionFlagsBits, ActivityType,
    ChannelType
} = require('discord.js');

// BOTU CANLANDIRAN INTENTLER
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// --- AYARLAR ---
const TOKEN = "MTQ5NzcyNzkxMjk3ODE1MzQ4Mg.Gun3w1.Nm_DKZSYBUyg4YYr-OoYpamELiRqc3lJLzp-CQ"; 
const PASSO_RED = "#E30613";
const INVITE_LINK = "https://discord.com/oauth2/authorize?client_id=1497727912978153482&permissions=8&scope=bot+applications.commands";

// --- KOMUT TANIMLAMALARI ---
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
        .setName('adminduzenle')
        .setDescription('Etkinlik yönetici rollerini ayarlar.'),
    new SlashCommandBuilder()
        .setName('passoyardim')
        .setDescription('Tüm komutların listesini ve kullanımını gösterir.')
];

// --- BOT HAZIR OLDUĞUNDA ---
client.once('ready', async () => {
    console.log(`✅ ROPasso Hazır: ${client.user.tag}`);
    client.user.setActivity('Roblox Stadyumlarını', { type: ActivityType.Watching });

    try {
        // Global kayıt - Tüm sunucularda komutların çıkmasını sağlar
        await client.application.commands.set(commands);
        console.log("🔥 Slash komutları başarıyla tüm sunuculara tanımlandı.");
    } catch (err) {
        console.error("❌ Komut yükleme hatası:", err);
    }
});

// --- SUNUCUYA KATILMA OLAYI (OTOMATİK PANEL) ---
client.on('guildCreate', async (guild) => {
    console.log(`🏠 Yeni Sunucuya Katıldım: ${guild.name}`);

    // Mesaj atabileceği ilk metin kanalını bulur
    const channel = guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && 
        ch.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)
    );

    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('🏟️ RoPasso Sunucunuza Hoş Geldiniz!')
        .setDescription('Roblox dünyasının en gelişmiş biletleme ve geçiş sistemi artık aktif.\n\n**Nasıl Başlanır?**\nAşağıdaki butona basarak yönetim panelini bu kanala kurabilirsiniz.')
        .addFields(
            { name: '📍 Hızlı Kurulum', value: 'Buton sistemi otomatik yapılandırır.', inline: true },
            { name: '🔐 Yönetim', value: 'Sadece Yöneticiler erişebilir.', inline: true }
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(PASSO_RED)
        .setFooter({ text: 'RoPasso v1.0 | Premium Biletleme Altyapısı' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('auto_setup')
            .setLabel('Yönetim Panelini Buraya Kur')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛠️')
    );

    channel.send({ embeds: [welcomeEmbed], components: [row] });
});

// --- ETKİLEŞİM YÖNETİMİ ---
client.on('interactionCreate', async interaction => {
    
    // 1. SLASH KOMUTLARI
    if (interaction.isChatInput()) {
        if (interaction.commandName === 'setup') await sendControlPanel(interaction);
        
        if (interaction.commandName === 'setmatch' || interaction.commandName === 'setconcert') {
            await openEventModal(interaction, interaction.commandName === 'setmatch');
        }

        if (interaction.commandName === 'passoyardim') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('📖 ROPasso Komut Rehberi')
                .setColor(PASSO_RED)
                .addFields(
                    { name: '`/setup`', value: 'Yönetim panelini gönderir.' },
                    { name: '`/setmatch`', value: 'Maç oluşturma formunu açar.' },
                    { name: '`/setconcert`', value: 'Konser oluşturma formunu açar.' }
                );
            await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
        }
    }

    // 2. BUTONLAR
    if (interaction.isButton()) {
        if (interaction.customId === 'auto_setup' || interaction.customId === 'refresh_panel') {
            await sendControlPanel(interaction);
        }

        if (interaction.customId === 'btn_match') await openEventModal(interaction, true);
        if (interaction.customId === 'btn_concert') await openEventModal(interaction, false);
        
        if (interaction.customId === 'add_tribune') {
            const modal = new ModalBuilder().setCustomId('modal_tribune').setTitle('Tribün Detayları');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_name').setLabel("Tribün Adı").setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('t_part').setLabel("Roblox Part İsmi").setStyle(TextInputStyle.Short).setRequired(true))
            );
            await interaction.showModal(modal);
        }
    }

    // 3. MODAL SUBMIT
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modal_match' || interaction.customId === 'modal_concert') {
            const isMatch = interaction.customId === 'modal_match';
            const title = interaction.fields.getTextInputValue('title');
            const date = interaction.fields.getTextInputValue('date');
            
            const eventEmbed = new EmbedBuilder()
                .setTitle(isMatch ? `⚽ Maç Hazırlanıyor: ${title}` : `🎤 Konser Hazırlanıyor: ${title}`)
                .setColor(isMatch ? '#1F1F1F' : '#FFB300') // Senin sevdiğin renk paleti
                .setDescription(`Etkinlik detayları sisteme işlendi. Satışa açmak için lütfen tribün ekleyin.`)
                .addFields(
                    { name: '📅 Tarih', value: date, inline: true },
                    { name: '🏟️ Durum', value: 'Tribün Bekleniyor', inline: true }
                );

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('add_tribune').setLabel('➕ Tribün Ekle').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('finalize').setLabel('🚀 Yayına Al').setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ embeds: [eventEmbed], components: [row] });
        }

        if (interaction.customId === 'modal_tribune') {
            const tName = interaction.fields.getTextInputValue('t_name');
            await interaction.reply({ content: `✅ **${tName}** tribünü başarıyla kaydedildi.`, ephemeral: true });
        }
    }
});

// --- YÖNETİM PANELİ FONKSİYONU ---
async function sendControlPanel(interaction) {
    const panelEmbed = new EmbedBuilder()
        .setTitle('🕹️ ROPasso Yönetim Paneli')
        .setDescription('Sunucundaki maç ve konser süreçlerini buradan yönetebilirsin.\n\n**Hızlı İşlemler:**')
        .addFields(
            { name: '⚽ Maçlar', value: 'Yeni maç ve stadyum ayarları.', inline: true },
            { name: '🎤 Konserler', value: 'Sanatçı ve alan ayarları.', inline: true }
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setColor(PASSO_RED);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_match').setLabel('Maç Kur').setStyle(ButtonStyle.Secondary).setEmoji('⚽'),
        new ButtonBuilder().setCustomId('btn_concert').setLabel('Konser Kur').setStyle(ButtonStyle.Secondary).setEmoji('🎤'),
        new ButtonBuilder().setCustomId('refresh_panel').setLabel('Paneli Yenile').setStyle(ButtonStyle.Primary).setEmoji('🔄')
    );

    if (interaction.isButton() && interaction.customId === 'auto_setup') {
        await interaction.update({ embeds: [panelEmbed], components: [row] });
    } else {
        await interaction.reply({ embeds: [panelEmbed], components: [row] });
    }
}

// --- MODAL AÇMA FONKSİYONU ---
async function openEventModal(interaction, isMatch) {
    const modal = new ModalBuilder()
        .setCustomId(isMatch ? 'modal_match' : 'modal_concert')
        .setTitle(isMatch ? 'Maç Oluşturma Formu' : 'Konser Oluşturma Formu');

    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel(isMatch ? "Maç Adı" : "Etkinlik Adı").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('date').setLabel("Tarih ve Saat").setStyle(TextInputStyle.Short).setPlaceholder("GG/AA/YYYY 20:00").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('link').setLabel("Roblox Oyun Linki").setStyle(TextInputStyle.Short).setRequired(true))
    );

    await interaction.showModal(modal);
}

client.login(TOKEN);
